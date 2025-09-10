import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * 高级统计和数据可视化组件
 */
export default function AdvancedStatistics() {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  // const [, setChartType] = useState('bar'); // bar, line, pie

  // 获取统计数据
  const { data: stats, isLoading } = useQuery({
    queryKey: ['advancedStats', timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate = new Date('2020-01-01');
      }

      // 并行获取多个统计数据
      const [
        wordsStats,
        categoriesStats,
        activitiesStats,
        difficultyStats,
        languageStats,
        dailyStats
      ] = await Promise.all([
        // 词汇统计
        supabase
          .from('words')
          .select('id, created_at, difficulty, language, word_type')
          .eq('is_deleted', false)
          .gte('created_at', startDate.toISOString()),
        
        // 分类统计
        supabase
          .from('categories')
          .select('id, name, words(count)')
          .eq('is_deleted', false),
        
        // 用户活动统计
        supabase
          .from('user_activities')
          .select('action_type, created_at')
          .gte('created_at', startDate.toISOString()),
        
        // 难度分布
        supabase
          .from('words')
          .select('difficulty')
          .eq('is_deleted', false),
        
        // 语言分布
        supabase
          .from('words')
          .select('language')
          .eq('is_deleted', false),
        
        // 每日新增统计
        supabase
          .rpc('get_daily_word_stats', {
            start_date: startDate.toISOString(),
            end_date: now.toISOString()
          })
      ]);

      return {
        words: wordsStats.data || [],
        categories: categoriesStats.data || [],
        activities: activitiesStats.data || [],
        difficulty: difficultyStats.data || [],
        language: languageStats.data || [],
        daily: dailyStats.data || []
      };
    }
  });

  // 处理统计数据
  const processedStats = React.useMemo(() => {
    if (!stats) return null;

    // 难度分布
    const difficultyDistribution = stats.difficulty.reduce((acc, word) => {
      const level = word.difficulty || 1;
      const levelName = level === 1 ? '初级' : level === 2 ? '中级' : level === 3 ? '高级' : '专业';
      acc[levelName] = (acc[levelName] || 0) + 1;
      return acc;
    }, {});

    // 语言分布
    const languageDistribution = stats.language.reduce((acc, word) => {
      const lang = word.language || 'unknown';
      const langName = {
        'en': '英语',
        'zh': '中文',
        'es': '西班牙语',
        'fr': '法语',
        'de': '德语',
        'ja': '日语',
        'ko': '韩语',
        'ru': '俄语'
      }[lang] || '其他';
      acc[langName] = (acc[langName] || 0) + 1;
      return acc;
    }, {});

    // 活动类型分布
    const activityDistribution = stats.activities.reduce((acc, activity) => {
      const actionName = {
        'add_word': '添加词汇',
        'upvote': '点赞',
        'report': '举报',
        'search': '搜索',
        'export': '导出'
      }[activity.action_type] || activity.action_type;
      acc[actionName] = (acc[actionName] || 0) + 1;
      return acc;
    }, {});

    // 分类词汇数量
    const categoryStats = stats.categories.map(cat => ({
      name: cat.name,
      count: cat.words?.[0]?.count || 0
    })).sort((a, b) => b.count - a.count);

    // 每日新增趋势
    const dailyTrend = stats.daily.map(day => ({
      date: new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      count: day.word_count || 0
    }));

    return {
      difficultyDistribution,
      languageDistribution,
      activityDistribution,
      categoryStats,
      dailyTrend,
      totalWords: stats.words.length,
      totalCategories: stats.categories.length,
      totalActivities: stats.activities.length
    };
  }, [stats]);

  // 简单的条形图组件
  const BarChart = ({ data, title, color = '#3b82f6' }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 truncate">{key}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4 relative">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${(value / maxValue) * 100}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-gray-900 text-right">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 饼图组件
  const PieChart = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {Object.entries(data).reduce((acc, [key, value], index) => {
                const percentage = (value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = acc.offset;
                
                acc.elements.push(
                  <circle
                    key={key}
                    cx="50"
                    cy="50"
                    r="15.915"
                    fill="transparent"
                    stroke={colors[index % colors.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={-strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
                
                acc.offset += percentage;
                return acc;
              }, { elements: [], offset: 0 }).elements}
            </svg>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-gray-600 truncate">{key}</span>
              <span className="ml-auto font-medium">
                {((value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 折线图组件
  const LineChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.count));
    const minValue = Math.min(...data.map(d => d.count));
    const range = maxValue - minValue || 1;
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* 网格线 */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="40"
                y1={40 + i * 32}
                x2="360"
                y2={40 + i * 32}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* 数据线 */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data.map((d, i) => {
                const x = 40 + (i / (data.length - 1)) * 320;
                const y = 168 - ((d.count - minValue) / range) * 128;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* 数据点 */}
            {data.map((d, i) => {
              const x = 40 + (i / (data.length - 1)) * 320;
              const y = 168 - ((d.count - minValue) / range) * 128;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                />
              );
            })}
          </svg>
          
          {/* X轴标签 */}
          <div className="absolute bottom-0 left-10 right-10 flex justify-between text-xs text-gray-500">
            {data.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!processedStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">暂无统计数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">数据统计</h2>
          <p className="text-gray-600">详细的词汇库数据分析和可视化</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="all">全部时间</option>
          </select>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">词汇总数</p>
              <p className="text-2xl font-bold text-gray-900">{processedStats.totalWords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">分类数量</p>
              <p className="text-2xl font-bold text-gray-900">{processedStats.totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">用户活动</p>
              <p className="text-2xl font-bold text-gray-900">{processedStats.totalActivities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={processedStats.difficultyDistribution}
          title="难度分布"
          color="#3b82f6"
        />
        
        <PieChart
          data={processedStats.languageDistribution}
          title="语言分布"
        />
        
        <BarChart
          data={processedStats.activityDistribution}
          title="用户活动类型"
          color="#10b981"
        />
        
        <BarChart
          data={Object.fromEntries(
            processedStats.categoryStats.slice(0, 8).map(cat => [cat.name, cat.count])
          )}
          title="热门分类"
          color="#f59e0b"
        />
      </div>

      {/* 趋势图 */}
      {processedStats.dailyTrend.length > 0 && (
        <LineChart
          data={processedStats.dailyTrend}
          title="每日新增词汇趋势"
        />
      )}
    </div>
  );
}
