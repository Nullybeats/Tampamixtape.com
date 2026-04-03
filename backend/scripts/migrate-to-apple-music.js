/**
 * Migration script: Map existing artists from Spotify IDs to Apple Music IDs.
 *
 * Searches Apple Music by artist name, matches the best result,
 * and populates appleMusicId + appleMusicUrl.
 *
 * Usage: node scripts/migrate-to-apple-music.js [--dry-run]
 *
 * Rate limiting: 200ms between requests (~5 req/s), well within
 * Apple Music's limits. Respects 429 Retry-After if hit.
 */

require('dotenv').config();
const prisma = require('../services/db');
const appleMusic = require('../services/applemusic');

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 200; // 200ms between API calls (~5 req/s)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrate() {
  console.log(`\n🍎 Apple Music Migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // Find all artists with a spotifyId but no appleMusicId
  const artists = await prisma.user.findMany({
    where: {
      role: 'ARTIST',
      status: 'APPROVED',
      spotifyId: { not: null },
      appleMusicId: null,
    },
    select: {
      id: true,
      artistName: true,
      spotifyId: true,
      profileSlug: true,
    },
    orderBy: { artistName: 'asc' },
  });

  // Also find artists with no music platform ID at all
  const unlinkedArtists = await prisma.user.findMany({
    where: {
      role: 'ARTIST',
      status: 'APPROVED',
      spotifyId: null,
      appleMusicId: null,
      artistName: { not: null },
    },
    select: {
      id: true,
      artistName: true,
      profileSlug: true,
    },
    orderBy: { artistName: 'asc' },
  });

  const allArtists = [
    ...artists.map(a => ({ ...a, source: 'spotify-migration' })),
    ...unlinkedArtists.map(a => ({ ...a, source: 'unlinked' })),
  ];

  console.log(`Found ${artists.length} artists with Spotify IDs to migrate`);
  console.log(`Found ${unlinkedArtists.length} unlinked artists to search`);
  console.log(`Total: ${allArtists.length} artists to process\n`);

  if (allArtists.length === 0) {
    console.log('Nothing to migrate!');
    await prisma.$disconnect();
    return;
  }

  let matched = 0;
  let failed = 0;
  let skipped = 0;
  const results = [];

  for (let i = 0; i < allArtists.length; i++) {
    const artist = allArtists[i];
    const progress = `[${i + 1}/${allArtists.length}]`;

    if (!artist.artistName) {
      console.log(`${progress} ⏭  Skipping (no artist name)`);
      skipped++;
      continue;
    }

    try {
      // Search Apple Music by artist name
      const searchResults = await appleMusic.searchArtist(artist.artistName);
      await sleep(DELAY_MS);

      if (!searchResults || searchResults.length === 0) {
        console.log(`${progress} ❌ ${artist.artistName} — not found on Apple Music`);
        results.push({ name: artist.artistName, status: 'not_found' });
        failed++;
        continue;
      }

      // Try exact match first, then fall back to first result
      const normalizedName = artist.artistName.toLowerCase().trim();
      const exactMatch = searchResults.find(
        r => r.name.toLowerCase().trim() === normalizedName
      );
      const bestMatch = exactMatch || searchResults[0];
      const matchType = exactMatch ? 'exact' : 'fuzzy';

      if (!DRY_RUN) {
        await prisma.user.update({
          where: { id: artist.id },
          data: {
            appleMusicId: bestMatch.id,
            appleMusicUrl: bestMatch.url,
            // Reset sync state so scheduler picks them up
            syncEnabled: true,
            syncFailCount: 0,
            lastSyncError: null,
          },
        });
      }

      console.log(`${progress} ✅ ${artist.artistName} → ${bestMatch.name} (${matchType}, ID: ${bestMatch.id})`);
      results.push({
        name: artist.artistName,
        appleMusicName: bestMatch.name,
        appleMusicId: bestMatch.id,
        matchType,
        status: 'matched',
      });
      matched++;

    } catch (err) {
      // Handle rate limiting
      if (err.isRateLimitCooldown || err.response?.status === 429) {
        const retryAfter = err.retryAfter || parseInt(err.response?.headers?.['retry-after']) || 30;
        console.log(`${progress} ⏳ Rate limited — waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        i--; // Retry this artist
        continue;
      }

      console.log(`${progress} ❌ ${artist.artistName} — error: ${err.message}`);
      results.push({ name: artist.artistName, status: 'error', error: err.message });
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`🍎 Migration Complete ${DRY_RUN ? '(DRY RUN — no changes made)' : ''}`);
  console.log(`   ✅ Matched: ${matched}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   ⏭  Skipped: ${skipped}`);
  console.log(`   📊 Total:   ${allArtists.length}`);

  // Show fuzzy matches for review
  const fuzzyMatches = results.filter(r => r.matchType === 'fuzzy');
  if (fuzzyMatches.length > 0) {
    console.log(`\n⚠️  Fuzzy matches (review these):`);
    fuzzyMatches.forEach(r => {
      console.log(`   "${r.name}" → "${r.appleMusicName}" (ID: ${r.appleMusicId})`);
    });
  }

  // Show failures
  const failures = results.filter(r => r.status !== 'matched');
  if (failures.length > 0) {
    console.log(`\n❌ Not found / errors:`);
    failures.forEach(r => {
      console.log(`   "${r.name}" — ${r.status}${r.error ? ': ' + r.error : ''}`);
    });
  }

  await prisma.$disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
