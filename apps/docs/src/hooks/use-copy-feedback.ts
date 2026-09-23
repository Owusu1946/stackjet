"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

/** Keeps only the latest copy result and its reset timer. */
export function useCopyFeedback(value: string, duration = 1800) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0);
  const lastValue = useRef(value);

  useEffect(() => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    request.current += 1;
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
  }, [value]);

  useEffect(
    () => () => {
      request.current += 1;
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    const current = ++request.current;
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      if (request.current !== current) return;
      setStatus("copied");
    } catch {
      if (request.current !== current) return;
      setStatus("failed");
    }
    timer.current = setTimeout(() => {
      if (request.current === current) setStatus("idle");
    }, duration);
  }, [duration, value]);

  return { status, copy };
}
