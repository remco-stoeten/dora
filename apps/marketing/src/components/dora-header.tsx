'use client'

import {
    ArrowRight,
    BookOpen,
    ChevronDown,
    ChevronRight,
    Code,
    Map,
    Menu,
    Sparkles,
    X
} from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useShortcut } from '@remcostoeten/use-shortcut/react'
import type { ComponentType } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Marketing top bar — recreated from the hex.tech-style Figma design.
 * A scrolling announcement marquee sits above a centered primary nav that
 * collapses into a full-screen menu on small screens.
 */

const APP_PATH = '/app'

// rose-fog #e3b2b3 = reality / punchline, white/70 = the skeptic's guess.
const MARQUEE_ITEMS: { guess: string; reality: string }[] = [
    {
        guess: 'Let me guess, AI bloat',
        reality: 'Disabled by default, opt-in yourself'
    },
    {
        guess: 'Probably another ancient DB manager',
        reality: "Huh, a DB manager that's actually aesthetic???"
    },
    {
        guess: 'Probably slow Electron',
        reality: 'What! roughly 10mb, <1s startup'
    },
    {
        guess: 'Probably way overpriced',
        reality: 'Free for life, and self-hostable'
    }
]

type TNavItem = {
    label: string
    href: string
    chevron?: boolean
    icon: ComponentType<{ className?: string }>
}

const NAV_LEFT: TNavItem[] = [
    { label: 'Features', href: '/#features', chevron: true, icon: Sparkles },
    { label: 'Roadmap', href: '/changelog', chevron: true, icon: Map }
]

const NAV_RIGHT: TNavItem[] = [
    { label: 'Resources', href: '/docs', chevron: true, icon: BookOpen },
    {
        label: 'Open source',
        href: 'https://github.com/remcostoeten',
        icon: Code
    }
]

const ALL_NAV_ITEMS = [...NAV_LEFT, ...NAV_RIGHT]

