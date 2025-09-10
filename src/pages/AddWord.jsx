import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, AlertCircle, Volume2, Loader } from 'lucide-react'
import { vocabularyService, categoryService } from '../lib/database'
import { validateWord, validateMeaning, validateExampleSentence } from '../lib/utils'
import { phoneticService } from '../lib/phonetics'
import AudioPronunciation from '../components/AudioPronunciation'

export default function AddWord() {
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    exampleSentence: '',
    categoryId: '',
    newCategory: '',
    phonetic: ''
  })
  const [errors, setErrors] = useState({})
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneticLoading, setPhoneticLoading] = useState(false)
  const [phoneticData, setPhoneticData] = useState(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 获取分类列表
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  // 创建新分类
  const createCategoryMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
    }
  })

  // 添加词汇
  const addWordMutation = useMutation({
    mutationFn: vocabularyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['words'])
      navigate('/words')
    }
  })

  // 自动获取音标
  const fetchPhonetic = async (word) => {
    if (!word || word.length < 2) return
    
    setPhoneticLoading(true)
    try {
      const result = await phoneticService.getWordInfo(word)
      if (result.phonetic) {
        setFormData(prev => ({ ...prev, phonetic: result.phonetic }))
        setPhoneticData(result)
      }
    } catch (error) {
      console.warn('获取音标失败:', error)
    } finally {
      setPhoneticLoading(false)
    }
  }

  // 防抖处理单词输入
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.word.trim()) {
        fetchPhonetic(formData.word.trim())
      } else {
        setFormData(prev => ({ ...prev, phonetic: '' }))
        setPhoneticData(null)
      }
    }, 800) // 800ms 防抖

    return () => clearTimeout(timer)
  }, [formData.word])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    const wordError = validateWord(formData.word)
    if (wordError) newErrors.word = wordError

    const meaningError = validateMeaning(formData.meaning)
    if (meaningError) newErrors.meaning = meaningError

    const exampleError = validateExampleSentence(formData.exampleSentence)
    if (exampleError) newErrors.exampleSentence = exampleError

    if (!formData.categoryId && !formData.newCategory) {
      newErrors.category = '请选择分类或创建新分类'
    }

    if (formData.newCategory && formData.newCategory.length > 50) {
      newErrors.newCategory = '分类名称不能超过50个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let categoryId = formData.categoryId

      // 如果需要创建新分类
      if (formData.newCategory && !categoryId) {
        const { data: newCategory, error: categoryError } = await createCategoryMutation.mutateAsync({
          name: formData.newCategory.trim(),
          description: `用户创建的分类：${formData.newCategory.trim()}`
        })

        if (categoryError) {
          setErrors({ category: '创建分类失败：' + categoryError.message })
          setIsSubmitting(false)
          return
        }

        categoryId = newCategory[0].id
      }

      // 添加词汇
      await addWordMutation.mutateAsync({
        word: formData.word.trim(),
        meaning: formData.meaning.trim(),
        exampleSentence: formData.exampleSentence.trim() || null,
        phonetic: formData.phonetic.trim() || null,
        categoryId,
        createdBy: 'anonymous'
      })

    } catch (error) {
      setErrors({ submit: '提交失败：' + error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">添加新词汇</h1>
        <p className="mt-2 text-gray-600">
          为公共词库贡献新的词汇，帮助更多人学习
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* 单词 */}
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-2">
            单词 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="word"
              name="word"
              value={formData.word}
              onChange={handleInputChange}
              className={`input ${errors.word ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="请输入单词"
              maxLength={100}
            />
            {formData.word && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AudioPronunciation 
                  word={formData.word} 
                  className="text-gray-400 hover:text-gray-600"
                />
              </div>
            )}
          </div>
          {errors.word && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.word}
            </p>
          )}
        </div>

        {/* 音标 */}
        <div>
          <label htmlFor="phonetic" className="block text-sm font-medium text-gray-700 mb-2">
            音标 <span className="text-gray-400">(自动识别)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="phonetic"
              name="phonetic"
              value={formData.phonetic}
              onChange={handleInputChange}
              className="input"
              placeholder="音标将自动识别..."
              maxLength={100}
            />
            {phoneticLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          {phoneticData && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {phoneticData.source === 'free-dictionary' && '📚 词典'}
                {phoneticData.source === 'words-api' && '🔍 API'}
                {phoneticData.source === 'local-guess' && '🤖 推测'}
              </span>
              {phoneticData.confidence === 'low' && (
                <span className="text-yellow-600 text-xs">准确性较低，建议手动校正</span>
              )}
              {phoneticData.hasAudio && (
                <span className="text-green-600 text-xs flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  支持原声发音
                </span>
              )}
            </div>
          )}
        </div>

        {/* 释义 */}
        <div>
          <label htmlFor="meaning" className="block text-sm font-medium text-gray-700 mb-2">
            释义 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="meaning"
            name="meaning"
            rows={3}
            value={formData.meaning}
            onChange={handleInputChange}
            className={`input ${errors.meaning ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="请输入单词的释义"
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            {errors.meaning ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.meaning}
              </p>
            ) : (
              <div></div>
            )}
            <p className="text-sm text-gray-500">
              {formData.meaning.length}/500
            </p>
          </div>
        </div>

        {/* 例句 */}
        <div>
          <label htmlFor="exampleSentence" className="block text-sm font-medium text-gray-700 mb-2">
            例句 <span className="text-gray-400">(可选)</span>
          </label>
          <textarea
            id="exampleSentence"
            name="exampleSentence"
            rows={2}
            value={formData.exampleSentence}
            onChange={handleInputChange}
            className={`input ${errors.exampleSentence ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="请输入使用该单词的例句"
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            {errors.exampleSentence ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.exampleSentence}
              </p>
            ) : (
              <div></div>
            )}
            <p className="text-sm text-gray-500">
              {formData.exampleSentence.length}/1000
            </p>
          </div>
        </div>

        {/* 分类选择 */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            分类 <span className="text-red-500">*</span>
          </label>
          
          {!showNewCategory ? (
            <div className="space-y-3">
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`input ${errors.category ? 'border-red-300 focus:ring-red-500' : ''}`}
                disabled={categoriesLoading}
              >
                <option value="">请选择分类</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                + 创建新分类
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                name="newCategory"
                value={formData.newCategory}
                onChange={handleInputChange}
                className={`input ${errors.newCategory ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="请输入新分类名称"
                maxLength={50}
              />
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false)
                    setFormData(prev => ({ ...prev, newCategory: '' }))
                  }}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  取消
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  选择现有分类
                </button>
              </div>
            </div>
          )}

          {errors.category && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.category}
            </p>
          )}
          {errors.newCategory && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.newCategory}
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/words')}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                提交中...
              </div>
            ) : (
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                添加词汇
              </div>
            )}
          </button>
        </div>

        {errors.submit && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  提交失败
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {errors.submit}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* 提示信息 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Check className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              贡献须知
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>请确保词汇内容准确无误</li>
                <li>避免重复添加已存在的词汇</li>
                <li>例句应该简洁明了，便于理解</li>
                <li>所有内容将采用 CC BY-SA 4.0 许可证共享</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
