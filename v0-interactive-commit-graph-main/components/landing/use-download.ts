"use client"

import { useEffect, useState } from "react"

const RELEASES_URL = "https://github.com/remcostoeten/dora/releases/latest"
const API_URL = "https://api.github.com/repos/remcostoeten/dora/releases/latest"

export type OS = "macos" | "windows" | "linux-deb" | "linux-rpm" | "linux" | "unknown"

type DownloadTarget = {
  os: OS
  label: string
  href: string
  /** true once we've resolved an exact asset (vs. the generic releases page) */
  resolved: boolean
}

type GithubAsset = { name: string; browser_download_url: string }

function detectOS(): OS {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent.toLowerCase()
  const platform = (navigator.platform || "").toLowerCase()

  if (/win/.test(ua) || /win/.test(platform)) return "windows"
  if (/mac/.test(ua) || /mac/.test(platform)) return "macos"
  if (/android/.test(ua)) return "linux"
  if (/linux/.test(ua) || /linux/.test(platform)) {
    // best-effort distro family guess from UA hints
    if (/ubuntu|debian/.test(ua)) return "linux-deb"
    if (/fedora|red hat|rhel|suse/.test(ua)) return "linux-rpm"
    return "linux"
  }
  return "unknown"
}

const LABELS: Record<OS, string> = {
  macos: "Download for macOS",
  windows: "Download for Windows",
  "linux-deb": "Download .deb",
  "linux-rpm": "Download .rpm",
  linux: "Download for Linux",
  unknown: "Download",
}

function matchAsset(os: OS, assets: GithubAsset[]): GithubAsset | undefined {
  const by = (re: RegExp) => assets.find((a) => re.test(a.name.toLowerCase()))
  switch (os) {
    case "macos":
      return by(/\.dmg$/) || by(/darwin|mac|universal/) || by(/\.app\.tar\.gz$/)
    case "windows":
      return by(/\.msi$/) || by(/setup.*\.exe$/) || by(/\.exe$/)
    case "linux-deb":
      return by(/\.deb$/) || by(/\.appimage$/)
    case "linux-rpm":
      return by(/\.rpm$/) || by(/\.appimage$/)
    case "linux":
      return by(/\.appimage$/) || by(/\.deb$/) || by(/\.tar\.gz$/)
    default:
      return undefined
  }
}

export function useDownload(): DownloadTarget {
  const [os, setOs] = useState<OS>("unknown")
  const [href, setHref] = useState(RELEASES_URL)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const detected = detectOS()
    setOs(detected)

    let cancelled = false
    fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("release fetch failed"))))
      .then((data: { assets?: GithubAsset[] }) => {
        if (cancelled || !data.assets?.length) return
        const asset = matchAsset(detected, data.assets)
        if (asset) {
          setHref(asset.browser_download_url)
          setResolved(true)
        }
      })
      .catch(() => {
        /* keep fallback releases page */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { os, label: LABELS[os], href, resolved }
}
