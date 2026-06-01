"use client"

import { useEffect, useState } from "react"
import { Download, Github } from "lucide-react"
import { Logo } from "./logo"
import { useDownload } from "./use-download"

const REPO_URL = "https://github.com/remcostoeten/dora"

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const { href, label, os } = useDownload()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <a href="#top" className="group flex items-center gap-2.5" aria-label="Dora home">
          <Logo className="h-6 w-6 transition-transform group-hover:scale-105" />
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-pixel)] text-sm text-[#f0f0f0] tracking-wide">
              dora
            </span>
            <span className="hidden sm:block text-[9px] uppercase tracking-[0.18em] text-[#5a5a5a]">
              the database explorah
            </span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 h-8 rounded-md text-xs text-[#8a8a8a] hover:text-[#f0f0f0] border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#111111] transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            title={label}
            className="group flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium text-[#0a0a0a] bg-[#ededed] hover:bg-[#ffffff] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{os === "unknown" ? "Download" : "Download"}</span>
            <span className="sm:hidden">Get</span>
          </a>
        </div>
      </nav>
    </header>
  )
}
