"use client"

import { useRef, useEffect, useState, type RefObject } from "react"

/* ---------------------------------------------------------------------------
 * Shared scroll-motion hook
 * Tracks the section's position in the viewport (progress 0 -> 1) and the
 * current scroll velocity. Both are exposed as refs so canvas/RAF loops can
 * read the freshest value every frame without re-subscribing, and progress is
 * also returned as state for DOM-driven transforms.
 * ------------------------------------------------------------------------- */
function useScrollMotion(ref: RefObject<HTMLElement | null>) {
  const progressRef = useRef(0)
  const velocityRef = useRef(0)

  useEffect(() => {
    let lastY = window.scrollY
    let lastT = performance.now()
    let raf = 0
    let decayRaf = 0

    const measure = () => {
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const total = rect.height + vh
        const seen = vh - rect.top
        // refs only — no setState, so scrolling never re-renders the section
        progressRef.current = Math.max(0, Math.min(1, seen / total))
      }
    }

    // Decay velocity toward 0 so motion settles. Self-stopping: only runs
    // while there is residual velocity, instead of looping forever.
    const decay = () => {
      velocityRef.current *= 0.9
      if (Math.abs(velocityRef.current) < 0.002) {
        velocityRef.current = 0
        decayRaf = 0
        return
      }
      decayRaf = requestAnimationFrame(decay)
    }

    const onScroll = () => {
      const now = performance.now()
      const dy = window.scrollY - lastY
      const dt = Math.max(16, now - lastT)
      // normalized velocity (px per ms), clamped
      velocityRef.current = Math.max(-3, Math.min(3, dy / dt))
      lastY = window.scrollY
      lastT = now
      if (!raf) {
        raf = requestAnimationFrame(() => {
          measure()
          raf = 0
        })
      }
      if (!decayRaf) decayRaf = requestAnimationFrame(decay)
    }

    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", measure)
      if (raf) cancelAnimationFrame(raf)
      if (decayRaf) cancelAnimationFrame(decayRaf)
    }
  }, [ref])

  return { progressRef, velocityRef }
}

type Motion = {
  progressRef: RefObject<number>
  velocityRef: RefObject<number>
}

/* ---------------------------------------------------------------------------
 * Connection String Morph — database URIs cycle through with staggered
 * character animation and abstract visual elements.
 * ------------------------------------------------------------------------- */
const CONNECTION_STRINGS = [
  { db: "PostgreSQL", conn: "postgresql://user:pass@db.neon.tech/mydb", color: "#3b82f6" },
  { db: "MySQL", conn: "mysql://user:pass@localhost:3306/mydb", color: "#f59e0b" },
  { db: "SQLite", conn: "file:///path/to/database.db", color: "#8b5cf6" },
  { db: "libSQL", conn: "libsql://database.turso.io?authToken=token", color: "#ec4899" },
]

