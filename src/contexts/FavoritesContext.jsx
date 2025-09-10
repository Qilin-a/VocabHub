import React, { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const item = window.localStorage.getItem('vocab_favorites')
      return item ? JSON.parse(item) : []
    } catch (error) {
      console.warn('Error reading favorites from localStorage:', error)
      return []
    }
  })

  const [unreadFavorites, setUnreadFavorites] = useState(() => {
    try {
      const item = window.localStorage.getItem('vocab_unread_favorites')
      return item ? JSON.parse(item) : 0
    } catch (error) {
      console.warn('Error reading unread favorites from localStorage:', error)
      return 0
    }
  })

  const [upvotedWords, setUpvotedWords] = useState(() => {
    try {
      const item = window.localStorage.getItem('vocab_upvoted_words')
      return item ? JSON.parse(item) : []
    } catch (error) {
      console.warn('Error reading upvoted words from localStorage:', error)
      return []
    }
  })

  // 同步到 localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('vocab_favorites', JSON.stringify(favorites))
    } catch (error) {
      console.warn('Error saving favorites to localStorage:', error)
    }
  }, [favorites])

  useEffect(() => {
    try {
      window.localStorage.setItem('vocab_unread_favorites', JSON.stringify(unreadFavorites))
    } catch (error) {
      console.warn('Error saving unread favorites to localStorage:', error)
    }
  }, [unreadFavorites])

  useEffect(() => {
    try {
      window.localStorage.setItem('vocab_upvoted_words', JSON.stringify(upvotedWords))
    } catch (error) {
      console.warn('Error saving upvoted words to localStorage:', error)
    }
  }, [upvotedWords])

  const addToFavorites = (wordId) => {
    if (!favorites.includes(wordId)) {
      setFavorites(prev => [...prev, wordId])
      setUnreadFavorites(prev => prev + 1)
    }
  }

  const removeFromFavorites = (wordId) => {
    setFavorites(prev => prev.filter(id => id !== wordId))
    // 如果删除的是未读的收藏，减少未读计数
    if (unreadFavorites > 0) {
      setUnreadFavorites(prev => Math.max(0, prev - 1))
    }
  }

  const toggleFavorite = (wordId) => {
    if (favorites.includes(wordId)) {
      removeFromFavorites(wordId)
    } else {
      addToFavorites(wordId)
    }
  }

  const markFavoritesAsRead = () => {
    setUnreadFavorites(0)
  }

  const isFavorite = (wordId) => {
    return favorites.includes(wordId)
  }

  const addUpvote = (wordId) => {
    if (!upvotedWords.includes(wordId)) {
      setUpvotedWords(prev => [...prev, wordId])
    }
  }

  const removeUpvote = (wordId) => {
    setUpvotedWords(prev => prev.filter(id => id !== wordId))
  }

  const toggleUpvote = (wordId) => {
    if (upvotedWords.includes(wordId)) {
      removeUpvote(wordId)
      return false // 表示取消点赞
    } else {
      addUpvote(wordId)
      return true // 表示添加点赞
    }
  }

  const isUpvoted = (wordId) => {
    return upvotedWords.includes(wordId)
  }

  const value = {
    favorites,
    unreadFavorites,
    upvotedWords,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    markFavoritesAsRead,
    isFavorite,
    addUpvote,
    removeUpvote,
    toggleUpvote,
    isUpvoted
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
