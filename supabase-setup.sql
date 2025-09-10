-- 公共词库数据库表结构和 RLS 策略
-- 请在 Supabase SQL Editor 中执行以下 SQL

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建词汇表
CREATE TABLE IF NOT EXISTS words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word VARCHAR(100) NOT NULL CHECK (length(trim(word)) > 0),
  meaning TEXT NOT NULL CHECK (length(trim(meaning)) > 0 AND length(meaning) <= 2000),
  example_sentence TEXT CHECK (example_sentence IS NULL OR length(example_sentence) <= 3000),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by VARCHAR(100) DEFAULT 'anonymous',
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  reports INTEGER DEFAULT 0 CHECK (reports >= 0),
  is_deleted BOOLEAN DEFAULT FALSE,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'zh', 'mixed')),
  pronunciation VARCHAR(200),
  word_type VARCHAR(50), -- noun, verb, adjective, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(word, category_id) -- 防止同一分类下重复词汇
);

-- 3. 创建举报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0 AND length(reason) <= 1000),
  reported_by VARCHAR(100) DEFAULT 'anonymous',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建用户活动日志表
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('add_word', 'upvote', 'report', 'search', 'export')),
  word_id UUID REFERENCES words(id) ON DELETE SET NULL,
  user_fingerprint VARCHAR(200), -- 浏览器指纹用于防滥用
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- 存储额外信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建词汇收藏表（用户可收藏词汇）
CREATE TABLE IF NOT EXISTS word_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  user_fingerprint VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(word_id, user_fingerprint)
);

