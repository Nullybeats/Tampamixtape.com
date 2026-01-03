import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Music,
  ExternalLink,
} from 'lucide-react'

// Audio Player Context
const AudioPlayerContext = createContext(null)

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return context
}

export function AudioPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const audioRef = useRef(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    const audio = audioRef.current

    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime)
    })

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('ended', () => {
      handleNext()
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      setIsPlaying(false)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Update audio source when track changes
  useEffect(() => {
    if (currentTrack?.previewUrl && audioRef.current) {
      audioRef.current.src = currentTrack.previewUrl
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [currentTrack])

  // Handle play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentTrack?.previewUrl) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const playTrack = (track, trackQueue = [], startIndex = 0) => {
    if (!track.previewUrl) {
      // No preview available, open Spotify instead
      if (track.url) {
        window.open(track.url, '_blank')
      }
      return
    }
    setCurrentTrack(track)
    setQueue(trackQueue)
    setQueueIndex(startIndex)
    setIsPlaying(true)
    setProgress(0)
  }

  const togglePlay = () => {
    if (currentTrack?.previewUrl) {
      setIsPlaying(!isPlaying)
    }
  }

  const handleNext = () => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1
      const nextTrack = queue[nextIndex]
      if (nextTrack?.previewUrl) {
        setQueueIndex(nextIndex)
        setCurrentTrack(nextTrack)
        setProgress(0)
      } else {
        // Skip tracks without previews
        setQueueIndex(nextIndex)
        if (nextIndex < queue.length - 1) {
          handleNext()
        } else {
          setIsPlaying(false)
        }
      }
    } else {
      setIsPlaying(false)
    }
  }

  const handlePrev = () => {
    if (progress > 3) {
      // Restart current track if more than 3 seconds in
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        setProgress(0)
      }
    } else if (queueIndex > 0) {
      const prevIndex = queueIndex - 1
      const prevTrack = queue[prevIndex]
      if (prevTrack?.previewUrl) {
        setQueueIndex(prevIndex)
        setCurrentTrack(prevTrack)
        setProgress(0)
      }
    }
  }

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }

  const closePlayer = () => {
    setIsPlaying(false)
    setCurrentTrack(null)
    setQueue([])
    setQueueIndex(0)
    setProgress(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }

  const value = {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    playTrack,
    togglePlay,
    handleNext,
    handlePrev,
    seekTo,
    setVolume,
    setIsMuted,
    closePlayer,
  }

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <AudioPlayerBar />
    </AudioPlayerContext.Provider>
  )
}

function AudioPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    togglePlay,
    handleNext,
    handlePrev,
    seekTo,
    setVolume,
    setIsMuted,
    closePlayer,
  } = useAudioPlayer()

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl"
        >
          {/* Progress bar at top */}
          <div
            className="h-1 bg-primary/20 cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              seekTo(percent * duration)
            }}
          >
            <motion.div
              className="h-full bg-primary relative"
              style={{ width: `${(progress / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Track Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentTrack.albumImage ? (
                  <img
                    src={currentTrack.albumImage}
                    alt={currentTrack.name}
                    className="w-12 h-12 rounded shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">{currentTrack.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.artistName || currentTrack.albumName}
                  </p>
                </div>
                {currentTrack.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 hidden sm:flex"
                    onClick={() => window.open(currentTrack.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  className="hidden sm:flex"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="hidden sm:flex"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Time & Volume */}
              <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatTime(progress)} / {formatTime(duration)}
                </span>

                <div className="hidden md:flex items-center gap-2 w-28">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={([val]) => {
                      setVolume(val / 100)
                      if (val > 0) setIsMuted(false)
                    }}
                    className="flex-1"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={closePlayer}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview notice */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/20 rounded-t text-[10px] text-primary font-medium">
            30s Preview
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AudioPlayerProvider
