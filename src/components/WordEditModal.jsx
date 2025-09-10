import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Save, AlertCircle } from 'lucide-react'
import { vocabularyService, categoryService } from '../lib/database'
import { validateWord, validateMeaning, validateExampleSentence } from '../lib/utils'

export default function WordEditModal({ word, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    exampleSentence: '',
    categoryId: '',
    difficultyLevel: 1,
    language: 'en',
    pronunciation: '',
    wordType: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // 获取分类列表
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  // 更新词汇
  const updateWordMutation = useMutation({
    mutationFn: ({ id, data }) => vocabularyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['words'])
      onClose()
    }
  })

  useEffect(() => {
    if (word && isOpen) {
      setFormData({
        word: word.word || '',
        meaning: word.meaning || '',
        exampleSentence: word.example_sentence || '',
        categoryId: word.category_id || '',
        difficultyLevel: word.difficulty_level || 1,
        language: word.language || 'en',
        pronunciation: word.pronunciation || '',
        wordType: word.word_type || ''
      })
      setErrors({})
    }
  }, [word, isOpen])

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

    if (!formData.categoryId) {
      newErrors.categoryId = '请选择分类'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await updateWordMutation.mutateAsync({
        id: word.id,
        data: {
          word: formData.word.trim(),
          meaning: formData.meaning.trim(),
          exampleSentence: formData.exampleSentence.trim() || null,
          categoryId: formData.categoryId,
          difficultyLevel: parseInt(formData.difficultyLevel),
          language: formData.language,
          pronunciation: formData.pronunciation.trim() || null,
          wordType: formData.wordType.trim() || null
        }
      })
    } catch (error) {
      setErrors({ submit: '更新失败：' + error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">编辑词汇</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 单词 */}
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-2">
              单词 <span className="text-red-500">*</span>
            </label>
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
            {errors.word && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.word}
              </p>
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
              maxLength={2000}
            />
            {errors.meaning && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.meaning}
              </p>
            )}
          </div>

          {/* 例句 */}
          <div>
            <label htmlFor="exampleSentence" className="block text-sm font-medium text-gray-700 mb-2">
              例句
            </label>
            <textarea
              id="exampleSentence"
              name="exampleSentence"
              rows={2}
              value={formData.exampleSentence}
              onChange={handleInputChange}
              className={`input ${errors.exampleSentence ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="请输入使用该单词的例句"
              maxLength={3000}
            />
            {errors.exampleSentence && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.exampleSentence}
              </p>
            )}
          </div>

          {/* 分类和难度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`input ${errors.categoryId ? 'border-red-300 focus:ring-red-500' : ''}`}
              >
                <option value="">请选择分类</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                难度等级
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleInputChange}
                className="input"
              >
                <option value={1}>1 - 入门</option>
                <option value={2}>2 - 初级</option>
                <option value={3}>3 - 中级</option>
                <option value={4}>4 - 高级</option>
                <option value={5}>5 - 专家</option>
              </select>
            </div>
          </div>

          {/* 语言和词性 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                语言
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="input"
              >
                <option value="en">英语</option>
                <option value="zh">中文</option>
                <option value="mixed">中英混合</option>
              </select>
            </div>

            <div>
              <label htmlFor="wordType" className="block text-sm font-medium text-gray-700 mb-2">
                词性
              </label>
              <select
                id="wordType"
                name="wordType"
                value={formData.wordType}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">请选择词性</option>
                <option value="noun">名词 (noun)</option>
                <option value="verb">动词 (verb)</option>
                <option value="adjective">形容词 (adjective)</option>
                <option value="adverb">副词 (adverb)</option>
                <option value="preposition">介词 (preposition)</option>
                <option value="conjunction">连词 (conjunction)</option>
                <option value="interjection">感叹词 (interjection)</option>
                <option value="pronoun">代词 (pronoun)</option>
              </select>
            </div>
          </div>

          {/* 发音 */}
          <div>
            <label htmlFor="pronunciation" className="block text-sm font-medium text-gray-700 mb-2">
              发音 (IPA)
            </label>
            <input
              type="text"
              id="pronunciation"
              name="pronunciation"
              value={formData.pronunciation}
              onChange={handleInputChange}
              className="input"
              placeholder="例如: /ˈeksəmpəl/"
              maxLength={200}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
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
                  保存中...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
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
                    更新失败
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errors.submit}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
