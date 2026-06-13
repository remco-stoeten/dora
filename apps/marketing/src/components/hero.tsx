'use client'

import { Download, Terminal } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { AnimatedFrame } from '@/components/animated-frame'
import { AppDemo } from '@/components/hero-app-demo'
import { ScrollReveal } from '@/components/scroll-reveal'
import { useInView } from '@/shared/hooks/use-in-view'
import { FRAME_LINE_MS } from '@/shared/hooks/use-frame-draw-in'
import {
    findAsset,
    LATEST_RELEASE_URL,
    type TAsset,
    type TDownload,
    type TLatest
} from '@/core/github/release-downloads'

const InteractiveCube = dynamic(
    () =>
        import('@/components/interactive-cube').then((m) => m.InteractiveCube),
    { ssr: false }
)

// The hero frame draws its border lines in first; only once they land does the
// content stagger in. Keep the content start derived from the frame timing so
// the two stay in sync if either value changes.
const HERO_FRAME_DELAY = 120
const HERO_CONTENT_START = HERO_FRAME_DELAY + FRAME_LINE_MS
const HERO_STAGGER = 120

type OsPlatform = 'mac-arm' | 'mac-x64' | 'windows' | 'linux'

const PRIMARY: Record<OsPlatform, TDownload & { os: string }> = {
    'mac-arm': {
        os: 'macOS',
        label: 'Apple Silicon',
        suffix: '.dmg',
        archPattern: /(?:aarch64|arm64)/i
    },
    'mac-x64': {
        os: 'macOS',
        label: 'Intel',
        suffix: '.dmg',
        archPattern: /(?:x64|x86_64|amd64)/i
    },
    windows: { os: 'Windows', label: 'Windows', suffix: '.exe' },
    linux: { os: 'Linux', label: 'AppImage', suffix: '.AppImage' }
}

const PLATFORM_GROUPS = [
    {
        os: 'macOS',
        platforms: ['mac-arm', 'mac-x64'] as OsPlatform[],
        downloads: [
            { label: 'Apple Silicon', suffix: '.dmg', archPattern: /(?:aarch64|arm64)/i } as TDownload,
            { label: 'Intel', suffix: '.dmg', archPattern: /(?:x64|x86_64|amd64)/i } as TDownload
        ]
    },
    {
        os: 'Windows',
        platforms: ['windows'] as OsPlatform[],
        downloads: [
            { label: '.exe', suffix: '.exe' } as TDownload,
            { label: '.msi', suffix: '.msi' } as TDownload
        ]
    },
    {
        os: 'Linux',
        platforms: ['linux'] as OsPlatform[],
        downloads: [
            { label: 'AppImage', suffix: '.AppImage' } as TDownload,
            { label: '.deb', suffix: '.deb' } as TDownload,
            { label: '.rpm', suffix: '.rpm' } as TDownload,
            { label: '.tar.gz', suffix: '.tar.gz' } as TDownload
        ]
    }
]

function detectPlatform(): OsPlatform {
    const ua = navigator.userAgent
    if (/Win/i.test(ua)) return 'windows'
    if (/Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)) {
        return navigator.maxTouchPoints > 1 ? 'mac-arm' : 'mac-x64'
    }
    return 'linux'
}

function assetUrl(assets: TAsset[], download: TDownload, fallback: string): string {
    const asset = findAsset(assets, download)
    return asset?.browser_download_url ?? download.fallbackHref ?? fallback
}

function AppleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    )
}

function WindowsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 5.56 9.58 4.6l.003 6.54-6.574.038L3 5.56zm6.576 6.277.005 6.551-6.578-.95V11.8l6.573.037zm.829-7.357L21 3v8.088l-10.593.083L10.405 4.48zM21 11.905l-.003 8.08L10.406 18.52l-.012-6.625L21 11.905z" />
        </svg>
    )
}

function OsIcon({ platform, className }: { platform: OsPlatform; className?: string }) {
    if (platform === 'mac-arm' || platform === 'mac-x64') return <AppleIcon className={className} />
    if (platform === 'windows') return <WindowsIcon className={className} />
    return <Terminal className={className} />
}

