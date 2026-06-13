'use client'

import type { ReactNode } from 'react'

import { CornerTick } from '@/components/corner-tick'
import { useFrameDrawIn } from '@/shared/hooks/use-frame-draw-in'

const LINE_BASE = 'pointer-events-none absolute z-[2] bg-[#3a3138]'

/**
 * Frames its children with the standard rose corner ticks, but draws the four
 * border lines in on first view (every line wipes outward from its center) and
 * then pops the corner ticks once the lines land. Replaces a plain
 * `border-x border-y` box; keep the same padding on `className`.
 */
export function AnimatedFrame({
    children,
    className = '',
    delay = 0
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    const { ref, lineStyle, tickStyle } = useFrameDrawIn<HTMLDivElement>(delay)

    return (
        <div ref={ref} className={`relative ${className}`}>
            <span
                className={`${LINE_BASE} inset-x-0 top-0 h-px origin-center`}
                style={lineStyle('x')}
            />
            <span
                className={`${LINE_BASE} inset-x-0 bottom-0 h-px origin-center`}
                style={lineStyle('x')}
            />
            <span
                className={`${LINE_BASE} inset-y-0 left-0 w-px origin-center`}
                style={lineStyle('y')}
            />
            <span
                className={`${LINE_BASE} inset-y-0 right-0 w-px origin-center`}
                style={lineStyle('y')}
            />

            <CornerTick
                className="-left-px -top-px -translate-x-1/2 -translate-y-1/2"
                style={tickStyle(0)}
            />
            <CornerTick
                className="-right-px -top-px translate-x-1/2 -translate-y-1/2"
                style={tickStyle(1)}
            />
            <CornerTick
                className="-bottom-px -left-px -translate-x-1/2 translate-y-1/2"
                style={tickStyle(2)}
            />
            <CornerTick
                className="-bottom-px -right-px translate-x-1/2 translate-y-1/2"
                style={tickStyle(3)}
            />

            {children}
        </div>
    )
}
