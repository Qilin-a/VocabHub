import { useState, useEffect, useCallback } from 'react';

/**
 * 防抖 Hook - 延迟更新值直到指定时间内没有新的更新
 * @param {*} value - 要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Array} dependencies - 依赖数组
 * @returns {*} - 防抖后的值
 */
export function useDebounce(value, delay, dependencies = []) {
  // const deps = dependencies || []; // eslint-disable-line no-unused-vars
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, dependencies]);

  return debouncedValue;
}

/**
 * 防抖回调 Hook - 防抖执行回调函数
 * @param {Function} callback - 要防抖的回调函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Array} deps - 依赖数组
 * @returns {Function} - 防抖后的回调函数
 */
export function useDebouncedCallback(callback, delay, deps = []) { // eslint-disable-line no-unused-vars
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
      setDebounceTimer(null);
    }, delay);

    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        setDebounceTimer(null);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * 节流 Hook - 限制函数执行频率
 * @param {Function} callback - 要节流的回调函数
 * @param {number} delay - 节流间隔（毫秒）
 * @returns {Function} - 节流后的回调函数
 */
export function useThrottle(callback, delay) {
  const [throttleTimer, setThrottleTimer] = useState(null);
  const [lastExecTime, setLastExecTime] = useState(0);

  const throttledCallback = (...args) => {
    const now = Date.now();
    
    if (now - lastExecTime >= delay) {
      callback(...args);
      setLastExecTime(now);
    } else if (!throttleTimer) {
      const remainingTime = delay - (now - lastExecTime);
      const timer = setTimeout(() => {
        callback(...args);
        setLastExecTime(Date.now());
        setThrottleTimer(null);
      }, remainingTime);
      
      setThrottleTimer(timer);
    }
  };

  useEffect(() => {
    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [throttleTimer]);

  return throttledCallback;
}
