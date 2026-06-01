"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, Download, Github } from "lucide-react"
import { useDownload } from "./use-download"

const REPO_URL = "https://github.com/remcostoeten/dora"

type Node = {
  x: number
  y: number
  vx: number
  vy: number
  base: number
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)
  const [decoded, setDecoded] = useState(false)
  const { href: downloadHref, label: downloadLabel, os } = useDownload()

  useEffect(() => {
    const t = setTimeout(() => setDecoded(true), 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: Node[] = []

    function resize() {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // grid of nodes spaced ~46px
      const gap = 46
      const cols = Math.ceil(width / gap) + 1
      const rows = Math.ceil(height / gap) + 1
      nodes = []
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap
          const y = j * gap
          nodes.push({ x, y, vx: 0, vy: 0, base: Math.random() })
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const mx = mouse.current.x
      const my = mouse.current.y
      const radius = 150

      for (const n of nodes) {
        const dx = n.x - mx
        const dy = n.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const influence = dist < radius ? 1 - dist / radius : 0

        // push nodes gently away from cursor
        const targetX = n.x + (influence > 0 ? (dx / (dist || 1)) * influence * 10 : 0)
        const targetY = n.y + (influence > 0 ? (dy / (dist || 1)) * influence * 10 : 0)

        const drawX = targetX
        const drawY = targetY

        const alpha = 0.12 + influence * 0.6
        const size = 1 + influence * 1.6

        ctx.beginPath()
        ctx.fillStyle =
          influence > 0.05
            ? `rgba(34, 197, 94, ${alpha})`
            : `rgba(120, 120, 120, ${alpha})`
        ctx.fillRect(drawX - size / 2, drawY - size / 2, size, size)

        // connect to cursor with faint lines when close
        if (influence > 0.15) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(34, 197, 94, ${influence * 0.18})`
          ctx.lineWidth = 0.6
          ctx.moveTo(drawX, drawY)
          ctx.lineTo(mx, my)
          ctx.stroke()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  function onMove(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onLeave() {
    mouse.current = { x: -9999, y: -9999 }
  }

  return (
    <section
      id="top"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {/* vignette so center text stays readable */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.85)_0%,rgba(10,10,10,0.4)_45%,rgba(10,10,10,0.9)_100%)]" />

      <div className="relative z-10 px-6 sm:px-8 pt-36 pb-24 flex flex-col items-start">
        <div className="inline-flex items-center gap-2 border border-[#1a1a1a] bg-[#0d0d0d]/60 px-3 py-1 text-[11px] text-[#8a8a8a] mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          local-first · tauri · rust
        </div>

        <h1
          className={`font-[family-name:var(--font-pixel)] text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-[#f0f0f0] text-balance transition-all duration-700 ${
            decoded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
          }`}
        >
          query the
          <br />
          <span className="text-[#22c55e]">unseen.</span>
        </h1>

        <p className="mt-5 font-[family-name:var(--font-pixel)] text-xs uppercase tracking-[0.2em] text-[#6a6a6a]">
          dora — the database explorah
        </p>

        <p className="mt-5 max-w-md text-sm leading-relaxed text-[#8a8a8a] text-pretty">
          A native database explorer that lives on your machine. Postgres, SQLite,
          MySQL and libSQL — no cloud between you and your rows.
        </p>

        <div className="mt-8 flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <a
              href={downloadHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium text-[#0a0a0a] bg-[#ededed] hover:bg-[#ffffff] transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloadLabel}
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 h-10 rounded-md text-sm text-[#c0c0c0] border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#111111] transition-colors"
            >
              <Github className="w-4 h-4" />
              Source
            </a>
          </div>
          <p className="text-[11px] text-[#5a5a5a]">
            {os === "unknown"
              ? "Available for macOS, Windows & Linux"
              : "Detected your platform automatically · other builds on GitHub"}
          </p>
        </div>

        <a
          href="#interface"
          className="mt-16 flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#4a4a4a] hover:text-[#8a8a8a] transition-colors"
        >
          <ArrowDown className="w-3 h-3 animate-bounce" />
          explore
        </a>
      </div>
    </section>
  )
}
