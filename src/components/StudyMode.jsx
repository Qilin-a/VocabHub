import { useState, useEffect } from 'react';
import { vocabularyService } from '../lib/database';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * 学习模式组件 - 提供多种学习方式
 */
export default function StudyMode() {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [studyMode, setStudyMode] = useState('flashcard'); // flashcard, quiz, spelling
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [studyStats, setStudyStats] = useLocalStorage('vocab_study_stats', {
    totalStudied: 0,
    correctAnswers: 0,
    streakCount: 0,
    lastStudyDate: null
  });
  const [quizAnswer, setQuizAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载词汇数据
  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const { data } = await vocabularyService.getAll();
      if (data && data.length > 0) {
        // 随机打乱词汇顺序
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setCurrentWordIndex(0);
      }
    } catch (error) {
      console.error('加载词汇失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentWord = words[currentWordIndex];

  // 下一个词汇
  const nextWord = () => {
    setShowAnswer(false);
    setQuizAnswer('');
    setFeedback(null);
    
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // 学习完成
      setCurrentWordIndex(0);
      setWords(prev => [...prev].sort(() => Math.random() - 0.5));
    }
  };

  // 上一个词汇
  const prevWord = () => {
    setShowAnswer(false);
    setQuizAnswer('');
    setFeedback(null);
    
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  // 显示答案
  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // 标记答案正确性
  const markAnswer = (isCorrect) => {
    const newStats = {
      ...studyStats,
      totalStudied: studyStats.totalStudied + 1,
      correctAnswers: studyStats.correctAnswers + (isCorrect ? 1 : 0),
      streakCount: isCorrect ? studyStats.streakCount + 1 : 0,
      lastStudyDate: new Date().toISOString()
    };
    setStudyStats(newStats);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(nextWord, 1500);
  };

  // 检查测验答案
  const checkQuizAnswer = () => {
    if (!quizAnswer.trim()) return;
    
    const isCorrect = quizAnswer.toLowerCase().trim() === currentWord.word.toLowerCase().trim();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    markAnswer(isCorrect);
  };

  // 检查拼写答案
  const checkSpelling = () => {
    if (!quizAnswer.trim()) return;
    
    const isCorrect = quizAnswer.toLowerCase().trim() === currentWord.word.toLowerCase().trim();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    markAnswer(isCorrect);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载词汇中...</p>
        </div>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无词汇</h3>
        <p className="text-gray-600">请先添加一些词汇再开始学习</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 学习模式选择 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'flashcard', label: '闪卡模式', icon: '📚' },
            { value: 'quiz', label: '测验模式', icon: '❓' },
            { value: 'spelling', label: '拼写模式', icon: '✏️' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => {
                setStudyMode(mode.value);
                setShowAnswer(false);
                setQuizAnswer('');
                setFeedback(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                studyMode === mode.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 进度和统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{currentWordIndex + 1}</div>
          <div className="text-sm text-gray-600">当前 / {words.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{score}</div>
          <div className="text-sm text-gray-600">本轮得分</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{studyStats.streakCount}</div>
          <div className="text-sm text-gray-600">连续正确</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {studyStats.totalStudied > 0 ? Math.round((studyStats.correctAnswers / studyStats.totalStudied) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">正确率</div>
        </div>
      </div>

      {/* 学习卡片 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6 min-h-[400px] flex flex-col justify-center">
        {studyMode === 'flashcard' && (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentWord.word}</h2>
              {currentWord.pronunciation && (
                <p className="text-lg text-gray-600 mb-2">/{currentWord.pronunciation}/</p>
              )}
              {currentWord.word_type && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {currentWord.word_type}
                </span>
              )}
            </div>
            
            {showAnswer ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">释义</h3>
                  <p className="text-lg text-gray-700">{currentWord.meaning}</p>
                </div>
                {currentWord.example && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">例句</h3>
                    <p className="text-lg text-gray-700 italic">"{currentWord.example}"</p>
                  </div>
                )}
                
                <div className="flex justify-center space-x-4 mt-8">
                  <button
                    onClick={() => markAnswer(false)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    😞 不认识
                  </button>
                  <button
                    onClick={() => markAnswer(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    😊 认识
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={toggleAnswer}
                className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-medium"
              >
                点击查看释义
              </button>
            )}
          </div>
        )}

        {studyMode === 'quiz' && (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">根据释义猜单词</h3>
              <p className="text-lg text-gray-700 mb-4">{currentWord.meaning}</p>
              {currentWord.example && (
                <p className="text-md text-gray-600 italic mb-4">例句: "{currentWord.example}"</p>
              )}
            </div>
            
            {!feedback ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkQuizAnswer()}
                  placeholder="输入单词..."
                  className="input text-center text-lg"
                  autoFocus
                />
                <button
                  onClick={checkQuizAnswer}
                  disabled={!quizAnswer.trim()}
                  className="btn btn-primary text-lg px-8 py-3"
                >
                  提交答案
                </button>
              </div>
            ) : (
              <div className={`p-6 rounded-lg ${
                feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="text-4xl mb-2">
                  {feedback === 'correct' ? '🎉' : '😔'}
                </div>
                <p className="text-xl font-semibold mb-2">
                  {feedback === 'correct' ? '回答正确！' : '回答错误'}
                </p>
                <p className="text-lg">
                  正确答案: <strong>{currentWord.word}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {studyMode === 'spelling' && (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">听写单词</h3>
              <p className="text-lg text-gray-700 mb-2">{currentWord.meaning}</p>
              {currentWord.pronunciation && (
                <p className="text-md text-gray-600 mb-4">发音: /{currentWord.pronunciation}/</p>
              )}
              <div className="text-2xl mb-4">
                {currentWord.word.split('').map((char, index) => (
                  <span key={index} className="inline-block w-8 h-8 border-b-2 border-gray-300 mx-1">
                    {showAnswer ? char : ''}
                  </span>
                ))}
              </div>
            </div>
            
            {!feedback ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkSpelling()}
                  placeholder="拼写单词..."
                  className="input text-center text-lg"
                  autoFocus
                />
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="btn btn-secondary"
                  >
                    {showAnswer ? '隐藏' : '显示'}提示
                  </button>
                  <button
                    onClick={checkSpelling}
                    disabled={!quizAnswer.trim()}
                    className="btn btn-primary"
                  >
                    检查拼写
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-lg ${
                feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="text-4xl mb-2">
                  {feedback === 'correct' ? '🎉' : '😔'}
                </div>
                <p className="text-xl font-semibold mb-2">
                  {feedback === 'correct' ? '拼写正确！' : '拼写错误'}
                </p>
                <p className="text-lg">
                  正确拼写: <strong>{currentWord.word}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevWord}
          disabled={currentWordIndex === 0}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一个
        </button>

        <div className="flex space-x-2">
          <button
            onClick={loadWords}
            className="btn btn-secondary"
            title="重新打乱词汇顺序"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => {
              setScore(0);
              setCurrentWordIndex(0);
              setShowAnswer(false);
              setQuizAnswer('');
              setFeedback(null);
            }}
            className="btn btn-secondary"
            title="重新开始"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <button
          onClick={nextWord}
          className="btn btn-primary"
        >
          下一个
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
