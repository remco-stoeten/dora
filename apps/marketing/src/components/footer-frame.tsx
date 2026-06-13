'use client'

import type { CSSProperties } from 'react'

import { CornerTick } from '@/components/corner-tick'
import {
    FRAME_EASE,
    FRAME_LINE_MS,
    useFrameDrawIn
} from '@/shared/hooks/use-frame-draw-in'

/**
 * Footer frame draw-in: the top border wipes outward from center, then the two
 * side accents drip down from the top corners (they're top-anchored gradients,
 * so they grow from the top rather than the middle), and the two corner ticks
 * pop last.
 */
export function FooterFrame() {
    const { ref, visible, reduced, lineStyle, tickStyle } =
        useFrameDrawIn<HTMLSpanElement>()

    const sideStyle: CSSProperties = reduced
        ? { transform: 'none' }
        : {
              transformOrigin: 'top',
              transform: visible ? 'scaleY(1)' : 'scaleY(0)',
              transitionProperty: 'transform',
              transitionDuration: `${FRAME_LINE_MS}ms`,
              transitionTimingFunction: FRAME_EASE
          }

    return (
        <>
            <span
                ref={ref}
                aria-hidden
                className="pointer-events-none absolute inset-0"
            />
            <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-px w-full origin-center bg-[#3a3138]"
                style={lineStyle('x')}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-[#3a3138] to-transparent"
                style={sideStyle}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-[#3a3138] to-transparent"
                style={sideStyle}
            />
            <CornerTick
                className="-left-px -top-px -translate-x-1/2 -translate-y-1/2"
                style={tickStyle(0)}
            />
            <CornerTick
                className="-right-px -top-px translate-x-1/2 -translate-y-1/2"
                style={tickStyle(1)}
            />
        </>
    )
}
