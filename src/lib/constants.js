/**
 * 应用常量配置
 */

// 应用信息
export const APP_CONFIG = {
  name: 'VocaHub',
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  author: 'VocaHub Team',
  repository: 'https://github.com/qilin-a/VocabHub'
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
};

// 搜索配置
export const SEARCH = {
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_SUGGESTIONS: 8,
  HIGHLIGHT_CLASS: 'bg-yellow-200'
};

// 词汇配置
export const WORD = {
  MAX_WORD_LENGTH: 100,
  MAX_MEANING_LENGTH: 1000,
  MAX_EXAMPLE_LENGTH: 500,
  MAX_PRONUNCIATION_LENGTH: 100,
  DIFFICULTY_LEVELS: [
    { value: 1, label: '初级', color: 'green' },
    { value: 2, label: '中级', color: 'yellow' },
    { value: 3, label: '高级', color: 'orange' },
    { value: 4, label: '专业', color: 'red' }
  ],
  WORD_TYPES: [
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
    'preposition', 'conjunction', 'interjection', 'phrase', 'other'
  ],
  LANGUAGES: [
    { code: 'en', name: '英语', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: '西班牙语', flag: '🇪🇸' },
    { code: 'fr', name: '法语', flag: '🇫🇷' },
    { code: 'de', name: '德语', flag: '🇩🇪' },
    { code: 'ja', name: '日语', flag: '🇯🇵' },
    { code: 'ko', name: '韩语', flag: '🇰🇷' },
    { code: 'ru', name: '俄语', flag: '🇷🇺' }
  ]
};

// 分类配置
export const CATEGORY = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  DEFAULT_CATEGORIES: [
    '日常用语', '商务英语', '学术词汇', '科技术语', 
    '医学词汇', '法律用语', '文学词汇', '旅游用语'
  ]
};

// 文件配置
export const FILE = {
  IMPORT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/json', 'text/csv', 'text/plain'],
    BATCH_SIZE: 100
  },
  EXPORT: {
    PDF: {
      MAX_WORDS_PER_PAGE: 50,
      MARGIN: 20,
      FONT_SIZE: 12
    },
    CSV: {
      DELIMITER: ',',
      ENCODING: 'utf-8'
    }
  }
};

// 本地存储键名
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'vocab_user_preferences',
  SEARCH_HISTORY: 'vocab_search_history',
  BACKUP_HISTORY: 'vocab_backup_history',
  OFFLINE_QUEUE: 'vocab_offline_queue',
  LAST_SYNC: 'vocab_last_sync',
  THEME: 'vocab_theme',
  LANGUAGE: 'vocab_language'
};

// API 配置
export const API = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  RATE_LIMIT: {
    SEARCH: 10, // 每分钟最多10次搜索
    ADD_WORD: 20, // 每分钟最多添加20个词汇
    UPVOTE: 60 // 每分钟最多60次点赞
  }
};

// 通知配置
export const NOTIFICATION = {
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000
  },
  POSITION: 'top-right',
  MAX_NOTIFICATIONS: 5
};

// 主题配置
export const THEME = {
  COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#6b7280',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px'
  }
};

// 性能配置
export const PERFORMANCE = {
  VIRTUAL_SCROLL_THRESHOLD: 100,
  IMAGE_LAZY_LOAD_THRESHOLD: '200px',
  DEBOUNCE_DELAYS: {
    SEARCH: 300,
    RESIZE: 150,
    SCROLL: 100
  }
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  UNAUTHORIZED: '您没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器错误，请稍后重试',
  VALIDATION_ERROR: '输入数据格式不正确',
  FILE_TOO_LARGE: '文件大小超过限制',
  UNSUPPORTED_FILE_TYPE: '不支持的文件类型'
};

// 成功消息
export const SUCCESS_MESSAGES = {
  WORD_ADDED: '词汇添加成功',
  WORD_UPDATED: '词汇更新成功',
  WORD_DELETED: '词汇删除成功',
  CATEGORY_ADDED: '分类添加成功',
  CATEGORY_UPDATED: '分类更新成功',
  CATEGORY_DELETED: '分类删除成功',
  DATA_EXPORTED: '数据导出成功',
  DATA_IMPORTED: '数据导入成功',
  BACKUP_CREATED: '备份创建成功'
};

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  WORD: /^[\u4e00-\u9fa5a-zA-Z\s\-']+$/,
  PHONE: /^1[3-9]\d{9}$/
};

// 默认用户偏好设置
export const DEFAULT_PREFERENCES = {
  theme: 'light',
  language: 'zh-CN',
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  autoSave: true,
  showPronunciation: true,
  showDifficulty: true,
  enableNotifications: true,
  enableSounds: false
};
