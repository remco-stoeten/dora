'use client'

import type { CSSProperties, ReactNode } from 'react'

import { useInView } from '@/shared/hooks/use-in-view'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

export function ScrollReveal({
    children,
    className = '',
    delay = 0,
    rootMargin = '-80px 0px'
}: {
    children: ReactNode
    className?: string
    delay?: number
    rootMargin?: string
}) {
    const [ref, inView] = useInView<HTMLDivElement>({
        once: true,
        rootMargin,
        threshold: 0.01
    })
    const reduced = usePrefersReducedMotion()
    const visible = inView || reduced
    const style: CSSProperties = {
        opacity: visible ? 1 : 0,
        transform: reduced
            ? 'none'
            : visible
              ? 'translate3d(0, 0, 0)'
              : 'translate3d(0, 10px, 0)',
        transitionDelay: reduced ? '0ms' : `${delay}ms`,
        transitionDuration: reduced ? '180ms' : '420ms',
        transitionProperty: 'opacity, transform',
        transitionTimingFunction: EASE_OUT
    }

    return (
        <div ref={ref} className={className} style={style}>
            {children}
        </div>
    )
}
