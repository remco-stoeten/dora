'use client'

import { useRef, useState } from 'react'

import { useGate } from './use-scroll-motion'

const PARTICLES = [
    { left: '22%', top: '30%', size: 1.5, opacity: 0.36 },
    { left: '43%', top: '21%', size: 2, opacity: 0.42 },
    { left: '70%', top: '32%', size: 1, opacity: 0.32 },
    { left: '76%', top: '58%', size: 1.5, opacity: 0.38 },
    { left: '31%', top: '67%', size: 1, opacity: 0.3 }
] as const

/* ---------------------------------------------------------------------------
 * Schema Visualization — live ER diagram; a pulse travels the foreign-key
 * links and hovering a table highlights its relationships.
 * ------------------------------------------------------------------------- */
export function SchemaDiagramCard({ animate }: { animate: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState<string | null>(null)
    const gate = useGate(ref)
    const running = animate && gate.active
    const nodes = [
        { id: 'users', x: 12, y: 10, w: 54, h: 30 },
        { id: 'products', x: 8, y: 78, w: 60, h: 30 },
        { id: 'orders', x: 98, y: 44, w: 52, h: 30 }
    ]
    const edges = [
        { a: 'users', b: 'orders', d: 'M66 22 C 86 22, 84 56, 98 56' },
        { a: 'products', b: 'orders', d: 'M68 90 C 88 90, 84 62, 98 62' }
    ]
    const nodeLit = (id: string) =>
        hover === null ||
        hover === id ||
        edges.some(
            (e) =>
                (e.a === hover && e.b === id) || (e.b === hover && e.a === id)
        )
    const edgeLit = (e: { a: string; b: string }) =>
        hover === null || e.a === hover || e.b === hover

    return (
        <div ref={ref} className="relative h-full flex flex-col overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-2xl"
                style={{
                    background:
                        'radial-gradient(circle, rgba(227,178,179,0.12) 0%, rgba(173,142,182,0.05) 38%, transparent 70%)'
                }}
            />
            {PARTICLES.map((particle, index) => (
                <span
                    aria-hidden
                    key={`${particle.left}-${particle.top}`}
                    className="pointer-events-none absolute rounded-full bg-[#f5c0c0]"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        width: particle.size,
                        height: particle.size,
                        opacity: particle.opacity,
                        animation: `particleFloat ${4.1 + index * 0.5}s cubic-bezier(0.23, 1, 0.32, 1) ${index * 140}ms infinite alternate`
                    }}
                />
            ))}
            <div className="relative flex-1 flex items-center justify-center px-4 pt-5">
                <svg
                    viewBox="0 0 160 118"
                    className="w-full h-[118px]"
                    aria-hidden="true"
                >
                    {edges.map((e, i) => (
                        <path
                            key={i}
                            d={e.d}
                            fill="none"
                            stroke={edgeLit(e) ? '#e3b2b3' : '#3a3138'}
                            strokeWidth="1.2"
                            strokeDasharray={edgeLit(e) ? '4 4' : undefined}
                        >
                            {edgeLit(e) && running ? (
                                <animate
                                    attributeName="stroke-dashoffset"
                                    dur="0.9s"
                                    from="0"
                                    repeatCount="indefinite"
                                    to="-16"
                                />
                            ) : null}
                        </path>
                    ))}
                    {nodes.map((n) => {
                        const lit = nodeLit(n.id)
                        return (
                            <g
                                key={n.id}
                                onMouseEnter={() => setHover(n.id)}
                                onMouseLeave={() => setHover(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <rect
                                    x={n.x}
                                    y={n.y}
                                    width={n.w}
                                    height={n.h}
                                    rx="3"
                                    fill="#161218"
                                    stroke={
                                        lit
                                            ? 'rgba(227,178,179,0.4)'
                                            : '#2b252c'
                                    }
                                    strokeWidth="1"
                                    className="transition-colors duration-200"
                                />
                                <path
                                    d={`M${n.x} ${n.y + 3} a3 3 0 0 1 3 -3 h${n.w - 6} a3 3 0 0 1 3 3 v7 h-${n.w} Z`}
                                    fill={
                                        lit
                                            ? 'rgba(227,178,179,0.16)'
                                            : '#1c1820'
                                    }
                                    className="transition-colors duration-200"
                                />
                                <text
                                    x={n.x + 5}
                                    y={n.y + 7.6}
                                    fontSize="6.5"
                                    className="font-mono transition-colors duration-200"
                                    style={{
                                        fontFamily: 'var(--font-geist-mono)'
                                    }}
                                    fill={lit ? '#e3b2b3' : '#6a6a6a'}
                                >
                                    {n.id}
                                </text>
                                <line
                                    x1={n.x + 5}
                                    y1={n.y + 17}
                                    x2={n.x + n.w - 6}
                                    y2={n.y + 17}
                                    stroke="#3a3138"
                                    strokeWidth="1.4"
                                />
                                <line
                                    x1={n.x + 5}
                                    y1={n.y + 23}
                                    x2={n.x + n.w - 12}
                                    y2={n.y + 23}
                                    stroke="#2b252c"
                                    strokeWidth="1.4"
                                />
                            </g>
                        )
                    })}
                </svg>
            </div>
            <div className="relative px-5 pb-5">
                <h3 className="mb-1 font-pixel text-sm font-[500] text-[#e0e0e0]">
                    Schema Visualization
                </h3>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">
                    ERD diagram. Live relationships. Query-driven discovery.
                    Instant insight.
                </p>
            </div>
        </div>
    )
}
