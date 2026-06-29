# @dora/promo

Code-driven promo recorder for the Dora Studio UI. Scenes are plain data
files; a Playwright run drives the **real app** (the browser build, backed by
the mock adapter) and records native video, then ffmpeg trims and encodes it.

Because scenes are version-controlled, a promo **regenerates itself** when the
UI changes — re-run the command and you get a fresh, correct clip. No manual
screen-capture, no stale footage.

## Requirements

- The Studio dev server running on `localhost:1420`
  (`cd apps/desktop && bun vite --port 1420 --strictPort`).
  With no Tauri runtime it auto-uses the mock adapter (demo e-commerce schema),
  so the whole app works in a plain browser.
- `ffmpeg` on `PATH` (for captions, a system font resolvable via `fc-match`).
- Playwright's Chromium (already vendored in the repo).

## Usage

```bash
# from repo root
node packages/promo/src/cli.mjs --list
node packages/promo/src/cli.mjs drizzle-lsp --gif --captions --out ~/promos

# or via the package script
cd packages/promo && pnpm render drizzle-lsp -- --gif --captions
```

Flags: `--gif` also emit a GIF · `--captions` burn-in lower-third captions ·
`--out <dir>` output dir (default `./promo-out`) · `--base <url>` dev-server URL
· `--headed` run a visible browser.

## Authoring a scene interactively

Instead of hand-writing a scene, record one against the live app:

```bash
node packages/promo/src/cli.mjs author my-scene \
  --view sql-console --connection demo-ecommerce-001 --mode drizzle
```

This opens a **headed** browser at the dev server with a recorder overlay
pinned top-right. Just interact with the real Monaco editor — type, accept
completions with `Enter`, press keys — and the overlay captures each action,
auto-grouping printable runs into `type` steps and special keys into `key`
steps. Per-character `delay` and inter-step `holdAfter` are inferred from your
real timing (gaps under 250 ms are dropped, everything is rounded).

Overlay controls: **+ caption** (rides on the next step), **+ hold** (insert an
explicit `wait`), **save** (writes `scenes/my-scene.mjs`, capturing the final
editor value as `expect`), **cancel**. Then refine timings with `edit` below or
render it straight away.

Defaults match the example scene (`sql-console` + demo e-commerce + drizzle);
override with `--view` / `--connection` / `--table` / `--mode`. Requires the
dev server, same as rendering.

## Editing a scene's timing

```bash
node packages/promo/src/cli.mjs edit drizzle-lsp
```

Opens a standalone in-browser timeline editor (no dev server needed): tweak
each step's `delay` / `holdAfter` / `caption` / text, reorder, delete, or add
steps, adjust the global `leadInMs` / `defaultDelay`, and watch the estimated
duration update live. **Save** writes the scene back to its `.mjs` file in the
same clean shape as the hand-written ones.

## Scene format

A scene is a default-exported object (`scenes/<name>.mjs`):

```js
/** @type {import("../src/runner.mjs").Scene} */
export default {
  name: "drizzle-lsp",
  url: { view: "sql-console", connection: "demo-ecommerce-001" },
  mode: "drizzle",                      // sql | drizzle | prisma
  size: { width: 1600, height: 900 },
  editor: { fontSize: 18, lineHeight: 30 },
  closeRightSidebar: true,              // collapse the Snippets panel
  leadInMs: 600,                        // empty-editor beat kept before typing
  steps: [
    { type: "db.select().from(", holdAfter: 1300, caption: "Tables" },
    { type: "ord", delay: 150, holdAfter: 1500 },
    { key: "Enter", holdAfter: 700 },   // accept completion (canonical insert)
    // ...
  ],
  expect: "db.select().from(orders).where(eq(orders.total, 100))",
};
```

**Steps:** `type` (typed char-by-char), `key` (a keypress like `Enter`/`Escape`),
`wait` (pause only). Each accepts `holdAfter`; `type` accepts `delay`; any step
accepts `caption` (shown until the next caption). `expect` is asserted against
the final editor value and warns on mismatch.

## Authoring notes (hard-won — the runner already handles these)

- **Accept via `Enter`, type only to filter.** Completion acceptance inserts the
  canonical text, so filter typos don't matter and the final code stays clean.
  Accepting a table inserts `orders).`; accepting a method inserts `where()` with
  the cursor inside — don't hand-type those structural bits.
- **Avoid bare single-letter editor shortcuts in `type` text** if the app still
  has any (`h`/`v` in SQL Console were fixed to defer to editor focus). The
  runner can't know app-specific bindings; keep an eye on `expect`.
- The browser build needs React deduped in `apps/desktop/vite.config.ts`
  (already in place) or it won't boot.

## Adding a scene

Drop a new `scenes/<name>.mjs`, then `node src/cli.mjs <name>`. Good candidates:
schema visualizer, docker manager, data import, AI assistant.
