/**
 * 性能监控工具
 * 提供页面性能指标收集和分析
 */

// 性能指标收集
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.init();
  }

  init() {
    // 监听页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.collectLoadMetrics());
    } else {
      this.collectLoadMetrics();
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // 监听用户交互
    this.setupInteractionObserver();
    
    // 监听资源加载
    this.setupResourceObserver();
  }

  // 收集页面加载指标
  collectLoadMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      this.metrics.loadTime = {
        // DNS 查询时间
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        // TCP 连接时间
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        // 请求响应时间
        request: navigation.responseEnd - navigation.requestStart,
        // DOM 解析时间
        domParse: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        // 页面完全加载时间
        pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
        // 首次内容绘制
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        // 首次绘制
        fp: paint.find(p => p.name === 'first-paint')?.startTime || 0
      };

      console.log('📊 页面加载性能指标:', this.metrics.loadTime);
    } catch (error) {
      console.warn('性能指标收集失败:', error);
    }
  }

  // 监听用户交互
  setupInteractionObserver() {
    const interactionTypes = ['click', 'keydown', 'scroll'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.recordInteraction(type, event);
      }, { passive: true });
    });
  }

  // 记录用户交互
  recordInteraction(type, event) {
    const timestamp = performance.now();
    
    if (!this.metrics.interactions) {
      this.metrics.interactions = [];
    }

    this.metrics.interactions.push({
      type,
      timestamp,
      target: event.target.tagName || 'unknown',
      className: event.target.className || ''
    });

    // 只保留最近 100 个交互记录
    if (this.metrics.interactions.length > 100) {
      this.metrics.interactions = this.metrics.interactions.slice(-100);
    }
  }

  // 监听资源加载
  setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordResourceLoad(entry);
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  // 记录资源加载
  recordResourceLoad(entry) {
    if (!this.metrics.resources) {
      this.metrics.resources = [];
    }

    // 只记录较慢的资源加载
    if (entry.duration > 100) {
      this.metrics.resources.push({
        name: entry.name,
        type: entry.initiatorType,
        duration: Math.round(entry.duration),
        size: entry.transferSize || 0,
        timestamp: entry.startTime
      });

      // 只保留最近 50 个慢资源记录
      if (this.metrics.resources.length > 50) {
        this.metrics.resources = this.metrics.resources.slice(-50);
      }
    }
  }

  // 处理页面可见性变化
  handleVisibilityChange() {
    const timestamp = performance.now();
    
    if (!this.metrics.visibility) {
      this.metrics.visibility = [];
    }

    this.metrics.visibility.push({
      visible: !document.hidden,
      timestamp
    });
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      ...this.metrics,
      memory: this.getMemoryInfo(),
      connection: this.getConnectionInfo(),
      timestamp: new Date().toISOString()
    };
  }

  // 获取内存信息
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  // 获取网络连接信息
  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  // 清理观察器
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 性能优化建议
export function getPerformanceRecommendations(metrics) {
  const recommendations = [];

  if (metrics.loadTime) {
    const { loadTime } = metrics;
    
    if (loadTime.pageLoad > 3000) {
      recommendations.push({
        type: 'warning',
        message: '页面加载时间过长，建议优化资源加载'
      });
    }

    if (loadTime.fcp > 2500) {
      recommendations.push({
        type: 'warning', 
        message: '首次内容绘制时间过长，建议优化关键渲染路径'
      });
    }

    if (loadTime.dnsLookup > 200) {
      recommendations.push({
        type: 'info',
        message: 'DNS 查询时间较长，建议使用 DNS 预解析'
      });
    }
  }

  if (metrics.memory && metrics.memory.used > 50) {
    recommendations.push({
      type: 'warning',
      message: `内存使用量较高 (${metrics.memory.used}MB)，建议检查内存泄漏`
    });
  }

  if (metrics.resources) {
    const slowResources = metrics.resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `发现 ${slowResources.length} 个加载缓慢的资源，建议优化`
      });
    }
  }

  return recommendations;
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
