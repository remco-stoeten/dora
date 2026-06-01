"use client"

import { useEffect, useState, useRef, useCallback } from "react"

export interface CommitDetail {
  sha: string
  message: string
  author: string
  authorAvatar?: string
  time: string
  additions?: number
  deletions?: number
  files?: string[]
}

export interface CommitDataPoint {
  date: string
  commits: number
  details?: CommitDetail[]
}

interface CommitGraphProps {
  data: CommitDataPoint[]
  hoveredIndex: number | null
  onHoverChange: (index: number | null, position?: { x: number; y: number }) => void
  onClick: (index: number) => void
  accentColor?: string
}

export function CommitGraph({
  data,
  hoveredIndex,
  onHoverChange,
  onClick,
  accentColor = "#22c55e",
}: CommitGraphProps) {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [zoom, setZoom] = useState(1) // 1 = default, higher = more zoomed in
  const [panOffset, setPanOffset] = useState(0) // horizontal scroll offset (0-1 range representing percentage)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const maxCommits = Math.max(...data.map((d) => d.commits), 1)
  const animationDuration = 2000

  const minZoom = 1
  const maxZoom = 4

  // Calculate visible range based on zoom and pan
  const visibleRange = 1 / zoom
  const startIndex = Math.floor(panOffset * data.length)
  const endIndex = Math.min(
    Math.ceil((panOffset + visibleRange) * data.length),
    data.length
  )
  const visibleData = data.slice(startIndex, endIndex)

  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / animationDuration, 1)
      const easedProgress = easeOutCubic(progress)

      setAnimationProgress(easedProgress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setHasAnimated(true)
      }
    },
    [animationDuration]
  )

  const startAnimation = useCallback(() => {
    if (hasAnimated) return
    startTimeRef.current = null
    animationRef.current = requestAnimationFrame(animate)
  }, [animate, hasAnimated])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            startAnimation()
          })
          observer.disconnect()
        }
      },
      {
        threshold: 0.2,
        rootMargin: "50px",
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [startAnimation])

  // Handle scroll wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      // Shift + scroll = zoom, normal scroll = pan
      if (e.shiftKey || e.ctrlKey) {
        const delta = e.deltaY > 0 ? -0.2 : 0.2
        setZoom((prev) => {
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev + delta))
          // Adjust pan offset to keep the center point stable
          if (newZoom !== prev) {
            const centerPoint = panOffset + visibleRange / 2
            const newVisibleRange = 1 / newZoom
            setPanOffset(Math.max(0, Math.min(1 - newVisibleRange, centerPoint - newVisibleRange / 2)))
          }
          return newZoom
        })
      } else {
        // Horizontal pan
        const delta = e.deltaY > 0 ? 0.05 : -0.05
        setPanOffset((prev) => Math.max(0, Math.min(1 - visibleRange, prev + delta)))
      }
    },
    [panOffset, visibleRange]
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, relativeIndex: number) => {
    const actualIndex = startIndex + relativeIndex
    const rect = e.currentTarget.getBoundingClientRect()
    const parentRect = containerRef.current?.getBoundingClientRect()
    if (parentRect && actualIndex < data.length) {
      onHoverChange(actualIndex, {
        x: rect.left - parentRect.left + rect.width / 2,
        y: e.clientY - parentRect.top,
      })
    }
  }

  const handleClick = (relativeIndex: number) => {
    const actualIndex = startIndex + relativeIndex
    if (actualIndex < data.length) {
      onClick(actualIndex)
    }
  }

  const generateSmoothPath = (heightMultiplier = 1) => {
    const width = visibleData.length * 3
    const points = visibleData.map((d, i) => ({
      x: i * 3 + 1.5,
      y: 60 - (d.commits / maxCommits) * 45 * heightMultiplier * animationProgress,
    }))

    if (animationProgress === 0) {
      return `M 0 60 L ${width} 60`
    }

    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + 1
      const cp1y = points[i].y
      const cp2x = points[i + 1].x - 1
      const cp2y = points[i + 1].y
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`
    }
    return path
  }

  // Find hovered index in visible range
  const hoveredVisibleIndex = hoveredIndex !== null ? hoveredIndex - startIndex : null
  const isHoveredVisible = hoveredVisibleIndex !== null && hoveredVisibleIndex >= 0 && hoveredVisibleIndex < visibleData.length

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* Scrollable graph container */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 opacity-25 group-hover:opacity-45 transition-opacity duration-700"
        onWheel={handleWheel}
        style={{ minHeight: "100%" }}
      >
        <svg
          viewBox={`0 0 ${visibleData.length * 3} 60`}
          className="w-full h-full"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.1" />
              <stop offset="50%" stopColor={accentColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d={`${generateSmoothPath()} L ${visibleData.length * 3} 60 L 0 60 Z`}
            fill="url(#waveGradient)"
          />

          <path d={generateSmoothPath()} fill="none" stroke="url(#lineGradient)" strokeWidth="1" />

          {isHoveredVisible && animationProgress > 0 && (
            <circle
              cx={hoveredVisibleIndex * 3 + 1.5}
              cy={60 - (visibleData[hoveredVisibleIndex].commits / maxCommits) * 45 * animationProgress}
              r="2.5"
              fill={accentColor}
              className="transition-all duration-150"
            />
          )}
        </svg>
      </div>

      {/* Interactive hover/click zones */}
      <div
        className="absolute inset-0 flex z-10"
        onMouseLeave={() => onHoverChange(null)}
        onWheel={handleWheel}
      >
        {visibleData.map((_, i) => (
          <div
            key={startIndex + i}
            className="flex-1 h-full cursor-pointer hover:bg-white/[0.02] transition-colors"
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={() => handleClick(i)}
          />
        ))}
      </div>

      {/* Hover line indicator */}
      {isHoveredVisible && (
        <div
          className="absolute top-0 bottom-0 w-px pointer-events-none z-10 transition-opacity duration-200"
          style={{
            left: `${(hoveredVisibleIndex / visibleData.length) * 100}%`,
            background: `linear-gradient(to bottom, transparent, ${accentColor}40, transparent)`,
          }}
        />
      )}

      {/* Zoom indicator */}
      {zoom > 1 && (
        <div className="absolute bottom-1 right-1 text-[9px] text-[#3a3a3a] pointer-events-none z-20 font-mono">
          {zoom.toFixed(1)}x
        </div>
      )}

      {/* Scroll position indicator when zoomed */}
      {zoom > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a1a] pointer-events-none z-20">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${visibleRange * 100}%`,
              marginLeft: `${panOffset * 100}%`,
              backgroundColor: `${accentColor}40`,
            }}
          />
        </div>
      )}
    </div>
  )
}
