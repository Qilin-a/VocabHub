// 免费音标识别和发音服务
export class PhoneticService {
  constructor() {
    this.cache = new Map(); // 本地缓存
  }

  /**
   * 获取单词的音标 - 使用免费API
   */
  async getPhonetic(word) {
    if (!word) return null;
    
    const normalizedWord = word.toLowerCase().trim();
    
    // 检查缓存
    if (this.cache.has(normalizedWord)) {
      return this.cache.get(normalizedWord);
    }

    try {
      // 方法1: 使用 Free Dictionary API (完全免费)
      const result = await this.fetchFromFreeDictionary(normalizedWord);
      if (result) {
        this.cache.set(normalizedWord, result);
        return result;
      }

      // 方法2: 使用 WordsAPI (有免费额度)
      const wordsApiResult = await this.fetchFromWordsAPI(normalizedWord);
      if (wordsApiResult) {
        this.cache.set(normalizedWord, wordsApiResult);
        return wordsApiResult;
      }

      // 方法3: 本地音标规则推测
      const guessedPhonetic = this.guessPhonetic(normalizedWord);
      if (guessedPhonetic) {
        this.cache.set(normalizedWord, guessedPhonetic);
        return guessedPhonetic;
      }

      return null;
    } catch (error) {
      console.warn('获取音标失败:', error);
      return null;
    }
  }

  /**
   * Free Dictionary API - 完全免费
   */
  async fetchFromFreeDictionary(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data && data[0] && data[0].phonetics) {
        // 查找最佳音标
        for (const phonetic of data[0].phonetics) {
          if (phonetic.text) {
            return {
              phonetic: phonetic.text,
              audio: phonetic.audio || null,
              source: 'free-dictionary'
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.warn('Free Dictionary API 错误:', error);
      return null;
    }
  }

  /**
   * WordsAPI - 有免费额度 (500次/天)
   */
  async fetchFromWordsAPI(word) {
    try {
      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word}/pronunciation`, {
        headers: {
          'X-RapidAPI-Key': 'demo', // 使用demo key，有限制但免费
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data && data.pronunciation) {
        return {
          phonetic: `/${data.pronunciation.all || data.pronunciation}/`,
          audio: null,
          source: 'words-api'
        };
      }
      return null;
    } catch (error) {
      console.warn('WordsAPI 错误:', error);
      return null;
    }
  }

  /**
   * 本地音标推测 - 基于英语发音规则
   */
  guessPhonetic(word) {
    // 简单的音标推测规则
    const rules = {
      // 常见词缀
      'tion': 'ʃən',
      'sion': 'ʃən', 
      'ough': 'ʌf',
      'augh': 'ɔːf',
      'eigh': 'eɪ',
      'ight': 'aɪt',
      
      // 元音规则
      'ee': 'iː',
      'ea': 'iː',
      'oo': 'uː',
      'ou': 'aʊ',
      'ow': 'aʊ',
      'oy': 'ɔɪ',
      'oi': 'ɔɪ',
      
      // 辅音规则
      'ch': 'tʃ',
      'sh': 'ʃ',
      'th': 'θ',
      'ph': 'f',
      'gh': 'f',
      'ck': 'k',
      'ng': 'ŋ'
    };

    let phonetic = word.toLowerCase();
    
    // 应用规则
    for (const [pattern, replacement] of Object.entries(rules)) {
      phonetic = phonetic.replace(new RegExp(pattern, 'g'), replacement);
    }

    // 简单的元音处理
    phonetic = phonetic
      .replace(/a(?![eiou])/g, 'æ')
      .replace(/e(?![aiou])/g, 'e')
      .replace(/i(?![aeou])/g, 'ɪ')
      .replace(/o(?![aieu])/g, 'ɒ')
      .replace(/u(?![aeio])/g, 'ʌ');

    return {
      phonetic: `/${phonetic}/`,
      audio: null,
      source: 'local-guess',
      confidence: 'low'
    };
  }

  /**
   * 播放发音 - 使用多种免费方法
   */
  async playPronunciation(word, phoneticData = null) {
    if (!word) return false;

    try {
      // 方法1: 如果有音频URL，直接播放
      if (phoneticData?.audio) {
        return await this.playAudioUrl(phoneticData.audio);
      }

      // 方法2: 使用 Web Speech API (完全免费)
      if ('speechSynthesis' in window) {
        return await this.playWithSpeechSynthesis(word);
      }

      // 方法3: 使用 Google Translate TTS (免费但有限制)
      return await this.playWithGoogleTTS(word);
      
    } catch (error) {
      console.warn('播放发音失败:', error);
      return false;
    }
  }

  /**
   * 播放音频URL
   */
  async playAudioUrl(audioUrl) {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    });
  }

  /**
   * 使用 Web Speech API 播放
   */
  async playWithSpeechSynthesis(word) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * 使用 Google TTS (有CORS限制，需要代理)
   */
  async playWithGoogleTTS(word) {
    try {
      const encodedWord = encodeURIComponent(word);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedWord}&tl=en&client=tw-ob`;
      
      return await this.playAudioUrl(audioUrl);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取单词的完整信息（音标 + 发音）
   */
  async getWordInfo(word) {
    const phoneticData = await this.getPhonetic(word);
    
    return {
      word,
      phonetic: phoneticData?.phonetic || null,
      hasAudio: !!phoneticData?.audio,
      source: phoneticData?.source || null,
      confidence: phoneticData?.confidence || 'high',
      playPronunciation: () => this.playPronunciation(word, phoneticData)
    };
  }

  /**
   * 批量获取多个单词的音标
   */
  async getBatchPhonetics(words) {
    const results = await Promise.allSettled(
      words.map(word => this.getWordInfo(word))
    );
    
    return results.map((result, index) => ({
      word: words[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// 创建全局实例
export const phoneticService = new PhoneticService();

// 便捷函数
export const getPhonetic = (word) => phoneticService.getPhonetic(word);
export const playPronunciation = (word, phoneticData) => phoneticService.playPronunciation(word, phoneticData);
export const getWordInfo = (word) => phoneticService.getWordInfo(word);