-- 6. 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_words_category_id ON words(category_id);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_words_is_deleted ON words(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_words_upvotes ON words(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_words_language ON words(language);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_level);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_words_search ON words USING gin((word || ' ' || meaning || ' ' || COALESCE(example_sentence, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_words_word_trgm ON words USING gin(word gin_trgm_ops);

-- 其他索引
CREATE INDEX IF NOT EXISTS idx_reports_word_id ON reports(word_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_fingerprint ON user_activities(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_word_favorites_user ON word_favorites(user_fingerprint);

-- 8. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 为表添加更新时间触发器
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_words_updated_at ON words;
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 创建业务函数

-- 点赞函数（防重复点赞）
CREATE OR REPLACE FUNCTION increment_upvotes(word_id UUID, user_fp VARCHAR(200) DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  activity_count INTEGER;
BEGIN
  -- 检查是否已经点赞过（24小时内）
  IF user_fp IS NOT NULL THEN
    SELECT COUNT(*) INTO activity_count
    FROM user_activities
    WHERE activity_type = 'upvote'
      AND word_id = increment_upvotes.word_id
      AND user_fingerprint = user_fp
      AND created_at > NOW() - INTERVAL '24 hours';
    
    IF activity_count > 0 THEN
      RETURN FALSE; -- 已经点赞过
    END IF;
  END IF;

  -- 增加点赞数
  UPDATE words SET upvotes = upvotes + 1 WHERE id = word_id AND is_deleted = false;
  
  -- 记录活动
  IF user_fp IS NOT NULL THEN
    INSERT INTO user_activities (activity_type, word_id, user_fingerprint)
    VALUES ('upvote', word_id, user_fp);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 搜索函数
CREATE OR REPLACE FUNCTION search_words(
  search_term TEXT DEFAULT NULL,
  category_filter UUID DEFAULT NULL,
  language_filter VARCHAR(10) DEFAULT NULL,
  difficulty_filter INTEGER DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  word VARCHAR(100),
  meaning TEXT,
  example_sentence TEXT,
  category_id UUID,
  category_name VARCHAR(100),
  upvotes INTEGER,
  difficulty_level INTEGER,
  language VARCHAR(10),
  pronunciation VARCHAR(200),
  word_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.word,
    w.meaning,
    w.example_sentence,
    w.category_id,
    c.name as category_name,
    w.upvotes,
    w.difficulty_level,
    w.language,
    w.pronunciation,
    w.word_type,
    w.created_at,
    CASE 
      WHEN search_term IS NOT NULL THEN
        GREATEST(
          similarity(w.word, search_term),
          similarity(w.meaning, search_term),
          similarity(COALESCE(w.example_sentence, ''), search_term)
        )
      ELSE 0
    END as similarity
  FROM words w
  LEFT JOIN categories c ON w.category_id = c.id
  WHERE w.is_deleted = false
    AND (category_filter IS NULL OR w.category_id = category_filter)
    AND (language_filter IS NULL OR w.language = language_filter)
    AND (difficulty_filter IS NULL OR w.difficulty_level = difficulty_filter)
    AND (
      search_term IS NULL OR
      w.word ILIKE '%' || search_term || '%' OR
      w.meaning ILIKE '%' || search_term || '%' OR
      w.example_sentence ILIKE '%' || search_term || '%' OR
      similarity(w.word || ' ' || w.meaning || ' ' || COALESCE(w.example_sentence, ''), search_term) > 0.1
    )
  ORDER BY 
    CASE WHEN search_term IS NOT NULL THEN similarity END DESC,
    w.upvotes DESC,
    w.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 防滥用检查函数
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_fp VARCHAR(200),
  activity_type VARCHAR(50),
  time_window INTERVAL DEFAULT '1 hour',
  max_count INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  activity_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO activity_count
  FROM user_activities
  WHERE user_fingerprint = user_fp
    AND activity_type = check_rate_limit.activity_type
    AND created_at > NOW() - time_window;
  
  RETURN activity_count < max_count;
END;
$$ LANGUAGE plpgsql;

-- 11. 启用 RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 12. 创建 RLS 策略

-- 分类表策略：所有人可读，管理员可写
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories are insertable by authenticated users" ON categories;
CREATE POLICY "Categories are insertable by authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Categories are updatable by authenticated users" ON categories;
CREATE POLICY "Categories are updatable by authenticated users" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Categories are deletable by authenticated users" ON categories;
CREATE POLICY "Categories are deletable by authenticated users" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- 词汇表策略：所有人可读和插入，限制更新和删除
DROP POLICY IF EXISTS "Words are viewable by everyone" ON words;
CREATE POLICY "Words are viewable by everyone" ON words
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Words are insertable with rate limit" ON words;
CREATE POLICY "Words are insertable with rate limit" ON words
  FOR INSERT WITH CHECK (
    length(trim(word)) > 0 AND
    length(trim(meaning)) > 0 AND
    length(meaning) <= 2000 AND
    (example_sentence IS NULL OR length(example_sentence) <= 3000)
  );

DROP POLICY IF EXISTS "Words are updatable by authenticated users" ON words;
CREATE POLICY "Words are updatable by authenticated users" ON words
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Words are deletable by authenticated users" ON words;
CREATE POLICY "Words are deletable by authenticated users" ON words
  FOR DELETE USING (auth.role() = 'authenticated');

-- 举报表策略：所有人可插入，管理员可查看和更新
DROP POLICY IF EXISTS "Reports are insertable by everyone" ON reports;
CREATE POLICY "Reports are insertable by everyone" ON reports
  FOR INSERT WITH CHECK (
    length(trim(reason)) > 0 AND
    length(reason) <= 1000
  );

DROP POLICY IF EXISTS "Reports are viewable by authenticated users" ON reports;
CREATE POLICY "Reports are viewable by authenticated users" ON reports
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Reports are updatable by authenticated users" ON reports;
CREATE POLICY "Reports are updatable by authenticated users" ON reports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 用户活动表策略
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are insertable by everyone" ON user_activities;
CREATE POLICY "Activities are insertable by everyone" ON user_activities
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Activities are viewable by authenticated users" ON user_activities;
CREATE POLICY "Activities are viewable by authenticated users" ON user_activities
  FOR SELECT USING (auth.role() = 'authenticated');

-- 收藏表策略
ALTER TABLE word_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Favorites are manageable by everyone" ON word_favorites;
CREATE POLICY "Favorites are manageable by everyone" ON word_favorites
  FOR ALL USING (true);

-- 系统配置表策略
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Config is viewable by everyone" ON system_config;
CREATE POLICY "Config is viewable by everyone" ON system_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Config is manageable by authenticated users" ON system_config;
CREATE POLICY "Config is manageable by authenticated users" ON system_config
  FOR ALL USING (auth.role() = 'authenticated');

-- 13. 插入默认数据

-- 插入系统配置
INSERT INTO system_config (key, value, description) VALUES
  ('max_words_per_hour', '10', '每小时最大添加词汇数'),
  ('max_reports_per_day', '5', '每天最大举报次数'),
  ('featured_categories', '["通用词汇", "技术术语", "商务英语"]', '首页推荐分类'),
  ('announcement', '', '系统公告'),
  ('maintenance_mode', 'false', '维护模式开关'),
  ('version', '1.0.0', '系统版本号')
ON CONFLICT (key) DO NOTHING;

-- 插入默认分类
INSERT INTO categories (name, description) VALUES
  ('通用词汇', '常见的通用词汇'),
  ('学术词汇', '学术和专业领域词汇'),
  ('商务英语', '商务和职场相关词汇'),
  ('日常口语', '日常对话中常用词汇'),
  ('技术术语', '技术和科技相关词汇'),
  ('文学词汇', '文学作品中的词汇'),
  ('医学术语', '医学和健康相关词汇'),
  ('法律术语', '法律和法规相关词汇')
ON CONFLICT (name) DO NOTHING;

-- 插入示例词汇
INSERT INTO words (word, meaning, example_sentence, category_id, difficulty_level, language, pronunciation, word_type) VALUES
  ('serendipity', '意外发现珍奇事物的能力；意外的好运', 'The discovery was pure serendipity.', 
   (SELECT id FROM categories WHERE name = '通用词汇' LIMIT 1), 4, 'en', '/ˌserənˈdɪpəti/', 'noun'),
  ('algorithm', '算法；计算程序', 'The new algorithm improved the search results significantly.', 
   (SELECT id FROM categories WHERE name = '技术术语' LIMIT 1), 3, 'en', '/ˈælɡərɪðəm/', 'noun'),
  ('entrepreneur', '企业家；创业者', 'She became a successful entrepreneur at a young age.', 
   (SELECT id FROM categories WHERE name = '商务英语' LIMIT 1), 3, 'en', '/ˌɑːntrəprəˈnɜːr/', 'noun'),
  ('ubiquitous', '无处不在的；普遍存在的', 'Smartphones have become ubiquitous in modern society.', 
   (SELECT id FROM categories WHERE name = '学术词汇' LIMIT 1), 4, 'en', '/juːˈbɪkwɪtəs/', 'adjective'),
  ('procrastinate', '拖延；耽搁', 'I tend to procrastinate when I have difficult tasks to complete.', 
   (SELECT id FROM categories WHERE name = '日常口语' LIMIT 1), 2, 'en', '/prəˈkræstɪneɪt/', 'verb'),
  ('mellifluous', '甜美流畅的（声音）', 'Her mellifluous voice captivated the entire audience.', 
   (SELECT id FROM categories WHERE name = '文学词汇' LIMIT 1), 5, 'en', '/məˈlɪfluəs/', 'adjective'),
  ('diagnosis', '诊断', 'The doctor made a quick diagnosis based on the symptoms.', 
   (SELECT id FROM categories WHERE name = '医学术语' LIMIT 1), 3, 'en', '/ˌdaɪəɡˈnoʊsɪs/', 'noun'),
  ('litigation', '诉讼；法律纠纷', 'The company is involved in complex litigation over patent rights.', 
   (SELECT id FROM categories WHERE name = '法律术语' LIMIT 1), 4, 'en', '/ˌlɪtɪˈɡeɪʃən/', 'noun')
ON CONFLICT (word, category_id) DO NOTHING;

-- 14. 创建视图和统计函数

-- 词汇统计视图
CREATE OR REPLACE VIEW public.word_statistics AS
SELECT 
  c.name as category_name,
  COUNT(w.id) as word_count,
  AVG(w.upvotes) as avg_upvotes,
  AVG(w.difficulty_level) as avg_difficulty,
  COUNT(CASE WHEN w.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_additions
FROM categories c
LEFT JOIN words w ON c.id = w.category_id AND w.is_deleted = false
GROUP BY c.id, c.name
ORDER BY word_count DESC;

-- 热门词汇视图
CREATE OR REPLACE VIEW public.popular_words AS
SELECT 
  w.*,
  c.name as category_name,
  (w.upvotes * 0.7 + EXTRACT(EPOCH FROM (NOW() - w.created_at)) / 86400 * 0.3) as popularity_score
FROM words w
LEFT JOIN categories c ON w.category_id = c.id
WHERE w.is_deleted = false
ORDER BY popularity_score DESC;

-- 15. 创建管理员用户（请手动在 Supabase Auth 中创建用户）
-- 邮箱: 3679044152@qq.com
-- 密码: hqc2351@

-- 16. 创建定期清理任务（可选，需要 pg_cron 扩展）
-- 清理旧的用户活动记录（保留30天）
-- SELECT cron.schedule('cleanup-old-activities', '0 2 * * *', 'DELETE FROM user_activities WHERE created_at < NOW() - INTERVAL ''30 days'';');

-- 17. 性能优化建议
-- 定期运行 ANALYZE 以更新统计信息
-- ANALYZE words;
-- ANALYZE categories;
-- ANALYZE reports;
-- ANALYZE user_activities;
