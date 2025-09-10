/**
 * 内存优化工具函数
 */

// 清理React Query缓存
export const clearQueryCache = (queryClient) => {
  queryClient.clear()
  console.log('React Query缓存已清理')
}

// 强制垃圾回收（仅在开发环境）
export const forceGarbageCollection = () => {
  if (window.gc && process.env.NODE_ENV === 'development') {
    window.gc()
    console.log('强制垃圾回收完成')
  }
}

// 监控内存使用情况
export const monitorMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory
    console.log('内存使用情况:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    })
    
    // 如果内存使用超过50MB，发出警告
    if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
      console.warn('内存使用量较高，建议检查内存泄漏')
      return true
    }
  }
  return false
}

// 清理localStorage中的过期数据
export const cleanupLocalStorage = () => {
  const keysToCheck = [
    'vocab_favorites',
    'vocab_unread_favorites', 
    'vocab_upvoted_words',
    'vocab_user_preferences'
  ]
  
  keysToCheck.forEach(key => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        // 检查数据是否有效
        JSON.parse(item)
      }
    } catch (error) {
      console.warn(`清理无效的localStorage项: ${key}`)
      localStorage.removeItem(key)
    }
  })
}

// 优化图片加载
export const optimizeImageLoading = () => {
  // 懒加载图片
  const images = document.querySelectorAll('img[data-src]')
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.removeAttribute('data-src')
        observer.unobserve(img)
      }
    })
  })
  
  images.forEach(img => imageObserver.observe(img))
  
  return () => {
    imageObserver.disconnect()
  }
}

// 防抖函数优化版本
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
    
    // 返回清理函数
    return () => {
      clearTimeout(timeout)
      timeout = null
    }
  }
}

// 内存泄漏检测
export const detectMemoryLeaks = () => {
  let initialMemory = 0
  let checkCount = 0
  
  const check = () => {
    if (performance.memory) {
      const currentMemory = performance.memory.usedJSHeapSize
      
      if (checkCount === 0) {
        initialMemory = currentMemory
      } else {
        const growth = currentMemory - initialMemory
        const growthMB = growth / 1024 / 1024
        
        if (growthMB > 10) {
          console.warn(`检测到可能的内存泄漏: 内存增长 ${growthMB.toFixed(2)} MB`)
        }
      }
      
      checkCount++
    }
  }
  
  // 每30秒检查一次
  const interval = setInterval(check, 30000)
  
  return () => {
    clearInterval(interval)
  }
}
