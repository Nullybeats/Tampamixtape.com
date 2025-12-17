const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

async function searchChannel(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return [];
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        key: apiKey,
        q: query,
        type: 'channel',
        part: 'snippet',
        maxResults: 5,
      },
    });
    return response.data.items || [];
  } catch (error) {
    console.error('YouTube search error:', error.message);
    return [];
  }
}

async function getChannelStats(channelId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        key: apiKey,
        id: channelId,
        part: 'snippet,statistics,brandingSettings',
      },
    });

    const channel = response.data.items?.[0];
    if (!channel) return null;

    return {
      platform: 'youtube',
      id: channel.id,
      name: channel.snippet?.title,
      description: channel.snippet?.description,
      image: channel.snippet?.thumbnails?.high?.url,
      subscribers: parseInt(channel.statistics?.subscriberCount || 0),
      totalViews: parseInt(channel.statistics?.viewCount || 0),
      videoCount: parseInt(channel.statistics?.videoCount || 0),
      url: `https://youtube.com/channel/${channel.id}`,
    };
  } catch (error) {
    console.error('YouTube getChannelStats error:', error.message);
    return null;
  }
}

async function searchVideos(query, maxResults = 10) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    // Search for videos
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        key: apiKey,
        q: query,
        type: 'video',
        part: 'snippet',
        maxResults,
        videoCategoryId: '10', // Music category
      },
    });

    const videoIds = searchResponse.data.items?.map(item => item.id.videoId).join(',');
    if (!videoIds) return [];

    // Get video statistics
    const statsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        key: apiKey,
        id: videoIds,
        part: 'statistics,snippet',
      },
    });

    return statsResponse.data.items?.map(video => ({
      id: video.id,
      title: video.snippet?.title,
      thumbnail: video.snippet?.thumbnails?.high?.url,
      views: parseInt(video.statistics?.viewCount || 0),
      likes: parseInt(video.statistics?.likeCount || 0),
      comments: parseInt(video.statistics?.commentCount || 0),
      publishedAt: video.snippet?.publishedAt,
      url: `https://youtube.com/watch?v=${video.id}`,
    })) || [];
  } catch (error) {
    console.error('YouTube searchVideos error:', error.message);
    return [];
  }
}

async function getArtistYouTubeStats(artistName) {
  try {
    // Search for the artist's channel
    const channels = await searchChannel(`${artistName} official`);
    const channel = channels[0];

    let channelStats = null;
    if (channel) {
      channelStats = await getChannelStats(channel.id.channelId);
    }

    // Search for music videos
    const videos = await searchVideos(`${artistName} official music video`, 10);
    const totalVideoViews = videos.reduce((sum, v) => sum + v.views, 0);

    return {
      platform: 'youtube',
      channelId: channelStats?.id || null,
      channelName: channelStats?.name || null,
      subscribers: channelStats?.subscribers || 0,
      totalChannelViews: channelStats?.totalViews || 0,
      topVideos: videos.slice(0, 5),
      totalVideoViews,
      url: channelStats?.url || null,
    };
  } catch (error) {
    console.error('YouTube getArtistYouTubeStats error:', error.message);
    return {
      platform: 'youtube',
      error: error.message,
      subscribers: 0,
      totalChannelViews: 0,
      totalVideoViews: 0,
      topVideos: [],
    };
  }
}

module.exports = {
  searchChannel,
  getChannelStats,
  searchVideos,
  getArtistYouTubeStats,
};
