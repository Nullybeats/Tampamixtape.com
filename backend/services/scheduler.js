const prisma = require('./db');
const spotify = require('./spotify');

let syncTimer = null;
let isRunning = false;

// Helper to check if error is rate limiting
function isRateLimitError(err) {
  return err.response?.status === 429 ||
         (err.message && err.message.includes('429'));
}

// Run the sync job
async function runSync() {
  if (isRunning) {
    console.log('[Scheduler] Sync already in progress, skipping...');
    return;
  }

  isRunning = true;
  console.log('[Scheduler] Starting auto-sync...');

  try {
    // Get all approved artists with Spotify IDs
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
      },
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        spotifyId: true,
      },
    });

    console.log(`[Scheduler] Syncing ${artists.length} artists...`);

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // Sync releases for each artist
    for (const artist of artists) {
      try {
        const albums = await spotify.getArtistAlbums(artist.spotifyId);

        if (albums && albums.length > 0) {
          for (const album of albums) {
            await prisma.release.upsert({
              where: { id: album.id },
              create: {
                id: album.id,
                name: album.name,
                type: album.album_type === 'album' ? 'Album' : album.album_type === 'single' ? 'Single' : 'EP',
                image: album.images?.[0]?.url || null,
                releaseDate: album.release_date || null,
                spotifyUrl: album.external_urls?.spotify || null,
                artistId: artist.id,
                artistName: artist.artistName,
                artistSlug: artist.profileSlug,
              },
              update: {
                name: album.name,
                type: album.album_type === 'album' ? 'Album' : album.album_type === 'single' ? 'Single' : 'EP',
                image: album.images?.[0]?.url || null,
                releaseDate: album.release_date || null,
                spotifyUrl: album.external_urls?.spotify || null,
                artistName: artist.artistName,
                artistSlug: artist.profileSlug,
              },
            });
            totalAdded++;
          }
        }

        // Also refresh artist data (popularity, followers, etc.)
        const spotifyData = await spotify.getArtist(artist.spotifyId);
        if (spotifyData) {
          const updateData = {};
          if (typeof spotifyData.popularity === 'number') {
            updateData.popularity = spotifyData.popularity;
          }
          if (spotifyData.followers?.total !== undefined) {
            updateData.followers = spotifyData.followers.total;
          }
          if (spotifyData.genres?.length > 0) {
            updateData.genres = spotifyData.genres.join(', ');
          }
          if (spotifyData.images?.length > 0) {
            updateData.avatar = spotifyData.images[0].url;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: artist.id },
              data: updateData,
            });
          }
        }
      } catch (err) {
        if (isRateLimitError(err)) {
          console.log(`[Scheduler] Rate limited, stopping sync early...`);
          totalSkipped++;
          break; // Stop the sync if rate limited
        } else {
          console.error(`[Scheduler] Failed for ${artist.artistName}:`, err.message);
          totalFailed++;
        }
      }

      // Delay between artists (1.5 seconds for auto-sync to be gentler)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Update settings with sync result
    const status = totalFailed > 0 || totalSkipped > 0 ? 'partial' : 'success';
    const message = `Synced ${totalAdded} releases. ${totalFailed} failed, ${totalSkipped} skipped.`;

    await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: {
        id: 'app_settings',
        lastSyncAt: new Date(),
        lastSyncStatus: status,
        lastSyncMessage: message,
      },
      update: {
        lastSyncAt: new Date(),
        lastSyncStatus: status,
        lastSyncMessage: message,
      },
    });

    console.log(`[Scheduler] Sync complete: ${message}`);
  } catch (error) {
    console.error('[Scheduler] Sync error:', error);

    // Update settings with error
    await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: {
        id: 'app_settings',
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastSyncMessage: error.message,
      },
      update: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastSyncMessage: error.message,
      },
    });
  } finally {
    isRunning = false;
  }
}

// Start the scheduler
async function start() {
  console.log('[Scheduler] Initializing...');

  try {
    // Get or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: { id: 'app_settings' },
      update: {},
    });

    if (settings.autoSyncEnabled && settings.autoSyncIntervalMins > 0) {
      const intervalMs = settings.autoSyncIntervalMins * 60 * 1000;
      console.log(`[Scheduler] Auto-sync enabled, interval: ${settings.autoSyncIntervalMins} minutes`);

      // Clear any existing timer
      if (syncTimer) {
        clearInterval(syncTimer);
      }

      // Set up the interval
      syncTimer = setInterval(runSync, intervalMs);

      // Also check if we should run immediately (if last sync was too long ago)
      if (settings.lastSyncAt) {
        const timeSinceLastSync = Date.now() - new Date(settings.lastSyncAt).getTime();
        if (timeSinceLastSync >= intervalMs) {
          console.log('[Scheduler] Last sync was too long ago, running now...');
          runSync();
        }
      }
    } else {
      console.log('[Scheduler] Auto-sync is disabled');
    }
  } catch (error) {
    console.error('[Scheduler] Failed to initialize:', error);
  }
}

// Stop the scheduler
function stop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[Scheduler] Stopped');
  }
}

// Restart with new settings
async function restart() {
  stop();
  await start();
}

// Get scheduler status
async function getStatus() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'app_settings' },
  });

  return {
    enabled: settings?.autoSyncEnabled || false,
    intervalMins: settings?.autoSyncIntervalMins || 60,
    lastSyncAt: settings?.lastSyncAt,
    lastSyncStatus: settings?.lastSyncStatus,
    lastSyncMessage: settings?.lastSyncMessage,
    isRunning,
  };
}

module.exports = {
  start,
  stop,
  restart,
  runSync,
  getStatus,
};
