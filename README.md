# VocaHub - 公共词库

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)

一个基于 React + Supabase 的现代化开源公共词库网站，支持多人协作添加、查看和分享词汇。

## ✨ 功能特色

### 🎯 核心功能
- ✅ **词汇管理** - 添加、编辑、删除词汇，支持多语言
- ✅ **智能搜索** - 关键词搜索，实时建议，高级筛选
- ✅ **分类系统** - 灵活的词汇分类和标签管理
- ✅ **批量操作** - 批量导入/导出，支持 CSV、JSON、PDF 格式
- ✅ **学习模式** - 闪卡、测验、拼写练习三种学习方式

### 🚀 高级功能
- 🎨 **用户偏好** - 主题切换（浅色/深色/自动），个性化设置
- ⭐ **收藏系统** - 收藏喜欢的词汇，本地存储
- 📊 **数据统计** - 词汇分布、学习进度、活动趋势可视化
- 🔊 **语音朗读** - 支持多语言发音，Web Speech API + 在线 TTS
- 📱 **PWA 支持** - 可安装到桌面，离线浏览，推送通知
- 🔐 **权限管理** - 管理员面板，内容审核和用户管理
- 🌐 **国际化** - 多语言界面支持（中文/英文）

## 🛠️ 技术栈

### 前端技术
- **框架**: React 18.2.0 + TypeScript
- **构建工具**: Vite 4.5.0 (快速开发和构建)
- **样式**: Tailwind CSS 3.3.5 (原子化 CSS)
- **路由**: React Router DOM 6.18.0
- **状态管理**: React Query (TanStack Query 5.8.4)
- **UI 组件**: Lucide React (图标库)

### 后端服务
- **数据库**: Supabase PostgreSQL
- **身份验证**: Supabase Auth
- **实时功能**: Supabase Realtime
- **文件存储**: Supabase Storage
- **安全策略**: Row Level Security (RLS)

### 开发工具
- **代码质量**: ESLint + Prettier
- **版本控制**: Git + GitHub
- **CI/CD**: GitHub Actions
- **部署**: GitHub Pages (零成本)

### 第三方库
- **PDF 生成**: jsPDF + html2canvas
- **数据处理**: Lodash utilities
- **工具函数**: clsx, tailwind-merge

## 📊 数据库架构

### 核心表结构
```sql
-- 分类表
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 词汇表
CREATE TABLE words (
  id BIGSERIAL PRIMARY KEY,
  word VARCHAR(200) NOT NULL,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  category_id BIGINT REFERENCES categories(id),
  difficulty VARCHAR(20) DEFAULT 'medium',
  language VARCHAR(10) DEFAULT 'en',
  pronunciation VARCHAR(500),
  word_type VARCHAR(50),
  upvotes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(100) DEFAULT 'anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 举报表
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  word_id BIGINT REFERENCES words(id),
  reason TEXT NOT NULL,
  reported_by VARCHAR(100) DEFAULT 'anonymous',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🔒 安全策略 (RLS)
- **公开读取**: 所有用户可查看词汇和分类
- **匿名添加**: 未登录用户可添加词汇和举报
- **管理员权限**: 完整的 CRUD 操作权限
- **数据保护**: 软删除机制，防止数据丢失

## 🎯 功能模块

### 📝 词汇管理
- **添加词汇**: 支持单个和批量添加
- **编辑功能**: 实时编辑词汇信息
- **分类管理**: 动态分类创建和管理
- **搜索过滤**: 多条件筛选和排序

### 🎓 学习系统
- **闪卡模式**: 翻卡式学习体验
- **测验模式**: 选择题形式测试
- **拼写练习**: 键盘输入拼写训练
- **进度跟踪**: 学习统计和成就系统

### 📱 用户体验
- **响应式设计**: 完美适配各种设备
- **主题切换**: 浅色/深色/自动模式
- **离线支持**: PWA 离线缓存功能
- **性能优化**: 懒加载和代码分割

## 🔧 开发指南

### 项目结构
```
src/
├── components/          # 可复用组件
│   ├── Layout.jsx      # 布局组件
│   ├── StudyMode.jsx   # 学习模式
│   ├── UserPreferences.jsx # 用户设置
│   └── ...
├── pages/              # 页面组件
│   ├── Home.jsx        # 首页
│   ├── AddWord.jsx     # 添加词汇
│   └── ...
├── hooks/              # 自定义 Hooks
│   ├── useLocalStorage.js
│   ├── useDebounce.js
│   └── ...
├── lib/                # 工具库
│   ├── database.js     # 数据库操作
│   ├── supabase.js     # Supabase 配置
│   └── constants.js    # 常量定义
└── styles/             # 样式文件
```

### 开发规范
- **组件命名**: PascalCase (如 `UserPreferences`)
- **文件命名**: camelCase (如 `useLocalStorage.js`)
- **提交信息**: 遵循 [Conventional Commits](https://conventionalcommits.org/)
- **代码风格**: ESLint + Prettier 自动格式化

### 调试技巧
```bash
# 查看构建分析
npm run build -- --analyze

# 检查代码质量
npm run lint

# 修复代码格式
npm run lint:fix
```

## 🚀 性能优化

### 已实现优化
- ✅ **代码分割**: 按路由和功能模块分割
- ✅ **懒加载**: 组件和图片懒加载
- ✅ **缓存策略**: React Query 智能缓存
- ✅ **压缩优化**: Gzip 压缩和资源压缩
- ✅ **CDN 加速**: 静态资源 CDN 分发

### 性能指标
- **首屏加载**: < 2s
- **交互响应**: < 100ms
- **包大小**: < 500KB (gzipped)
- **Lighthouse 评分**: 90+ 分

## 🤝 贡献指南

### 参与方式
1. **报告问题**: 通过 [Issues](https://github.com/qilin-a/VocabHub/issues) 报告 Bug
2. **功能建议**: 提出新功能想法和改进建议
3. **代码贡献**: 提交 Pull Request 参与开发
4. **文档完善**: 改进文档和使用说明

### 贡献流程
```bash
# 1. Fork 项目
git clone https://github.com/qilin-a/VocabHub.git

# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'feat: add amazing feature'

# 4. 推送分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

### 代码审查标准
- ✅ 功能完整且测试通过
- ✅ 代码风格符合项目规范
- ✅ 添加必要的注释和文档
- ✅ 性能影响在可接受范围内

## 📄 许可证

### 开源协议
- **代码**: [MIT License](LICENSE) - 允许商业使用
- **内容**: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) - 署名-相同方式共享
- **数据**: 公共领域，自由使用

### 使用条款
- ✅ 允许商业使用和修改
- ✅ 允许私人使用和分发
- ❗ 需要保留版权声明
- ❗ 需要包含许可证副本

## 📞 联系方式

### 获取帮助
- **文档**: [项目 Wiki](https://github.com/qilin-a/VocabHub/wiki)
- **问题**: [GitHub Issues](https://github.com/qilin-a/VocabHub/issues)
- **讨论**: [GitHub Discussions](https://github.com/qilin-a/VocabHub/discussions)

### 社区
- **QQ 群**:  (公共词库交流群)
- **微信群**: 扫描二维码加入
- **邮箱**: 3679044152@qq.com

---

## 🎉 致谢

感谢所有为本项目做出贡献的开发者和用户！

**让知识共享，让学习更简单！** 🌟

[![Star History Chart](https://api.star-history.com/svg?repos=qilin-a/VocabHub&type=Date)](https://star-history.com/#qilin-a/VocabHub&Date)
