import { supabase } from './supabase.js'

// 词汇相关操作
export const vocabularyService = {
  // 获取所有词汇
  async getAll(filters = {}) {
    let query = supabase
      .from('words')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters.search) {
      query = query.or(`word.ilike.%${filters.search}%,meaning.ilike.%${filters.search}%,example_sentence.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    return { data, error }
  },

  // 添加新词汇
  async create(wordData) {
    const { data, error } = await supabase
      .from('words')
      .insert([{
        word: wordData.word,
        meaning: wordData.meaning,
        example_sentence: wordData.exampleSentence || null,
        category_id: wordData.categoryId,
        created_by: wordData.createdBy || 'anonymous'
      }])
      .select()

    return { data, error }
  },

  // 更新词汇
  async update(id, wordData) {
    const { data, error } = await supabase
      .from('words')
      .update({
        word: wordData.word,
        meaning: wordData.meaning,
        example_sentence: wordData.exampleSentence || null,
        category_id: wordData.categoryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    return { data, error }
  },

  // 软删除词汇
  async delete(id) {
    const { data, error } = await supabase
      .from('words')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    return { data, error }
  },

  // 点赞词汇
  async upvote(id) {
    const { data, error } = await supabase
      .rpc('increment_upvotes', { word_id: id })

    return { data, error }
  },

  // 取消点赞词汇
  async removeUpvote(id) {
    // 先获取当前点赞数
    const { data: currentWord, error: fetchError } = await supabase
      .from('words')
      .select('upvotes')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError }
    }

    const newUpvotes = Math.max((currentWord.upvotes || 0) - 1, 0)

    const { data, error } = await supabase
      .from('words')
      .update({ 
        upvotes: newUpvotes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()

    return { data, error }
  },

  // 举报词汇
  async report(id, reason) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        word_id: id,
        reason: reason,
        reported_by: 'anonymous'
      }])

    return { data, error }
  }
}

// 收藏相关操作
export const favoriteService = {
  // 获取用户指纹
  getUserFingerprint() {
    // 简单的浏览器指纹生成
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Browser fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    // 生成简单的hash
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  },

  // 添加收藏
  async addFavorite(wordId) {
    const userFingerprint = this.getUserFingerprint()
    const { data, error } = await supabase
      .from('word_favorites')
      .insert([{
        word_id: wordId,
        user_fingerprint: userFingerprint
      }])
      .select()

    return { data, error }
  },

  // 移除收藏
  async removeFavorite(wordId) {
    const userFingerprint = this.getUserFingerprint()
    const { data, error } = await supabase
      .from('word_favorites')
      .delete()
      .eq('word_id', wordId)
      .eq('user_fingerprint', userFingerprint)

    return { data, error }
  },

  // 获取用户收藏的词汇ID列表
  async getUserFavorites() {
    const userFingerprint = this.getUserFingerprint()
    const { data, error } = await supabase
      .from('word_favorites')
      .select('word_id')
      .eq('user_fingerprint', userFingerprint)

    return { data: data?.map(item => item.word_id) || [], error }
  },

  // 获取收藏的词汇详情
  async getFavoriteWords() {
    const userFingerprint = this.getUserFingerprint()
    const { data, error } = await supabase
      .from('word_favorites')
      .select(`
        word_id,
        words (
          *,
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_fingerprint', userFingerprint)
      .eq('words.is_deleted', false)

    return { data: data?.map(item => item.words).filter(Boolean) || [], error }
  },

  // 检查词汇是否已收藏
  async isFavorite(wordId) {
    const userFingerprint = this.getUserFingerprint()
    const { data, error } = await supabase
      .from('word_favorites')
      .select('id')
      .eq('word_id', wordId)
      .eq('user_fingerprint', userFingerprint)
      .single()

    return { isFavorite: !!data, error }
  }
}

// 分类相关操作
export const categoryService = {
  // 获取所有分类
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    return { data, error }
  },

  // 创建新分类
  async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: categoryData.name,
        description: categoryData.description || null
      }])
      .select()

    return { data, error }
  },

  // 更新分类
  async update(id, categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        description: categoryData.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    return { data, error }
  },

  // 删除分类
  async delete(id) {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    return { data, error }
  }
}
