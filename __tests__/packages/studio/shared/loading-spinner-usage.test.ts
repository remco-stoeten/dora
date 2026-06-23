import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../../../..')
const studioSrc = path.join(repoRoot, 'packages/studio/src')

function collectSourceFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (entry) {
		const target = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			return collectSourceFiles(target)
		}

		return /\.(ts|tsx)$/.test(entry.name) ? [target] : []
	})
}

describe('studio loading spinner usage', function () {
	it('routes indeterminate loading spinners through the shared Spinner component', function () {
		const offenders = collectSourceFiles(studioSrc)
			.filter(function (filePath) {
				return !filePath.endsWith('shared/ui/spinner.tsx')
			})
			.flatMap(function (filePath) {
				const source = fs.readFileSync(filePath, 'utf8')
				const relativePath = path.relative(repoRoot, filePath)
				const issues: string[] = []

				if (
					/import\s*\{[^}]*\bLoader2\b[^}]*\}\s*from\s*['"]lucide-react['"]/.test(source)
				) {
					issues.push('imports Loader2 directly')
				}

				if (/border-t-[^\s'"]+\s+rounded-full\s+animate-spin/.test(source)) {
					issues.push('uses a raw CSS border spinner')
				}

				if (source.includes('animate-spin')) {
					issues.push('uses animate-spin outside the shared Spinner component')
				}

				return issues.map(function (issue) {
					return `${relativePath}: ${issue}`
				})
			})

		expect(offenders).toEqual([])
	})
})
