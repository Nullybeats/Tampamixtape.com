import { useNavigate } from 'react-router-dom'
import { ChevronUp, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

// Decorative "rising" series for the hero chart (deterministic, not live data).
const SERIES = [14, 19, 16, 24, 21, 30, 27, 38, 34, 46, 52, 49, 66, 84]

function buildChart(width, height, pad) {
  const n = SERIES.length
  const max = 100
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const pts = SERIES.map((v, i) => ({
    x: pad.l + (i / (n - 1)) * innerW,
    y: pad.t + (1 - v / max) * innerH,
  }))
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[n - 1].x.toFixed(1)},${(height - pad.b).toFixed(1)} L${pts[0].x.toFixed(1)},${(height - pad.b).toFixed(1)} Z`
  return { pts, line, area, last: pts[n - 1] }
}

function LiveChart() {
  const W = 560
  const H = 240
  const pad = { l: 34, r: 18, t: 16, b: 26 }
  const { line, area, last } = buildChart(W, H, pad)
  const yFor = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lrFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff656c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff656c" stopOpacity="0" />
        </linearGradient>
        <filter id="lrGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* gridlines + y labels */}
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={yFor(v)} y2={yFor(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pad.l - 8} y={yFor(v) + 3} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.35)">{v}</text>
        </g>
      ))}
      {/* x labels */}
      {['12AM', '6AM', '12PM', '6PM', '12AM'].map((t, i, a) => (
        <text key={t + i} x={pad.l + (i / (a.length - 1)) * (W - pad.l - pad.r)} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)">{t}</text>
      ))}

      <path d={area} fill="url(#lrFill)" />
      <path d={line} fill="none" stroke="#ff656c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#lrGlow)" />
      <circle cx={last.x} cy={last.y} r="9" fill="#ff656c" opacity="0.25" />
      <circle cx={last.x} cy={last.y} r="4.5" fill="#ff656c" filter="url(#lrGlow)" />
    </svg>
  )
}

function SkeletonRow({ i }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-6 text-xs font-mono text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
      <div className="h-9 w-9 rounded-lg bg-white/5 animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse" />
        <div className="h-2 w-16 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="h-3 w-6 rounded bg-white/5 animate-pulse" />
    </div>
  )
}

export function LiveRankingsCard({ artists = [] }) {
  const navigate = useNavigate()
  const top = artists.slice(0, 5)

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* concentric glow rings emanating from behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(circle,black_25%,transparent_72%)]"
      >
        {[480, 720, 1000, 1320, 1680, 2080].map((s, i) => (
          <div
            key={s}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25"
            style={{ width: s, height: s, opacity: 1 - i * 0.13 }}
          />
        ))}
        <div className="absolute left-1/2 top-1/2 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[130px]" />
      </div>

      {/* the product card */}
      <div className="relative rounded-3xl glass p-4 sm:p-6 elev-3">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* chart */}
          <div>
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Tampa Hot 100</div>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tight">Live Rankings</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Updated in real time
              </span>
            </div>
            <div className="h-52 w-full rounded-xl bg-black/20">
              <LiveChart />
            </div>
          </div>

          {/* ranked list */}
          <div className="lg:border-l lg:border-white/5 lg:pl-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" /> Top Movers
              </span>
              <button onClick={() => navigate('/artists')} className="text-xs text-primary hover:underline">
                View Full Chart →
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {top.length === 0
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} i={i} />)
                : top.map((a, i) => (
                    <button
                      key={a.id || i}
                      onClick={() => a.profileSlug && navigate(`/${a.profileSlug}`)}
                      className="group flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] rounded-lg px-1"
                    >
                      <span className="w-6 font-mono text-xs text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.artistName} className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-white/5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                          {a.artistName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.genres?.split(',')[0] || 'Artist'}
                        </div>
                      </div>
                      <span className={cn(
                        'flex items-center gap-0.5 text-xs font-semibold tabular-nums',
                        i === top.length - 1 ? 'text-primary' : 'text-primary'
                      )}>
                        {i === top.length - 1 && !a.demandScore ? (
                          'NEW'
                        ) : (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            {a.demandScore ?? ''}
                          </>
                        )}
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* pedestal glow + reflection */}
      <div aria-hidden className="pointer-events-none absolute -bottom-4 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-[50%] bg-primary/40 blur-[60px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-[55%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    </div>
  )
}
