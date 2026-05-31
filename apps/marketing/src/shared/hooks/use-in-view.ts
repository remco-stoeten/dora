"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type TOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useInView<T extends HTMLElement = HTMLDivElement>({
  threshold = 0,
  rootMargin = "0px",
  once = false,
}: TOptions = {}) {
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(false);

  const handleObserve = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once && ref.current) {
          observerRef.current?.unobserve(ref.current);
        }
      } else if (!once) {
        setInView(false);
      }
    },
    [once],
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserve, {
      threshold,
      rootMargin,
    });
    const el = ref.current;
    if (el) observerRef.current.observe(el);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [handleObserve, threshold, rootMargin]);

  return [ref, inView] as const;
}
