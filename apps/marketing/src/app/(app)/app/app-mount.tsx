'use client'

import dynamic from 'next/dynamic'

/**
 * Loads the studio app client-side only.
 *
 * The studio is a fully client-rendered SPA (react-router, monaco, Tauri-style
 * globals) that touches `document`/`window` during render, so it must never be
 * server-rendered or prerendered. `ssr: false` (only allowed inside a client
 * component) guarantees it loads in the browser.
 */
const AppClient = dynamic(() => import('./app-client').then((m) => m.AppClient), {
    ssr: false,
    loading: function Loading() {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
                Loading Dora…
            </div>
        )
    }
})

export default function AppMount() {
    return <AppClient />
}
