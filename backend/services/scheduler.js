const prisma = require('./db');
const spotify = require('./spotify');
const lastfm = require('./lastfm');
const cache = require('./cache');

let syncTimer = null;
let isRunning = false;

const CHUNK_SIZE = 30; // Artists per sync cycle
const CIRCUIT_BREAKER_THRESHOLD = 3; // Consecutive failures to quarantine

// ==============================
// Helpers
// ==============================

function isRateLimitError(err) {
  return err.response?.status === 429 ||
         (err.message && err.message.includes('429'));
}

function isBadRequestError(err) {
  return err.response?.status === 400 || err.response?.status === 404;
}

function flushLandingCache() {
  cache.keys().forEach(key => {
    if (key.startsWith('hot100:') || key.startsWith('releases:') || key === 'landing') {
      cache.del(key);
    }
  });
}

function formatGenres(genres) {
  return genres
    .slice(0, 3)
    .map(g => g.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '))
    .join(', ');
}

function releaseType(albumType) {
  if (albumType === 'album') return 'Album';
  if (albumType === 'single') return 'Single';
  return 'EP';
}

// Upsert releases from Spotify album data
async function upsertReleases(albums, artist) {
  let added = 0;
  for (const album of albums) {
    await prisma.release.upsert({
      where: { id: album.id },
      create: {
        id: album.id,
        name: album.name,
        type: releaseType(album.album_type),
        image: album.images?.[0]?.url || null,
        releaseDate: album.release_date || null,
        spotifyUrl: album.external_urls?.spotify || null,
        artistId: artist.id,
        artistName: artist.artistName,
        artistSlug: artist.profileSlug,
      },
      update: {
        name: album.name,
        type: releaseType(album.album_type),
        image: album.images?.[0]?.url || null,
        releaseDate: album.release_date || null,
        spotifyUrl: album.external_urls?.spotify || null,
        artistName: artist.artistName,
        artistSlug: artist.profileSlug,
      },
    });
    added++;
  }
  return added;
}

// Write a SyncLog entry
async function writeSyncLog({ type, status, message, artistsSynced, artistsFailed, artistsSkipped, errors, duration }) {
  try {
    await prisma.syncLog.create({
      data: {
        type,
        status,
        message,
        artistsSynced: artistsSynced || 0,
        artistsFailed: artistsFailed || 0,
        artistsSkipped: artistsSkipped || 0,
        errors: errors ? JSON.stringify(errors) : null,
        duration: duration || null,
      },
    });
  } catch (err) {
    console.error('[Scheduler] Failed to write sync log:', err.message);
  }
}

// ==============================
// Single artist sync (used after approval/creation)
// ==============================

async function syncSingleArtist(artist) {
  if (!artist.spotifyId) return { added: 0 };

  // Validate ID format
  if (!spotify.isValidSpotifyId(artist.spotifyId)) {
    console.log(`[Scheduler] Invalid Spotify ID for ${artist.artistName}: ${artist.spotifyId}`);
    await prisma.user.update({
      where: { id: artist.id },
      data: { syncEnabled: false, lastSyncError: 'Invalid Spotify ID format' },
    });
    return { added: 0, error: 'Invalid Spotify ID format' };
  }

  console.log(`[Scheduler] Syncing releases for ${artist.artistName}...`);
  const startTime = Date.now();

  try {
    const albums = await spotify.getArtistAlbums(artist.spotifyId);
    const added = albums && albums.length > 0 ? await upsertReleases(albums, artist) : 0;

    // Mark as successfully synced, reset fail count
    await prisma.user.update({
      where: { id: artist.id },
      data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
    });

    flushLandingCache();

    await writeSyncLog({
      type: 'single',
      status: 'success',
      message: `Synced ${added} releases for ${artist.artistName}`,
      artistsSynced: 1,
      duration: Date.now() - startTime,
    });

    console.log(`[Scheduler] Synced ${added} releases for ${artist.artistName}`);
    return { added };
  } catch (err) {
    const errorMsg = err.message || 'Unknown error';

    // Increment fail count, quarantine if threshold reached
    const newFailCount = (artist.syncFailCount || 0) + 1;
    const shouldDisable = isBadRequestError(err) || newFailCount >= CIRCUIT_BREAKER_THRESHOLD;

    await prisma.user.update({
      where: { id: artist.id },
      data: {
        syncFailCount: newFailCount,
        lastSyncError: errorMsg,
        ...(shouldDisable && { syncEnabled: false }),
      },
    });

    if (shouldDisable) {
      console.log(`[Scheduler] Quarantined ${artist.artistName} (${isBadRequestError(err) ? 'bad ID' : 'too many failures'})`);
    }

    await writeSyncLog({
      type: 'single',
      status: 'failed',
      message: `Failed to sync ${artist.artistName}: ${errorMsg}`,
      artistsFailed: 1,
      errors: [{ artistName: artist.artistName, error: errorMsg }],
      duration: Date.now() - startTime,
    });

    throw err;
  }
}

// ==============================
// Chunked sync (main sync job)
// ==============================

async function runSync() {
  if (isRunning) {
    console.log('[Scheduler] Sync already in progress, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log('[Scheduler] Starting chunked sync...');

  const errorList = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalSynced = 0;

  try {
    // Step 1: Get the stalest artists (prioritize never-synced, then oldest)
    const artists = await prisma.user.findMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
        syncEnabled: true,
      },
      orderBy: [
        { lastSyncedAt: 'asc' }, // nulls first in Prisma = never synced come first
      ],
      take: CHUNK_SIZE,
      select: {
        id: true,
        artistName: true,
        profileSlug: true,
        spotifyId: true,
        genresLocked: true,
        syncFailCount: true,
      },
    });

    if (artists.length === 0) {
      console.log('[Scheduler] No artists to sync');
      isRunning = false;
      return;
    }

    // Filter out invalid Spotify IDs and quarantine them
    const validArtists = [];
    for (const artist of artists) {
      if (!spotify.isValidSpotifyId(artist.spotifyId)) {
        console.log(`[Scheduler] Quarantining ${artist.artistName} - invalid Spotify ID: ${artist.spotifyId}`);
        await prisma.user.update({
          where: { id: artist.id },
          data: { syncEnabled: false, lastSyncError: 'Invalid Spotify ID format' },
        });
        totalSkipped++;
        errorList.push({ artistName: artist.artistName, error: 'Invalid Spotify ID format' });
        continue;
      }
      validArtists.push(artist);
    }

    console.log(`[Scheduler] Syncing chunk of ${validArtists.length} artists (${totalSkipped} skipped for bad IDs)...`);

    // Step 2: Batch-fetch artist metadata (popularity, followers, genres, avatar)
    const spotifyIds = validArtists.map(a => a.spotifyId);
    let batchMetadata = [];
    try {
      batchMetadata = await spotify.getArtistsBatch(spotifyIds);
    } catch (err) {
      console.error('[Scheduler] Batch metadata fetch failed:', err.message);
      // Fall back to individual fetches below
    }

    // Build a lookup map from batch results
    const metadataMap = new Map();
    for (const data of batchMetadata) {
      if (data) metadataMap.set(data.id, data);
    }

    // Step 3: Process each artist — fetch albums + update metadata
    let rateLimitHits = 0;

    for (const artist of validArtists) {
      try {
        // Fetch albums
        const albums = await spotify.getArtistAlbums(artist.spotifyId);
        if (albums && albums.length > 0) {
          totalAdded += await upsertReleases(albums, artist);
        }

        // Update artist metadata (from batch or individual fallback)
        let spotifyData = metadataMap.get(artist.spotifyId);
        if (!spotifyData) {
          try {
            spotifyData = await spotify.getArtist(artist.spotifyId);
          } catch { /* skip metadata update */ }
        }

        if (spotifyData) {
          const updateData = {
            lastSyncedAt: new Date(),
            syncFailCount: 0,
            lastSyncError: null,
          };

          if (typeof spotifyData.popularity === 'number') {
            updateData.popularity = spotifyData.popularity;
          }
          if (spotifyData.followers?.total !== undefined) {
            updateData.followers = spotifyData.followers.total;
          }
          if (spotifyData.images?.length > 0) {
            updateData.avatar = spotifyData.images[0].url;
          }

          // Genre update (Spotify → Last.fm fallback)
          if (!artist.genresLocked) {
            let genres = spotifyData.genres || [];
            if (genres.length === 0 && artist.artistName) {
              try {
                const lastfmData = await lastfm.getArtistStats(artist.artistName);
                if (lastfmData?.tags?.length > 0) {
                  genres = lastfmData.tags;
                }
              } catch { /* skip */ }
            }
            if (genres.length > 0) {
              updateData.genres = formatGenres(genres);
            }
          }

          await prisma.user.update({ where: { id: artist.id }, data: updateData });
        } else {
          // No metadata but albums synced — still mark as synced
          await prisma.user.update({
            where: { id: artist.id },
            data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
          });
        }

        totalSynced++;
      } catch (err) {
        if (isRateLimitError(err)) {
          rateLimitHits++;
          if (rateLimitHits >= 3) {
            console.log('[Scheduler] Rate limited 3 times this cycle, stopping early');
            totalSkipped += validArtists.length - validArtists.indexOf(artist);
            break;
          }
          // Pause and retry this artist
          const wait = parseInt(err.response?.headers?.['retry-after']) || 30;
          console.log(`[Scheduler] Rate limited, pausing ${wait}s then resuming...`);
          await new Promise(r => setTimeout(r, wait * 1000));
          // Skip this artist for now, it'll be retried next cycle
          totalSkipped++;
          continue;
        }

        // Bad request / not found — quarantine
        if (isBadRequestError(err)) {
          await prisma.user.update({
            where: { id: artist.id },
            data: { syncEnabled: false, lastSyncError: err.message },
          });
          console.log(`[Scheduler] Quarantined ${artist.artistName} - API returned ${err.response?.status}`);
        } else {
          // Other error — increment fail count
          const newFailCount = (artist.syncFailCount || 0) + 1;
          await prisma.user.update({
            where: { id: artist.id },
            data: {
              syncFailCount: newFailCount,
              lastSyncError: err.message,
              ...(newFailCount >= CIRCUIT_BREAKER_THRESHOLD && { syncEnabled: false }),
            },
          });
          if (newFailCount >= CIRCUIT_BREAKER_THRESHOLD) {
            console.log(`[Scheduler] Quarantined ${artist.artistName} after ${newFailCount} consecutive failures`);
          }
        }

        errorList.push({ artistName: artist.artistName, error: err.message });
        totalFailed++;
      }

      // Delay between artists
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 4: Write results
    const status = totalFailed > 0 || totalSkipped > 0 ? 'partial' : 'success';
    const duration = Date.now() - startTime;
    const message = `Chunk: ${totalSynced} synced, ${totalAdded} releases, ${totalFailed} failed, ${totalSkipped} skipped (${Math.round(duration / 1000)}s)`;

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

    await writeSyncLog({
      type: 'chunk',
      status,
      message,
      artistsSynced: totalSynced,
      artistsFailed: totalFailed,
      artistsSkipped: totalSkipped,
      errors: errorList.length > 0 ? errorList : null,
      duration,
    });

    // Send admin alert if too many failures
    if (totalFailed > validArtists.length * 0.2 && validArtists.length > 5) {
      try {
        const emailService = require('./email');
        emailService.sendAdminAlert({
          subject: 'Tampa Mixtape: Sync failures detected',
          message: `${totalFailed}/${validArtists.length} artists failed to sync. Check admin dashboard for details.`,
        });
      } catch { /* email not critical */ }
    }

    flushLandingCache();
    console.log(`[Scheduler] ${message}`);
  } catch (error) {
    console.error('[Scheduler] Sync error:', error);

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

    await writeSyncLog({
      type: 'chunk',
      status: 'failed',
      message: error.message,
      errors: [{ artistName: 'SYSTEM', error: error.message }],
      duration: Date.now() - startTime,
    });
  } finally {
    isRunning = false;
  }
}

// ==============================
// Scheduler lifecycle
// ==============================

async function start() {
  console.log('[Scheduler] Initializing...');

  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      create: { id: 'app_settings' },
      update: {},
    });

    // Always run an initial sync if there are no releases in the DB
    const releaseCount = await prisma.release.count();
    if (releaseCount === 0) {
      console.log('[Scheduler] No releases found, running initial sync...');
      runSync();
    }

    if (settings.autoSyncEnabled && settings.autoSyncIntervalMins > 0) {
      const intervalMs = settings.autoSyncIntervalMins * 60 * 1000;
      console.log(`[Scheduler] Auto-sync enabled, interval: ${settings.autoSyncIntervalMins} minutes`);

      if (syncTimer) {
        clearInterval(syncTimer);
      }

      syncTimer = setInterval(runSync, intervalMs);

      if (!settings.lastSyncAt) {
        console.log('[Scheduler] No previous sync found, running now...');
        runSync();
      } else {
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

function stop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[Scheduler] Stopped');
  }
}

async function restart() {
  stop();
  await start();
}

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
  syncSingleArtist,
  getStatus,
};
