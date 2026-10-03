"use client";

import { useEffect, useEffectEvent } from "react";

type Marker = { stage: number; offset: number };

/**
 * Reports the flight stage for the current window scroll position.
 *
 * Each `[data-flight-stage]` element marks a whole stage. A stage is reached when its element's
 * top scrolls to where the first marker started, so the hero is stage 0 at the top of the page.
 * Between markers the stage is fractional. With reduced motion it only steps between markers.
 */
export function useFlightProgress(onProgress: (stage: number) => void) {
  const report = useEffectEvent(onProgress);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let markers: Marker[] = [];
    let frame = 0;

    const measure = () => {
      const elements = [...document.querySelectorAll<HTMLElement>("[data-flight-stage]")];
      const tops = elements.map((element) => element.getBoundingClientRect().top + window.scrollY);
      const origin = Math.min(...tops);
      // The last stages may sit too close to the end of the page to reach the top.
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      markers = elements
        .map((element, index) => ({
          stage: Number(element.dataset.flightStage),
          offset: Math.min((tops[index] ?? origin) - origin, maxScroll),
        }))
        .sort((left, right) => left.offset - right.offset);
    };

    const stageAt = (scroll: number) => {
      const first = markers[0];
      if (!first) return 0;
      if (reduceMotion.matches) {
        // Step early, before the next section's content scrolls up to where the jet was.
        const lead = scroll + window.innerHeight * 0.75;
        return markers.findLast((marker) => marker.offset <= lead)?.stage ?? first.stage;
      }
      let from = first;
      for (const to of markers) {
        if (scroll < to.offset) {
          const span = to.offset - from.offset;
          const t = span > 0 ? Math.max(0, (scroll - from.offset) / span) : 1;
          return from.stage + (to.stage - from.stage) * t;
        }
        from = to;
      }
      return from.stage;
    };

    const update = () => {
      frame = 0;
      report(stageAt(window.scrollY));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    // Content height changes (fonts, images, live data) move the markers.
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    reduceMotion.addEventListener("change", schedule);
    remeasure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      reduceMotion.removeEventListener("change", schedule);
    };
  }, []);
}
