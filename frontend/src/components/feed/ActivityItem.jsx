import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Flame,
  Sparkles,
  Music,
  Clock,
  Image,
} from 'lucide-react'
import { formatTimeAgo } from './utils'

export function ActivityItem({ activity, index, onClick }) {
  const navigate = useNavigate()

  const getIcon = () => {
    switch (activity.type) {
      case 'release':
        return <Music className="w-4 h-4" />
      case 'trending':
        return <TrendingUp className="w-4 h-4" />
      case 'new_artist':
        return <Sparkles className="w-4 h-4" />
      case 'photo':
        return <Image className="w-4 h-4" />
      default:
        return <Flame className="w-4 h-4" />
    }
  }

  const getIconStyle = () => {
    switch (activity.type) {
      case 'release':
        return 'bg-primary/20 text-primary'
      case 'trending':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'photo':
        return 'bg-purple-500/20 text-purple-500'
      default:
        return 'bg-blue-500/20 text-blue-500'
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(activity)
    } else if (activity.profileSlug) {
      navigate(`/${activity.profileSlug}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle()}`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.artistName}</span>
          {' '}
          <span className="text-muted-foreground">{activity.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>

      {activity.image && (
        <img
          src={activity.image}
          alt=""
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      )}
    </motion.div>
  )
}