function HeroDownload({ release }: { release: TLatest | null }) {
    const [platform, setPlatform] = useState<OsPlatform | null>(null)

    useEffect(() => {
        setPlatform(detectPlatform())
    }, [])

    const assets = release?.assets ?? []
    const releaseUrl = release?.htmlUrl ?? LATEST_RELEASE_URL
    const primary = platform ? PRIMARY[platform] : null
    const primaryUrl = primary ? assetUrl(assets, primary, releaseUrl) : '/downloads'

    return (
        <div className="flex flex-col gap-3">
            <a
                href={primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 border border-[rgba(173,142,182,0.35)] px-5 py-4 transition-all hover:border-[rgba(173,142,182,0.6)] hover:bg-[rgba(173,142,182,0.05)]"
            >
                <div className="shrink-0 text-[#ad8eb6]/60 transition-colors group-hover:text-[#ad8eb6]">
                    {platform ? (
                        <OsIcon platform={platform} className="h-6 w-6" />
                    ) : (
                        <Download className="h-6 w-6" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-mono text-[13px] uppercase tracking-[0.12em] text-foreground">
                        {primary ? `Download for ${primary.os}` : 'Download'}
                    </div>
                    {primary && primary.label !== primary.os && (
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/50">
                            {primary.label}
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                    {release && (
                        <span className="font-mono text-[10px] text-muted-foreground/30">
                            {release.tagName}
                        </span>
                    )}
                    <Download className="h-3.5 w-3.5 text-[#ad8eb6]/40 transition-colors group-hover:text-[#ad8eb6]/80" />
                </div>
            </a>

            <div className="border border-[#2b252c] bg-background/20 px-4 py-3 space-y-2">
                {PLATFORM_GROUPS.map((group) => {
                    const isActive = platform ? group.platforms.includes(platform) : false
                    return (
                        <div key={group.os} className="flex items-start gap-3">
                            <span
                                className={`w-14 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                                    isActive ? 'text-[#ad8eb6]/70' : 'text-muted-foreground/35'
                                }`}
                            >
                                {group.os}
                            </span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {group.downloads.map((d) => {
                                    const isPrimary =
                                        primary &&
                                        d.suffix === primary.suffix &&
                                        (d.archPattern?.source ?? '') === (primary.archPattern?.source ?? '')
                                    return (
                                        <a
                                            key={d.label}
                                            href={assetUrl(assets, d, releaseUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`font-mono text-[11px] transition-colors hover:text-[#ad8eb6] ${
                                                isPrimary
                                                    ? 'text-[#ad8eb6]/60'
                                                    : 'text-muted-foreground/50'
                                            }`}
                                        >
                                            {d.label}
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-end">
                <a
                    href="/downloads"
                    className="font-mono text-[11px] text-muted-foreground/40 transition-colors hover:text-[#ad8eb6]"
                >
                    All downloads →
                </a>
            </div>
        </div>
    )
}

function HeroText({ release }: { release: TLatest | null }) {
    return (
        <div className="relative z-[3] min-w-0 max-w-[560px]">
            <h1 className="max-w-[560px] font-pixel text-[clamp(2.2rem,4.6vw,3.6rem)] font-[500] leading-[1.05] tracking-[0] text-foreground">
                The database
                <br />
                <span className="text-[#f5c0c0] [text-shadow:0_0_18px_rgba(245,192,192,0.45)]">
                    explorah.
                </span>
            </h1>
            <p className="mt-6 max-w-[420px] [font-family:system-ui,sans-serif] text-[14px] leading-relaxed text-muted-foreground">
                Dora is a native, keyboard-first SQL workbench for developers
                who think in tables. Browse millions of rows, edit live, ship
                faster.
            </p>
            <div className="mt-10">
                <HeroDownload release={release} />
            </div>
        </div>
    )
}

function HeroInteractive() {
    const [stageRef, stageInView] = useInView<HTMLDivElement>({
        threshold: 0.01
    })
    const [mountCube, setMountCube] = useState(false)

    useEffect(() => {
        if (!stageInView || mountCube) return

        const isMobile = window.matchMedia('(max-width: 767px)').matches
        const delay = isMobile ? 5200 : 900
        let idleId = 0
        const timer = window.setTimeout(() => {
            if ('requestIdleCallback' in window) {
                idleId = window.requestIdleCallback(() => setMountCube(true), {
                    timeout: 1600
                })
                return
            }
            setMountCube(true)
        }, delay)

        return () => {
            window.clearTimeout(timer)
            if (idleId) window.cancelIdleCallback(idleId)
        }
    }, [mountCube, stageInView])

    function loadCube() {
        setMountCube(true)
    }

    return (
        <div
            ref={stageRef}
            className="hero-cube-stage relative z-[1] flex min-h-[430px] items-center justify-center overflow-visible border-0 outline-none sm:min-h-[520px] lg:min-h-[580px] [&_*]:outline-none"
            onFocus={loadCube}
            onPointerEnter={loadCube}
            onTouchStart={loadCube}
        >
            <div className="hero-cube-stage relative h-[430px] w-full overflow-visible border-0 outline-none sm:h-[520px] lg:h-[580px]">
                {stageInView && mountCube ? (
                    <InteractiveCube className="absolute left-1/2 top-1/2 size-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 sm:size-[720px] lg:size-[clamp(760px,48vw,920px)]" />
                ) : null}
            </div>
        </div>
    )
}

export function Hero({
    className = '',
    release
}: {
    className?: string
    release: TLatest | null
}) {
    return (
        <section
            id="hero"
            className={`hero-frame relative z-10 overflow-visible ${className}`}
        >
            <AnimatedFrame
                delay={HERO_FRAME_DELAY}
                className="hero-frame overflow-visible px-6 sm:px-8"
            >
                <div className="hero-frame grid min-w-0 grid-cols-1 items-center gap-10 overflow-visible pt-[64px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <ScrollReveal rootMargin="0px 0px" delay={HERO_CONTENT_START}>
                        <HeroText release={release} />
                    </ScrollReveal>
                    <ScrollReveal
                        rootMargin="0px 0px"
                        delay={HERO_CONTENT_START + HERO_STAGGER}
                    >
                        <HeroInteractive />
                    </ScrollReveal>
                </div>
                <ScrollReveal
                    rootMargin="0px 0px"
                    delay={HERO_CONTENT_START + HERO_STAGGER * 2}
                >
                    <AppDemo />
                </ScrollReveal>
            </AnimatedFrame>
        </section>
    )
}
