import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  ExternalLink,
  Calendar,
  Music,
} from 'lucide-react'
import { formatRelativeDate } from './utils'

export function ReleaseCard({ release, index, compact = false }) {
  const navigate = useNavigate()

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => release.artistSlug && navigate(`/${release.artistSlug}`)}
      >
        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-secondary">
          {release.image ? (
            <img
              src={release.image}
              alt={release.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{release.name}</h4>
          <p className="text-xs text-muted-foreground truncate">{release.artistName}</p>
        </div>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {release.type}
        </Badge>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="group hover:glow-green-sm transition-all duration-300 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Album Art */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              {release.image ? (
                <img
                  src={release.image}
                  alt={release.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {release.url && (
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play className="w-8 h-8 text-white fill-white" />
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold truncate">{release.name}</h4>
                  <button
                    onClick={() => navigate(`/${release.artistSlug}`)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {release.artistName}
                  </button>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {release.type}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatRelativeDate(release.releaseDate)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {release.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    asChild
                  >
                    <a href={release.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Spotify
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => navigate(`/${release.artistSlug}`)}
                >
                  View Artist
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
