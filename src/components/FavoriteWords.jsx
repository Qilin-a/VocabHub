import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * 收藏词汇组件
 */
export default function FavoriteWords() {
  const [favorites, setFavorites] = useLocalStorage('vocab_favorites', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');

  // 获取收藏的词汇详情
  const { data: favoriteWords, isLoading } = useQuery({
    queryKey: ['favoriteWords', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from('words')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .in('id', favorites)
        .eq('is_deleted', false);

      if (error) throw error;
      return data || [];
    },
    enabled: favorites.length > 0
  });

  // 添加到收藏
  const addToFavorites = (wordId) => { // eslint-disable-line no-unused-vars
    if (!favorites.includes(wordId)) {
      setFavorites([...favorites, wordId]);
    }
  };

  // 从收藏中移除
  const removeFromFavorites = (wordId) => {
    setFavorites(favorites.filter(id => id !== wordId));
  };

  // 检查是否已收藏
  const isFavorite = (wordId) => { // eslint-disable-line no-unused-vars
    return favorites.includes(wordId);
  };

  // 过滤和排序词汇
  const filteredWords = favoriteWords?.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedWords = [...filteredWords].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.word.localeCompare(b.word);
      case 'difficulty':
        return (a.difficulty || 1) - (b.difficulty || 1);
      case 'date_added':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // 导出收藏词汇
  const exportFavorites = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalWords: favoriteWords?.length || 0,
      words: favoriteWords || []
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favorite-words-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 清空收藏
  const clearFavorites = () => {
    if (confirm('确定要清空所有收藏的词汇吗？')) {
      setFavorites([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">我的收藏</h2>
          <p className="text-gray-600 mb-4">
            这里是您收藏的词汇列表。您可以快速访问和复习这些&ldquo;重要&rdquo;词汇。
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportFavorites}
            disabled={!favoriteWords?.length}
            className="btn btn-secondary disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出
          </button>
          <button
            onClick={clearFavorites}
            disabled={!favorites.length}
            className="btn btn-danger disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
          <p className="text-gray-600">在词汇列表中点击心形图标来收藏词汇</p>
        </div>
      ) : (
        <>
          {/* 搜索和排序 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索收藏的词汇..."
                  className="input pl-10"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input sm:w-48"
            >
              <option value="date_added">按添加时间</option>
              <option value="alphabetical">按字母顺序</option>
              <option value="difficulty">按难度等级</option>
            </select>
          </div>

          {/* 词汇列表 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedWords.map((word) => (
              <div key={word.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {word.word}
                    </h3>
                    {word.pronunciation && (
                      <p className="text-sm text-gray-600 mb-2">
                        /{word.pronunciation}/
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromFavorites(word.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="取消收藏"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-700 mb-3 line-clamp-2">
                  {word.meaning}
                </p>
                
                {word.example && (
                  <p className="text-sm text-gray-600 italic mb-3 line-clamp-2">
                    "{word.example}"
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    {word.categories && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {word.categories.name}
                      </span>
                    )}
                    {word.difficulty && (
                      <span className={`px-2 py-1 rounded-full ${
                        word.difficulty === 1 ? 'bg-green-100 text-green-800' :
                        word.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' :
                        word.difficulty === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {word.difficulty === 1 ? '初级' :
                         word.difficulty === 2 ? '中级' :
                         word.difficulty === 3 ? '高级' : '专业'}
                      </span>
                    )}
                  </div>
                  <span>
                    {new Date(word.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {searchTerm && sortedWords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">没有找到匹配的词汇</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 导出工具函数供其他组件使用
export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage('vocab_favorites', []);
  const [unreadFavorites, setUnreadFavorites] = useLocalStorage('vocab_unread_favorites', 0);
  const [lastViewedTime, setLastViewedTime] = useLocalStorage('vocab_favorites_last_viewed', 0);

  const addToFavorites = (wordId) => {
    if (!favorites.includes(wordId)) {
      setFavorites([...favorites, wordId]);
      // 增加未读计数
      setUnreadFavorites(unreadFavorites + 1);
    }
  };

  const removeFromFavorites = (wordId) => {
    setFavorites(favorites.filter(id => id !== wordId));
    // 如果删除的是未读的收藏，减少未读计数
    if (unreadFavorites > 0) {
      setUnreadFavorites(Math.max(0, unreadFavorites - 1));
    }
  };

  const toggleFavorite = (wordId) => {
    if (favorites.includes(wordId)) {
      removeFromFavorites(wordId);
    } else {
      addToFavorites(wordId);
    }
  };

  const markFavoritesAsRead = () => {
    setUnreadFavorites(0);
    setLastViewedTime(Date.now());
  };

  const isFavorite = (wordId) => {
    return favorites.includes(wordId);
  };

  return {
    favorites,
    unreadFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    markFavoritesAsRead,
    isFavorite
  };
};
