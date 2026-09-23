"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Compose } from "./compose";
import { Guide } from "./guide";
import { Index } from "./index";
import type { PreviewProps } from "./shared";
import "./site.css";

const variants: { name: string; component: (props: PreviewProps) => React.ReactNode }[] = [
  { name: "Index", component: Index },
  { name: "Compose", component: Compose },
  { name: "Guide", component: Guide },
];

export function SitePrototype() {
  const [current, setCurrent] = useState(0);
  const [view, setView] = useState<PreviewProps["view"]>("landing");
  const [mount, setMount] = useState(0);
  const [ready, setReady] = useState(false);
  const picker = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const moveHighlight = useCallback(() => {
    const item = buttons.current[current];
    if (!item || !highlight.current) return;
    highlight.current.style.width = `${item.offsetWidth}px`;
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`;
  }, [current]);

  useEffect(() => {
    const value = Number(new URLSearchParams(window.location.search).get("v"));
    if (value >= 1 && value <= variants.length) setCurrent(value - 1);
    const first = window.requestAnimationFrame(() => {
      const second = window.requestAnimationFrame(() => setReady(true));
      return () => window.cancelAnimationFrame(second);
    });
    return () => window.cancelAnimationFrame(first);
  }, []);

  useLayoutEffect(() => {
    moveHighlight();
    window.addEventListener("resize", moveHighlight);
    return () => window.removeEventListener("resize", moveHighlight);
  }, [moveHighlight]);

  const select = useCallback((index: number) => {
    if (index < 0 || index >= variants.length) return;
    setCurrent(index);
    setView("landing");
    setMount((value) => value + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(index + 1));
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (number >= 1 && number <= variants.length) select(number - 1);
      else if (event.key === "ArrowRight") select((current + 1) % variants.length);
      else if (event.key === "ArrowLeft") select((current - 1 + variants.length) % variants.length);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, select]);

  const Variant = variants[current].component;

  return (
    <div className="site-prototype">
      <div key={`${current}-${mount}`} className="site-stage">
        <Variant view={view} setView={setView} />
      </div>
      <nav
        ref={picker}
        className="proto-picker"
        aria-label="Prototype variants"
        data-ready={ready ? "" : undefined}
      >
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {variants.map((variant, index) => (
          <button
            type="button"
            key={variant.name}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            className="proto-picker-item"
            data-active={current === index ? "" : undefined}
            aria-current={current === index ? "true" : undefined}
            onClick={() => select(index)}
          >
            {variant.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
