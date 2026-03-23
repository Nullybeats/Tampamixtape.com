const prisma = require('./db');
const spotify = require('./spotify');
const lastfm = require('./lastfm');
const cache = require('./cache');

let syncTimer = null;
let syncInProgress = false; // Module-level lock for ALL sync entry points
let cycleCount = 0; // Track cycles for metadata refresh cadence

const CHUNK_SIZE = 10; // Artists per sync cycle (reduced for Dev Mode)
const CIRCUIT_BREAKER_THRESHOLD = 3; // Consecutive failures to quarantine
const METADATA_REFRESH_INTERVAL = 12; // Every 12th cycle (~6 hours at 30min interval)
const API_DELAY_MS = 3000; // 3 seconds between every Spotify API call

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

  // Check module-level lock
  if (syncInProgress) {
    console.log(`[Scheduler] Sync in progress, deferring single sync for ${artist.artistName}`);
    return { added: 0, deferred: true };
  }

  // Don't sync if Spotify is in cooldown
  if (spotify.isRateLimited()) {
    const cooldown = spotify.isInCooldown();
    console.log(`[Scheduler] Spotify in cooldown (${cooldown.remainingSec}s), deferring sync for ${artist.artistName}`);
    return { added: 0, deferred: true };
  }

  // Validate ID format
  if (!spotify.isValidSpotifyId(artist.spotifyId)) {
    console.log(`[Scheduler] Invalid Spotify ID for ${artist.artistName}: ${artist.spotifyId}`);
    await prisma.user.update({
      where: { id: artist.id },
      data: { syncEnabled: false, lastSyncError: 'Invalid Spotify ID format' },
    });
    return { added: 0, error: 'Invalid Spotify ID format' };
  }

  syncInProgress = true;
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
    const shouldDisable = newFailCount >= CIRCUIT_BREAKER_THRESHOLD;

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
  } finally {
    syncInProgress = false;
  }
}

// ==============================
// Chunked sync (main sync job)
// ==============================

