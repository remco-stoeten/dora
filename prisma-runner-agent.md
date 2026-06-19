# Agent Prompt: Implement Prisma ORM Runner

## Context

You are implementing a Prisma ORM Runner feature for **Dora** — a native desktop database workbench built with Tauri + Rust + React (TypeScript). The project is a Bun + Turborepo monorepo at `/home/remcostoeten/dev/dora`.

The work is tracked in these GitHub issues on `remco-stoeten/dora`:
- **#122** — Epic: Prisma ORM Runner (keep updated, close when all sub-issues done)
- **#123** — Core translator (`prisma-to-sql.ts`)
- **#124** — Monaco LSP — ambient types + completions
- **#125** — UI integration — tab, schema viewer, results panel
- **#126** — Marketing & ecosystem promotion (skip for now — ship feature first)

## Branch setup (IMPORTANT — do this first)

Other agents are working on the current branch (`feat/hosted-provider-support`). You must work in isolation:

```bash
git fetch origin
git checkout master
git pull origin master
git checkout -b feat/prisma-runner
```

All your commits go on `feat/prisma-runner`. Do not touch `master` or `feat/hosted-provider-support`.

---

## What the feature is

A third tab in the SQL Console (alongside SQL and Drizzle) where users write Prisma client JavaScript like:

```ts
prisma.user.findMany({ where: { active: true }, take: 10 })
```

Dora translates this to SQL **entirely on the frontend** (no Node.js runtime, no Prisma schema file), executes it via the existing Rust adapter, and shows results in the same results panel.

**This is a translation layer, not a Prisma runtime.**

---

## Existing code to understand before writing anything

Read these files first to understand patterns to follow:

```
packages/studio/src/features/drizzle-runner/
├── drizzle-runner.tsx                     # Main component — mirror this
├── types.ts
├── index.ts
├── components/
│   ├── code-editor.tsx                    # Monaco + LSP — mirror this
│   ├── schema-viewer.tsx                  # Mirror this
│   ├── results-panel.tsx                  # REUSE directly (do not copy)
│   └── resizable-panels.tsx               # REUSE directly
└── utils/
    ├── lsp-patterns.ts                    # Pattern matching approach — mirror
    ├── lsp-utils.ts                       # Ambient .d.ts generation — mirror
    ├── drizzle-query.ts                   # Translator — mirror but go deeper
    └── fuzzy-match.ts                     # REUSE directly

packages/studio/src/features/sql-console/sql-console.tsx   # Where to add the third tab
packages/studio/src/core/data-provider/types.ts            # adapter interface
packages/studio/src/core/data-provider/adapters/tauri.ts   # IPC bridge
apps/desktop/src-tauri/src/database/commands/snippets.rs   # Snippet seeding reference
apps/desktop/src-tauri/migrations/                         # DB schema reference
```

Also read `__tests__/apps/desktop/src/features/drizzle-runner/utils/drizzle-query.test.ts` to understand test style.

---

## Implementation plan

Work in this order. Close each GitHub issue as you complete it.

---

### Step 1 — Core translator (closes #123)

**File:** `packages/studio/src/features/prisma-runner/utils/model-mapper.ts`

```ts
// Map DB table names to Prisma model conventions
tableToModelKey('user_profiles')  // → 'userProfile'  (camelCase singular, key on prisma object)
tableToModelName('user_profiles') // → 'UserProfile'  (PascalCase singular, display name)
modelKeyToTable('userProfile', schema) // → 'user_profiles'
```

Use this algorithm:
1. Strip trailing `s` (naive singularize — good enough for v1, not a full inflection library)
2. Split on `_`, camelCase join for key, PascalCase join for name

---

**File:** `packages/studio/src/features/prisma-runner/utils/prisma-to-sql.ts`

Return type:
```ts
export type TranslationResult =
  | { sql: string; params: unknown[] }
  | { error: string; hint?: string }
```

Top-level function:
```ts
export function prismaToSql(
  code: string,
  schema: DatabaseSchema,
  dialect: 'postgresql' | 'mysql' | 'sqlite'
): TranslationResult
```

Parse the code string with regex to extract: `prisma.{modelKey}.{method}({argsJson})` or `prisma.$queryRaw\`...\``.

**Supported methods and their SQL mapping:**

