const axios = require('axios');

// Bandsintown API - free, no auth required for basic usage
const BANDSINTOWN_APP_ID = process.env.BANDSINTOWN_APP_ID || 'tampamixtape';

/**
 * Fetch upcoming events for an artist from Bandsintown
 * @param {string} artistName - The artist name to search for
 * @returns {Promise<Array>} - Array of event objects
 */
async function getArtistEvents(artistName) {
  if (!artistName) return [];

  try {
    // URL encode the artist name
    const encodedName = encodeURIComponent(artistName);

    const response = await axios.get(
      `https://rest.bandsintown.com/artists/${encodedName}/events`,
      {
        params: {
          app_id: BANDSINTOWN_APP_ID,
        },
        timeout: 10000,
      }
    );

    // Bandsintown returns an array of events or an error object
    if (!Array.isArray(response.data)) {
      return [];
    }

    // Transform to our format
    return response.data.map(event => ({
      id: event.id,
      title: event.title || `${artistName} Live`,
      date: event.datetime ? event.datetime.split('T')[0] : null,
      time: event.datetime ? formatTime(event.datetime) : null,
      venue: event.venue?.name || 'TBA',
      city: event.venue?.city || '',
      region: event.venue?.region || '',
      country: event.venue?.country || '',
      location: formatLocation(event.venue),
      ticketUrl: event.url || event.offers?.[0]?.url || null,
      ticketStatus: event.offers?.[0]?.status || 'available',
      description: event.description || null,
      lineup: event.lineup || [artistName],
      source: 'bandsintown',
    }));
  } catch (error) {
    // Bandsintown returns 404 for artists not found
    if (error.response?.status === 404) {
      console.log(`No Bandsintown profile found for: ${artistName}`);
      return [];
    }
    console.error('Bandsintown API error:', error.message);
    return [];
  }
}

/**
 * Format venue location string
 */
function formatLocation(venue) {
  if (!venue) return 'Location TBA';
  const parts = [venue.city, venue.region, venue.country].filter(Boolean);
  return parts.join(', ') || 'Location TBA';
}

/**
 * Format datetime to time string
 */
function formatTime(datetime) {
  try {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

/**
 * Get artist info from Bandsintown (includes upcoming event count)
 */
async function getArtistInfo(artistName) {
  if (!artistName) return null;

  try {
    const encodedName = encodeURIComponent(artistName);

    const response = await axios.get(
      `https://rest.bandsintown.com/artists/${encodedName}`,
      {
        params: {
          app_id: BANDSINTOWN_APP_ID,
        },
        timeout: 10000,
      }
    );

    if (response.data?.error || response.data?.message) {
      return null;
    }

    return {
      name: response.data.name,
      imageUrl: response.data.image_url,
      thumbUrl: response.data.thumb_url,
      facebookUrl: response.data.facebook_page_url,
      upcomingEventCount: response.data.upcoming_event_count || 0,
      trackerCount: response.data.tracker_count || 0,
      bandsintownUrl: response.data.url,
    };
  } catch (error) {
    console.error('Bandsintown artist info error:', error.message);
    return null;
  }
}

module.exports = {
  getArtistEvents,
  getArtistInfo,
};
