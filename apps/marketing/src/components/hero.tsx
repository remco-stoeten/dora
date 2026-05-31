'use client'

import { Download } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Zap } from 'lucide-react'
import Link from 'next/link'

import dynamic from 'next/dynamic'
import { useInView } from '@/shared/hooks/use-in-view'

const InteractiveCube = dynamic(
    () =>
        import('@/components/interactive-cube').then((m) => m.InteractiveCube),
    { ssr: false }
)

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

const DEMO_PATH = '/app'

function HeroText() {
    const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 })
    const enter = (delay: number, y = 14) => ({
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
        transition: `opacity 520ms ${EASE_OUT} ${delay}ms, transform 560ms ${EASE_OUT} ${delay}ms`,
        willChange: 'transform, opacity'
    })

    return (
        <div ref={ref} className="relative z-[3] min-w-0 max-w-[560px]">
            <div
                className="font-pixel inline-flex items-center gap-2 px-2.5 py-1 border text-[11px] uppercase tracking-[0.16em] mb-6"
                style={{
                    ...enter(0, 8),
                    borderColor: 'hsl(var(--neon-cyan) / 0.4)',
                    color: 'hsl(var(--neon-cyan))',
                    background: 'hsl(var(--neon-cyan) / 0.06)',
                    boxShadow: '0 0 18px hsl(var(--neon-cyan) / 0.15)'
                }}
            >
                <Zap className="h-3 w-3" />
                v0.8 · overclocked beta
            </div>
            <h1
                className="font-pixel text-[clamp(2.2rem,4.6vw,3.6rem)] font-[400] leading-[1.05] tracking-[-0.02em] text-foreground max-w-[560px]"
                style={enter(90)}
            >
                The database
                <br />
                <span
                    style={{ animation: 'neonFlicker 7s ease-in-out infinite' }}
                    className="neon-text-cyan"
                >
                    explorah.
                </span>
            </h1>
            <p
                className="mt-6 text-[15px] leading-relaxed text-muted-foreground max-w-[460px] font-mono"
                style={enter(200)}
            >
                Dora is a native, keyboard-first SQL workbench for developers
                who think in tables. Browse millions of rows, edit live, ship
                faster.
            </p>
            <div
                className="mt-10 flex items-center gap-4 flex-wrap"
                style={enter(310)}
            >
                <Link href={DEMO_PATH}>
                    <button
                        className="group relative inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium transition-all duration-200 hover:gap-3 active:scale-[0.97]"
                        style={{
                            background: 'hsl(var(--neon-cyan))',
                            color: 'hsl(240 12% 6%)',
                            boxShadow:
                                '0 0 0 1px hsl(var(--neon-cyan) / 0.4), 0 0 24px hsl(var(--neon-cyan) / 0.5), 0 0 56px hsl(var(--neon-cyan) / 0.25)'
                        }}
                    >
                        Boot the demo
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </Link>
                <a
                    href="/downloads"
                    className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-mono uppercase tracking-[0.14em] border transition-colors hover:bg-foreground/[0.04]"
                    style={{
                        borderColor: 'hsl(var(--neon-magenta) / 0.4)',
                        color: 'hsl(var(--neon-magenta))'
                    }}
                >
                    <Download className="h-3.5 w-3.5" />
                    Download .dmg
                </a>
            </div>

            <div
                className="mt-8 flex items-center gap-2 flex-wrap font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                style={enter(420)}
            >
                <span>$ supports</span>
                {['postgres', 'mysql', 'sqlite', 'libsql'].map((db) => (
                    <span
                        key={db}
                        className="px-2 py-1 border border-border text-foreground/80 hover:border-foreground/40 transition-colors"
                    >
                        {db}
                    </span>
                ))}
            </div>
        </div>
    )
}

function HeroInteractive() {
    return (
        <div className="hero-cube-stage relative z-[1] flex flex-col gap-6 overflow-visible border-0 outline-none [&_*]:outline-none">
            <div className="hero-cube-stage relative w-full aspect-square max-h-[520px] mx-auto overflow-visible border-0 outline-none">
                <InteractiveCube className="absolute -inset-10 sm:-inset-12 lg:-inset-16" />
            </div>
        </div>
    )
}

export function Hero({ className = '' }: { className?: string }) {
    return (
        <section
            id="hero"
            className={`hero-frame relative z-10 overflow-visible pt-16 pb-0 ${className}`}
        >
            <div className="hero-frame relative overflow-visible">
                <div className="hero-frame grid min-w-0 grid-cols-1 items-center gap-10 overflow-visible pt-[64px] pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <HeroText />
                    <HeroInteractive />
                </div>
            </div>
        </section>
    )
}
