// Shared utility functions for feed components

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num?.toLocaleString() || '0'
}

export function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00')
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 0) return 'Upcoming'
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function formatRelativeDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00')
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Future releases
  if (diffDays < 0) {
    const daysUntil = Math.abs(diffDays)
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil < 7) return `In ${daysUntil} days`
    if (daysUntil < 30) return `In ${Math.floor(daysUntil / 7)} weeks`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return date.toLocaleDateString()
}