| Method | SQL template |
|--------|-------------|
| `findMany({ where?, select?, include?, orderBy?, take?, skip? })` | `SELECT {cols} FROM {table} {joins} WHERE {where} ORDER BY {orderBy} LIMIT {take} OFFSET {skip}` |
| `findFirst(...)` | Same as findMany + `LIMIT 1` |
| `findUnique({ where: { id: v } })` | `SELECT * FROM {table} WHERE {pk} = {v} LIMIT 1` |
| `create({ data: {...} })` | `INSERT INTO {table} ({cols}) VALUES ({vals}) RETURNING *` (Postgres) / without RETURNING (others) |
| `createMany({ data: [...] })` | `INSERT INTO {table} ({cols}) VALUES (...),(...),...` |
| `update({ where: {...}, data: {...} })` | `UPDATE {table} SET {assignments} WHERE {where}` |
| `updateMany({ where?: {...}, data: {...} })` | `UPDATE {table} SET {assignments} WHERE {where}` |
| `delete({ where: {...} })` | `DELETE FROM {table} WHERE {where}` |
| `deleteMany({ where?: {...} })` | `DELETE FROM {table} WHERE {where}` |
| `count({ where?: {...} })` | `SELECT COUNT(*) FROM {table} WHERE {where}` |
| `$queryRaw\`...\`` | Pass the template literal content through as raw SQL |
| `$executeRaw\`...\`` | Same as $queryRaw |

**WHERE clause operators** (recursive — AND/OR/NOT nest):

| Prisma operator | SQL |
|----------------|-----|
| `{ field: value }` (primitive) | `"field" = ?` |
| `{ field: { equals: v } }` | `"field" = ?` |
| `{ field: { not: v } }` | `"field" != ?` |
| `{ field: { in: [v1,v2] } }` | `"field" IN (?,?)` |
| `{ field: { notIn: [...] } }` | `"field" NOT IN (?,?)` |
| `{ field: { lt: v } }` | `"field" < ?` |
| `{ field: { lte: v } }` | `"field" <= ?` |
| `{ field: { gt: v } }` | `"field" > ?` |
| `{ field: { gte: v } }` | `"field" >= ?` |
| `{ field: { contains: v } }` | `"field" LIKE ?` (wrap v with `%`) |
| `{ field: { startsWith: v } }` | `"field" LIKE ?` (suffix `%`) |
| `{ field: { endsWith: v } }` | `"field" LIKE ?` (prefix `%`) |
| `{ AND: [...] }` | `(a AND b AND ...)` |
| `{ OR: [...] }` | `(a OR b OR ...)` |
| `{ NOT: {...} }` | `NOT (...)` |

Params use `?` for MySQL/SQLite and `$1`, `$2` etc. for PostgreSQL. Check the `dialect` argument.

**`include` → JOIN:**

`include: { posts: true }` — look up FKs in `schema.foreignKeys` to find which FK on `posts` references the current table. Emit `LEFT JOIN "posts" ON "posts"."userId" = "user"."id"`. Single level only. Nested include → return `{ error: 'Nested include is not supported. Use prisma.$queryRaw`...` for this query.' }`.

**`select`:** If provided, emit named columns instead of `*`. Validate column names against the schema table — unknown column names return `{ error: '...' }`.

**`orderBy`:** `{ email: 'asc' }` → `ORDER BY "email" ASC`. Array: `[{ email: 'asc' }, { id: 'desc' }]` → `ORDER BY "email" ASC, "id" DESC`.

**Unsupported patterns** — return `{ error, hint }` for:
- `connectOrCreate`, `upsert`
- `$transaction([...])`
- Nested writes (`create` with relation keys in `data`)
- `_sum`, `_avg`, `_min`, `_max` aggregations

**Tests:** `__tests__/apps/desktop/src/features/prisma-runner/utils/prisma-to-sql.test.ts`

Cover every method, every WHERE operator, nested AND/OR, include→JOIN, orderBy array, take/skip, $queryRaw passthrough, and every unsupported pattern returning an error (not throwing).

---

### Step 2 — Monaco LSP (closes #124)

**File:** `packages/studio/src/features/prisma-runner/utils/lsp-types.ts`

```ts
export function generatePrismaTypes(schema: DatabaseSchema, modelMap: ModelMap): string
```

Generates an ambient `.d.ts` string injected via:
```ts
monaco.languages.typescript.typescriptDefaults.addExtraLib(types, 'file:///dora-prisma-schema.d.ts')
```

