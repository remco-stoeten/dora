"use client";

import { useEffect, useRef, useState } from "react";

import { CornerTick } from "@/components/corner-tick";
import { SectionFrame } from "@/components/section-frame";
import { FileQueryCard } from "@/components/features/file-query-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { usePageVisible } from "@/shared/hooks/use-page-visible";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

const CELL_CLASS =
  "relative min-h-[340px] scroll-mt-28 border-r border-b border-[#2b252c] overflow-hidden transition-colors duration-[450ms] ease-out hover:bg-[rgba(245,192,192,0.06)]";

const POINTS = [
  {
    head: "No import step",
    body: "Point Dora at a .csv, .tsv, .parquet, .json, or .ndjson file — it reads the schema in place.",
  },
  {
    head: "Real SQL, real joins",
    body: "Filter, aggregate, and JOIN across several dropped files in one query, with results in table or JSON view.",
  },
  {
    head: "Read-only by design",
    body: "Your source files are never modified. Materialize the result into any connected database when you're ready.",
  },
];

/* ---------------------------------------------------------------------------
 * File Query — a standalone row that answers "what can it open": not just
 * database engines, but flat files you'd otherwise load into one first.
 * ------------------------------------------------------------------------- */
export function FileQuerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const pageVisible = usePageVisible();
  const reducedMotion = usePrefersReducedMotion();
  const animate = isInView && pageVisible && !reducedMotion;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "160px 0px", threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full">
      <SectionFrame />

      <div className="border-b border-r border-[#2b252c] px-6 py-12 sm:px-8">
        <ScrollReveal delay={40}>
          <h2 className="mb-1 font-[family-name:var(--font-pixel)] text-2xl font-light italic text-[#7a7a7a]">
            That CSV doesn&apos;t need a database first.
          </h2>
          <h3 className="text-balance font-[family-name:var(--font-pixel)] text-3xl font-semibold text-[#f0f0f0]">
            Drop a file. Query it like a table.
          </h3>
        </ScrollReveal>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2">
        <CornerTick className="hidden md:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <CornerTick className="hidden md:block left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
        <CornerTick className="hidden md:block left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2" />

        <div className={`${CELL_CLASS} flex`}>
          <ScrollReveal className="flex h-full w-full" delay={0}>
            <div className="flex h-full w-full flex-col justify-center gap-5 px-6 py-10 sm:px-8">
              {POINTS.map((point) => (
                <div key={point.head} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "#f5c0c0" }}
                  />
                  <div>
                    <p className="font-[family-name:var(--font-pixel)] text-[13px] font-medium text-[#e8e0e8]">
                      {point.head}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8a8a8a]">
                      {point.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <div className={`${CELL_CLASS} flex`}>
          <ScrollReveal className="flex h-full w-full" delay={90}>
            <FileQueryCard animate={animate} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
