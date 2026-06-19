/**
 * Builds the Tauri updater manifest (`latest.json`) from the signed bundle
 * artifacts produced by `tauri-action` with `createUpdaterArtifacts: true`.
 *
 * The desktop app's updater endpoint
 * (`https://github.com/remcostoeten/dora/releases/latest/download/latest.json`)
 * serves this file. For each platform it lists the download URL of the updater
 * artifact and the base64 signature read from the matching `.sig` file.
 *
 * Usage:
 *   bun tools/scripts/generate-latest-json.ts \
 *     --assets-dir=/tmp/release-assets \
 *     --version=v0.30.0 \
 *     --notes-file=/tmp/release-notes.md \
 *     --repo=remcostoeten/dora \
 *     --output=/tmp/latest.json
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function arg(name: string, fallback = ''): string {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
	return hit ? hit.slice(name.length + 3) : fallback
}

const assetsDir = arg('assets-dir')
const rawVersion = arg('version')
const notesFile = arg('notes-file')
const repo = arg('repo', 'remcostoeten/dora')
const output = arg('output', 'latest.json')

if (!assetsDir || !rawVersion) {
	console.error('Missing required --assets-dir / --version')
	process.exit(2)
}

// The updater compares against the installed app version, which carries no "v".
const version = rawVersion.replace(/^v/, '')
const tag = rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`

function walk(dir: string): string[] {
	const out: string[] = []
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry)
		if (statSync(full).isDirectory()) out.push(...walk(full))
		else out.push(full)
	}
	return out
}

// Map an updater artifact filename to its platform key. Returns null for files
// that are not updater targets (e.g. .deb, .rpm, .dmg, .msi installers).
function platformFor(file: string): string | null {
	if (file.endsWith('.AppImage')) return 'linux-x86_64'
	if (file.endsWith('.app.tar.gz')) return 'darwin-aarch64'
	if (file.endsWith('-setup.exe') || file.endsWith('.exe')) return 'windows-x86_64'
	return null
}

const files = walk(assetsDir)
const sigs = files.filter((f) => f.endsWith('.sig'))

const platforms: Record<string, { signature: string; url: string }> = {}

for (const sig of sigs) {
	const artifact = sig.slice(0, -'.sig'.length)
	const platform = platformFor(artifact)
	if (!platform) continue
	const filename = artifact.split('/').pop() as string
	const signature = readFileSync(sig, 'utf8').trim()
	const url = `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(filename)}`
	// Prefer the first artifact found per platform; NSIS `-setup.exe` and bare
	// `.exe` both map to windows — keep whichever appears first deterministically.
	if (!platforms[platform]) {
		platforms[platform] = { signature, url }
	}
}

if (Object.keys(platforms).length === 0) {
	console.error('No signed updater artifacts (.sig) found — did createUpdaterArtifacts + signing run?')
	console.error(`Scanned: ${files.length} files under ${assetsDir}`)
	process.exit(1)
}

const notes = notesFile ? readFileSync(notesFile, 'utf8').trim() : ''

const manifest = {
	version,
	notes,
	pub_date: new Date().toISOString(),
	platforms
}

writeFileSync(output, JSON.stringify(manifest, null, 2))
console.log(`Wrote ${output} with platforms: ${Object.keys(platforms).join(', ')}`)
