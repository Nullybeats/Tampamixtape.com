const prisma = require('./db');
const appleMusic = require('./applemusic');
const lastfm = require('./lastfm');
const cache = require('./cache');

let syncTimer = null;
let syncInProgress = false; // Module-level lock for ALL sync entry points
let cycleCount = 0; // Track cycles for metadata refresh cadence

const CHUNK_SIZE = 400; // All artists in one cycle (~300 req/min is safe with Apple Music)
const CIRCUIT_BREAKER_THRESHOLD = 5; // Consecutive failures before quarantine
const METADATA_REFRESH_INTERVAL = 4; // Every 4th cycle — metadata refresh
const API_DELAY_MS = 200; // 200ms = 5 req/s, safely under Apple's ~300/min limit

// ==============================
// Helpers
// ==============================

function isRateLimitError(err) {
  return err.response?.status === 429 || err.isRateLimitCooldown;
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

function releaseType(type) {
  if (type === 'album') return 'Album';
  if (type === 'single') return 'Single';
  return 'EP';
}

// Upsert releases from Apple Music album data
async function upsertReleases(albums, artist) {
  let added = 0;
  for (const album of albums) {
    await prisma.release.upsert({
      where: { id: album.id },
      create: {
        id: album.id,
        name: album.name,
        type: releaseType(album.type),
        image: album.image || null,
        releaseDate: album.releaseDate || null,
        appleMusicUrl: album.url || null,
        artistId: artist.id,
        artistName: artist.artistName,
        artistSlug: artist.profileSlug,
      },
      update: {
        name: album.name,
        type: releaseType(album.type),
        image: album.image || null,
        releaseDate: album.releaseDate || null,
        appleMusicUrl: album.url || null,
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
  if (!artist.appleMusicId) return { added: 0 };

  // Check module-level lock
  if (syncInProgress) {
    console.log(`[Scheduler] Sync in progress, deferring single sync for ${artist.artistName}`);
    return { added: 0, deferred: true };
  }

  // Validate ID format
  if (!appleMusic.isValidAppleMusicId(artist.appleMusicId)) {
    console.log(`[Scheduler] Invalid Apple Music ID for ${artist.artistName}: ${artist.appleMusicId}`);
    await prisma.user.update({
      where: { id: artist.id },
      data: { syncEnabled: false, lastSyncError: 'Invalid Apple Music ID format' },
    });
    return { added: 0, error: 'Invalid Apple Music ID format' };
  }

  syncInProgress = true;
  console.log(`[Scheduler] Syncing releases for ${artist.artistName}...`);
  const startTime = Date.now();

  try {
    const albums = await appleMusic.getArtistAlbums(artist.appleMusicId);
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
        appleMusicId: { not: null },
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
        appleMusicId: true,
        genresLocked: true,
        syncFailCount: true,
      },
    });

    if (artists.length === 0) {
      console.log('[Scheduler] No artists to sync');
      syncInProgress = false;
      return;
    }

    // Filter out invalid Apple Music IDs and quarantine them
    const validArtists = [];
    for (const artist of artists) {
      if (!appleMusic.isValidAppleMusicId(artist.appleMusicId)) {
        console.log(`[Scheduler] Quarantining ${artist.artistName} - invalid Apple Music ID: ${artist.appleMusicId}`);
        await prisma.user.update({
          where: { id: artist.id },
          data: { syncEnabled: false, lastSyncError: 'Invalid Apple Music ID format' },
        });
        totalSkipped++;
        errorList.push({ artistName: artist.artistName, error: 'Invalid Apple Music ID format' });
        continue;
      }
      validArtists.push(artist);
    }

    console.log(`[Scheduler] Syncing chunk of ${validArtists.length} artists (${totalSkipped} skipped for bad IDs)...`);

    // Step 2: Process each artist
    for (const artist of validArtists) {
      try {
        // --- Release sync (every cycle) ---
        const albums = await appleMusic.getArtistAlbums(artist.appleMusicId);
        if (albums && albums.length > 0) {
          totalAdded += await upsertReleases(albums, artist);
        }

        // Delay between API calls
        await new Promise(r => setTimeout(r, API_DELAY_MS));

        // --- Metadata refresh (every 12th cycle) ---
        if (isMetadataRefresh) {
          const artistData = await appleMusic.getArtistSafe(artist.appleMusicId);

          if (artistData) {
            const updateData = {};

            if (artistData.artwork) {
              updateData.avatar = artistData.artwork;
            }

            // Genre update (Apple Music -> Last.fm fallback)
            if (!artist.genresLocked) {
              let genres = artistData.genres || [];
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
            // getArtistSafe returned null (404) — still mark release sync as done
            await prisma.user.update({
              where: { id: artist.id },
              data: { lastSyncedAt: new Date(), syncFailCount: 0, lastSyncError: null },
            });
          }

          // Delay after metadata call
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
        // Rate limit — abort entire cycle immediately
        if (isRateLimitError(err)) {
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
            console.log(`[Scheduler] Quarantined ${artist.artistName} after ${newFailCount} consecutive failures`);
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

      // Delay between artists (unless we already delayed after metadata)
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

    // One-time cleanup: delete old Spotify releases (alphanumeric IDs with no Apple Music URL)
    const legacyReleases = await prisma.release.deleteMany({
      where: {
        appleMusicUrl: null,
        spotifyUrl: { not: null },
      },
    });
    if (legacyReleases.count > 0) {
      console.log(`[Scheduler] Cleaned up ${legacyReleases.count} legacy Spotify releases`);
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
