import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Heart, ThumbsUp, Flag, Edit3, Trash2, BookOpen } from 'lucide-react'
import WordEditModal from '../components/WordEditModal'
import { vocabularyService } from '../lib/database'
import { useFavorites } from '../contexts/FavoritesContext'
import { formatDate, debounce } from '../lib/utils'

export default function Favorites() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [editingWord, setEditingWord] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const { favorites, removeFromFavorites, isFavorite, markFavoritesAsRead } = useFavorites()

  const queryClient = useQueryClient()

  // 当用户访问收藏页面时，标记为已读
  useEffect(() => {
    markFavoritesAsRead()
  }, [markFavoritesAsRead])

  // 获取收藏的词汇详情
  const { data: favoriteWords = [], isLoading, error } = useQuery({
    queryKey: ['favoriteWords', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return []
      
      const { data, error } = await vocabularyService.getAll({})
      if (error) throw error
      
      // 过滤出收藏的词汇
      return data?.filter(word => favorites.includes(word.id)) || []
    },
    enabled: favorites.length > 0
  })

  // 点赞
  const upvoteMutation = useMutation({
    mutationFn: vocabularyService.upvote,
    onSuccess: () => {
      queryClient.invalidateQueries(['favorite-words'])
    }
  })

  // 举报
  const reportMutation = useMutation({
    mutationFn: ({ id, reason }) => vocabularyService.report(id, reason),
    onSuccess: () => {
      alert('举报已提交，感谢您的反馈！')
    }
  })

  // 删除
  const deleteMutation = useMutation({
    mutationFn: vocabularyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['favorite-words'])
    }
  })


  // 过滤和排序后的词汇
  const filteredAndSortedWords = useMemo(() => {
    if (!favoriteWords) return []

    let filtered = [...favoriteWords]

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(term) ||
        word.meaning.toLowerCase().includes(term) ||
        (word.example_sentence && word.example_sentence.toLowerCase().includes(term))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'word') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [favoriteWords, searchTerm, sortBy, sortOrder])

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term)
    }, 300),
    []
  )

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleUpvote = (wordId) => {
    upvoteMutation.mutate(wordId)
  }

  const handleReport = (wordId) => {
    const reason = prompt('请输入举报原因：')
    if (reason && reason.trim()) {
      reportMutation.mutate({ id: wordId, reason: reason.trim() })
    }
  }

  const handleDelete = (wordId) => {
    if (confirm('确定要删除这个词汇吗？此操作不可撤销。')) {
      deleteMutation.mutate(wordId)
    }
  }

  const handleUnfavorite = (wordId) => {
    removeFromFavorites(wordId)
  }

  if (error) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg">加载失败：{error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0" id="favorites-container">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">我的收藏</h1>
          </div>
          <p className="mt-2 text-gray-600">
            共收藏了 {filteredAndSortedWords.length} 个词汇
          </p>
        </div>
      </div>

      {/* 搜索和排序 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索收藏的单词、释义或例句..."
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>

          {/* 排序 */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input flex-1"
            >
              <option value="created_at">收藏时间</option>
              <option value="word">单词</option>
              <option value="upvotes">点赞数</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input w-20"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center justify-end">
            <div className="text-sm text-gray-500">
              显示 {filteredAndSortedWords.length} / {favoriteWords.length} 个词汇
            </div>
          </div>
        </div>
      </div>

      {/* 收藏词汇列表 */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedWords.length === 0 ? (
        <div className="text-center py-12">
          {favoriteWords.length === 0 ? (
            <>
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">还没有收藏任何词汇</h3>
              <p className="mt-1 text-sm text-gray-500">
                在词汇列表中点击心形图标来收藏您喜欢的词汇
              </p>
              <div className="mt-6">
                <a
                  href="/VocabHub/words"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  浏览词汇列表
                </a>
              </div>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">未找到匹配的词汇</h3>
              <p className="mt-1 text-sm text-gray-500">
                尝试调整搜索条件
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedWords.map((word) => (
            <div key={word.id} className="card hover:shadow-md transition-shadow border-l-4 border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {word.word}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {word.categories?.name || '未分类'}
                    </span>
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  </div>
                  
                  <p className="text-gray-700 mb-3">
                    {word.meaning}
                  </p>
                  
                  {word.example_sentence && (
                    <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 mb-3">
                      "{word.example_sentence}"
                    </blockquote>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      创建于 {formatDate(word.created_at)}
                    </span>
                    <span>
                      由 {word.created_by} 添加
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleUpvote(word.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors"
                    disabled={upvoteMutation.isLoading}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{word.upvotes || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => handleUnfavorite(word.id)}
                    className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition-colors"
                    title="取消收藏"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                    <span>取消收藏</span>
                  </button>
                  
                  <button
                    onClick={() => handleReport(word.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                    disabled={reportMutation.isLoading}
                  >
                    <Flag className="h-4 w-4" />
                    <span>举报</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingWord(word)
                      setShowEditModal(true)
                    }}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(word.id)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    disabled={deleteMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑模态框 */}
      <WordEditModal
        word={editingWord}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingWord(null)
        }}
      />
    </div>
  )
}
