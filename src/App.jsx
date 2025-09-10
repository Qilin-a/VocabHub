import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCurrentUser } from './lib/supabase';
import Layout from './components/Layout';
import { FavoritesProvider } from './contexts/FavoritesContext';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const AddWord = lazy(() => import('./pages/AddWord'));
const WordList = lazy(() => import('./pages/WordList'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const BatchImport = lazy(() => import('./pages/BatchImport'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
const DictationPractice = lazy(() => import('./pages/DictationPractice'));
const Favorites = lazy(() => import('./pages/Favorites'));
import OfflineNotification from './components/OfflineNotification';
import UserPreferences from './components/UserPreferences';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoading } from './components/LoadingSpinner';
import PerformanceMonitor from './components/PerformanceMonitor';
import HelpModal from './components/HelpModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { DEFAULT_PREFERENCES } from './lib/constants';
import { supabase } from './lib/supabase';
import { monitorMemoryUsage, cleanupLocalStorage, detectMemoryLeaks } from './utils/memoryOptimization';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 5 * 60 * 1000, // 减少缓存时间到5分钟
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences] = useLocalStorage('vocab_user_preferences', DEFAULT_PREFERENCES);

  // 启用全局快捷键
  useKeyboardShortcuts(GLOBAL_SHORTCUTS);

  useEffect(() => {
    checkUser()
    
    // 初始化内存监控
    cleanupLocalStorage()
    const memoryLeakDetector = detectMemoryLeaks()
    
    // 定期监控内存使用
    const memoryMonitor = setInterval(() => {
      monitorMemoryUsage()
    }, 60000) // 每分钟检查一次
    
    return () => {
      clearInterval(memoryMonitor)
      memoryLeakDetector()
    }
  }, []);

  useEffect(() => {
    setupGlobalEventListeners();
  }, []);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // 自动模式
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [preferences.theme]);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // 设置全局事件监听器
  const setupGlobalEventListeners = () => {
    // 监听用户状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听打开设置事件
    const handleOpenPreferences = () => setShowPreferences(true);
    window.addEventListener('openPreferences', handleOpenPreferences);

    return () => {
      window.removeEventListener('openPreferences', handleOpenPreferences);
    };
  };

  if (loading) {
    return <PageLoading text="应用初始化中..." />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <div className={`min-h-screen transition-colors duration-200 ${
            preferences.theme === 'dark' ? 'dark' : ''
          }`}>
            <Layout 
              user={user} 
              onUserChange={setUser}
              onOpenPreferences={() => setShowPreferences(true)}
            >
              <Suspense fallback={<PageLoading text="页面加载中..." />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/add-word" element={<AddWord />} />
                  <Route path="/words" element={<WordList />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/study" element={<StudyPage />} />
                  <Route path="/dictation" element={<DictationPractice />} />
                  <Route path="/import" element={<BatchImport />} />
                  <Route path="/login" element={<Login onLogin={checkUser} />} />
                  <Route 
                    path="/admin" 
                    element={
                      user ? <AdminPanel user={user} /> : <Navigate to="/login" replace />
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
            
            {/* 全局组件 */}
            <OfflineNotification />
            
            {/* 用户设置面板 */}
            <UserPreferences 
              isOpen={showPreferences}
              onClose={() => setShowPreferences(false)}
            />
            
            {/* 性能监控 (仅开发环境) */}
            <PerformanceMonitor />
            
            {/* 帮助模态框 */}
            <HelpModal />
          </div>
        </FavoritesProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
