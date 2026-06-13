'use client'

import type { CSSProperties } from 'react'

import { useInView } from '@/shared/hooks/use-in-view'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

/**
 * Shared timing for the marketing "frame draws itself in" effect: the four
 * border lines wipe outward from their center, then the rose corner ticks pop
 * once the lines land. Used by AnimatedFrame, the two-tone section frames, and
 * the footer so every frame across the app animates identically.
 */
export const FRAME_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
export const FRAME_LINE_MS = 560
export const FRAME_TICK_MS = 320

type TFrameState = {
    visible: boolean
    reduced: boolean
    delay: number
}

/**
 * Style for a single border line. Horizontal lines (`x`) scale on X, verticals
 * (`y`) on Y — both from their center, so the line draws outward from the
 * middle. Pair with a `origin-center` element sized to the edge.
 */
export function frameLineStyle(
    axis: 'x' | 'y',
    { visible, reduced, delay }: TFrameState
): CSSProperties {
    if (reduced) {
        return { transform: 'none' }
    }
    const scale = axis === 'x' ? 'scaleX' : 'scaleY'
    return {
        transformOrigin: 'center',
        transform: visible ? `${scale}(1)` : `${scale}(0)`,
        transitionProperty: 'transform',
        transitionDuration: `${FRAME_LINE_MS}ms`,
        transitionTimingFunction: FRAME_EASE,
        transitionDelay: `${delay}ms`
    }
}

/**
 * Style for a corner tick. Opacity only — the ticks carry their straddle offset
 * in a Tailwind `-translate-*` transform, so leave `transform` untouched. Ticks
 * fade in after the lines land, lightly staggered by `index`.
 */
export function frameTickStyle(
    index: number,
    { visible, reduced, delay }: TFrameState
): CSSProperties {
    if (reduced) {
        return { opacity: 1 }
    }
    return {
        opacity: visible ? 1 : 0,
        transitionProperty: 'opacity',
        transitionDuration: `${FRAME_TICK_MS}ms`,
        transitionTimingFunction: FRAME_EASE,
        transitionDelay: `${delay + FRAME_LINE_MS + index * 60}ms`
    }
}

/**
 * Self-contained driver for frames that don't already track their own
 * visibility: attaches `ref`, watches for first view, and binds the line/tick
 * style helpers to the current state. Components that already observe their
 * own in-view state should call `frameLineStyle`/`frameTickStyle` directly
 * instead.
 */
export function useFrameDrawIn<T extends HTMLElement = HTMLDivElement>(
    delay = 0
) {
    const [ref, inView] = useInView<T>({
        once: true,
        rootMargin: '0px 0px',
        threshold: 0.01
    })
    const reduced = usePrefersReducedMotion()
    const visible = inView || reduced

    return {
        ref,
        visible,
        reduced,
        lineStyle: (axis: 'x' | 'y') =>
            frameLineStyle(axis, { visible, reduced, delay }),
        tickStyle: (index: number) =>
            frameTickStyle(index, { visible, reduced, delay })
    }
}
