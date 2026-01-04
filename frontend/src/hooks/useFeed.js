import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function useFeed(options = {}) {
  const { filter = 'all', limit = 10, autoFetch = true } = options
  const { token, isAuthenticated } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${API_URL}/api/feed/personal?page=${pageNum}&limit=${limit}&filter=${filter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch feed')
      }

      const data = await response.json()

      if (append) {
        setItems(prev => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }

      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (err) {
      console.error('Feed fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, isAuthenticated, limit, filter])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed(page + 1, true)
    }
  }, [loading, hasMore, page, fetchFeed])

  const refetch = useCallback(() => {
    setPage(1)
    fetchFeed(1, false)
  }, [fetchFeed])

  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      fetchFeed(1, false)
    }
  }, [autoFetch, isAuthenticated, fetchFeed])

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  }
}

export function useMyActivity(options = {}) {
  const { limit = 10 } = options
  const { token, isAuthenticated } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActivity = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/feed/my-activity?limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch activity')
        }

        const data = await response.json()
        setItems(data.items)
      } catch (err) {
        console.error('Activity fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [token, isAuthenticated, limit])

  return { items, loading, error }
}

export function useFollowingActivity(options = {}) {
  const { limit = 20 } = options
  const { token, isAuthenticated } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActivity = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/feed/following-activity?limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch following activity')
        }

        const data = await response.json()
        setItems(data.items)
      } catch (err) {
        console.error('Following activity fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [token, isAuthenticated, limit])

  return { items, loading, error }
}
