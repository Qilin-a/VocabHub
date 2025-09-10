import { useEffect } from 'react';

/**
 * 键盘快捷键 Hook
 * 提供全局键盘快捷键支持
 */
export function useKeyboardShortcuts(shortcuts = {}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 检查是否在输入框中
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName
      );
      
      // 如果在输入框中且不是全局快捷键，则不处理
      if (isInputFocused && !event.ctrlKey && !event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const combo = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'meta', 
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        key
      ].filter(Boolean).join('+');

      // 查找匹配的快捷键
      const shortcut = shortcuts[combo] || shortcuts[key];
      
      if (shortcut) {
        event.preventDefault();
        shortcut(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// 全局快捷键配置
export const GLOBAL_SHORTCUTS = {
  // 导航快捷键
  'ctrl+1': () => window.location.hash = '#/',
  'ctrl+2': () => window.location.hash = '#/words',
  'ctrl+3': () => window.location.hash = '#/add-word',
  'ctrl+4': () => window.location.hash = '#/study',
  
  // 功能快捷键
  'ctrl+k': () => {
    // 打开搜索
    const searchInput = document.querySelector('[data-search]');
    if (searchInput) {
      searchInput.focus();
    }
  },
  
  'ctrl+n': () => {
    // 新建词汇
    window.location.hash = '#/add-word';
  },
  
  'ctrl+,': () => {
    // 打开设置
    window.dispatchEvent(new CustomEvent('openPreferences'));
  },
  
  'escape': () => {
    // 关闭模态框
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    if (closeButtons.length > 0) {
      closeButtons[closeButtons.length - 1].click();
    }
  },
  
  'f1': () => {
    // 显示帮助
    window.dispatchEvent(new CustomEvent('showHelp'));
  }
};

// 快捷键帮助信息
export const SHORTCUT_HELP = [
  { keys: ['Ctrl', '1'], description: '返回首页' },
  { keys: ['Ctrl', '2'], description: '词汇列表' },
  { keys: ['Ctrl', '3'], description: '添加词汇' },
  { keys: ['Ctrl', '4'], description: '学习模式' },
  { keys: ['Ctrl', 'K'], description: '打开搜索' },
  { keys: ['Ctrl', 'N'], description: '新建词汇' },
  { keys: ['Ctrl', ','], description: '打开设置' },
  { keys: ['Esc'], description: '关闭弹窗' },
  { keys: ['F1'], description: '显示帮助' }
];
