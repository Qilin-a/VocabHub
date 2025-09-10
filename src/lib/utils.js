import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 格式化日期
export function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生成随机ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 验证输入
export function validateWord(word) {
  if (!word || word.trim().length === 0) {
    return '单词不能为空'
  }
  if (word.length > 100) {
    return '单词长度不能超过100个字符'
  }
  return null
}

export function validateMeaning(meaning) {
  if (!meaning || meaning.trim().length === 0) {
    return '释义不能为空'
  }
  if (meaning.length > 500) {
    return '释义长度不能超过500个字符'
  }
  return null
}

export function validateExampleSentence(sentence) {
  if (sentence && sentence.length > 1000) {
    return '例句长度不能超过1000个字符'
  }
  return null
}
