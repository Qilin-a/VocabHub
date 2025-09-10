import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Statistics() {
  // 获取统计数据
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('word_statistics')
        .select('*')
      
      if (error) throw error
      return { data }
    },
  })

  // 获取热门词汇
  const { data: popularWords } = useQuery({
    queryKey: ['popular-words'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popular_words')
        .select('*')
        .limit(5)
      
      if (error) throw error
      return { data }
    },
  })

  // 获取用户活动统计
  const queryClient = useQueryClient()
  const activityStats = queryClient.getQueryData(['activity-stats']) // eslint-disable-line no-unused-vars

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const totalWords = stats?.data?.reduce((sum, cat) => sum + cat.word_count, 0) || 0
  const totalCategories = stats?.data?.length || 0
  const avgUpvotes = stats?.data?.reduce((sum, cat) => sum + (cat.avg_upvotes || 0), 0) / (totalCategories || 1)
  const recentAdditions = stats?.data?.reduce((sum, cat) => sum + cat.recent_additions, 0) || 0

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalWords}</div>
          <div className="text-sm text-gray-500">总词汇数</div>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCategories}</div>
          <div className="text-sm text-gray-500">分类数量</div>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgUpvotes.toFixed(1)}</div>
          <div className="text-sm text-gray-500">平均点赞数</div>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{recentAdditions}</div>
          <div className="text-sm text-gray-500">本周新增</div>
        </div>
      </div>

      {/* 分类统计 */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">分类词汇分布</h3>
        <div className="space-y-3">
          {stats?.data?.slice(0, 8).map((category) => (
            <div key={category.category_name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="font-medium text-gray-900">{category.category_name}</div>
                <div className="text-sm text-gray-500">
                  平均难度: {(category.avg_difficulty || 0).toFixed(1)}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {category.word_count} 个词汇
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((category.word_count / totalWords) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门词汇 */}
      {popularWords?.data && popularWords.data.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">热门词汇</h3>
          <div className="space-y-3">
            {popularWords.data.map((word, index) => (
              <div key={word.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{word.word}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {word.meaning.substring(0, 50)}...
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {word.upvotes} 👍
                  </div>
                  <div className="text-xs text-gray-500">
                    {word.category_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
