import { useState, useEffect } from 'react';
import { performanceMonitor, getPerformanceRecommendations } from '../utils/performance';

/**
 * 性能监控面板组件
 * 显示应用性能指标和优化建议
 */
export default function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 监控性能指标
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`性能指标: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      observer.observe({ entryTypes: ['measure', 'navigation'] })
      
      // 内存监控
      const memoryInterval = setInterval(() => {
        const isHighMemory = monitorMemoryUsage()
        if (isHighMemory) {
          console.warn('内存使用量过高，建议：')
          console.warn('1. 检查是否有未清理的事件监听器')
          console.warn('2. 检查是否有未清除的定时器')
          console.warn('3. 检查React Query缓存大小')
          console.warn('4. 检查组件是否正确卸载')
        }
      }, 30000) // 每30秒检查一次
      
      return () => {
        observer.disconnect()
        clearInterval(memoryInterval)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      const report = performanceMonitor.getPerformanceReport();
      setMetrics(report);
      setRecommendations(getPerformanceRecommendations(report));
    }
  }, [isOpen]);

  // 只在开发环境显示
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      {/* 性能监控按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="性能监控"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* 性能监控面板 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">性能监控面板</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 优化建议 */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">优化建议</h3>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md ${
                          rec.type === 'warning' 
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                            : 'bg-blue-50 border border-blue-200 text-blue-800'
                        }`}
                      >
                        {rec.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 加载性能 */}
              {metrics?.loadTime && (
                <div>
                  <h3 className="text-lg font-medium mb-3">页面加载性能</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      title="首次绘制"
                      value={`${Math.round(metrics.loadTime.fp)}ms`}
                      status={metrics.loadTime.fp < 1000 ? 'good' : metrics.loadTime.fp < 2500 ? 'ok' : 'poor'}
                    />
                    <MetricCard
                      title="首次内容绘制"
                      value={`${Math.round(metrics.loadTime.fcp)}ms`}
                      status={metrics.loadTime.fcp < 1500 ? 'good' : metrics.loadTime.fcp < 2500 ? 'ok' : 'poor'}
                    />
                    <MetricCard
                      title="DOM 解析"
                      value={`${Math.round(metrics.loadTime.domParse)}ms`}
                      status={metrics.loadTime.domParse < 500 ? 'good' : metrics.loadTime.domParse < 1000 ? 'ok' : 'poor'}
                    />
                    <MetricCard
                      title="页面加载"
                      value={`${Math.round(metrics.loadTime.pageLoad)}ms`}
                      status={metrics.loadTime.pageLoad < 2000 ? 'good' : metrics.loadTime.pageLoad < 3000 ? 'ok' : 'poor'}
                    />
                  </div>
                </div>
              )}

              {/* 内存使用 */}
              {metrics?.memory && (
                <div>
                  <h3 className="text-lg font-medium mb-3">内存使用情况</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard
                      title="已使用"
                      value={`${metrics.memory.used}MB`}
                      status={metrics.memory.used < 30 ? 'good' : metrics.memory.used < 50 ? 'ok' : 'poor'}
                    />
                    <MetricCard
                      title="总分配"
                      value={`${metrics.memory.total}MB`}
                    />
                    <MetricCard
                      title="限制"
                      value={`${metrics.memory.limit}MB`}
                    />
                  </div>
                </div>
              )}

              {/* 网络连接 */}
              {metrics?.connection && (
                <div>
                  <h3 className="text-lg font-medium mb-3">网络连接</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      title="连接类型"
                      value={metrics.connection.effectiveType}
                    />
                    <MetricCard
                      title="下行速度"
                      value={`${metrics.connection.downlink}Mbps`}
                    />
                    <MetricCard
                      title="往返时间"
                      value={`${metrics.connection.rtt}ms`}
                    />
                    <MetricCard
                      title="省流模式"
                      value={metrics.connection.saveData ? '开启' : '关闭'}
                    />
                  </div>
                </div>
              )}

              {/* 慢资源 */}
              {metrics?.resources && metrics.resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">慢加载资源</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            资源
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            类型
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            耗时
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            大小
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metrics.resources.slice(0, 10).map((resource, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                              {resource.name.split('/').pop()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {resource.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {resource.duration}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {resource.size ? `${Math.round(resource.size / 1024)}KB` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 指标卡片组件
function MetricCard({ title, value, status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'ok': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(status)}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
