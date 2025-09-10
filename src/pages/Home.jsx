import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookOpen, TrendingUp, Users, Headphones, Volume2 } from 'lucide-react'
import { vocabularyService, categoryService } from '../lib/database'
import Statistics from '../components/Statistics'

export default function Home() {
  const { data: words = [], isLoading: wordsLoading } = useQuery({
    queryKey: ['words', 'recent'],
    queryFn: () => vocabularyService.getAll(),
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  const recentWords = words.data?.slice(0, 6) || []
  const totalWords = words.data?.length || 0
  const totalCategories = categories.data?.length || 0

  return (
    <div className="px-4 sm:px-0">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="text-primary-600">公共词库</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          人人可添加、查看和分享的在线词汇库。让知识共享，让学习更简单。
        </p>
        <div className="mt-5 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:mt-8">
          <Link
            to="/add-word"
            className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            添加词汇
          </Link>
          
          <Link
            to="/words"
            className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-50 transition-colors shadow-lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            浏览词库
          </Link>
          
          <Link
            to="/study"
            className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors shadow-lg"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            学习模式
          </Link>
          
          <Link
            to="/dictation"
            className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors shadow-lg"
          >
            <Headphones className="h-5 w-5 mr-2" />
            听写练习
          </Link>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-12">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{totalWords}</div>
          <div className="text-sm text-gray-500 mt-1">总词汇数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{totalCategories}</div>
          <div className="text-sm text-gray-500 mt-1">分类数量</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">∞</div>
          <div className="text-sm text-gray-500 mt-1">免费使用</div>
        </div>
      </div>

      {/* 最新添加的词汇 */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">最新词汇</h2>
          <Link
            to="/words"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            查看全部 →
          </Link>
        </div>

        {wordsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentWords.map((word) => (
              <div key={word.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {word.word}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {word.meaning}
                    </p>
                    {word.example_sentence && (
                      <p className="text-gray-500 text-xs italic line-clamp-1">
                        "{word.example_sentence}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {word.categories?.name || '未分类'}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {word.upvotes || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!wordsLoading && recentWords.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无词汇</h3>
            <p className="mt-1 text-sm text-gray-500">
              成为第一个添加词汇的人吧！
            </p>
            <div className="mt-6">
              <Link
                to="/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加第一个词汇
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 分类概览 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">热门分类</h2>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.data?.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/words?category=${category.id}`}
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {category.description || '暂无描述'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据统计</h2>
        <Statistics />
      </div>

      {/* 功能特色 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">功能特色</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">人人可贡献</h3>
            <p className="text-gray-500">
              任何人都可以添加新词汇，共同建设词库
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">分类管理</h3>
            <p className="text-gray-500">
              按分类组织词汇，便于查找和学习
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">导出功能</h3>
            <p className="text-gray-500">
              支持导出为 PDF、CSV 等格式
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
