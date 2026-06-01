import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    typedRoutes: true,
    transpilePackages: ['@dora/studio'],
    typescript: {
        // The @dora/studio source is consumed raw and is type-checked under its
        // own (loose) tsconfig via the desktop app. Marketing is strict, so the
        // Next build gate would spuriously fail on the vendored package internals.
        // Marketing's own code is still type-checked via `bun run typecheck`.
        ignoreBuildErrors: true
    },
    turbopack: {
        root: rootDir,
        resolveAlias: {
            // The studio package's monaco-workers module uses Vite's `?worker`
            // import syntax, which Next/turbopack can't resolve. On the web,
            // @monaco-editor/react loads workers from a CDN, so stub it out.
            '@studio/monaco-workers': './src/stubs/monaco-workers.ts'
        }
    }
}

export default nextConfig