function MarqueeItem({ guess, reality }: { guess: string; reality: string }) {
    return (
        <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap border-l border-[#2b252c] px-5 text-[12px] leading-none">
            <span className="text-white/70">{guess}</span>
            <ArrowRight
                aria-hidden
                className="h-3 w-3 shrink-0 text-[#e3b2b3]"
            />
            <span className="text-[#e3b2b3]">{reality}</span>
        </div>
    )
}

function Marquee() {
    const loop = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
    const trackRef = useRef<HTMLDivElement>(null)
    const animRef = useRef<Animation | null>(null)
    const rateRef = useRef(1)
    const rafRef = useRef(0)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        const track = trackRef.current
        if (!track) return

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return

        const anim = track.animate(
            [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }],
            { duration: 38000, iterations: Infinity }
        )
        animRef.current = anim
        rateRef.current = 1
        return () => anim.cancel()
    }, [])

    useEffect(() => {
        const anim = animRef.current
        if (!anim) return

        const target = hovered ? 0 : 1
        const startRate = rateRef.current
        const startTime = performance.now()
        const duration = 1200

        function cubicBezier(t: number): number {
            return 1 - Math.pow(1 - t, 3)
        }

        function tick(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = cubicBezier(progress)
            const rate = startRate + (target - startRate) * eased
            rateRef.current = rate
            animRef.current!.playbackRate = rate
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick)
            }
        }

        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(tick)

        return () => cancelAnimationFrame(rafRef.current)
    }, [hovered])

    return (
        <div
            className="dora-marquee relative flex h-[30px] items-center overflow-hidden border-b border-[#2b252c] bg-background"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#252128,#201d25_50%,#252128)] opacity-20"
            />
            <div
                ref={trackRef}
                className="relative flex w-max shrink-0 items-center"
            >
                {loop.map((item, i) => (
                    <MarqueeItem
                        key={i}
                        guess={item.guess}
                        reality={item.reality}
                    />
                ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgba(245,192,192,0.17)]" />
        </div>
    )
}

function NavLink({
    href,
    className,
    onClick,
    children
}: {
    href: string
    className?: string
    onClick?: () => void
    children: React.ReactNode
}) {
    if (href.startsWith('http')) {
        return (
            <a
                className={className}
                href={href}
                onClick={onClick}
                rel="noreferrer"
                target="_blank"
            >
                {children}
            </a>
        )
    }
    return (
        <Link className={className} href={href as Route} onClick={onClick}>
            {children}
        </Link>
    )
}

function NavItem({ label, href, chevron }: TNavItem) {
    return (
        <NavLink
            className="group inline-flex items-center gap-1 rounded-[1px] px-[13px] py-[9px] text-[14px] leading-none text-white/90 transition-colors hover:text-[#f5c0c0]"
            href={href}
        >
            {label}
            {chevron ? (
                <ChevronDown
                    aria-hidden
                    className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-[#f5c0c0]"
                />
            ) : null}
        </NavLink>
    )
}

function CornerTick({ className }: { className: string }) {
    return (
        <span
            aria-hidden
            className={`pointer-events-none absolute size-[11px] ${className}`}
        >
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#e3b2b3]/50" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#e3b2b3]/50" />
        </span>
    )
}

function Logo() {
    return (
        <Link
            aria-label="Dora home"
            className="font-pixel select-none px-2 text-[20px] tracking-[0.08em] text-[#f5c0c0] [text-shadow:0_0_14px_rgba(245,192,192,0.45)]"
            href="/"
        >
            DORA
        </Link>
    )
}

function ViewAppButton({ className = '' }: { className?: string }) {
    // Open rings centered on each corner, faint by default and brighter on hover.
    const ring =
        'pointer-events-none absolute size-[17px] rounded-full border border-[rgba(245,192,192,0.3)] transition-colors group-hover:border-[rgba(245,192,192,0.6)]'
    return (
        <Link
            className={`group relative inline-flex h-[38px] items-center justify-center overflow-visible border border-[#f5c0c0] bg-background px-4 text-[14px] leading-none text-[#f5c0c0] transition-colors hover:bg-[rgba(245,192,192,0.06)] ${className}`}
            href={APP_PATH}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-px opacity-20 bg-[linear-gradient(35deg,rgba(245,192,192,0.85),rgba(173,142,182,0.5))]"
            />
            <span className="relative z-[1]">View web app</span>
            <span
                aria-hidden
                className={`${ring} -left-[8.5px] -top-[8.5px]`}
            />
            <span
                aria-hidden
                className={`${ring} -right-[8.5px] -top-[8.5px]`}
            />
            <span
                aria-hidden
                className={`${ring} -bottom-[8.5px] -left-[8.5px]`}
            />
            <span
                aria-hidden
                className={`${ring} -bottom-[8.5px] -right-[8.5px]`}
            />
        </Link>
    )
}

function MobileMenuRow({
    item,
    onNavigate
}: {
    item: TNavItem
    onNavigate: () => void
}) {
    const Icon = item.icon
    return (
        <NavLink
            className="group flex items-center gap-4 border-b border-[#2b252c] py-5 text-left"
            href={item.href}
            onClick={onNavigate}
        >
            <Icon className="h-5 w-5 shrink-0 text-[#e3b2b3]" />
            <span className="flex-1 text-[17px] text-white/90 transition-colors group-hover:text-[#f5c0c0]">
                {item.label}
            </span>
            <ChevronRight
                aria-hidden
                className="h-5 w-5 shrink-0 text-white/40 transition-colors group-hover:text-[#f5c0c0]"
            />
        </NavLink>
    )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in fade-in-0 duration-200 md:hidden">
            {/* Top frame: logo + circular close button, with rose corner brackets */}
            <div className="relative m-3 flex items-center justify-between border border-[#3a3138] px-4 py-5">
                <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                <CornerTick className="-bottom-px -left-px -translate-x-1/2 translate-y-1/2" />
                <CornerTick className="-bottom-px -right-px translate-x-1/2 translate-y-1/2" />
                <Logo />
                <button
                    aria-label="Close menu"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#3a3138] text-white/80 transition-colors hover:border-[#f5c0c0] hover:text-[#f5c0c0]"
                    onClick={onClose}
                    type="button"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 pb-8">
                {ALL_NAV_ITEMS.map((item) => (
                    <MobileMenuRow
                        item={item}
                        key={item.label}
                        onNavigate={onClose}
                    />
                ))}
                <ViewAppButton className="mt-8 h-[48px] w-full text-[16px]" />
            </nav>
        </div>
    )
}

export function DoraHeader() {
    const [menuOpen, setMenuOpen] = useState(false)
    const $ = useShortcut()

    useEffect(() => {
        const shortcut = $.bind('escape').on(() => setMenuOpen(false), {
            description: 'Close mobile menu',
            disabled: !menuOpen
        })
        return () => shortcut.unbind()
    }, [$, menuOpen])

    useEffect(() => {
        if (!menuOpen) {
            return
        }
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previous
        }
    }, [menuOpen])

    return (
        <header className="sticky top-0 z-50 w-full">
            <div
                aria-hidden
                className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(227,178,179,0.4),transparent)]"
            />
            <Marquee />
            <nav className="relative bg-background">
                <div className="marketing-container relative flex h-[62px] items-center border-x border-t border-[#3a3138] px-4">
                    <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
                    <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
                    <CornerTick className="-bottom-px -left-px -translate-x-1/2 translate-y-1/2" />
                    <CornerTick className="-bottom-px -right-px translate-x-1/2 translate-y-1/2" />

                    {/* Mobile: logo + hamburger */}
                    <div className="flex w-full items-center justify-between md:hidden">
                        <Logo />
                        <button
                            aria-expanded={menuOpen}
                            aria-label="Open menu"
                            className="inline-flex size-9 items-center justify-center text-white/90 transition-colors hover:text-[#f5c0c0]"
                            onClick={() => setMenuOpen(true)}
                            type="button"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Desktop: centered cluster */}
                    <div className="hidden w-full items-center justify-center gap-6 md:flex">
                        {NAV_LEFT.map((item) => (
                            <NavItem key={item.label} {...item} />
                        ))}
                        <Logo />
                        {NAV_RIGHT.map((item) => (
                            <NavItem key={item.label} {...item} />
                        ))}
                        <ViewAppButton className="ml-1" />
                    </div>
                </div>
            </nav>

            {menuOpen ? (
                <MobileMenu onClose={() => setMenuOpen(false)} />
            ) : null}
        </header>
    )
}
