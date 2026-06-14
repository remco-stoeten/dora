# Claude Context

## Project Structure

- **Root**: `/home/remco-stoeten/dora`
- **CLI**: `tools/dora-runner` (Go)
- **Scripts**: `tools/scripts` (TypeScript)
- **Docs**: `docs/` (Release notes, changelogs)

## Key Rules

1. **No Emojis**: Never use emojis in technical documentation or release notes.
2. **Path Awareness**: Always check `docs/` for release notes, not root.
3. **CLI**: The `dora-runner` binary is the source of truth for build management. Build: `cd tools/dora-runner && go build -o ../../dora-runner .`

## Release Process

When asked to handle a release:

1. Check `docs/RELEASE_NOTES.md` for the current draft.
2. Use `dora-runner` scripts if available (`bun run generate-release`).
3. If writing notes manually, follow `AGENTS.md` guidelines.
