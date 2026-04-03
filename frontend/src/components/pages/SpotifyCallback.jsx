// Legacy file — Spotify OAuth callback is no longer used.
// Apple Music uses JWT-based auth that doesn't require user OAuth.
// This file is kept to prevent import errors from App.jsx if still referenced.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SpotifyCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to home — this page is no longer needed
    navigate('/', { replace: true })
  }, [navigate])

  return null
}

export default SpotifyCallback
