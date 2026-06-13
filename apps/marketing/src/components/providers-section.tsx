'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CornerTick } from '@/components/corner-tick'
import { SectionFrame } from '@/components/section-frame'
import { HubSphere, ProviderRowGraph } from '@/components/provider-row-graph'
import { ProviderLogoMark, type ProviderLogoId } from '@/components/provider-logo'
import { usePageVisible } from '@/shared/hooks/use-page-visible'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

/* -------------------------------------------------------------------------- */

type TProvider = {
    id: ProviderLogoId
    name: string
    connectionString: string
}

const PROVIDERS: TProvider[] = [
    { id: 'postgres', name: 'PostgreSQL', connectionString: 'postgresql://user:pass@db.neon.tech/mydb' },
    { id: 'sqlite', name: 'SQLite', connectionString: 'file:///path/to/database.db' },
    { id: 'duckdb', name: 'DuckDB', connectionString: 'duckdb:///analytics.duckdb · or any .csv/.parquet' },
    { id: 'libsql', name: 'libSQL', connectionString: 'libsql://database.turso.io?authToken=…' },
    { id: 'mysql', name: 'MySQL', connectionString: 'mysql://user:pass@localhost:3306/mydb' },
    { id: 'mariadb', name: 'MariaDB', connectionString: 'mysql://user:pass@mariadb.internal/mydb' },
    { id: 'cockroach', name: 'CockroachDB', connectionString: 'postgresql://user:pass@cockroach.internal:26257/defaultdb' },
]

/**
 * Hosted services Dora reaches over the standard Postgres / libSQL paths.
 * These are not separate engines — they're connection-string compatibility,
 * surfaced here to match how people search ("Supabase GUI", "Neon client").
 */
const HOSTED_PROVIDERS = [
    { name: 'Supabase', src: '/providers/supabase.svg' },
    { name: 'Neon', src: '/providers/neon.svg' },
    { name: 'Turso', src: '/providers/libsql.svg' },
] as const

const HOSTED_EXTRA = 'Railway, Render, Vercel Postgres, Fly.io, Aiven'

const ACCENT = '#f5c0c0'
const REVEAL_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const STAGGER_MS = 52

const PANEL_GRID =
    'grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[5.5rem_repeat(7,minmax(0,1fr))]'

function ConnectionStringMarquee({ activeId, reducedMotion }: { activeId: string; reducedMotion: boolean }) {
    const active = PROVIDERS.find((p) => p.id === activeId) ?? PROVIDERS[0]
    const [displayed, setDisplayed] = useState(PROVIDERS[0].connectionString)
    const [typedLen, setTypedLen] = useState(PROVIDERS[0].connectionString.length)
    const prevIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (active.id === prevIdRef.current) return
        prevIdRef.current = active.id
        const str = active.connectionString
        setDisplayed(str)
        if (reducedMotion) { setTypedLen(str.length); return }
        setTypedLen(0)
        let i = 0
        const id = setInterval(() => {
            i += 2
            setTypedLen(Math.min(i, str.length))
            if (i >= str.length) clearInterval(id)
        }, 18)
        return () => clearInterval(id)
    }, [active, reducedMotion])

    const scheme = displayed.split('://')[0]
    const rest = displayed.slice(scheme.length + 3)
    const schemeShown = scheme.slice(0, Math.min(typedLen, scheme.length))
    const sepShown = typedLen > scheme.length ? '://'.slice(0, typedLen - scheme.length) : ''
    const restShown = typedLen > scheme.length + 3 ? rest.slice(0, typedLen - scheme.length - 3) : ''
    const isTyping = typedLen < displayed.length

    return (
        <div className="flex h-9 items-center gap-2 overflow-hidden border-r border-t border-[#2b252c] bg-[#100d12]/80 px-3 font-mono text-[11px] transition-colors duration-300 [font-family:var(--font-geist-mono),ui-monospace,monospace]">
            <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: ACCENT }}
            />
            <span className="truncate">
                <span style={{ color: ACCENT }}>{schemeShown}</span>
                <span className="text-[#6a6a6a]">{sepShown}</span>
                <span className="text-[#9a9a9a]">{restShown}</span>
                {isTyping && !reducedMotion
                    ? <span className="ml-px inline-block h-3 w-px animate-pulse align-middle" style={{ backgroundColor: ACCENT }} />
                    : null}
            </span>
        </div>
    )
}

