---
name: use-shortcut
description: Add scoped, accessible keyboard shortcuts to React apps with @remcostoeten/use-shortcut.
---

Add scoped, accessible keyboard shortcuts to React apps with `@remcostoeten/use-shortcut`. Prefer the narrow React entrypoint for app code:

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut/react"
```

## Workflow

1. Inspect the consumer context before adding shortcuts: target element, active modal/dialog state, focused inputs, required scopes, and expected browser/native shortcut collisions.
2. Choose the smallest API that fits:
   - Use `useShortcutBinding()` for one cleanup-safe shortcut binding in a component.
   - Use `useShortcut()` for fluent one-off bindings.
   - Use `useShortcutMap()` or `registerShortcutMap()` for config-driven command sets.
   - Use `.bind(...)` when combos already exist as strings from settings or config.
   - Use parser/formatter entrypoints only for shortcut UI, persistence, validation, or custom matching.
3. Keep shortcuts accessible:
   - Do not steal typing from inputs unless explicitly intended; default `ignoreInputs` is `true`.
   - Pair invisible or icon-only shortcut affordances with accessible names and visible focus states.
   - For debug overlays, toasts, or validation, use polite `aria-live` text and non-color status cues.
   - Preserve browser zoom, paste, screen-reader navigation, and native form behavior.
4. Register cleanup-safe handlers:
   - In React components, create fluent `.on(...)` registrations inside `useEffect()` and return cleanup that calls `unbind()`.
   - Keep effect dependencies honest; stabilize handlers with `useCallback()` or shortcut maps with `useMemo()` when needed.
   - Store returned `ShortcutResult`s when enabling, disabling, triggering, or unbinding is needed.
   - Group many imperative registrations with `createShortcutGroup()` or `useShortcutGroup()`.
   - Prefer scopes over conditional handler branches when shortcuts belong to app modes.
5. Validate behavior with realistic keyboard events and the repo commands relevant to the change.

## Common Patterns

Add a declarative shortcut:

```tsx
useShortcutBinding("mod+k", openCommandPalette, {
  description: "Open command palette",
  preventDefault: true,
})
```

Use a sequence:

```tsx
useShortcutBinding("g then d", goToDashboard, {
  description: "Go to dashboard",
  sequenceTimeout: 1000,
})
```

Use scopes:

```tsx
const $ = useShortcut({ activeScopes: "navigation" })

useEffect(() => {
  const shortcut = $.in("editor").mod.key("s").on(saveFile)
  $.setScopes("editor")

  return () => shortcut.unbind()
}, [$, saveFile])
```

Use structured debug metadata:

```tsx
const $ = useShortcut({
  debug: {
    console: true,
    includeCode: true,
    includeLocation: true,
    includeKeyCode: true,
  },
})

const unsubscribe = $.onDebug((event) => {
  showShortcutTelemetry(event.input.combo, event.attempts)
})
```

Use per-shortcut attempt feedback:

```tsx
useEffect(() => {
  const result = $.shift.key("e").then("e").on(runProbe)

  const removeAttempt = result.onAttempt?.((matched, event, details) => {
    updateAttemptStatus({ matched, key: event.key, status: details?.status })
  })

  return () => {
    removeAttempt?.()
    result.unbind()
  }
}, [$, runProbe, updateAttemptStatus])
```

## API Reference

Read [references/api.md](references/api.md) when you need exact entrypoints, option names, result shapes, parser/formatter utilities, or testing guidance.

## Repository Commands

Use the package scripts from the workspace root:

```bash
bun run package:typecheck
bun run package:test
bun run package:build
```

For docs changes, use:

```bash
bun run docs:lint
bun run docs:test
bun run docs:build
```
