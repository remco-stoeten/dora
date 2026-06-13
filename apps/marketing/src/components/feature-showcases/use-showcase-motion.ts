'use client'

import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

export function useCycleIndex(
    length: number,
    intervalMs: number,
    active = true
) {
    const reducedMotion = usePrefersReducedMotion()
    const [index, setIndex] = useState(0)

    useEffect(
        function cycle() {
            if (!active || reducedMotion || length <= 1) return
            const id = window.setInterval(function () {
                setIndex(function (current) {
                    return (current + 1) % length
                })
            }, intervalMs)
            return function cleanup() {
                window.clearInterval(id)
            }
        },
        [active, intervalMs, length, reducedMotion]
    )

    return index
}

export function useTypewriter(
    text: string,
    speedMs: number,
    active = true,
    resetKey = 0
) {
    const reducedMotion = usePrefersReducedMotion()
    const [count, setCount] = useState(reducedMotion ? text.length : 0)

    useEffect(
        function type() {
            if (reducedMotion) {
                setCount(text.length)
                return
            }
            setCount(0)
            if (!active) return
            const id = window.setInterval(function () {
                setCount(function (current) {
                    if (current >= text.length) {
                        window.clearInterval(id)
                        return current
                    }
                    return current + 1
                })
            }, speedMs)
            return function cleanup() {
                window.clearInterval(id)
            }
        },
        [active, reducedMotion, resetKey, speedMs, text]
    )

    return text.slice(0, count)
}
