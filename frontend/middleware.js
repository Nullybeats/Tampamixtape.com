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

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || ''

  // Only intercept for social crawlers
  if (!isCrawler(userAgent)) {
    return
  }

  const url = new URL(request.url)
  const slug = url.pathname.slice(1) // Remove leading slash

  // Skip static files and known routes
  const skipPaths = ['artists', 'releases', 'events', 'admin', 'login', 'register', 'settings', 'api', '_next', 'assets', 'favicon', 'og-image']
  if (!slug || skipPaths.some(p => slug.startsWith(p)) || slug.includes('.')) {
    return
  }

  try {
    // Fetch artist data from API
    const response = await fetch(`${API_URL}/api/profile/${slug}`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return

    const data = await response.json()
    const artist = data.user

    if (!artist) return

    // Build meta content
    const title = `${artist.artistName} | Tampa Mixtape`
    const description = artist.bio || `Discover ${artist.artistName} on Tampa Mixtape - Tampa Bay's Music Radar`
    const image = artist.avatar || 'https://tampamixtape.com/og-image.png'
    const pageUrl = `https://tampamixtape.com/${slug}`

    // Return a minimal HTML page with correct meta tags for crawlers
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
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="640">
  <meta property="og:image:height" content="640">
  <meta property="og:site_name" content="Tampa Mixtape">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">

  <!-- Redirect regular users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
  <h1>${artist.artistName}</h1>
  <p>${description}</p>
  <img src="${image}" alt="${artist.artistName}">
  <a href="${pageUrl}">View on Tampa Mixtape</a>
</body>
</html>`

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Middleware error:', error.message)
    return
  }
}
