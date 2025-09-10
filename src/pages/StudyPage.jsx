// import { useState, useEffect } from 'react';
import StudyMode from '../components/StudyMode';

/**
 * 学习页面
 */
export default function StudyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">词汇学习</h1>
          <p className="text-gray-600">
            通过多种学习模式提升词汇掌握程度，包括闪卡、测验和拼写练习
          </p>
        </div>
        
        <StudyMode />
      </div>
    </div>
  );
}
