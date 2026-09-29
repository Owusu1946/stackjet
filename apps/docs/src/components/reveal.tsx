"use client";

import { useEffect } from "react";

/**
 * Reveals every `[data-reveal]` element once it enters the viewport.
 *
 * The hidden state lives in CSS (`[data-reveal]:not([data-revealed])`), so a failure here would
 * leave content invisible. Three things therefore guarantee visibility:
 *
 * 1. Anything already inside the viewport is revealed synchronously on mount, without waiting for
 *    the observer's first callback.
 * 2. The observer reveals the rest as they scroll in.
 * 3. A timeout reveals everything that is left, so a browser that never fires the callback cannot
 *    strand the page.
 *
 * `prefers-reduced-motion` needs no branch here: `global.css` switches off every transition and
 * animation globally, which leaves the revealed state unchanged.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])");
    if (targets.length === 0) return;

    const reveal = (element: Element) => {
      (element as HTMLElement).dataset.revealed = "true";
    };

    // 1. Reveal what is already on screen, without depending on an async callback.
    for (const target of targets) {
      if (target.getBoundingClientRect().top < window.innerHeight) reveal(target);
    }

    // 2. Reveal the rest as they scroll in, and stop observing once they have.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    for (const target of targets) observer.observe(target);

    // 3. Never leave content hidden.
    const failsafe = window.setTimeout(() => {
      for (const target of targets) reveal(target);
      observer.disconnect();
    }, 3000);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return null;
}
