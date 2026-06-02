import { EQ_PATTERNS } from './docker-containers-motion'

export function EqualizerBars({
    active,
    animate,
    color,
    phase
}: {
    active: boolean
    animate: boolean
    color: string
    phase: number
}) {
    const bars = EQ_PATTERNS[phase % EQ_PATTERNS.length]

    return (
        <svg viewBox="0 0 39 22" className="w-full h-7" aria-hidden="true">
            {bars.map((b) => {
                const yValues = b.values
                    .split(';')
                    .map((v) => 21 - Number(v))
                    .join(';')
                return (
                    <rect
                        key={b.x}
                        x={b.x}
                        width="3"
                        rx="1"
                        fill={color}
                        opacity={active ? 0.9 : 0.3}
                        y={active ? 11 : 17}
                        height={active ? 10 : 4}
                    >
                        {active && animate ? (
                            <>
                                <animate
                                    attributeName="height"
                                    values={b.values}
                                    dur={b.dur}
                                    begin={b.begin}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="y"
                                    values={yValues}
                                    dur={b.dur}
                                    begin={b.begin}
                                    repeatCount="indefinite"
                                />
                            </>
                        ) : null}
                    </rect>
                )
            })}
        </svg>
    )
}
