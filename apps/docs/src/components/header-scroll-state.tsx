"use client";

import { useEffect } from "react";

/**
 * Marks the page header with `data-scrolled` once the document has scrolled, so a sticky header
 * can gain a border and a shadow to separate itself from content passing underneath.
 *
 * A tiny imperative island rather than a hook, so `SiteHeader` stays a server component and the
 * header markup ships without any client JavaScript of its own.
 */
export function HeaderScrollState({ threshold = 8 }: { threshold?: number }) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;

    // `null` rather than `0`, because a pending rAF handle is 0 on the first call and
    // `frame ??= requestAnimationFrame(...)` would never schedule with an initial 0.
    let frame: number | null = null;
    const read = () => {
      frame = null;
      header.dataset.scrolled = window.scrollY > threshold ? "true" : "false";
    };
    const onScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return null;
}
