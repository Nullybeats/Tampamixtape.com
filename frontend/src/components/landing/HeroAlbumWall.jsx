/**
 * Faint mosaic of real album covers behind the hero. Sourced from the album
 * artwork already in the landing feed (Apple Music artwork URLs on releases +
 * artist avatars) — no extra API call. Album covers are prioritized; avatars
 * only fill in. Heavily masked + darkened so it reads as texture, not content.
 */
export function HeroAlbumWall({ images = [] }) {
  const unique = [...new Set(images.filter(Boolean))]
  if (unique.length === 0) return null

  // Repeat to fill a seamless grid even with only a handful of covers.
  const TILES = 56
  const tiles = Array.from({ length: TILES }, (_, i) => unique[i % unique.length])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 opacity-[0.13] blur-[1.5px] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_72%,transparent)]">
        {tiles.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {/* Vignette keeps the headline + card area clean */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(8,8,10,0.9),rgba(8,8,10,0.35)_70%,transparent)]" />
    </div>
  )
}
