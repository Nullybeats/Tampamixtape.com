const axios = require('axios');

// Ticketmaster Discovery API - free tier (5000 calls/day)
// Sign up at: https://developer.ticketmaster.com/
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

/**
 * Fetch upcoming events for an artist from Ticketmaster
 * @param {string} artistName - The artist name to search for
 * @returns {Promise<Array>} - Array of event objects
 */
async function getArtistEvents(artistName) {
  if (!artistName) return [];

  // If no API key configured, return empty (graceful degradation)
  if (!TICKETMASTER_API_KEY) {
    console.log('Ticketmaster API key not configured - skipping events fetch');
    return [];
  }

  try {
    // Search for events by artist/attraction name
    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: artistName,
          classificationName: 'music', // Filter to music events
          size: 20, // Max events to return
          sort: 'date,asc', // Sort by date ascending
        },
        timeout: 10000,
      }
    );

    // Ticketmaster returns _embedded.events array
    const events = response.data?._embedded?.events;
    if (!Array.isArray(events)) {
      return [];
    }

    // Transform to our format
    return events.map(event => ({
      id: event.id,
      title: event.name || `${artistName} Live`,
      date: event.dates?.start?.localDate || null,
      time: formatTime(event.dates?.start?.localTime),
      venue: event._embedded?.venues?.[0]?.name || 'TBA',
      city: event._embedded?.venues?.[0]?.city?.name || '',
      state: event._embedded?.venues?.[0]?.state?.stateCode || '',
      country: event._embedded?.venues?.[0]?.country?.countryCode || '',
      location: formatLocation(event._embedded?.venues?.[0]),
      ticketUrl: event.url || null,
      ticketStatus: event.dates?.status?.code || 'onsale',
      priceRange: formatPriceRange(event.priceRanges),
      image: getBestImage(event.images),
      lineup: getAttractions(event._embedded?.attractions, artistName),
      source: 'ticketmaster',
    }));
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Ticketmaster API key invalid or expired');
    } else if (error.response?.status === 429) {
      console.error('Ticketmaster API rate limit exceeded');
    } else {
      console.error('Ticketmaster API error:', error.message);
    }
    return [];
  }
}

/**
 * Format venue location string
 */
function formatLocation(venue) {
  if (!venue) return 'Location TBA';
  const parts = [
    venue.city?.name,
    venue.state?.stateCode || venue.state?.name,
    venue.country?.countryCode
  ].filter(Boolean);
  return parts.join(', ') || 'Location TBA';
}

/**
 * Format time string from 24h to 12h format
 */
function formatTime(time) {
  if (!time) return null;
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return null;
  }
}

/**
 * Format price range string
 */
function formatPriceRange(priceRanges) {
  if (!priceRanges || priceRanges.length === 0) return null;
  const range = priceRanges[0];
  if (range.min === range.max) {
    return `$${range.min}`;
  }
  return `$${range.min} - $${range.max}`;
}

/**
 * Get best quality image from Ticketmaster images array
 */
function getBestImage(images) {
  if (!images || images.length === 0) return null;
  // Prefer larger images
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || null;
}

/**
 * Get attraction names (lineup)
 */
function getAttractions(attractions, defaultArtist) {
  if (!attractions || attractions.length === 0) {
    return [defaultArtist];
  }
  return attractions.map(a => a.name);
}

/**
 * Search for an artist/attraction on Ticketmaster
 */
async function searchArtist(artistName) {
  if (!artistName || !TICKETMASTER_API_KEY) return null;

  try {
    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/attractions.json',
      {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: artistName,
          classificationName: 'music',
          size: 5,
        },
        timeout: 10000,
      }
    );

    const attractions = response.data?._embedded?.attractions;
    if (!attractions || attractions.length === 0) {
      return null;
    }

    // Return the first (most relevant) match
    const artist = attractions[0];
    return {
      id: artist.id,
      name: artist.name,
      image: getBestImage(artist.images),
      upcomingEvents: artist.upcomingEvents?._total || 0,
      url: artist.url,
      externalLinks: artist.externalLinks,
    };
  } catch (error) {
    console.error('Ticketmaster search error:', error.message);
    return null;
  }
}

module.exports = {
  getArtistEvents,
  searchArtist,
};
