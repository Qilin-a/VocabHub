import { useState } from 'react';

/**
 * 自定义 Hook：本地存储管理
 * @param {string} key - 存储键名
 * @param {*} initialValue - 初始值
 * @returns {[value, setValue]} - 值和设置函数
 */
export function useLocalStorage(key, initialValue) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 设置值的函数
  const setValue = (value) => {
    try {
      // 允许传入函数来更新值
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * 自定义 Hook：会话存储管理
 * @param {string} key - 存储键名
 * @param {*} initialValue - 初始值
 * @returns {[value, setValue]} - 值和设置函数
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * 清理过期的本地存储数据
 * @param {number} maxAge - 最大保存时间（毫秒）
 */
export function cleanupExpiredStorage(maxAge = 7 * 24 * 60 * 60 * 1000) { // 默认7天
  try {
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vocab_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.timestamp && (now - data.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // 如果解析失败，也删除这个键
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleaned up ${keysToRemove.length} expired storage items`);
  } catch (error) {
    console.warn('Error cleaning up expired storage:', error);
  }
}
