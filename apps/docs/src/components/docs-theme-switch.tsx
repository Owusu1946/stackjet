"use client";

import { ThemeToggle } from "./theme-toggle";

// Theme switcher for the docs sidebar slots. It only shows inside the mobile
// drawer; the desktop sidebar copy is hidden with CSS.
export function DocsThemeSwitch({ className }: { className?: string }) {
  return (
    <span className={className ? `docs-theme-switch ${className}` : "docs-theme-switch"}>
      <ThemeToggle />
    </span>
  );
}
