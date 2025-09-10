import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../lib/supabase';
import { useFavorites } from '../contexts/FavoritesContext';

export default function Layout({ children, user, onUserChange, onOpenPreferences }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { favorites, unreadFavorites } = useFavorites();

  const handleSignOut = async () => {
    try {
      await signOut();
      onUserChange(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">公共词库</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                首页
              </Link>
              <Link
                to="/add-word"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/add-word') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                添加词汇
              </Link>
              <Link
                to="/words"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/words') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                词汇列表
              </Link>
              <Link
                to="/study"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/study') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                学习模式
              </Link>
              <Link
                to="/dictation"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dictation') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                听写练习
              </Link>
              <Link
                to="/import"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/import') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                批量导入
              </Link>
              <Link
                to="/favorites"
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/favorites') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                我的收藏
                {unreadFavorites > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadFavorites > 99 ? '99+' : unreadFavorites}
                  </span>
                )}
              </Link>
              
              {/* 设置按钮 */}
              <button
                onClick={onOpenPreferences}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                title="设置 (Ctrl+,)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {user && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  管理面板
                </Link>
              )}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  退出登录
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  管理员登录
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <Link
                to="/"
                className={`mobile-menu-item ${
                  isActive('/') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                to="/add-word"
                className={`mobile-menu-item ${
                  isActive('/add-word') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                添加词汇
              </Link>
              <Link
                to="/words"
                className={`mobile-menu-item ${
                  isActive('/words') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                词汇列表
              </Link>
              <Link
                to="/study"
                className={`mobile-menu-item ${
                  isActive('/study') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                学习模式
              </Link>
              <Link
                to="/dictation"
                className={`mobile-menu-item ${
                  isActive('/dictation') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                听写练习
              </Link>
              <Link
                to="/import"
                className={`mobile-menu-item ${
                  isActive('/import') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                批量导入
              </Link>
              <Link
                to="/favorites"
                className={`mobile-menu-item ${
                  isActive('/favorites') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                我的收藏
                {unreadFavorites > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadFavorites > 99 ? '99+' : unreadFavorites}
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  onOpenPreferences();
                  setIsMobileMenuOpen(false);
                }}
                className="mobile-menu-item text-gray-700 hover:text-primary-600"
              >
                设置
              </button>
              {user && (
                <Link
                  to="/admin"
                  className={`mobile-menu-item ${
                    isActive('/admin') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  管理面板
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-menu-item text-gray-700 hover:text-primary-600 w-full text-left"
                >
                  退出登录
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`mobile-menu-item ${
                    isActive('/login') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  管理员登录
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {children}
      </main>


      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 公共词库. 开源项目，欢迎贡献。</p>
            <p className="mt-1">
              所有词汇内容采用 
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="text-primary-600 hover:text-primary-500 ml-1">
                CC BY-SA 4.0
              </a> 
              许可证共享
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
