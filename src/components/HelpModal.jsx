import { useState, useEffect } from 'react';
import { SHORTCUT_HELP } from '../hooks/useKeyboardShortcuts';

/**
 * 帮助模态框组件
 * 显示应用使用说明和快捷键
 */
export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('showHelp', handleShowHelp);
    return () => window.removeEventListener('showHelp', handleShowHelp);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">使用帮助</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
            data-close-modal
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 应用介绍 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">关于 VocaHub</h3>
            <div className="text-gray-600 space-y-2">
              <p>VocaHub 是一个基于 React + Supabase 的现代化开源公共词库网站。</p>
              <p>支持多人协作添加、查看和分享词汇，提供丰富的学习和管理功能。</p>
            </div>
          </section>

          {/* 主要功能 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">主要功能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                icon="📝"
                title="添加词汇"
                description="快速添加新词汇，支持多语言和分类管理"
              />
              <FeatureCard
                icon="📚"
                title="词汇浏览"
                description="浏览所有词汇，支持搜索、筛选和排序"
              />
              <FeatureCard
                icon="🎯"
                title="学习模式"
                description="多种学习模式帮助记忆和复习词汇"
              />
              <FeatureCard
                icon="📊"
                title="统计分析"
                description="查看学习进度和词汇统计数据"
              />
              <FeatureCard
                icon="💾"
                title="数据导出"
                description="支持 PDF 导出和批量数据处理"
              />
              <FeatureCard
                icon="⭐"
                title="收藏管理"
                description="收藏重要词汇，创建个人学习列表"
              />
            </div>
          </section>

          {/* 快捷键 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">键盘快捷键</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SHORTCUT_HELP.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 使用技巧 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">使用技巧</h3>
            <div className="space-y-3">
              <TipItem
                icon="💡"
                title="智能搜索"
                description="支持模糊搜索，可以搜索词汇、释义、例句等内容"
              />
              <TipItem
                icon="🏷️"
                title="标签分类"
                description="使用分类标签组织词汇，便于管理和查找"
              />
              <TipItem
                icon="🔄"
                title="离线使用"
                description="支持 PWA 离线访问，数据会在联网时自动同步"
              />
              <TipItem
                icon="📱"
                title="移动端适配"
                description="完美适配手机和平板设备，随时随地学习"
              />
            </div>
          </section>

          {/* 联系方式 */}
          <section>
            <h3 className="text-lg font-semibold mb-4">获取帮助</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="space-y-2">
                <p className="text-blue-800">
                  <strong>邮箱：</strong>
                  <a href="mailto:3679044152@qq.com" className="text-blue-600 hover:underline">
                    3679044152@qq.com
                  </a>
                </p>
                <p className="text-blue-800">
                  <strong>GitHub：</strong>
                  <a 
                    href="https://github.com/qilin-a/VocabHub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    qilin-a/VocabHub
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}

// 功能卡片组件
function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

// 技巧项组件
function TipItem({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-xl">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
