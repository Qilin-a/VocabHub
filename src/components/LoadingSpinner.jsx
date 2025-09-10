/**
 * 加载动画组件
 * 提供统一的加载状态 UI
 */
export default function LoadingSpinner({ size = 'md', text = '加载中...', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      {text && (
        <p className="mt-4 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
}

// 页面级加载组件
export function PageLoading({ text = '页面加载中...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// 内容加载组件
export function ContentLoading({ text = '内容加载中...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// 按钮加载状态
export function ButtonLoading({ size = 'sm' }) {
  return (
    <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  );
}
