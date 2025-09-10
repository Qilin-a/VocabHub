/**
 * VocaHub Service Worker
 * 提供离线缓存和 PWA 功能
 */

// Service Worker 版本和缓存名称
const VERSION = '1.0.0';
const STATIC_CACHE = `vocahub-static-v${VERSION}`;
const DYNAMIC_CACHE = `vocahub-dynamic-v${VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/VocabHub/',
  '/VocabHub/index.html',
  '/VocabHub/manifest.json',
  '/VocabHub/favicon.svg',
  '/VocabHub/favicon-32x32.png',
  '/VocabHub/favicon-16x16.png',
  '/VocabHub/apple-touch-icon.png'
];

// 需要缓存的 API 路径模式
const API_CACHE_PATTERNS = [
  /\/rest\/v1\/words/,
  /\/rest\/v1\/categories/,
  /\/rest\/v1\/system_config/
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 缓存静态资源...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ 静态资源缓存完成');
        return self.skipWaiting();
      })
      .then(() => {
        // 通知所有客户端更新可用
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage('update-available');
          });
        });
      })
      .catch((error) => {
        console.error('❌ 静态资源缓存失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker 激活完成');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 静态资源缓存策略：缓存优先
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // API 请求缓存策略：网络优先
  if (isApiRequest(request.url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 其他请求：网络优先
  event.respondWith(networkFirst(request));
});

// 判断是否为静态资源
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('.js') ||
         url.includes('.css') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg') ||
         url.includes('.ico');
}

// 判断是否为 API 请求
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// 缓存优先策略
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('缓存优先策略失败:', error);
    return new Response('离线状态，资源不可用', { status: 503 });
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存成功的响应
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('网络请求失败，尝试缓存:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是页面请求，返回离线页面
    if (request.destination === 'document') {
      return caches.match('/VocabHub/index.html');
    }
    
    return new Response('离线状态，资源不可用', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  console.log('🔄 后台同步:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 这里可以添加离线时的数据同步逻辑
    console.log('📡 执行后台数据同步...');
  } catch (error) {
    console.error('❌ 后台同步失败:', error);
  }
}

// 推送通知
self.addEventListener('push', (event) => {
  console.log('📢 收到推送消息:', event);
  
  const options = {
    body: event.data ? event.data.text() : '您有新的词汇更新',
    icon: '/VocabHub/favicon-32x32.png',
    badge: '/VocabHub/favicon-16x16.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/VocabHub/favicon-16x16.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/VocabHub/favicon-16x16.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('VocaHub 通知', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 通知被点击:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.matchAll().then(() => {
        return self.clients.openWindow('/VocabHub/');
      })
    );
  }
});

// 错误处理
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker 错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker 未处理的 Promise 错误:', event.reason);
});

console.log('🚀 VocaHub Service Worker 已加载');
