import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2, CheckCircle2, XCircle, Music } from 'lucide-react'
import { toast } from 'sonner'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleSpotifyCallback, clearSpotifyConnection } = useAuth()
  const [status, setStatus] = useState('processing') // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const timeoutsRef = useRef([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const processCallback = async () => {
      // Check for errors first
      const error = searchParams.get('error')
      if (error) {
        if (mountedRef.current) setStatus('error')
        const errorMessages = {
          'access_denied': 'You cancelled the Spotify connection.',
          'invalid_state': 'Session expired. Please try again.',
          'no_code': 'Authorization failed. Please try again.',
          'callback_failed': 'Failed to connect with Spotify. Please try again.',
        }
        if (mountedRef.current) setErrorMessage(errorMessages[error] || `Error: ${error}`)
        if (mountedRef.current) clearSpotifyConnection()

        // Redirect after delay
        const t = setTimeout(() => {
          if (mountedRef.current) navigate('/', { replace: true })
        }, 3000)
        timeoutsRef.current.push(t)
        return
      }

      // Helper to show success and redirect
      const handleSuccess = (spotifyData) => {
        if (mountedRef.current) handleSpotifyCallback(spotifyData)
        if (mountedRef.current) setStatus('success')

        // Show success message with null-safe display name
        const displayName = spotifyData.artistData?.name ||
          spotifyData.spotifyProfile?.displayName ||
          'your account'

        toast.success('Spotify connected!', {
          description: spotifyData.artistData
            ? `Found your artist profile: ${spotifyData.artistData.name}`
            : `Connected as ${displayName}`,
        })

        // Redirect to the return URL or signup
        const returnTo = spotifyData.returnTo || '/'
        const t = setTimeout(() => {
          if (!mountedRef.current) return
          if (returnTo === '/signup' || returnTo === '/') {
            sessionStorage.setItem('spotify_connected', 'true')
            navigate('/', { replace: true })
          } else {
            navigate(returnTo, { replace: true })
          }
        }, 1500)
        timeoutsRef.current.push(t)
      }

      // Check for server-side token (preferred - avoids large URL payloads)
      const spotifyToken = searchParams.get('spotify_token')
      if (spotifyToken) {
        try {
          const response = await fetch(`${API_URL}/api/spotify/auth/result?token=${encodeURIComponent(spotifyToken)}`)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to retrieve Spotify data')
          }

          const spotifyData = await response.json()
          handleSuccess(spotifyData)
          return
        } catch (err) {
          console.error('Failed to exchange Spotify token:', err)
          if (mountedRef.current) setStatus('error')
          if (mountedRef.current) setErrorMessage('Failed to process Spotify data. Please try again.')
          if (mountedRef.current) clearSpotifyConnection()
          const t = setTimeout(() => {
            if (mountedRef.current) navigate('/', { replace: true })
          }, 3000)
          timeoutsRef.current.push(t)
          return
        }
      }

      // Fallback: Get Spotify data from URL (legacy support)
      const spotifyDataParam = searchParams.get('spotify_data')
      if (!spotifyDataParam) {
        if (mountedRef.current) setStatus('error')
        if (mountedRef.current) setErrorMessage('No data received from Spotify.')
        if (mountedRef.current) clearSpotifyConnection()
        const t = setTimeout(() => {
          if (mountedRef.current) navigate('/', { replace: true })
        }, 3000)
        timeoutsRef.current.push(t)
        return
      }

      try {
        // Parse the data
        const spotifyData = JSON.parse(decodeURIComponent(spotifyDataParam))
        handleSuccess(spotifyData)
      } catch (err) {
        console.error('Failed to parse Spotify data:', err)
        if (mountedRef.current) setStatus('error')
        if (mountedRef.current) setErrorMessage('Failed to process Spotify data.')
        if (mountedRef.current) clearSpotifyConnection()
        const t = setTimeout(() => {
          if (mountedRef.current) navigate('/', { replace: true })
        }, 3000)
        timeoutsRef.current.push(t)
      }
    }

    processCallback()

    return () => {
      mountedRef.current = false
      for (const id of timeoutsRef.current) {
        clearTimeout(id)
      }
      timeoutsRef.current = []
    }
  }, [searchParams, handleSpotifyCallback, clearSpotifyConnection, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1db954]/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#1db954] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Connecting to Spotify...</h1>
            <p className="text-muted-foreground">Please wait while we complete the connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Spotify Connected!</h1>
            <p className="text-muted-foreground">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          </>
        )}

        {/* Spotify branding */}
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Music className="w-4 h-4" />
          <span className="text-sm">Tampa Mixtape + Spotify</span>
        </div>
      </div>
    </div>
  )
}

export default SpotifyCallback
