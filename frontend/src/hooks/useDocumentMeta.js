import { useEffect } from 'react'

/**
 * Custom hook to update document meta tags dynamically
 * Works for search engines that execute JS (like Google)
 * For social crawlers, you'd need server-side rendering or edge middleware
 */
export function useDocumentMeta({ title, description, image, url }) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title
    }

    // Helper to update or create meta tag
    const updateMeta = (selector, content, attribute = 'content') => {
      if (!content) return
      let element = document.querySelector(selector)
      if (element) {
        element.setAttribute(attribute, content)
      }
    }

    // Update description
    if (description) {
      updateMeta('meta[name="description"]', description)
      updateMeta('meta[property="og:description"]', description)
      updateMeta('meta[property="twitter:description"]', description)
    }

    // Update OG image
    if (image) {
      updateMeta('meta[property="og:image"]', image)
      updateMeta('meta[property="twitter:image"]', image)
    }

    // Update OG title
    if (title) {
      updateMeta('meta[name="title"]', title)
      updateMeta('meta[property="og:title"]', title)
      updateMeta('meta[property="twitter:title"]', title)
    }

    // Update URL
    if (url) {
      updateMeta('meta[property="og:url"]', url)
      updateMeta('meta[property="twitter:url"]', url)
    }

    // Cleanup - restore defaults when component unmounts
    return () => {
      document.title = 'Tampa Mixtape - Tampa Bay\'s Music Radar'
      updateMeta('meta[name="title"]', 'Tampa Mixtape - Tampa Bay\'s Music Radar')
      updateMeta('meta[name="description"]', 'Discover Tampa Bay\'s hottest artists. Artist rankings, new releases, and music discovery powered by Spotify.')
      updateMeta('meta[property="og:title"]', 'Tampa Mixtape - Tampa Bay\'s Music Radar')
      updateMeta('meta[property="og:description"]', 'Discover Tampa Bay\'s hottest artists. Artist rankings, new releases, and music discovery powered by Spotify.')
      updateMeta('meta[property="og:image"]', 'https://tampamixtape.com/og-image.png')
      updateMeta('meta[property="og:url"]', 'https://tampamixtape.com/')
      updateMeta('meta[property="twitter:title"]', 'Tampa Mixtape - Tampa Bay\'s Music Radar')
      updateMeta('meta[property="twitter:description"]', 'Discover Tampa Bay\'s hottest artists. Artist rankings, new releases, and music discovery powered by Spotify.')
      updateMeta('meta[property="twitter:image"]', 'https://tampamixtape.com/og-image.png')
      updateMeta('meta[property="twitter:url"]', 'https://tampamixtape.com/')
    }
  }, [title, description, image, url])
}
