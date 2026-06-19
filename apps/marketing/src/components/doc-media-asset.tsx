'use client'

import { useEffect, useState } from 'react'

export type TDocMediaAssetProps = {
    src: string
    /** Defaults to 'video'. Pass 'image' for static screenshots. */
    type?: 'video' | 'image'
    /** Poster shown while the video loads and when prefers-reduced-motion is set. */
    poster?: string
    alt?: string
    caption?: string
    className?: string
}

export function DocMediaAsset({
    src,
    type = 'video',
    poster,
    alt = '',
    caption,
    className = ''
}: TDocMediaAssetProps) {
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReducedMotion(mq.matches)
        function handler(e: MediaQueryListEvent) {
            setReducedMotion(e.matches)
        }
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    const showStatic = type === 'image' || reducedMotion

    return (
        <figure
            className={`overflow-hidden border border-[#2b252c] bg-background/30 ${className}`}
        >
            {showStatic ? (
                <img
                    src={reducedMotion && poster ? poster : src}
                    alt={alt}
                    className="w-full"
                    draggable={false}
                />
            ) : (
                <video
                    src={src}
                    poster={poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full"
                    aria-label={alt || undefined}
                />
            )}
            {caption ? (
                <figcaption className="border-t border-[#2b252c] px-4 py-2 font-mono text-[11px] text-muted-foreground">
                    {caption}
                </figcaption>
            ) : null}
        </figure>
    )
}
