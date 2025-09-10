import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Users, BookOpen, Flag, Trash2, Check, X, LogOut, Settings, Activity, TrendingUp, Calendar, Clock, User, Database, AlertTriangle } from 'lucide-react'
import { vocabularyService, categoryService } from '../lib/database'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const queryClient = useQueryClient()

  // 检查管理员权限
  useEffect(() => {
    if (!user || user.email !== '3679044152@qq.com') {
      window.location.href = '/login'
    }
  }, [user])

  // 获取统计数据
  const { data: words = [] } = useQuery({
    queryKey: ['words', 'all'],
    queryFn: () => vocabularyService.getAll(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  // 获取举报列表
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          words (
            id,
            word,
            meaning,
            example_sentence
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data }
    },
    enabled: !!user
  })

  // 处理举报
  const handleReportMutation = useMutation({
    mutationFn: async ({ reportId, action }) => {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: action === 'approve' ? 'resolved' : 'reviewed' })
        .eq('id', reportId)
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports'])
    }
  })

  // 删除词汇
  const deleteWordMutation = useMutation({
    mutationFn: vocabularyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['words'])
      queryClient.invalidateQueries(['reports'])
    }
  })

  // 删除分类
  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
    }
  })

  const handleReport = (reportId, action) => {
    handleReportMutation.mutate({ reportId, action })
  }

  const handleDeleteWord = (wordId) => {
    if (confirm('确定要删除这个词汇吗？')) {
      deleteWordMutation.mutate(wordId)
    }
  }

  const handleDeleteCategory = (categoryId) => {
    if (confirm('确定要删除这个分类吗？相关词汇将变为未分类。')) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  if (!user || user.email !== '3679044152@qq.com') {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">访问被拒绝</h3>
        <p className="mt-1 text-sm text-gray-500">
          您需要管理员权限才能访问此页面
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: '概览', icon: BookOpen },
    { id: 'reports', name: '举报管理', icon: Flag },
    { id: 'categories', name: '分类管理', icon: Users },
    { id: 'analytics', name: '数据分析', icon: TrendingUp },
    { id: 'settings', name: '系统设置', icon: Settings },
  ]

  const totalWords = words.data?.length || 0
  const totalCategories = categories.data?.length || 0
  const pendingReports = reports.data?.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧标题 */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">VocabHub 管理面板</h1>
                <p className="text-sm text-gray-500">系统管理与数据监控</p>
              </div>
            </div>

            {/* 右侧用户信息和操作 */}
            <div className="flex items-center space-x-4">
              {/* 当前时间 */}
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                {new Date().toLocaleString('zh-CN')}
              </div>

              {/* 用户信息 */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">管理员</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>

                {/* 登出按钮 */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-2" />
                    {tab.name}
                    {tab.id === 'reports' && pendingReports > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {pendingReports}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="p-6">

            {/* 概览 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">总词汇数</p>
                        <p className="text-3xl font-bold">{totalWords}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">分类数量</p>
                        <p className="text-3xl font-bold">{totalCategories}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">待处理举报</p>
                        <p className="text-3xl font-bold">{pendingReports}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">今日活动</p>
                        <p className="text-3xl font-bold">{words.data?.filter(w => new Date(w.created_at).toDateString() === new Date().toDateString()).length || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                </div>

                {/* 最近活动 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-gray-600" />
                      最近添加的词汇
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {words.data?.slice(0, 5).map((word) => (
                        <div key={word.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{word.word}</p>
                                <p className="text-sm text-gray-500">{word.meaning.substring(0, 60)}...</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(word.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 举报管理 */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reportsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : reports.data?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Flag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暂无举报</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      当前没有需要处理的举报
                    </p>
                  </div>
                ) : (
                  reports.data?.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Flag className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-gray-900">
                              举报词汇：{report.words?.word}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>释义：</strong>{report.words?.meaning}
                            </p>
                            {report.words?.example_sentence && (
                              <p className="text-sm text-gray-700">
                                <strong>例句：</strong>"{report.words?.example_sentence}"
                              </p>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>举报原因：</strong>{report.reason}
                          </p>
                          
                          <p className="text-xs text-gray-500">
                            举报时间：{formatDate(report.created_at)} | 举报人：{report.reported_by}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleReport(report.id, 'reject')}
                          className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          disabled={handleReportMutation.isLoading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          驳回
                        </button>
                        
                        <button
                          onClick={() => handleDeleteWord(report.word_id)}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          disabled={deleteWordMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除词汇
                        </button>
                        
                        <button
                          onClick={() => handleReport(report.id, 'approve')}
                          className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800"
                          disabled={handleReportMutation.isLoading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          标记已处理
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 分类管理 */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">分类列表</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.data?.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{category.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {category.description || '暂无描述'}
                          </p>
                          <p className="text-xs text-gray-500">
                            创建时间：{formatDate(category.created_at)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={deleteCategoryMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 数据分析 */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* 数据统计图表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 词汇增长趋势 */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                      词汇增长趋势
                    </h3>
                    <div className="space-y-4">
                      {(() => {
                        const last7Days = Array.from({length: 7}, (_, i) => {
                          const date = new Date()
                          date.setDate(date.getDate() - (6 - i))
                          const dayWords = words.data?.filter(w => 
                            new Date(w.created_at).toDateString() === date.toDateString()
                          ).length || 0
                          return {
                            date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
                            count: dayWords
                          }
                        })
                        const maxCount = Math.max(...last7Days.map(d => d.count), 1)
                        
                        return last7Days.map((day, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-16 text-sm text-gray-600">{day.date}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(day.count / maxCount) * 100}%` }}
                              ></div>
                            </div>
                            <div className="w-8 text-sm font-medium text-gray-900">{day.count}</div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* 分类分布 */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-600" />
                      分类词汇分布
                    </h3>
                    <div className="space-y-3">
                      {categories.data?.map((category, index) => {
                        const categoryWords = words.data?.filter(w => w.category_id === category.id).length || 0
                        const percentage = totalWords > 0 ? (categoryWords / totalWords * 100).toFixed(1) : 0
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500']
                        
                        return (
                          <div key={category.id} className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                                <span className="text-sm text-gray-600">{categoryWords} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 热门词汇排行 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                      热门词汇排行 (按点赞数)
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {words.data?.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
                        .slice(0, 10)
                        .map((word, index) => (
                          <div key={word.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{word.word}</p>
                              <p className="text-sm text-gray-500">{word.meaning.substring(0, 50)}...</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{word.upvotes || 0}</p>
                              <p className="text-xs text-gray-500">点赞</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 系统设置 */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* 数据管理 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Database className="h-5 w-5 mr-2 text-blue-600" />
                      数据管理
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => {
                          const data = {
                            words: words.data || [],
                            categories: categories.data || [],
                            exportTime: new Date().toISOString()
                          }
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `vocabhub-backup-${new Date().toISOString().split('T')[0]}.json`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                        className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Database className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-900">导出数据</span>
                        <span className="text-xs text-gray-500 mt-1">备份所有词汇和分类</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('确定要清理所有已处理的举报记录吗？此操作不可撤销。')) {
                            supabase.from('reports').delete().neq('status', 'pending')
                              .then(() => {
                                alert('清理完成')
                                queryClient.invalidateQueries(['reports'])
                              })
                          }
                        }}
                        className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                      >
                        <Trash2 className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-900">清理举报</span>
                        <span className="text-xs text-gray-500 mt-1">删除已处理的举报</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('确定要重置所有点赞数据吗？此操作不可撤销。')) {
                            supabase.from('words').update({ upvotes: 0 }).neq('id', 0)
                              .then(() => {
                                alert('重置完成')
                                queryClient.invalidateQueries(['words'])
                              })
                          }
                        }}
                        className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                      >
                        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-900">重置点赞</span>
                        <span className="text-xs text-gray-500 mt-1">清零所有点赞数据</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 批量操作 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-green-600" />
                      批量操作
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">批量删除词汇</h4>
                        <p className="text-sm text-gray-600 mb-3">删除点赞数低于指定值的词汇</p>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="最小点赞数"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            id="minUpvotes"
                          />
                          <button
                            onClick={() => {
                              const minUpvotes = parseInt(document.getElementById('minUpvotes').value) || 0
                              if (confirm(`确定要删除点赞数少于 ${minUpvotes} 的所有词汇吗？`)) {
                                const wordsToDelete = words.data?.filter(w => (w.upvotes || 0) < minUpvotes) || []
                                Promise.all(wordsToDelete.map(w => vocabularyService.delete(w.id)))
                                  .then(() => {
                                    alert(`已删除 ${wordsToDelete.length} 个词汇`)
                                    queryClient.invalidateQueries(['words'])
                                  })
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            删除
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">批量分类管理</h4>
                        <p className="text-sm text-gray-600 mb-3">将未分类词汇分配到指定分类</p>
                        <div className="flex space-x-2">
                          <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" id="targetCategory">
                            <option value="">选择目标分类</option>
                            {categories.data?.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const categoryId = document.getElementById('targetCategory').value
                              if (!categoryId) return alert('请选择分类')
                              
                              const uncategorizedWords = words.data?.filter(w => !w.category_id) || []
                              if (confirm(`确定要将 ${uncategorizedWords.length} 个未分类词汇移动到选定分类吗？`)) {
                                Promise.all(uncategorizedWords.map(w => 
                                  supabase.from('words').update({ category_id: categoryId }).eq('id', w.id)
                                )).then(() => {
                                  alert('批量分类完成')
                                  queryClient.invalidateQueries(['words'])
                                })
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            分配
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 系统信息 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-purple-600" />
                      系统信息
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">应用版本</span>
                          <span className="text-sm font-medium text-gray-900">VocabHub v1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">数据库连接</span>
                          <span className="text-sm font-medium text-green-600">正常</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">最后备份时间</span>
                          <span className="text-sm font-medium text-gray-900">从未备份</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">总存储使用</span>
                          <span className="text-sm font-medium text-gray-900">
                            {((JSON.stringify(words.data || []).length + JSON.stringify(categories.data || []).length) / 1024).toFixed(2)} KB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">平均词汇长度</span>
                          <span className="text-sm font-medium text-gray-900">
                            {words.data?.length ? (words.data.reduce((sum, w) => sum + w.word.length, 0) / words.data.length).toFixed(1) : 0} 字符
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">系统运行时间</span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.floor((Date.now() - new Date().setHours(0,0,0,0)) / 1000 / 60)} 分钟
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 登出确认模态框 */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <LogOut className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">确认登出</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    您确定要登出管理员账户吗？
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      确认登出
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
