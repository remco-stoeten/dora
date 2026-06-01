import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A small "+" crosshair marker that sits on the intersection of the vertical
 * rails and a horizontal divider, the signature detail of the zeroleaks layout.
 */
export function Crosshair({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-30 block h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2",
        className,
      )}
    >
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-frame-strong" />
      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-frame-strong" />
    </span>
  )
}

/**
 * The centered column with continuous left/right rails. Every section lives
 * inside this so the vertical lines run uninterrupted top to bottom.
 */
export function FrameShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-5xl border-x border-frame", className)}>
      {children}
    </div>
  )
}

/**
 * A stacked section separated from the previous one by a full-width divider,
 * with crosshairs pinned to the rails at the divider.
 */
export function FrameSection({
  children,
  className,
  id,
  divider = true,
  crosshairs = true,
}: {
  children: ReactNode
  className?: string
  id?: string
  divider?: boolean
  crosshairs?: boolean
}) {
  return (
    <section id={id} className={cn("relative", divider && "border-t border-frame", className)}>
      {divider && crosshairs ? (
        <>
          <Crosshair className="left-0 top-0" />
          <Crosshair className="right-0 top-0 translate-x-1/2" />
        </>
      ) : null}
      {children}
    </section>
  )
}

/**
 * Closes the bottom of the shell with a divider + bottom crosshairs so the
 * rails terminate cleanly instead of running off the page.
 */
export function FrameFoot({ className }: { className?: string }) {
  return (
    <div className={cn("relative border-t border-frame", className)}>
      <Crosshair className="left-0 top-0" />
      <Crosshair className="right-0 top-0 translate-x-1/2" />
    </div>
  )
}
