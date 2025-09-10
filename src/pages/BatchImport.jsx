import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react'
import { vocabularyService, categoryService } from '../lib/database'
import { validateWord, validateMeaning, validateExampleSentence } from '../lib/utils'

export default function BatchImport() {
  const [file, setFile] = useState(null)
  const [importData, setImportData] = useState([])
  const [validationResults, setValidationResults] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResults, setImportResults] = useState(null)

  const queryClient = useQueryClient()

  // 获取分类列表
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  })

  // 批量导入
  const batchImportMutation = useMutation({
    mutationFn: async (validWords) => {
      const results = { success: 0, failed: 0, errors: [] }
      
      for (const word of validWords) {
        try {
          await vocabularyService.create(word)
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push(`${word.word}: ${error.message}`)
        }
      }
      
      return results
    },
    onSuccess: (results) => {
      setImportResults(results)
      queryClient.invalidateQueries(['words'])
    }
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = async (file) => {
    const text = await file.text()
    let data = []

    try {
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        alert('仅支持 JSON 和 CSV 格式')
        return
      }

      setImportData(data)
      validateImportData(data)
    } catch (error) {
      alert('文件解析失败：' + error.message)
    }
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const obj = {}
      
      headers.forEach((header, index) => {
        const key = mapHeaderToField(header)
        if (key) obj[key] = values[index] || ''
      })
      
      return obj
    })
  }

  const mapHeaderToField = (header) => {
    const mapping = {
      '单词': 'word',
      'word': 'word',
      '释义': 'meaning',
      'meaning': 'meaning',
      '例句': 'exampleSentence',
      'example': 'exampleSentence',
      'example_sentence': 'exampleSentence',
      '分类': 'categoryName',
      'category': 'categoryName',
      '难度': 'difficultyLevel',
      'difficulty': 'difficultyLevel',
      '语言': 'language',
      'language': 'language',
      '发音': 'pronunciation',
      'pronunciation': 'pronunciation',
      '词性': 'wordType',
      'type': 'wordType',
      'word_type': 'wordType'
    }
    
    return mapping[header.toLowerCase()]
  }

  const validateImportData = (data) => {
    const results = data.map((item, index) => {
      const errors = []
      
      const wordError = validateWord(item.word)
      if (wordError) errors.push(wordError)
      
      const meaningError = validateMeaning(item.meaning)
      if (meaningError) errors.push(meaningError)
      
      const exampleError = validateExampleSentence(item.exampleSentence)
      if (exampleError) errors.push(exampleError)
      
      // 查找分类ID
      let categoryId = null
      if (item.categoryName && categories.data) {
        const category = categories.data.find(c => 
          c.name.toLowerCase() === item.categoryName.toLowerCase()
        )
        if (category) {
          categoryId = category.id
        } else {
          errors.push(`分类 "${item.categoryName}" 不存在`)
        }
      }
      
      return {
        index,
        valid: errors.length === 0,
        errors,
        data: {
          ...item,
          categoryId,
          difficultyLevel: parseInt(item.difficultyLevel) || 1,
          language: item.language || 'en'
        }
      }
    })
    
    setValidationResults(results)
  }

  const handleImport = async () => {
    const validWords = validationResults
      .filter(result => result.valid)
      .map(result => result.data)
    
    if (validWords.length === 0) {
      alert('没有有效的词汇可以导入')
      return
    }
    
    setIsProcessing(true)
    await batchImportMutation.mutateAsync(validWords)
    setIsProcessing(false)
  }

  const downloadTemplate = () => {
    const template = [
      {
        word: 'example',
        meaning: '例子；实例',
        exampleSentence: 'This is an example sentence.',
        categoryName: '通用词汇',
        difficultyLevel: 2,
        language: 'en',
        pronunciation: '/ɪɡˈzæmpəl/',
        wordType: 'noun'
      }
    ]
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary_template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = validationResults.filter(r => r.valid).length
  const invalidCount = validationResults.filter(r => !r.valid).length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">批量导入词汇</h1>
        <p className="mt-2 text-gray-600">
          支持 JSON 和 CSV 格式文件，一次性导入多个词汇
        </p>
      </div>

      {/* 模板下载 */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">导入模板</h3>
        <p className="text-gray-600 mb-4">
          下载模板文件了解正确的数据格式，然后填入你的词汇数据
        </p>
        <button
          onClick={downloadTemplate}
          className="btn btn-secondary"
        >
          <Download className="h-4 w-4 mr-2" />
          下载 JSON 模板
        </button>
      </div>

      {/* 文件上传 */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">选择文件</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                点击选择文件或拖拽到此处
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                支持 JSON, CSV 格式，最大 10MB
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".json,.csv"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
        
        {file && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              已选择文件: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}
      </div>

      {/* 验证结果 */}
      {validationResults.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">验证结果</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validCount}</div>
              <div className="text-sm text-green-800">有效词汇</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
              <div className="text-sm text-red-800">无效词汇</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{importData.length}</div>
              <div className="text-sm text-gray-800">总计</div>
            </div>
          </div>

          {/* 详细验证结果 */}
          <div className="max-h-96 overflow-y-auto">
            {validationResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 mb-2 rounded-lg border ${
                  result.valid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {result.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">
                        第 {index + 1} 行: {result.data.word}
                      </span>
                    </div>
                    
                    {!result.valid && (
                      <div className="mt-2 ml-6">
                        {result.errors.map((error, errorIndex) => (
                          <p key={errorIndex} className="text-sm text-red-600">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 导入按钮 */}
          {validCount > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="btn btn-primary"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    导入中...
                  </div>
                ) : (
                  `导入 ${validCount} 个有效词汇`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 导入结果 */}
      {importResults && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">导入完成</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
              <div className="text-sm text-green-800">成功导入</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
              <div className="text-sm text-red-800">导入失败</div>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">错误详情：</h4>
              <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {importResults.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => {
                setFile(null)
                setImportData([])
                setValidationResults([])
                setImportResults(null)
              }}
              className="btn btn-secondary"
            >
              重新导入
            </button>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              导入说明
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>JSON 格式：数组对象，每个对象包含词汇信息</li>
                <li>CSV 格式：第一行为标题行，支持中英文标题</li>
                <li>必填字段：word（单词）、meaning（释义）</li>
                <li>可选字段：exampleSentence、categoryName、difficultyLevel、language、pronunciation、wordType</li>
                <li>分类名称必须在系统中存在，否则需要先创建分类</li>
                <li>为避免服务器压力，建议单次导入不超过100个词汇</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
