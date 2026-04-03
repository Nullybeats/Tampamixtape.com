const API_URL = 'https://tampamixtape-api.onrender.com'

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Embedly',
]

export const config = {
  matcher: ['/:path*'],
}

function isCrawler(userAgent) {
  if (!userAgent) return false
  return CRAWLER_USER_AGENTS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  )
}

// HTML escape to prevent XSS in meta tags
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Generate OG meta tag HTML response
function generateOGResponse({ artistName, bio, image, pageUrl }) {
  const escapedName = escapeHtml(artistName)
  const title = `${escapedName} — Tampa Mixtape`
  const description = escapeHtml(bio) || `Discover ${escapedName} on Tampa Mixtape — Tampa Bay's Music Radar`
  const imageUrl = image || 'https://tampamixtape.com/og-image.png'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="640">
  <meta property="og:image:height" content="640">
  <meta property="og:site_name" content="Tampa Mixtape — Tampa Bay's Music Radar">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(pageUrl)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <!-- Redirect regular users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body>
  <h1>${escapedName}</h1>
  <p>${description}</p>
  <img src="${escapeHtml(imageUrl)}" alt="${escapedName}">
  <a href="${escapeHtml(pageUrl)}">View on Tampa Mixtape</a>
</body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

// Handle /artist/:appleMusicId routes
async function handleArtistPage(appleMusicId) {
  try {
    const response = await fetch(`${API_URL}/api/artists/apple-music/${appleMusicId}/full`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return

    const artist = await response.json()
    if (!artist || !artist.name) return

    return generateOGResponse({
      artistName: artist.name,
      bio: null,
      image: artist.image,
      pageUrl: `https://tampamixtape.com/artist/${appleMusicId}`,
    })
  } catch (error) {
    console.error('Artist page middleware error:', error.message)
    return
  }
}

// Handle /:profileSlug routes
async function handleProfilePage(slug) {
  try {
    const response = await fetch(`${API_URL}/api/profile/${slug}`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return

    const data = await response.json()
    const profile = data.user

    if (!profile) return

    return generateOGResponse({
      artistName: profile.artistName,
      bio: profile.bio,
      image: profile.avatar,
      pageUrl: `https://tampamixtape.com/${slug}`,
    })
  } catch (error) {
    console.error('Profile middleware error:', error.message)
    return
  }
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || ''

  // Only intercept for social crawlers
  if (!isCrawler(userAgent)) {
    return
  }

  const url = new URL(request.url)
  const pathname = url.pathname

  // Handle /artist/:appleMusicId routes (Apple Music IDs are numeric strings)
  const artistRouteMatch = pathname.match(/^\/artist\/(\d+)$/)
  if (artistRouteMatch) {
    return handleArtistPage(artistRouteMatch[1])
  }

  // Handle profile slug routes
  const slug = pathname.slice(1) // Remove leading slash

  // Skip static files and known routes
  const skipPaths = ['artists', 'releases', 'events', 'admin', 'login', 'register', 'settings', 'api', '_next', 'assets', 'favicon', 'og-image']
  if (!slug || skipPaths.some(p => slug.startsWith(p)) || slug.includes('.')) {
    return
  }

  return handleProfilePage(slug)
}
