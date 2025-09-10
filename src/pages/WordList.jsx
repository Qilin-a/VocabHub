import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, Download, ThumbsUp, Flag, Edit3, Trash2, Heart, Star } from 'lucide-react'
import WordEditModal from '../components/WordEditModal'
import { vocabularyService, categoryService } from '../lib/database'
import { useFavorites } from '../contexts/FavoritesContext'
import { pdfService, csvService, jsonService } from '../lib/pdf'
import { formatDate, debounce } from '../lib/utils'

export default function WordList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [editingWord, setEditingWord] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { favorites, toggleFavorite, isFavorite, toggleUpvote, isUpvoted } = useFavorites()

  const queryClient = useQueryClient()

  // 获取词汇列表
  const { data: words = [], isLoading: wordsLoading, error } = useQuery({
    queryKey: ['words', { category: selectedCategory, search: searchTerm }],
    queryFn: () => vocabularyService.getAll({ 
      category: selectedCategory || undefined,
      search: searchTerm || undefined 
    }),
  })

  // 获取分类列表
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })


  // 点赞词汇
  const upvoteMutation = useMutation({
    mutationFn: async ({ wordId, isCurrentlyUpvoted }) => {
      if (isCurrentlyUpvoted) {
        const result = await vocabularyService.removeUpvote(wordId)
        return { ...result, action: 'remove' }
      } else {
        const result = await vocabularyService.upvote(wordId)
        return { ...result, action: 'add' }
      }
    },
    onMutate: async ({ wordId, isCurrentlyUpvoted }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries(['words'])
      
      // 获取当前数据
      const previousWords = queryClient.getQueryData(['words', { category: selectedCategory, search: searchTerm }])
      
      // 乐观更新
      queryClient.setQueryData(['words', { category: selectedCategory, search: searchTerm }], (old) => {
        if (!old?.data) return old
        
        return {
          ...old,
          data: old.data.map(word => {
            if (word.id === wordId) {
              const currentUpvotes = word.upvotes || 0
              return {
                ...word,
                upvotes: isCurrentlyUpvoted 
                  ? Math.max(currentUpvotes - 1, 0)
                  : currentUpvotes + 1
              }
            }
            return word
          })
        }
      })
      
      // 更新本地点赞状态
      toggleUpvote(wordId)
      
      return { previousWords }
    },
    onError: (err, { wordId }, context) => {
      // 回滚数据
      queryClient.setQueryData(['words', { category: selectedCategory, search: searchTerm }], context.previousWords)
      // 回滚本地状态
      toggleUpvote(wordId)
      console.error('点赞操作失败:', err)
    },
    onSettled: () => {
      // 重新获取数据确保同步
      queryClient.invalidateQueries(['words'])
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
      queryClient.invalidateQueries(['words'])
    }
  })


  // 过滤和排序后的词汇
  const filteredAndSortedWords = useMemo(() => {
    if (!words.data) return []

    let filtered = [...words.data]

    // 收藏过滤
    if (showFavoritesOnly) {
      filtered = filtered.filter(word => favorites.includes(word.id))
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
  }, [words.data, sortBy, sortOrder, showFavoritesOnly, favorites])

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

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    if (categoryId) {
      setSearchParams({ category: categoryId })
    } else {
      setSearchParams({})
    }
  }

  const handleUpvote = (wordId) => {
    const isCurrentlyUpvoted = isUpvoted(wordId)
    upvoteMutation.mutate({ wordId, isCurrentlyUpvoted })
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

  const handleFavoriteToggle = (wordId) => {
    toggleFavorite(wordId)
  }

  const handleExport = async (format) => {
    const wordsToExport = filteredAndSortedWords
    const categoryName = selectedCategory 
      ? categories.data?.find(c => c.id === selectedCategory)?.name || '未知分类'
      : '全部分类'

    try {
      switch (format) {
        case 'pdf':
          await pdfService.exportWordsToPDF(wordsToExport, {
            title: '词汇列表',
            category: categoryName
          })
          break
        case 'csv':
          csvService.exportWordsToCSV(wordsToExport, `词汇列表_${categoryName}.csv`)
          break
        case 'json':
          jsonService.exportWordsToJSON(wordsToExport, `词汇列表_${categoryName}.json`)
          break
        case 'markdown':
          pdfService.exportToMarkdown(wordsToExport, categoryName)
          break
      }
    } catch (error) {
      alert('导出失败：' + error.message)
    }
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
    <div className="px-4 sm:px-0" id="word-list-container">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">词汇列表</h1>
          <p className="mt-2 text-gray-600">
            共 {filteredAndSortedWords.length} 个词汇
          </p>
        </div>
        
        {/* 导出按钮 */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              导出
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为 PDF
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为 CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为 JSON
                  </button>
                  <button
                    onClick={() => handleExport('markdown')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为 Markdown
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索单词、释义或例句..."
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input"
          >
            <option value="">全部分类</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* 收藏筛选 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
                showFavoritesOnly 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span className="text-sm">收藏</span>
            </button>
          </div>

          {/* 排序 */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input flex-1"
            >
              <option value="created_at">创建时间</option>
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
        </div>
      </div>

      {/* 词汇列表 */}
      {wordsLoading ? (
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
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">未找到词汇</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showFavoritesOnly ? '您还没有收藏任何词汇' : 
             searchTerm || selectedCategory ? '尝试调整搜索条件' : '还没有任何词汇'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedWords.map((word) => (
            <div key={word.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {word.word}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {word.categories?.name || '未分类'}
                    </span>
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
                    className={`flex items-center space-x-1 transition-colors ${
                      isUpvoted(word.id)
                        ? 'text-primary-600 hover:text-primary-700'
                        : 'text-gray-500 hover:text-primary-600'
                    }`}
                    disabled={upvoteMutation.isLoading}
                    title={isUpvoted(word.id) ? '取消点赞' : '点赞'}
                  >
                    <ThumbsUp className={`h-4 w-4 ${isUpvoted(word.id) ? 'fill-current' : ''}`} />
                    <span>{word.upvotes || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => handleFavoriteToggle(word.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      isFavorite(word.id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                    title={isFavorite(word.id) ? '取消收藏' : '收藏'}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(word.id) ? 'fill-current' : ''}`} />
                    <span>{isFavorite(word.id) ? '已收藏' : '收藏'}</span>
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

      {/* 点击外部关闭导出菜单 */}
      {showFilters && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowFilters(false)}
        ></div>
      )}
    </div>
  )
}
