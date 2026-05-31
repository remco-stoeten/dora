# @remcostoeten/use-shortcut API Notes

Load this reference for exact API names, option choices, and implementation patterns.

## Entrypoints

- `@remcostoeten/use-shortcut/react`: preferred React entrypoint for `useShortcut`, `useShortcutMap`, `registerShortcutMap`, `createShortcutGroup`, and `useShortcutGroup`.
- `@remcostoeten/use-shortcut`: compatibility barrel.
- `@remcostoeten/use-shortcut/parser`: parser and matcher utilities.
- `@remcostoeten/use-shortcut/formatter`: display helpers such as `formatShortcut()` and modifier symbols.
- `@remcostoeten/use-shortcut/constants`: platform and normalization constants.

## Fluent Builder

Prefer `useShortcutBinding()` for a single cleanup-safe binding:

```tsx
useShortcutBinding("mod+s", save, {
  description: "Save document",
  preventDefault: true,
})

useShortcutBinding({
  keys: ["escape", "mod+d"],
  handler: closeDialog,
  options: { description: "Close dialog" },
})
```

Use the fluent builder when you need advanced chaining, `onDebug`, recording, or imperative scope control.

Use modifiers before `.key(...)`:

```tsx
useEffect(() => {
  const shortcuts = [
    $.mod.key("s").on(save),
    $.cmd.shift.key("p").on(openPalette),
    $.key("escape").on(closeDialog),
  ]

  return () => shortcuts.forEach((shortcut) => shortcut.unbind())
}, [$, save, openPalette, closeDialog])
```

Use `.then(...)` for multi-step sequences:

```tsx
useEffect(() => {
  const shortcut = $.key("g").then("d").on(goToDashboard)
  return () => shortcut.unbind()
}, [$, goToDashboard])
```

Use `.bind(...)` for string combos:

```tsx
useEffect(() => {
  const shortcuts = [
    $.bind("mod+k").on(openPalette),
    $.bind(["escape", "mod+d"]).on(closeDialog),
  ]

  return () => shortcuts.forEach((shortcut) => shortcut.unbind())
}, [$, openPalette, closeDialog])
```

Use `.except(...)` to skip a shortcut in common contexts:

```tsx
useEffect(() => {
  const shortcut = $.mod.key("b").except(["typing", "modal"]).on(toggleSidebar)
  return () => shortcut.unbind()
}, [$, toggleSidebar])
```

Preset names: `input`, `editable`, `typing`, `modal`, `disabled`. Custom predicates receive the `KeyboardEvent` and return `true` to skip.

## Hook Options

`useShortcut(options)` accepts:

- `debug?: boolean | ShortcutDebugOptions`
- `delay?: number`
- `ignoreInputs?: boolean` defaults to `true`
- `target?: HTMLElement | Window | null`
- `eventType?: "keydown" | "keyup"`
- `disabled?: boolean`
- `activeScopes?: string | string[]`
- `sequenceTimeout?: number`
- `conflictWarnings?: boolean`
- `onConflict?: (conflict) => void`
- `eventFilter?: (event) => boolean`

Prefer `debug: { ... }` over `debug: true` when UI or telemetry needs inspectable metadata:

```tsx
const $ = useShortcut({
  debug: {
    console: true,
    includeCode: true,
    includeLocation: true,
    includeKeyCode: true,
  },
})
```

## Handler Options

`.on(handler, options)` and `.handle({ handler, ...options })` accept:

- `preventDefault?: boolean` defaults to `true`
- `stopPropagation?: boolean`
- `delay?: number`
- `description?: string`
- `disabled?: boolean`
- `except?: ExceptPreset | ExceptPreset[] | ExceptPredicate`
- `scopes?: string | string[]`
- `sequenceTimeout?: number`
- `priority?: number`
- `stopOnMatch?: boolean`

Use `priority` and `stopOnMatch` for intentional overlaps:

```tsx
useEffect(() => {
  const primary = $.mod.key("k").on(openPalette, { priority: 10, stopOnMatch: true })
  const telemetry = $.mod.key("k").on(trackShortcutUse, { priority: 0 })

  return () => {
    primary.unbind()
    telemetry.unbind()
  }
}, [$, openPalette, trackShortcutUse])
```

## Result Handles

Shortcut registrations return `ShortcutResult`:

- `unbind()`
- `display`
- `combo`
- `trigger()`
- `isEnabled`
- `enable()`
- `disable()`
- `onAttempt(callback)`

Use `onAttempt` for per-shortcut success, mismatch, partial sequence, and wrong-order UI. Keep any visible status accessible with `aria-live="polite"` and text/icons, not color alone.

## Shortcut Maps

Use `useShortcutMap()` in components:

```tsx
useShortcutMap(
  {
    save: { keys: "mod+s", handler: save, options: { preventDefault: true } },
    close: { keys: "escape", handler: closeDialog },
    dashboard: { keys: "g then d", handler: goToDashboard },
  },
  { ignoreInputs: false },
)
```

Use `registerShortcutMap(builder, map)` when you already have a builder and need returned handles:

```tsx
const results = registerShortcutMap($, shortcutMap)
results.save.disable()
```

Map `keys` can be a combo string, a sequence string such as `g then d`, a space-separated sequence such as `g d`, or a string array.

## Scopes

Use scopes for app modes such as `navigation`, `editor`, `modal`, or `command-palette`:

```tsx
const $ = useShortcut({ activeScopes: ["navigation"] })

useEffect(() => {
  const shortcut = $.in("editor").mod.key("s").on(saveFile)
  $.enableScope("editor")
  $.disableScope("navigation")

  return () => shortcut.unbind()
}, [$, saveFile])
```

Builder scope methods:

- `.in(scope | scopes)` sets required scopes for upcoming chain calls.
- `setScopes(scopes)` replaces active scopes.
- `enableScope(scope)` adds one active scope.
- `disableScope(scope)` removes one active scope.
- `getScopes()` returns active scope names.
- `isScopeActive(scope)` checks one scope.

## Recording

Use `$.record({ timeoutMs })` to capture the next key combo:

```tsx
const combo = await $.record({ timeoutMs: 1000 })
```

Recording returns parseable combo strings such as `ctrl+k` or `ctrl+space`. Handle timeout and cancellation states in the caller UI.

## Parser And Formatter Utilities

Use parser utilities when validating saved user bindings or building custom matchers:

```ts
const parsed = parseShortcut("mod+shift+p")
const parsedList = parseShortcuts(["mod+s", "escape"])
```

Use formatter utilities for platform-aware UI:

```ts
const label = formatShortcut("mod+s")
```

Prefer locale- and platform-aware display labels over hand-built modifier text.

## Tests

For package work, prefer focused Vitest coverage in `packages/use-shortcut/src/__tests__/`.

Useful event pattern:

```ts
window.dispatchEvent(
  new KeyboardEvent("keydown", {
    key: "k",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  }),
)
```

Cover:

- modifier and key matching
- input/editable guard behavior
- sequence timeout and partial/wrong-order attempts
- scope activation and deactivation
- conflict reporting for exact and sequence-prefix overlaps
- cleanup via `unbind()` or groups
- debug stream and `onAttempt` payloads when debug UI depends on them
