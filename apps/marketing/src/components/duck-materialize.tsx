"use client";

import { useEffect, useState } from "react";

import { useInView } from "@/shared/hooks/use-in-view";
import { usePageVisible } from "@/shared/hooks/use-page-visible";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/* ---------------------------------------------------------------------------
 * DuckMaterialize — the "save as DuckDB" beat made tangible. Three dashed,
 * translucent source files (the in-memory views) collapse as a solid .duckdb
 * file crystallizes on disk: a comet sweeps left→right along the flow, the
 * target pill settles in with a back-eased pop and a pink glow, and the caption
 * flips from "in-memory" to "on disk".
 *
 * This is a rare, explanatory moment, so a little delight is earned. It plays
 * once automatically when scrolled into view to teach the gesture, then replays
 * on hover/click. Reduced motion keeps the state change (opacity, color, glow)
 * but drops the travel and scale.
 * ------------------------------------------------------------------------- */
const SOURCES = ["csv", "json", "parquet"];

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function DuckMaterialize() {
  const [ref, inView] = useInView<HTMLButtonElement>({ threshold: 0.6 });
  const pageVisible = usePageVisible();
  const reduced = usePrefersReducedMotion();

  const [saved, setSaved] = useState(false);
  const [pinned, setPinned] = useState(false);

  // One automatic demo when it first scrolls into view, so the gesture reads
  // even if the visitor never hovers.
  const [demoed, setDemoed] = useState(false);
  useEffect(() => {
    if (!inView || !pageVisible || demoed) return;
    setDemoed(true);
    const on = setTimeout(() => setSaved(true), 520);
    const off = setTimeout(() => {
      setSaved((s) => (pinned ? s : false));
    }, 2200);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [inView, pageVisible, demoed, pinned]);

  const move = !reduced;

  function enter() {
    if (!pinned) setSaved(true);
  }
  function leave() {
    if (!pinned) setSaved(false);
  }
  function toggle() {
    setPinned((p) => {
      const next = !p;
      setSaved(next);
      return next;
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onClick={toggle}
      aria-pressed={saved}
      aria-label="Preview saving the in-memory file views as a DuckDB database on disk"
      className="group/duck mt-1 flex w-full items-center gap-2.5 text-left outline-none transition-transform duration-150 ease-out active:scale-[0.99]"
    >
      {/* source files — the ephemeral in-memory views */}
      <span className="flex shrink-0 items-center gap-1">
        {SOURCES.map((s, i) => (
          <span
            key={s}
            className="rounded-[3px] border border-dashed border-line-strong bg-surface-deeper/70 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-500 [font-family:var(--font-geist-mono),ui-monospace,monospace]"
            style={{
              opacity: saved ? 0.3 : 1,
              filter: saved ? "blur(1.4px)" : "blur(0)",
              transform: saved && move ? "scale(0.92) translateX(3px)" : "none",
              transition: `opacity 320ms ${EASE_OUT}, filter 320ms ${EASE_OUT}, transform 320ms ${EASE_OUT}`,
              transitionDelay: `${(SOURCES.length - 1 - i) * 35}ms`,
            }}
          >
            {s}
          </span>
        ))}
      </span>

      {/* flow track — a comet that runs toward the database while saving */}
      <span className="relative h-px w-6 shrink-0 self-center overflow-visible bg-line">
        <span
          aria-hidden
          className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full"
          style={{
            left: 0,
            backgroundColor: "#f5c0c0",
            boxShadow: "0 0 6px rgba(245,192,192,0.8)",
            opacity: saved && move ? 1 : 0,
            transform: saved && move ? "translateX(24px)" : "translateX(0)",
            transition: `transform 520ms ${EASE_OUT}, opacity 200ms ease`,
          }}
        />
      </span>

      {/* target — the solid .duckdb file that crystallizes on disk */}
      <span
        className="flex shrink-0 items-center gap-1.5 rounded-[3px] px-2 py-0.5 font-mono text-[10px] [font-family:var(--font-geist-mono),ui-monospace,monospace]"
        style={{
          border: saved
            ? "1px solid rgba(245,192,192,0.45)"
            : "1px dashed #3a3138",
          backgroundColor: saved ? "rgba(245,192,192,0.12)" : "transparent",
          color: saved ? "#f5c0c0" : "#6a6a6a",
          boxShadow: saved ? "0 0 16px rgba(245,192,192,0.4)" : "0 0 0 transparent",
          transform: saved && move ? "scale(1)" : move ? "scale(0.96)" : "none",
          transition: `color 300ms ${EASE_OUT}, background-color 300ms ${EASE_OUT}, border-color 300ms ${EASE_OUT}, box-shadow 360ms ${EASE_OUT}, transform 360ms ${EASE_BACK}`,
        }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: saved ? "#f5c0c0" : "#4a444a",
            boxShadow: saved ? "0 0 8px rgba(245,192,192,0.9)" : "none",
            transition: `background-color 300ms ${EASE_OUT}, box-shadow 300ms ${EASE_OUT}`,
          }}
        />
        sales.duckdb
      </span>

      {/* caption — flips from ephemeral to durable */}
      <span className="relative ml-0.5 hidden h-3 flex-1 self-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-700 sm:block [font-family:var(--font-geist-mono),ui-monospace,monospace]">
        <span
          className="absolute inset-0 flex items-center"
          style={{
            opacity: saved ? 0 : 1,
            transition: `opacity 240ms ${EASE_OUT}`,
          }}
        >
          in-memory
        </span>
        <span
          className="absolute inset-0 flex items-center text-[#9a7d86]"
          style={{
            opacity: saved ? 1 : 0,
            transition: `opacity 240ms ${EASE_OUT}`,
          }}
        >
          on disk
        </span>
      </span>
    </button>
  );
}