The generated string declares:
- A `{Model}WhereInput` interface per table with all column names typed with operator overloads
- A `{Model}SelectInput` interface (all columns as `boolean?`)
- A `{Model}IncludeInput` interface (FK relation names as `boolean?`)
- A `{Model}OrderByInput` interface (all columns as `'asc' | 'desc'` optionals)
- A `{Model}Delegate` interface with all methods typed
- A `declare const prisma: { [modelKey]: {Model}Delegate; ...; $queryRaw(...): Promise<unknown[]>; $executeRaw(...): Promise<number> }`

Column type mapping:
- `varchar`, `text`, `char`, `uuid`, `enum` → `string`
- `int`, `integer`, `bigint`, `serial`, `smallint` → `number`
- `boolean`, `bool` → `boolean`
- `timestamp`, `timestamptz`, `date`, `datetime` → `Date | string`
- `json`, `jsonb` → `unknown`
- `float`, `double`, `real`, `numeric`, `decimal` → `number`
- `bytea`, `blob` → `string`
- Everything else → `unknown`

**File:** `packages/studio/src/features/prisma-runner/utils/lsp-patterns.ts`

Regex-based context detectors operating on `lineTextBeforeCursor: string`:

```ts
type PrismaContext =
  | { type: 'model-key' }                                  // after "prisma."
  | { type: 'method'; modelKey: string }                   // after "prisma.user."
  | { type: 'where-field'; modelKey: string }              // inside "where: {"
  | { type: 'field-operator'; modelKey: string; field: string } // inside "{ field: {"
  | { type: 'orderby-field'; modelKey: string }            // inside "orderBy: {"
  | { type: 'orderby-direction' }                          // after "field: "
  | { type: 'include-field'; modelKey: string }            // inside "include: {"
  | { type: 'raw-method' }                                 // after "prisma.$"
  | { type: 'unknown' }

export function detectPrismaContext(lineBeforeCursor: string): PrismaContext
```

