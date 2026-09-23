"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type PreviewProps = {
  view: "landing" | "docs";
  setView: (view: "landing" | "docs") => void;
};

export const command = "npx create-expojet@latest my-app";

export function Mark({ size = 34 }: { size?: number }) {
  return <Image src="/brand/expojet-mark.svg" alt="" width={size} height={size} priority />;
}

export function PreviewNav({ view, setView }: PreviewProps) {
  return (
    <nav className="site-preview-nav" aria-label="Preview pages">
      <button
        type="button"
        aria-current={view === "landing" ? "page" : undefined}
        onClick={() => setView("landing")}
      >
        Home
      </button>
      <button
        type="button"
        aria-current={view === "docs" ? "page" : undefined}
        onClick={() => setView("docs")}
      >
        Docs
      </button>
      <Link href="/builder">Builder ↗</Link>
    </nav>
  );
}

export function CopyCommand({ label = "Copy command" }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" className="site-copy-command" onClick={copy} aria-live="polite">
      <code>{command}</code>
      <span>{copied ? "Copied ✓" : label}</span>
    </button>
  );
}

export function DocsLinks() {
  return (
    <div className="site-doc-links">
      <Link href="/docs/installation">Installation ↗</Link>
      <Link href="/docs/quick-start">Quick start ↗</Link>
      <Link href="/docs/guides/navigation/expo-router">Navigation ↗</Link>
      <Link href="/docs/guides/authentication/providers">Authentication ↗</Link>
    </div>
  );
}