export function ProvidersSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const hubRef = useRef<HTMLDivElement>(null)
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([])

    const [hoveredId, setHoveredId] = useState<ProviderLogoId | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const scrollProgressRef = useRef(0)
    const [isInView, setIsInView] = useState(false)
    const pageVisible = usePageVisible()
    const reducedMotion = usePrefersReducedMotion()
    const running = isInView && pageVisible && !reducedMotion

    useEffect(() => {
        if (reducedMotion) {
            scrollProgressRef.current = 1
            setScrollProgress(1)
            return
        }
        if (!isInView) return

        const DURATION = 5500
        const startTime = performance.now()
        let raf = 0

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startTime) / DURATION)
            scrollProgressRef.current = progress
            setScrollProgress((prev) => (Math.abs(prev - progress) > 0.001 ? progress : prev))
            if (progress < 1) raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isInView, reducedMotion])

    const scrollIndex = Math.min(
        PROVIDERS.length - 1,
        Math.round(scrollProgress * (PROVIDERS.length - 1))
    )
    const activeId = hoveredId ?? PROVIDERS[scrollIndex].id
    const activeIndex = Math.max(0, PROVIDERS.findIndex((p) => p.id === activeId))
    const fillOverride = hoveredId
        ? activeIndex / (PROVIDERS.length - 1)
        : null

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { rootMargin: '120px 0px', threshold: 0.15 },
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    function focusProvider(id: ProviderLogoId) {
        setHoveredId(id)
    }

    const revealed = isInView || reducedMotion

    function revealStyle(delay: number): CSSProperties {
        return {
            opacity: revealed ? 1 : 0,
            transform: reducedMotion
                ? 'none'
                : revealed
                  ? 'translate3d(0, 0, 0)'
                  : 'translate3d(0, 12px, 0)',
            transitionDelay: reducedMotion ? '0ms' : `${delay}ms`,
            transitionDuration: reducedMotion ? '180ms' : '420ms',
            transitionProperty: 'opacity, transform',
            transitionTimingFunction: REVEAL_EASE,
        }
    }

    const rowDelay = 90
    const hubDelay = rowDelay + 36
    const providerStart = hubDelay + STAGGER_MS
    const marqueeDelay = providerStart + PROVIDERS.length * STAGGER_MS + 36
    const footerDelay = marqueeDelay + 72

    return (
        <section ref={sectionRef} className="relative w-full">
            <SectionFrame />

            <div className="border-b border-r border-[#2b252c] px-6 py-12 sm:px-8">
                <h2
                    className="mb-1 font-[family-name:var(--font-pixel)] text-2xl font-light italic text-[#7a7a7a]"
                    style={revealStyle(0)}
                >
                    Every database you reach for.
                </h2>
                <h3
                    className="font-[family-name:var(--font-pixel)] text-3xl font-semibold text-[#f0f0f0]"
                    style={revealStyle(STAGGER_MS)}
                >
                    One workbench for all of them.
                </h3>
            </div>

            <div className="overflow-hidden border-b border-r border-[#2b252c]">
                <div ref={rowRef} className="relative overflow-hidden">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.22]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgba(227,178,179,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,178,179,0.08) 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />

                    <ProviderRowGraph
                        containerRef={rowRef}
                        hubRef={hubRef}
                        nodeRefs={nodeRefs}
                        providers={PROVIDERS}
                        fillProgressRef={scrollProgressRef}
                        fillOverride={fillOverride}
                        running={running}
                        revealed={revealed}
                        hubDelay={hubDelay}
                        providerStart={providerStart}
                        staggerMs={STAGGER_MS}
                        reducedMotion={reducedMotion}
                    />

                    <div className={PANEL_GRID}>
                        <div
                            className="relative flex flex-col items-center justify-center gap-2 border-r border-[#2b252c] px-2 py-6 sm:gap-3 sm:px-3 sm:py-10"
                            style={revealStyle(hubDelay)}
                        >
                            <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
                            <CornerTick className="-left-px -bottom-px -translate-x-1/2 translate-y-1/2" />
                            <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                            <CornerTick className="-right-px -bottom-px translate-x-1/2 translate-y-1/2" />
                            <HubSphere running={running} />
                            <div ref={hubRef} aria-hidden className="h-px w-px shrink-0" />
                            <span className="font-[family-name:var(--font-pixel)] text-[10px] font-medium uppercase tracking-[0.08em] text-[#9a8aa2]">
                                Dora
                            </span>
                        </div>

                        {PROVIDERS.map((provider, i) => {
                            const isActive = activeId === provider.id

                            return (
                                <button
                                    key={provider.id}
                                    type="button"
                                    className={[
                                        'relative flex flex-col items-center justify-center gap-2 border-r border-[#2b252c] px-1 py-6 transition-colors duration-300 last:border-r-0 sm:gap-3 sm:px-2 sm:py-10',
                                        isActive ? 'bg-[rgba(245,192,192,0.04)]' : 'hover:bg-[rgba(245,192,192,0.02)]',
                                    ].join(' ')}
                                    style={revealStyle(providerStart + i * STAGGER_MS)}
                                    onMouseEnter={() => focusProvider(provider.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onFocus={() => focusProvider(provider.id)}
                                    onBlur={() => setHoveredId(null)}
                                >
                                    <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                                    <CornerTick className="-right-px -bottom-px translate-x-1/2 translate-y-1/2" />
                                    <ProviderLogoMark
                                        id={provider.id}
                                        active={isActive}
                                    />
                                    <div ref={(el) => { nodeRefs.current[i] = el }} aria-hidden className="h-px w-px shrink-0" />
                                    <span
                                        className="max-w-[4.75rem] truncate text-center font-[family-name:var(--font-pixel)] text-[10px] font-medium leading-tight transition-colors duration-300 sm:max-w-none sm:text-[11px]"
                                        style={{ color: isActive ? '#f0e8f0' : '#9a8aa2' }}
                                    >
                                        {provider.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div style={revealStyle(marqueeDelay)}>
                <ConnectionStringMarquee activeId={activeId} reducedMotion={reducedMotion} />
            </div>

            <div className="border-t border-r border-[#2b252c] px-6 py-8 sm:px-8">
                <p
                    className="mb-5 font-[family-name:var(--font-pixel)] text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a6a72]"
                    style={revealStyle(footerDelay)}
                >
                    Works with any hosted Postgres &amp; libSQL
                </p>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                    {HOSTED_PROVIDERS.map((provider, i) => (
                        <span
                            key={provider.name}
                            className="flex items-center gap-2"
                            style={revealStyle(footerDelay + STAGGER_MS + i * STAGGER_MS)}
                        >
                            <img
                                src={provider.src}
                                alt={`${provider.name} logo`}
                                width={20}
                                height={20}
                                className="size-5 opacity-75"
                                style={{ filter: 'grayscale(1) brightness(1.7)' }}
                                draggable={false}
                            />
                            <span className="text-[13px] font-medium text-[#c4bcc4]">
                                {provider.name}
                            </span>
                        </span>
                    ))}
                    <span
                        className="text-[13px] leading-relaxed text-[#6a6a6a]"
                        style={revealStyle(
                            footerDelay + STAGGER_MS + HOSTED_PROVIDERS.length * STAGGER_MS
                        )}
                    >
                        + {HOSTED_EXTRA}, and any Postgres connection string
                    </span>
                </div>
            </div>
        </section>
    )
}
