import { useState } from 'react';
import { vocabularyService, categoryService } from '../lib/database';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * 数据备份和恢复组件
 */
export default function DataBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupHistory, setBackupHistory] = useLocalStorage('vocab_backup_history', []);
  const [importStatus, setImportStatus] = useState(null);

  // 导出数据
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [wordsResult, categoriesResult] = await Promise.all([
        vocabularyService.getAll(),
        categoryService.getAll()
      ]);

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          words: wordsResult.data || [],
          categories: categoriesResult.data || []
        },
        metadata: {
          totalWords: wordsResult.data?.length || 0,
          totalCategories: categoriesResult.data?.length || 0,
          exportedBy: 'Public Vocabulary App'
        }
      };

      // 创建下载链接
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 保存备份历史
      const newBackup = {
        id: Date.now(),
        timestamp: backupData.timestamp,
        wordCount: backupData.metadata.totalWords,
        categoryCount: backupData.metadata.totalCategories
      };
      setBackupHistory(prev => [newBackup, ...prev.slice(0, 9)]); // 保留最近10次备份记录

    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据
  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // 验证备份数据格式
      if (!backupData.data || !backupData.data.words || !backupData.data.categories) {
        throw new Error('备份文件格式不正确');
      }

      const { words, categories } = backupData.data;
      let importedWords = 0;
      let importedCategories = 0;
      let errors = [];

      // 导入分类
      for (const category of categories) {
        try {
          await categoryService.create({ name: category.name, description: category.description });
          importedCategories++;
        } catch (error) {
          errors.push(`分类 "${category.name}" 导入失败: ${error.message}`);
        }
      }

      // 导入词汇
      for (const word of words) {
        try {
          await vocabularyService.create({
            word: word.word,
            meaning: word.meaning,
            exampleSentence: word.example,
            category_id: word.category_id,
            difficulty: word.difficulty,
            language: word.language,
            pronunciation: word.pronunciation,
            word_type: word.word_type
          });
          importedWords++;
        } catch (error) {
          errors.push(`词汇 "${word.word}" 导入失败: ${error.message}`);
        }
      }

      setImportStatus({
        success: true,
        importedWords,
        importedCategories,
        totalWords: words.length,
        totalCategories: categories.length,
        errors
      });

    } catch (error) {
      console.error('导入数据失败:', error);
      setImportStatus({
        success: false,
        error: error.message
      });
    } finally {
      setIsImporting(false);
      // 清除文件选择
      event.target.value = '';
    }
  };

  // 清除备份历史
  const clearBackupHistory = () => {
    if (confirm('确定要清除所有备份历史记录吗？')) {
      setBackupHistory([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据备份与恢复</h3>
        
        {/* 导出数据 */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">导出数据</h4>
          <p className="text-sm text-gray-600 mb-3">
            将所有词汇和分类数据导出为 JSON 文件，可用于备份或迁移数据。
          </p>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="btn btn-primary"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                导出中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出数据
              </>
            )}
          </button>
        </div>

        {/* 导入数据 */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">导入数据</h4>
          <p className="text-sm text-gray-600 mb-3">
            从备份文件中恢复词汇和分类数据。支持本应用导出的 JSON 格式文件。
          </p>
          <div className="flex items-center space-x-3">
            <label className="btn btn-secondary cursor-pointer">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              选择备份文件
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            {isImporting && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                导入中...
              </div>
            )}
          </div>
        </div>

        {/* 导入状态 */}
        {importStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            importStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`flex items-center mb-2 ${
              importStatus.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {importStatus.success ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <span className="font-medium">
                {importStatus.success ? '导入完成' : '导入失败'}
              </span>
            </div>
            
            {importStatus.success ? (
              <div className="text-sm text-green-700">
                <p>成功导入 {importStatus.importedWords}/{importStatus.totalWords} 个词汇</p>
                <p>成功导入 {importStatus.importedCategories}/{importStatus.totalCategories} 个分类</p>
                {importStatus.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">查看 {importStatus.errors.length} 个错误</summary>
                    <ul className="mt-1 ml-4 list-disc">
                      {importStatus.errors.map((error, index) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-700">{importStatus.error}</p>
            )}
          </div>
        )}

        {/* 备份历史 */}
        {backupHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">备份历史</h4>
              <button
                onClick={clearBackupHistory}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                清除历史
              </button>
            </div>
            <div className="space-y-2">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(backup.timestamp).toLocaleString('zh-CN')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {backup.wordCount} 个词汇, {backup.categoryCount} 个分类
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    已导出
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
