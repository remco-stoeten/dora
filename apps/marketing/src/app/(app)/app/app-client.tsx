'use client'

import { StudioApp, desktopAnalyticsConfig } from '@dora/studio'

/**
 * Client island hosting the full Dora Studio app (the same code the desktop runs).
 *
 * `forceMock` selects the in-memory mock data adapter so it runs as a web demo.
 * The studio owns its own react-router instance internally; we mount it under
 * `/app` via `basename` so its routing doesn't fight Next's router.
 */
export function AppClient() {
    return <StudioApp forceMock basename="/app" analyticsConfig={desktopAnalyticsConfig} />
}
