import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_PREFERENCES, PAGINATION } from '../lib/constants';

/**
 * 用户偏好设置组件
 */
export default function UserPreferences({ isOpen, onClose }) {
  const [preferences, setPreferences] = useLocalStorage('vocab_user_preferences', DEFAULT_PREFERENCES);
  const [tempPreferences, setTempPreferences] = useState(preferences);

  useEffect(() => {
    setTempPreferences(preferences);
  }, [preferences]);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  const handleSave = () => {
    setPreferences(tempPreferences);
    onClose();
    
    // 显示保存成功提示
    const event = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        message: '设置已保存'
      }
    });
    window.dispatchEvent(event);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      setTempPreferences(DEFAULT_PREFERENCES);
    }
  };

  const updatePreference = (key, value) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">用户设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 外观设置 */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">外观设置</h3>
            
            {/* 主题选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">主题</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: '浅色', icon: '☀️' },
                  { value: 'dark', label: '深色', icon: '🌙' },
                  { value: 'auto', label: '自动', icon: '🔄' }
                ].map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => updatePreference('theme', theme.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      tempPreferences.theme === theme.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{theme.icon}</div>
                    <div className="text-sm font-medium">{theme.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 语言选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">界面语言</label>
              <select
                value={tempPreferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                className="input"
              >
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </section>

          {/* 显示设置 */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">显示设置</h3>
            
            {/* 每页显示数量 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">每页显示词汇数量</label>
              <select
                value={tempPreferences.pageSize}
                onChange={(e) => updatePreference('pageSize', parseInt(e.target.value))}
                className="input"
              >
                {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size} 个</option>
                ))}
              </select>
            </div>

            {/* 显示选项 */}
            <div className="space-y-3">
              {[
                { key: 'showPronunciation', label: '显示发音', desc: '在词汇列表中显示发音信息' },
                { key: 'showDifficulty', label: '显示难度', desc: '在词汇列表中显示难度等级' },
                { key: 'showWordType', label: '显示词性', desc: '在词汇列表中显示词性信息' },
                { key: 'showLanguage', label: '显示语言', desc: '在词汇列表中显示语言标识' }
              ].map(option => (
                <div key={option.key} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={tempPreferences[option.key] || false}
                      onChange={(e) => updatePreference(option.key, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">{option.label}</label>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 功能设置 */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">功能设置</h3>
            
            <div className="space-y-3">
              {[
                { key: 'autoSave', label: '自动保存', desc: '编辑时自动保存草稿' },
                { key: 'enableNotifications', label: '启用通知', desc: '显示操作成功/失败通知' },
                { key: 'enableSounds', label: '启用音效', desc: '播放操作音效' },
                { key: 'enableAnimations', label: '启用动画', desc: '显示过渡动画效果' },
                { key: 'offlineMode', label: '离线模式', desc: '启用离线功能和数据缓存' }
              ].map(option => (
                <div key={option.key} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={tempPreferences[option.key] || false}
                      onChange={(e) => updatePreference(option.key, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">{option.label}</label>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 学习设置 */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">学习设置</h3>
            
            {/* 默认难度 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">默认词汇难度</label>
              <select
                value={tempPreferences.defaultDifficulty || 1}
                onChange={(e) => updatePreference('defaultDifficulty', parseInt(e.target.value))}
                className="input"
              >
                <option value={1}>初级</option>
                <option value={2}>中级</option>
                <option value={3}>高级</option>
                <option value={4}>专业</option>
              </select>
            </div>

            {/* 学习提醒 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">学习提醒间隔</label>
              <select
                value={tempPreferences.reminderInterval || 'daily'}
                onChange={(e) => updatePreference('reminderInterval', e.target.value)}
                className="input"
              >
                <option value="never">从不提醒</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
          </section>

          {/* 数据设置 */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">数据设置</h3>
            
            <div className="space-y-3">
              {[
                { key: 'autoBackup', label: '自动备份', desc: '定期自动备份数据到本地' },
                { key: 'syncOnline', label: '在线同步', desc: '自动同步数据到云端' },
                { key: 'clearCacheOnExit', label: '退出时清理缓存', desc: '关闭应用时清理临时数据' }
              ].map(option => (
                <div key={option.key} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={tempPreferences[option.key] || false}
                      onChange={(e) => updatePreference(option.key, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">{option.label}</label>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            重置默认
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