**In `code-editor.tsx`** (new file — mirror drizzle-runner's code-editor.tsx):

- Language: `'typescript'` (not `'sql'`)
- Register completion provider with trigger chars `[".", "(", " ", ":", "{"]`
- In `provideCompletionItems`, call `detectPrismaContext()` and return appropriate suggestions per context type
- Inject ambient types on mount and whenever `schema` prop changes
- Reuse `fuzzy-match.ts` from drizzle-runner for diagnostics (import it directly, don't copy)
- Register in scope `'prisma'`: `Ctrl+Enter` / `Cmd+Enter` to run

**Tests:** Mirror `lsp-utils.test.ts` and `lsp-patterns.test.ts` from drizzle-runner.

---

### Step 3 — UI integration (closes #125)

**New component files:**

```
packages/studio/src/features/prisma-runner/
├── prisma-runner.tsx
├── types.ts
├── index.ts
└── components/
    ├── code-editor.tsx   (from Step 2)
    └── schema-viewer.tsx
```

**`types.ts`:**
```ts
export interface PrismaRunnerProps {
  connectionId: string
}
```

**`schema-viewer.tsx`:**

Same shape as drizzle-runner's schema-viewer but shows model names (PascalCase) with fields. On click, inserts `prisma.{modelKey}` at cursor. Show FK relations as sub-section:

```
▼ User
   id         number
   email      string
   active     boolean
   ↳ posts    Post[]
▶ UserProfile
```

**`prisma-runner.tsx`:**

On mount:
1. `adapter.getSchema(connectionId)` 
2. Build model map via `model-mapper.ts`
3. Default query: `prisma.{firstModelKey}.findMany({ take: 10 })` with real model key interpolated

Run handler:
1. `prismaToSql(query, schema, dialect)` 
2. If `{ error }` → set `translationError` state, do not call adapter
3. If `{ sql, params }` → `adapter.executeQuery(connectionId, sql)` (pass params if the adapter supports it, else interpolate — check `types.ts` to see if executeQuery accepts params)
4. Render result in `<ResultsPanel />` imported from `../../drizzle-runner/components/results-panel`

Translation error UI: persistent banner above results (not a toast). Red/amber, dismissible, clears on next successful run.

**`sql-console.tsx` — add Prisma tab:**

Find where the SQL/Drizzle mode switcher renders. Add `'prisma'` as a third mode. Render `<PrismaRunner connectionId={connectionId} />` when mode is `'prisma'`. Persist active mode in existing tab session state.

**Snippet seeding:**

In `apps/desktop/src-tauri/src/database/commands/snippets.rs`, in the `seed_system_snippets()` function, add:

```rust
SavedQuery {
    name: "Find all (Prisma)".to_string(),
    query_text: "prisma.{model}.findMany({ take: 100 })".to_string(),
    language: Some("prisma".to_string()),
    category: Some("Templates".to_string()),
    is_system: true,
    favorite: true,
    // ... other fields as None/defaults matching existing entries
}
```

The `language` field is already a free-text column — no migration needed.

In `unified-sidebar.tsx`, `'prisma'` mode snippets should already filter correctly if the sidebar already filters by language. Verify this and fix if not.

---

### Step 4 — Close issues

After each step compiles and tests pass:

```bash
# After Step 1:
gh issue close 123 --repo remco-stoeten/dora --comment "Implemented in feat/prisma-runner. Core translator in packages/studio/src/features/prisma-runner/utils/prisma-to-sql.ts with full WHERE clause coverage, include→JOIN, and all unsupported patterns returning structured errors."

# After Step 2:
gh issue close 124 --repo remco-stoeten/dora --comment "Implemented in feat/prisma-runner. Ambient .d.ts generation in lsp-types.ts, context-aware completion provider in code-editor.tsx, pattern detectors in lsp-patterns.ts."

# After Step 3:
gh issue close 125 --repo remco-stoeten/dora --comment "Implemented in feat/prisma-runner. PrismaRunner component wired as third tab in SQL Console. Schema viewer shows Prisma model names. Translation errors shown as persistent inline banner."

# Close the epic after all sub-issues are done:
gh issue close 122 --repo remco-stoeten/dora --comment "All implementation sub-issues (#123, #124, #125) complete on feat/prisma-runner branch. Marketing issue #126 tracked separately for post-ship."
```

---

## Code quality rules

- **No comments** unless explaining a non-obvious invariant. No docstrings.
- **No new abstractions** beyond what the task requires. Follow existing patterns exactly.
- **No error swallowing** — translation errors must surface as `{ error }` results, not be silently dropped.
- **TypeScript strict** — no `any` except where the existing codebase already uses it (check drizzle-runner for precedent).
- **No new dependencies** — use what's already in `packages/studio/package.json`. Check before reaching for a new package.
- **Tests must pass** — run `bun run test` (or `bun vitest`) before closing any issue.
- **Build must pass** — run `bun run build` (or `bun turbo build`) and check for type errors.

---

## Commit style

Follow the existing repo convention (seen in recent commits):

```
feat(prisma-runner): core query translator — Prisma client API to SQL
feat(prisma-runner): Monaco LSP ambient types and completion provider
feat(prisma-runner): UI integration — third tab, schema viewer, translation error banner
```

One commit per logical step. Do not squash unrelated concerns into one commit.

---

## What NOT to do

- Do not touch `master` or `feat/hosted-provider-support`
- Do not copy `results-panel.tsx` or `resizable-panels.tsx` or `fuzzy-match.ts` — import them
- Do not implement `prisma.$transaction`, nested writes, or aggregations in v1
- Do not add a Node.js runtime or shell out to execute actual Prisma client code
- Do not add new Rust backend code — all translation is frontend-only, execution goes through the existing `adapter.executeQuery`
- Do not create documentation files or README updates unless the user asks
- Do not close issue #126 (marketing) — that is post-ship work for the human

---

## Done criteria

The feature is shippable when:
- [ ] `prisma.user.findMany({ take: 10 })` executes and shows results in the Prisma tab
- [ ] `prisma.user.findMany({ where: { active: true }, orderBy: { email: 'asc' }, take: 20 })` executes correctly
- [ ] `prisma.user.create({ data: { email: 'test@example.com' } })` executes correctly
- [ ] `prisma.$queryRaw\`SELECT 1\`` passes through and shows results
- [ ] Unsupported pattern (e.g. nested include) shows inline error banner, does not crash
- [ ] Monaco completions appear after typing `prisma.` and after typing `prisma.user.`
- [ ] All new tests pass (`bun run test`)
- [ ] TypeScript build passes with no new errors (`bun run typecheck` or `tsc --noEmit`)
- [ ] Issues #122, #123, #124, #125 are closed on GitHub
