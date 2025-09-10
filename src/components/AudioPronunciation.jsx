import React, { useState, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * 音频发音组件
 */
export default function AudioPronunciation({ word, language = 'en', className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [preferences] = useLocalStorage('vocab_user_preferences', {});
  const audioRef = useRef(null);

  // 检查是否启用音效
  const soundEnabled = preferences.enableSounds !== false;

  // 播放发音
  const playPronunciation = async () => {
    if (!soundEnabled || !word) return;

    setIsPlaying(true);
    setError(null);

    try {
      // 尝试使用 Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        
        // 设置语言
        const langMap = {
          'en': 'en-US',
          'zh': 'zh-CN',
          'es': 'es-ES',
          'fr': 'fr-FR',
          'de': 'de-DE',
          'ja': 'ja-JP',
          'ko': 'ko-KR',
          'ru': 'ru-RU'
        };
        utterance.lang = langMap[language] || 'en-US';
        
        // 设置语音参数
        utterance.rate = 0.8; // 语速稍慢
        utterance.pitch = 1.0; // 正常音调
        utterance.volume = 0.8; // 音量

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          setError('发音失败');
          setIsPlaying(false);
          
          // 尝试备用方案
          tryAlternativePronunciation();
        };

        // 停止当前播放的语音
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      } else {
        // 备用方案：使用在线TTS服务
        tryAlternativePronunciation();
      }
    } catch (err) {
      console.error('Pronunciation error:', err);
      setError('发音功能不可用');
      setIsPlaying(false);
    }
  };

  // 备用发音方案
  const tryAlternativePronunciation = async () => {
    try {
      // 使用 Google Translate TTS API（需要处理CORS）
      const encodedWord = encodeURIComponent(word);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedWord}&tl=${language}&client=tw-ob`;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {
          // 如果在线服务也失败，显示错误
          setError('在线发音服务不可用');
          setIsPlaying(false);
        });
      }
    } catch (err) {
      setError('发音服务不可用');
      setIsPlaying(false);
    }
  };

  // 停止播放
  const stopPronunciation = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  if (!soundEnabled) {
    return null;
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        onClick={isPlaying ? stopPronunciation : playPronunciation}
        disabled={!word}
        className={`p-2 rounded-full transition-colors ${
          isPlaying
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isPlaying ? '停止播放' : '播放发音'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.586 8.586A2 2 0 018 10v4a2 2 0 01.586 1.414L12 19l3.414-3.586A2 2 0 0116 14v-4a2 2 0 01-.586-1.414L12 5 8.586 8.586z" />
          </svg>
        )}
      </button>
      
      {error && (
        <span className="ml-2 text-xs text-red-600" title={error}>
          ⚠️
        </span>
      )}
      
      {/* 隐藏的音频元素用于备用播放 */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setError('音频加载失败');
          setIsPlaying(false);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}

/**
 * 语音控制Hook
 */
export const useSpeechSynthesis = () => {
  const [isSupported] = useState('speechSynthesis' in window);
  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      setIsLoading(false);
    };

    // 初始加载
    loadVoices();

    // 监听语音列表变化
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const speak = (text, options = {}) => {
    if (!isSupported || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 应用选项
    if (options.lang) utterance.lang = options.lang;
    if (options.rate) utterance.rate = options.rate;
    if (options.pitch) utterance.pitch = options.pitch;
    if (options.volume) utterance.volume = options.volume;
    if (options.voice) utterance.voice = options.voice;

    // 停止当前播放
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    return utterance;
  };

  const stop = () => {
    if (isSupported) {
      speechSynthesis.cancel();
    }
  };

  const pause = () => {
    if (isSupported) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSupported) {
      speechSynthesis.resume();
    }
  };

  return {
    isSupported,
    voices,
    isLoading,
    speak,
    stop,
    pause,
    resume,
    isPlaying: isSupported && speechSynthesis.speaking,
    isPaused: isSupported && speechSynthesis.paused
  };
};
