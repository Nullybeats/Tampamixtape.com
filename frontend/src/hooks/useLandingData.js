import { useState, useEffect } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function useLandingData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async (retry = false) => {
      try {
        const response = await fetch(`${API_URL}/api/landing`)
        if (!response.ok) throw new Error('Failed to fetch landing data')
        const result = await response.json()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          if (!retry) {
            // Retry once after 3s (handles cold-start race)
            setTimeout(() => fetchData(true), 3000)
            return
          }
          console.error('Failed to fetch landing data:', err)
          setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
