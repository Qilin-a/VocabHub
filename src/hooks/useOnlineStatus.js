import { useState, useEffect } from 'react';

/**
 * 在线状态 Hook - 监听网络连接状态
 * @returns {boolean} - 是否在线
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * 网络状态 Hook - 提供详细的网络信息
 * @returns {Object} - 网络状态信息
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();
    const handleConnectionChange = () => updateNetworkStatus();

    // 初始化
    updateNetworkStatus();

    // 监听事件
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}

/**
 * 离线提示 Hook - 在离线时显示提示
 * @param {Object} options - 配置选项
 * @returns {Object} - 离线状态和提示控制
 */
export function useOfflineNotification(options = {}) {
  const {
    showNotification = true,
    autoHide = true,
    hideDelay = 3000
  } = options;

  const isOnline = useOnlineStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      if (showNotification) {
        setShowOfflineMessage(true);
      }
    } else if (wasOffline && isOnline) {
      // 从离线恢复到在线
      if (showNotification) {
        setShowOfflineMessage(true);
        if (autoHide) {
          setTimeout(() => {
            setShowOfflineMessage(false);
          }, hideDelay);
        }
      }
      setWasOffline(false);
    }
  }, [isOnline, showNotification, autoHide, hideDelay, wasOffline]);

  const hideMessage = () => setShowOfflineMessage(false);

  return {
    isOnline,
    showOfflineMessage,
    hideMessage,
    wasOffline
  };
}