async function runSync() {
  // Check module-level lock (shared with syncSingleArtist and admin triggers)
  if (syncInProgress) {
    console.log('[Scheduler] Sync already in progress, skipping...');
    return;
  }

  // Check global Spotify cooldown before doing anything
  if (spotify.isRateLimited()) {
    const cooldown = spotify.isInCooldown();
    console.log(`[Scheduler] Spotify API in cooldown (${cooldown.remainingSec}s remaining), skipping cycle`);
    return;
  }

  syncInProgress = true;
  cycleCount++;
  const isMetadataRefresh = (cycleCount % METADATA_REFRESH_INTERVAL === 0);
  const startTime = Date.now();
  console.log(`[Scheduler] Starting sync cycle #${cycleCount} (${isMetadataRefresh ? 'release + metadata' : 'release only'})...`);

  const errorList = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalSynced = 0;

  try {
    // Step 1: Get the stalest artists (prioritize never-synced, then oldest lastSyncedAt)
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
      syncInProgress = false;
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

    // Step 2: Process each artist
    for (const artist of validArtists) {
      // Check rate limit before EVERY artist — abort entire cycle if limited
      if (spotify.isRateLimited()) {
        console.log(`[Scheduler] Rate limited — aborting cycle. Will retry next scheduled interval.`);
        totalSkipped += validArtists.length - validArtists.indexOf(artist);
        break;
      }

      try {
        // --- Release sync (every cycle) ---
        const albums = await spotify.getArtistAlbums(artist.spotifyId);
        if (albums && albums.length > 0) {
          totalAdded += await upsertReleases(albums, artist);
        }

        // 3-second delay between API calls
        await new Promise(r => setTimeout(r, API_DELAY_MS));

        // --- Metadata refresh (every 12th cycle) ---
        if (isMetadataRefresh) {
          // Check rate limit again before metadata call
          if (spotify.isRateLimited()) {
            console.log(`[Scheduler] Rate limited during metadata phase — aborting cycle.`);
            totalSkipped += validArtists.length - validArtists.indexOf(artist);
            break;
          }

          const spotifyData = await spotify.getArtistSafe(artist.spotifyId);

          if (spotifyData) {
            const updateData = {};

            if (spotifyData.followers?.total !== undefined) {
              updateData.followers = spotifyData.followers.total;
            }
            if (spotifyData.images?.length > 0) {
              updateData.avatar = spotifyData.images[0].url;
            }

            // Genre update (Spotify -> Last.fm fallback)
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

            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: artist.id },
                data: {
                  ...updateData,
                  lastSyncedAt: new Date(),
                  syncFailCount: 0,
                  lastSyncError: null,
                },
              });
            } else {
              await prisma.user.update({
                where: { id: artist.id },
                data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
              });
            }
          } else {
            // getArtistSafe returned null (403/404) — still mark release sync as done
            await prisma.user.update({
              where: { id: artist.id },
              data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
            });
          }

          // 3-second delay after metadata call
          await new Promise(r => setTimeout(r, API_DELAY_MS));
        } else {
          // Release-only cycle — just mark as synced
          await prisma.user.update({
            where: { id: artist.id },
            data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
          });
        }

        totalSynced++;
      } catch (err) {
        // Rate limit or cooldown — abort entire cycle immediately
        if (isRateLimitError(err) || err.isRateLimitCooldown) {
          console.log(`[Scheduler] Rate limited — aborting cycle. Will retry next scheduled interval.`);
          totalSkipped += validArtists.length - validArtists.indexOf(artist);
          break;
        }

        // Bad request / not found — increment fail count, quarantine after threshold
        if (isBadRequestError(err)) {
          const newFailCount = (artist.syncFailCount || 0) + 1;
          const shouldQuarantine = newFailCount >= CIRCUIT_BREAKER_THRESHOLD;
          await prisma.user.update({
            where: { id: artist.id },
            data: {
              syncFailCount: newFailCount,
              lastSyncError: `API returned ${err.response?.status}: ${JSON.stringify(err.response?.data || err.message)}`,
              ...(shouldQuarantine && { syncEnabled: false }),
            },
          });
          if (shouldQuarantine) {
            console.log(`[Scheduler] Quarantined ${artist.artistName} after ${newFailCount} consecutive 400s`);
          } else {
            console.log(`[Scheduler] ${artist.artistName} failed (${newFailCount}/${CIRCUIT_BREAKER_THRESHOLD}) - API returned ${err.response?.status}`);
          }
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

      // 3-second delay between artists (unless we already delayed after metadata)
      if (!isMetadataRefresh) {
        await new Promise(r => setTimeout(r, API_DELAY_MS));
      }
    }

    // Step 3: Write results
    const status = totalFailed > 0 || totalSkipped > 0 ? 'partial' : 'success';
    const duration = Date.now() - startTime;
    const mode = isMetadataRefresh ? 'release+metadata' : 'release-only';
    const message = `Chunk [${mode}]: ${totalSynced} synced, ${totalAdded} releases, ${totalFailed} failed, ${totalSkipped} skipped (${Math.round(duration / 1000)}s)`;

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
    syncInProgress = false;
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

    // On startup, re-enable artists that were quarantined (they may have been wrongly disabled)
    const reEnabled = await prisma.user.updateMany({
      where: {
        status: 'APPROVED',
        role: 'ARTIST',
        spotifyId: { not: null },
        syncEnabled: false,
      },
      data: { syncEnabled: true, syncFailCount: 0 },
    });
    if (reEnabled.count > 0) {
      console.log(`[Scheduler] Re-enabled ${reEnabled.count} previously quarantined artists`);
    }

    if (settings.autoSyncEnabled && settings.autoSyncIntervalMins > 0) {
      const intervalMs = settings.autoSyncIntervalMins * 60 * 1000;
      console.log(`[Scheduler] Auto-sync enabled, interval: ${settings.autoSyncIntervalMins} minutes`);
      console.log(`[Scheduler] First sync will run in ${settings.autoSyncIntervalMins} minutes (no startup hammering)`);

      if (syncTimer) {
        clearInterval(syncTimer);
      }

      syncTimer = setInterval(runSync, intervalMs);
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
    isRunning: syncInProgress,
  };
}

/**
 * Check if a sync is currently in progress.
 * Used by admin routes to prevent concurrent syncs.
 */
function isSyncInProgress() {
  return syncInProgress;
}

module.exports = {
  start,
  stop,
  restart,
  runSync,
  syncSingleArtist,
  getStatus,
  isSyncInProgress,
};
