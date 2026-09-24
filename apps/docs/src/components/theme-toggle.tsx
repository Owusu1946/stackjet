"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "fumadocs-ui/provider/base";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="site-theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="site-theme-toggle-icon" data-active={!isDark}>
        <HugeiconsIcon icon={Sun03Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="site-theme-toggle-icon" data-active={isDark}>
        <HugeiconsIcon icon={Moon02Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}
