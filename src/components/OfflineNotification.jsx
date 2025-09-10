// import { useState } from 'react';
import { useOfflineNotification } from '../hooks/useOnlineStatus';

/**
 * 离线通知组件 - 显示网络状态提示
 */
export default function OfflineNotification() {
  // const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // const [, setWasOffline] = useState(false);
  const { isOnline, showOfflineMessage, hideMessage } = useOfflineNotification({
    showNotification: true,
    autoHide: true,
    hideDelay: 5000
  });

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className={`rounded-lg p-4 shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-100 border border-green-200 text-green-800' 
          : 'bg-yellow-100 border border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isOnline ? (
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <div>
              <p className="font-medium">
                {isOnline ? '网络已连接' : '网络连接中断'}
              </p>
              <p className="text-sm opacity-75">
                {isOnline 
                  ? '您现在可以正常使用所有功能' 
                  : '部分功能可能无法使用，数据将在连接恢复后同步'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={hideMessage}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
