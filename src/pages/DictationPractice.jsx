import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Volume2, RotateCcw, CheckCircle, XCircle, Play, Pause, SkipForward, Award, Target, Clock, Headphones } from 'lucide-react'
import { vocabularyService } from '../lib/database'
import { PhoneticService } from '../lib/phonetics'

export default function DictationPractice() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [practiceMode, setPracticeMode] = useState('random') // random, category, difficulty
  const [selectedCategory, setSelectedCategory] = useState('')
  const [practiceWords, setPracticeWords] = useState([])
  const [timeSpent, setTimeSpent] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [autoPlay, setAutoPlay] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showHints, setShowHints] = useState(false)
  
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const phoneticService = new PhoneticService()

  // 获取词汇数据
  const { data: words = [], isLoading } = useQuery({
    queryKey: ['words', 'all'],
    queryFn: () => vocabularyService.getAll(),
  })

  // 获取分类数据
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => vocabularyService.getCategories(),
  })

  // 初始化练习词汇
  useEffect(() => {
    if (words.data && words.data.length > 0) {
      let filteredWords = [...words.data]
      
      if (practiceMode === 'category' && selectedCategory) {
        filteredWords = words.data.filter(word => word.category_id === selectedCategory)
      }
      
      // 随机打乱顺序
      const shuffled = filteredWords.sort(() => Math.random() - 0.5)
      setPracticeWords(shuffled.slice(0, 20)) // 限制为20个词
      setCurrentWordIndex(0)
      setScore({ correct: 0, total: 0 })
      setSessionStartTime(Date.now())
    }
  }, [words.data, practiceMode, selectedCategory])

  // 计时器
  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - sessionStartTime) / 1000))
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [sessionStartTime])

  // 自动播放当前单词
  useEffect(() => {
    if (autoPlay && practiceWords.length > 0 && currentWordIndex < practiceWords.length) {
      const timer = setTimeout(() => {
        playCurrentWord()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentWordIndex, practiceWords, autoPlay])

  const currentWord = practiceWords[currentWordIndex]

  const playCurrentWord = async () => {
    if (!currentWord) return
    
    setIsPlaying(true)
    try {
      await phoneticService.playPronunciation(currentWord.word, playbackSpeed)
    } catch (error) {
      console.error('播放发音失败:', error)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleSubmit = () => {
    if (!currentWord || !userInput.trim()) return

    const isCorrect = userInput.trim().toLowerCase() === currentWord.word.toLowerCase()
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))
    
    setShowAnswer(true)
    
    // 2秒后自动进入下一题
    setTimeout(() => {
      nextWord()
    }, 2000)
  }

  const nextWord = () => {
    if (currentWordIndex < practiceWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
      setShowAnswer(false)
      setShowHints(false)
    }
  }

  const resetPractice = () => {
    setCurrentWordIndex(0)
    setUserInput('')
    setShowAnswer(false)
    setScore({ correct: 0, total: 0 })
    setTimeSpent(0)
    setSessionStartTime(Date.now())
    setShowHints(false)
    
    // 重新打乱词汇顺序
    const shuffled = practiceWords.sort(() => Math.random() - 0.5)
    setPracticeWords([...shuffled])
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAccuracy = () => {
    return score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showAnswer) {
      handleSubmit()
    } else if (e.key === 'Enter' && showAnswer) {
      nextWord()
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()
      playCurrentWord()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (practiceWords.length === 0) {
    return (
      <div className="text-center py-12">
        <Headphones className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无练习词汇</h3>
        <p className="mt-1 text-sm text-gray-500">
          请先添加一些词汇，或选择不同的练习模式
        </p>
      </div>
    )
  }

  // 练习完成
  if (currentWordIndex >= practiceWords.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <Award className="mx-auto h-16 w-16 text-yellow-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">练习完成！</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{score.correct}/{score.total}</div>
              <div className="text-sm text-blue-800">正确率</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{getAccuracy()}%</div>
              <div className="text-sm text-green-800">准确度</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</div>
              <div className="text-sm text-purple-800">用时</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={resetPractice}
              className="w-full btn btn-primary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重新练习
            </button>
            
            <button
              onClick={() => window.location.hash = '#/'}
              className="w-full btn btn-secondary"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 练习设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">练习模式:</span>
              <select
                value={practiceMode}
                onChange={(e) => setPracticeMode(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="random">随机练习</option>
                <option value="category">分类练习</option>
              </select>
            </div>
            
            {practiceMode === 'category' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">选择分类</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{score.correct}/{score.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主要练习区域 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              进度: {currentWordIndex + 1} / {practiceWords.length}
            </span>
            <span className="text-sm text-gray-500">
              准确率: {getAccuracy()}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentWordIndex + 1) / practiceWords.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 音频控制 */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <button
              onClick={playCurrentWord}
              disabled={isPlaying}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPlaying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  播放中...
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  播放发音
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded"
              />
              <span>自动播放</span>
            </label>
            
            <div className="flex items-center space-x-2">
              <span>播放速度:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>
          </div>
        </div>

        {/* 输入区域 */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              请输入您听到的单词:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showAnswer}
              className="w-full max-w-md mx-auto text-center text-xl p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
              placeholder="在此输入单词..."
              autoFocus
            />
          </div>
          
          {!showAnswer && (
            <div className="text-center space-x-4">
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交答案
              </button>
              
              <button
                onClick={() => setShowHints(!showHints)}
                className="btn btn-secondary"
              >
                {showHints ? '隐藏提示' : '显示提示'}
              </button>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {showHints && !showAnswer && currentWord && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-yellow-800">
              <p><strong>提示:</strong></p>
              <p>• 单词长度: {currentWord.word.length} 个字母</p>
              <p>• 首字母: {currentWord.word[0].toUpperCase()}</p>
              {currentWord.phonetic && (
                <p>• 音标: {currentWord.phonetic}</p>
              )}
              <p>• 释义: {currentWord.meaning.substring(0, 20)}...</p>
            </div>
          </div>
        )}

        {/* 答案显示 */}
        {showAnswer && currentWord && (
          <div className="text-center">
            <div className={`inline-flex items-center px-6 py-3 rounded-lg text-lg font-medium ${
              userInput.trim().toLowerCase() === currentWord.word.toLowerCase()
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {userInput.trim().toLowerCase() === currentWord.word.toLowerCase() ? (
                <>
                  <CheckCircle className="h-6 w-6 mr-2" />
                  正确！
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 mr-2" />
                  错误
                </>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900 mb-2">
                正确答案: {currentWord.word}
              </div>
              {currentWord.phonetic && (
                <div className="text-sm text-gray-600 mb-2">
                  音标: {currentWord.phonetic}
                </div>
              )}
              <div className="text-sm text-gray-700 mb-2">
                释义: {currentWord.meaning}
              </div>
              {currentWord.example_sentence && (
                <div className="text-sm text-gray-600">
                  例句: {currentWord.example_sentence}
                </div>
              )}
            </div>
            
            <div className="mt-4">
              {currentWordIndex < practiceWords.length - 1 ? (
                <button
                  onClick={nextWord}
                  className="btn btn-primary"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  下一个单词
                </button>
              ) : (
                <div className="text-lg font-medium text-gray-700">
                  练习即将完成...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <strong>快捷键:</strong>
          <span className="ml-2">Enter - 提交答案/下一题</span>
          <span className="ml-4">Space - 重新播放</span>
        </div>
      </div>
    </div>
  )
}
