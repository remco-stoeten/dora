'use client'

import { Download } from 'lucide-react'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { CornerTick } from '@/components/corner-tick'
import { useInView } from '@/shared/hooks/use-in-view'

const InteractiveCube = dynamic(
    () =>
        import('@/components/interactive-cube').then((m) => m.InteractiveCube),
    { ssr: false }
)

function HeroText() {
    return (
        <div className="relative z-[3] min-w-0 max-w-[560px]">
            <h1 className="max-w-[560px] [font-family:system-ui,sans-serif] text-[clamp(2.2rem,4.6vw,3.6rem)] font-[650] leading-[1.05] tracking-[0] text-foreground sm:font-pixel sm:font-[400]">
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
            <div className="mt-10 flex items-center gap-4 flex-wrap">
                <a
                    href="/downloads"
                    className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-mono uppercase tracking-[0.14em] border transition-colors hover:bg-[rgba(173,142,182,0.08)]"
                    style={{
                        borderColor: 'rgba(173,142,182,0.5)',
                        color: '#ad8eb6'
                    }}
                >
                    <Download className="h-3.5 w-3.5" />
                    Download .dmg
                </a>
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

export function Hero({ className = '' }: { className?: string }) {
    return (
        <section
            id="hero"
            className={`hero-frame relative z-10 overflow-visible ${className}`}
        >
            <div className="hero-frame relative overflow-visible border-x border-t border-[#3a3138] px-6 sm:px-8">
                <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-bottom-px -left-px -translate-x-1/2 translate-y-1/2" />
                <CornerTick className="-bottom-px -right-px translate-x-1/2 translate-y-1/2" />
                <div className="hero-frame grid min-w-0 grid-cols-1 items-center gap-10 overflow-visible pt-[64px] pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <HeroText />
                    <HeroInteractive />
                </div>
            </div>
        </section>
    )
}