function ConnectionStringMorph({ active }: { active: number }) {
  const current = CONNECTION_STRINGS[active]
  const [revealed, setRevealed] = useState(0)
  const prevActive = useRef(active)

  // Parse connection string into parts for syntax highlighting
  const parts = current.conn.split("://")
  const scheme = parts[0]
  const rest = parts[1] || ""
  const fullLength = current.conn.length

  // Staggered reveal on active change
  useEffect(() => {
    if (active !== prevActive.current) {
      setRevealed(0)
      prevActive.current = active
    }
    const timer = setInterval(() => {
      setRevealed((r) => {
        if (r >= fullLength) {
          clearInterval(timer)
          return r
        }
        return r + 1
      })
    }, 18)
    return () => clearInterval(timer)
  }, [active, fullLength])

  // Get revealed portions
  const schemeRevealed = scheme.slice(0, Math.min(revealed, scheme.length))
  const separatorRevealed = revealed > scheme.length ? "://" .slice(0, revealed - scheme.length) : ""
  const restRevealed = revealed > scheme.length + 3 ? rest.slice(0, revealed - scheme.length - 3) : ""
  const isTyping = revealed < fullLength

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {CONNECTION_STRINGS.map((db, idx) => (
          <div
            key={db.db}
            className="absolute w-16 h-16 border transition-all duration-700"
            style={{
              borderColor: idx === active ? `${db.color}30` : "#1a1a1a",
              left: `${15 + idx * 20}%`,
              top: `${20 + (idx % 2) * 40}%`,
              transform: `rotate(${45 + idx * 15}deg) scale(${idx === active ? 1.1 : 0.7})`,
              opacity: idx === active ? 0.6 : 0.15,
            }}
          />
        ))}
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: current.color,
              opacity: 0.3 + (i % 3) * 0.1,
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Database indicator with staggered fade */}
      <div className="relative z-10 mb-3">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm transition-all duration-500"
          style={{ borderColor: `${current.color}40` }}
        >
          <span
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{ backgroundColor: current.color, boxShadow: `0 0 8px ${current.color}60` }}
          />
          <span className="text-xs font-mono text-[#c0c0c0] tracking-wide">{current.db}</span>
        </div>
      </div>

      {/* Connection string with character-by-character reveal */}
      <div className="relative z-10 w-full">
        <div className="relative border border-[#1f1f1f] bg-[#0c0c0c]/90 backdrop-blur-sm overflow-hidden">
          {/* Scanning line effect */}
          {isTyping && (
            <div
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-current to-transparent opacity-60 transition-all"
              style={{
                color: current.color,
                left: `${Math.min(95, (revealed / fullLength) * 100)}%`,
              }}
            />
          )}
          <div className="flex items-center px-4 py-3 font-mono text-sm">
            <span className="transition-colors duration-300" style={{ color: current.color }}>
              {schemeRevealed}
            </span>
            <span className="text-[#5a5a5a]">{separatorRevealed}</span>
            <span className="text-[#9a9a9a]">{restRevealed}</span>
            {isTyping && (
              <span
                className="inline-block w-[2px] h-4 ml-0.5 animate-pulse"
                style={{ backgroundColor: current.color }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Multi-Database — animated card rotation with connection string morphing
 * Card interaction proxy for cycling through database providers
 * ------------------------------------------------------------------------- */
function DatabaseConnectionCard({ motion }: { motion: Motion }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setActive((a) => (a + 1) % CONNECTION_STRINGS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [paused])

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 flex items-center justify-center px-5 pt-4 pb-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <ConnectionStringMorph active={active} />
      </div>
      <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
        {CONNECTION_STRINGS.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Show ${CONNECTION_STRINGS[idx].db}`}
            onClick={() => setActive(idx)}
            className={`h-1 transition-all duration-300 ${
              idx === active ? "w-4 bg-[#22c55e]" : "w-1 bg-[#2a2a2a]"
            }`}
          />
        ))}
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Multi-Database</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          PostgreSQL, SQLite, libSQL, MySQL. Connect anywhere — local, hosted, tunneled, SSH.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Connect Anywhere — wireframe globe; rotation speed reacts to scroll.
 * ------------------------------------------------------------------------- */
function RegionGlobeCard({ motion }: { motion: Motion }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const rotationRef = useRef(0)
  const animationRef = useRef<number>(0)

  const regions = [
    { name: "Local", angle: 0, radius: 0.35 },
    { name: "Neon", angle: Math.PI * 0.5, radius: 0.45 },
    { name: "Turso", angle: Math.PI, radius: 0.4 },
    { name: "SSH", angle: Math.PI * 1.5, radius: 0.5 },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const cx = rect.width / 2
    const cy = rect.height / 2 - 10
    const baseRadius = Math.min(rect.width, rect.height) * 0.35

    const animate = () => {
      const vel = motion.velocityRef.current ?? 0
      // gently drifts at rest; scrolling just nudges the rotation speed
      rotationRef.current += 0.0025 + vel * 0.05
      // autonomous phase that always advances, independent of scroll, so the
      // colour highlight travels around the globe on its own
      const t = performance.now() / 1000
      ctx.clearRect(0, 0, rect.width, rect.height)

      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, baseRadius, (baseRadius * 0.3 * (i + 1)) / 3, 0, 0, Math.PI * 2)
        ctx.strokeStyle = "#1a1a1a"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI + rotationRef.current
        // a green glow sweeps smoothly from one meridian to the next over time
        const glow = (Math.sin(t * 1.4 - i * 0.8) + 1) / 2 // 0..1
        const gg = Math.round(26 + glow * glow * 150)
        const gb = Math.round(26 + glow * glow * 50)
        ctx.beginPath()
        ctx.ellipse(cx, cy, baseRadius * Math.abs(Math.cos(angle)), baseRadius, Math.PI / 2, 0, Math.PI * 2)
        ctx.strokeStyle = `rgb(26, ${gg}, ${gb})`
        ctx.lineWidth = 1 + glow * glow * 0.6
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
      ctx.strokeStyle = "#2a2a2a"
      ctx.lineWidth = 1
      ctx.stroke()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationRef.current)
  }, [motion])

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        {regions.map((region) => {
          const x = 50 + Math.cos(region.angle) * region.radius * 80
          const y = 45 + Math.sin(region.angle) * region.radius * 50
          return (
            <div
              key={region.name}
              onMouseEnter={() => setHoveredRegion(region.name)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="absolute cursor-pointer transition-all duration-200"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                  hoveredRegion === region.name
                    ? "border-[#22c55e]/50 bg-[#0a0a0a]"
                    : "border-[#1a1a1a] bg-[#0a0a0a]/80"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    hoveredRegion === region.name ? "bg-[#22c55e]" : "bg-[#3a3a3a]"
                  }`}
                />
                <span className="text-[9px] text-[#5a5a5a] font-mono">{region.name}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Query History</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          Every query logged and queryable. Full audit trail. Time-series playback.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Rust-Native — orbit animation; orbit speed reacts to scroll + hover.
 * ------------------------------------------------------------------------- */
function NativePerformanceCard({ motion }: { motion: Motion }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [isHovered, setIsHovered] = useState(false)
  const hoverRef = useRef(false)

  useEffect(() => {
    hoverRef.current = isHovered
  }, [isHovered])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const cx = rect.width / 2
    const cy = rect.height / 2
    let time = 0

    const animate = () => {
      const vel = Math.abs(motion.velocityRef.current ?? 0)
      // scroll only nudges the spin speed; colour responds to hover only, so
      // it never blinks or flashes while scrolling
      time += (hoverRef.current ? 0.024 : 0.008) + vel * 0.05
      const active = hoverRef.current
      ctx.clearRect(0, 0, rect.width, rect.height)

      // autonomous phase so the nodes pulse green on their own, scroll-independent
      const t = performance.now() / 1000

      const orbits = [30, 45, 60]
      orbits.forEach((radius, idx) => {
        // each node pulses green on its own staggered cycle
        const pulse = (Math.sin(t * 1.6 - idx * 1.1) + 1) / 2 // 0..1
        const lit = active ? 1 : pulse * pulse
        const r = Math.round(58 + lit * (34 - 58))
        const g = Math.round(58 + lit * (197 - 58))
        const b = Math.round(58 + lit * (94 - 58))
        const node = `rgb(${r}, ${g}, ${b})`

        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(34,197,94,${0.05 + lit * 0.15})`
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])

        const angle = time * (1 - idx * 0.2) + idx * Math.PI * 0.7
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        ctx.beginPath()
        ctx.arc(px, py, 3 + lit * 1.2, 0, Math.PI * 2)
        ctx.fillStyle = node
        ctx.fill()
      })

      const corePulse = (Math.sin(t * 1.6) + 1) / 2
      const coreLit = active ? 1 : corePulse * corePulse
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${Math.round(42 + coreLit * (34 - 42))}, ${Math.round(42 + coreLit * (197 - 42))}, ${Math.round(42 + coreLit * (94 - 42))})`
      ctx.fill()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationRef.current)
  }, [motion])

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 flex items-center justify-center cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <canvas ref={canvasRef} className="w-32 h-32" />
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Rust-Native</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          Edge-optimized engine. Instant queries. Orchestrated container management.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Query History — a recent-queries log. Entries cascade in when the card
 * scrolls into view (local IntersectionObserver, so it never triggers early),
 * and the latest entry shows a live pulse.
 * ------------------------------------------------------------------------- */
const HISTORY: { sql: string; ms: number; ago: string }[] = [
  { sql: "SELECT * FROM orders WHERE status = 'paid'", ms: 6, ago: "now" },
  { sql: "UPDATE users SET plan = 'pro' WHERE id = 42", ms: 11, ago: "2m" },
  { sql: "SELECT count(*) FROM events GROUP BY day", ms: 24, ago: "5m" },
  { sql: "DELETE FROM sessions WHERE expires < now()", ms: 9, ago: "12m" },
]

function QueryHistoryCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // only reveal once the card itself is genuinely on screen
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) setRevealed(true)
      },
      { threshold: [0, 0.4, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex-1 px-4 pt-5 pb-1 flex flex-col gap-1.5">
        {HISTORY.map((q, idx) => {
          const latest = idx === 0
          const lit = hover === idx || (hover === null && latest)
          return (
            <div
              key={q.sql}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
              className={`group flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer ${
                lit ? "border-[#22c55e]/30 bg-[#22c55e]/5" : "border-[#1a1a1a] bg-transparent hover:border-[#2a2a2a]"
              }`}
              style={{
                opacity: revealed ? 1 : 0,
                // slides in from the right with a gentle overshoot
                transform: revealed ? "translateX(0)" : "translateX(14px)",
                transition:
                  "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 620ms cubic-bezier(0.34,1.56,0.64,1), border-color 300ms ease, background-color 300ms ease",
                transitionDelay: `${idx * 110}ms`,
              }}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {latest && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${lit ? "bg-[#22c55e]" : "bg-[#3a3a3a]"}`} />
              </span>
              <span className={`flex-1 truncate text-[10px] font-mono transition-colors ${lit ? "text-[#cfcfcf]" : "text-[#6a6a6a]"}`}>
                {q.sql}
              </span>
              <span className="shrink-0 text-[8px] font-mono text-[#22c55e]/70 tabular-nums">{q.ms}ms</span>
              <span className="shrink-0 w-7 text-right text-[8px] font-mono text-[#3a3a3a]">{q.ago}</span>
            </div>
          )
        })}
      </div>
      <div className="px-5 pb-5 pt-1">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Query History</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          Every query saved. Search, replay, analyze.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Docker Containers — manage local DB containers; one restarts on a loop
 * (running → starting spinner → running) and rows highlight on hover.
 * ------------------------------------------------------------------------- */
const CONTAINERS = [
  { name: "postgres:16", port: "5432" },
  { name: "mysql:8.4", port: "3306" },
  { name: "redis:7", port: "6379" },
]

function DockerContainersCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [restarting, setRestarting] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) setRevealed(true)
      },
      { threshold: [0, 0.4, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let i = 0
    const cycle = () => {
      setRestarting(i % CONTAINERS.length)
      timer = setTimeout(() => {
        setRestarting(null)
        i += 1
        timer = setTimeout(cycle, 2200)
      }, 1200)
    }
    timer = setTimeout(cycle, 1600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-1.5 px-4 pt-6 pb-2">
        {CONTAINERS.map((c, idx) => {
          const starting = restarting === idx
          const lit = hover === idx
          return (
            <div
              key={c.name}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer ${
                lit ? "border-[#2a2a2a] bg-[#0d0d0d]" : "border-[#1a1a1a] bg-transparent"
              }`}
              style={{
                opacity: revealed ? 1 : 0,
                // staggered slide-in from the left with a gentle overshoot
                transform: revealed ? "translateX(0)" : "translateX(-14px)",
                transition:
                  "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 620ms cubic-bezier(0.34,1.56,0.64,1), border-color 300ms ease, background-color 300ms ease",
                transitionDelay: `${idx * 110}ms`,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                className={`shrink-0 transition-colors duration-300 ${
                  starting ? "text-[#d4a017]" : "text-[#22c55e]"
                }`}
                aria-hidden="true"
              >
                <path
                  d="M8 1.5 L14 4.5 V11 L8 14 L2 11 V4.5 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 4.5 L8 7.5 L14 4.5 M8 7.5 V14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[10px] font-mono text-[#9a9a9a]">{c.name}</span>
              <span className="ml-auto text-[8px] font-mono text-[#3a3a3a]">:{c.port}</span>
              {starting ? (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-[#d4a017] border-t-transparent animate-spin" />
                  <span className="text-[7px] font-mono text-[#d4a017] uppercase tracking-wider">boot</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <span className="text-[7px] font-mono text-[#22c55e]/70 uppercase tracking-wider">up</span>
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Docker Containers</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          Start, stop, restart. Live process management. Auto-reconnect on failure.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Schema Visualization — live ER diagram; a pulse travels the foreign-key
 * links and hovering a table highlights its relationships.
 * ------------------------------------------------------------------------- */
function SchemaDiagramCard() {
  const [hover, setHover] = useState<string | null>(null)
  const nodes = [
    { id: "users", x: 12, y: 10, w: 54, h: 30 },
    { id: "products", x: 8, y: 78, w: 60, h: 30 },
    { id: "orders", x: 98, y: 44, w: 52, h: 30 },
  ]
  const edges = [
    { a: "users", b: "orders", d: "M66 22 C 86 22, 84 56, 98 56" },
    { a: "products", b: "orders", d: "M68 90 C 88 90, 84 62, 98 62" },
  ]
  const nodeLit = (id: string) =>
    hover === null ||
    hover === id ||
    edges.some((e) => (e.a === hover && e.b === id) || (e.b === hover && e.a === id))
  const edgeLit = (e: { a: string; b: string }) => hover === null || e.a === hover || e.b === hover

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 pt-5">
        <svg viewBox="0 0 160 118" className="w-full h-[118px]" aria-hidden="true">
          {edges.map((e, i) => (
            <path
              key={i}
              d={e.d}
              fill="none"
              className={edgeLit(e) ? "dora-flow" : ""}
              stroke={edgeLit(e) ? "#22c55e" : "#262626"}
              strokeWidth="1.2"
            />
          ))}
          {nodes.map((n) => {
            const lit = nodeLit(n.id)
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx="3"
                  fill="#0d0d0d"
                  stroke={lit ? "rgba(34,197,94,0.4)" : "#1f1f1f"}
                  strokeWidth="1"
                  className="transition-colors duration-200"
                />
                <path
                  d={`M${n.x} ${n.y + 3} a3 3 0 0 1 3 -3 h${n.w - 6} a3 3 0 0 1 3 3 v7 h-${n.w} Z`}
                  fill={lit ? "rgba(34,197,94,0.16)" : "#161616"}
                  className="transition-colors duration-200"
                />
                <text
                  x={n.x + 5}
                  y={n.y + 7.6}
                  fontSize="6.5"
                  className="font-mono transition-colors duration-200"
                  fill={lit ? "#22c55e" : "#6a6a6a"}
                >
                  {n.id}
                </text>
                <line x1={n.x + 5} y1={n.y + 17} x2={n.x + n.w - 6} y2={n.y + 17} stroke="#262626" strokeWidth="1.4" />
                <line x1={n.x + 5} y1={n.y + 23} x2={n.x + n.w - 12} y2={n.y + 23} stroke="#1f1f1f" strokeWidth="1.4" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-sm text-[#e0e0e0] font-medium mb-1">Schema Visualization</h3>
        <p className="text-xs text-[#5a5a5a] leading-relaxed">
          ERD diagram. Live relationships. Query-driven discovery. Instant insight.
        </p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const motion = useScrollMotion(sectionRef)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 },
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="w-full">
      {/* Heading */}
      <div
        className={`px-6 sm:px-8 py-12 border-b border-frame transition-all duration-700 delay-150 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl text-[#5a5a5a] font-light italic mb-1 font-[family-name:var(--font-pixel)]">
          More Than a GUI.
        </h2>
        <h3 className="text-3xl text-[#f0f0f0] font-semibold font-[family-name:var(--font-pixel)]">
          The Interface Databases Deserve.
        </h3>
      </div>

      {/* Feature cards — collapsed bordered grid */}
      <div
        className={`grid grid-cols-2 md:grid-cols-3 transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <DatabaseConnectionCard motion={motion} />
        </div>
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <RegionGlobeCard motion={motion} />
        </div>
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <DockerContainersCard />
        </div>
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <SchemaDiagramCard />
        </div>
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <NativePerformanceCard motion={motion} />
        </div>
        <div className="border-r border-b border-frame overflow-hidden transition-colors hover:bg-[#0d0d0d]">
          <QueryHistoryCard />
        </div>
      </div>
    </section>
  )
}
