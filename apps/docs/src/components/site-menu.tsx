"use client";

import { productName } from "@expojet/brand";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { siteLinks } from "./site-links";

// Slide-in navigation sheet for compact viewports. Always mounted so the
// open/close transitions can run in both directions.
export function SiteMenu({ active }: { active: "home" | "builder" }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        className="site-menu-button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open site navigation"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Menu01Icon} size={19} aria-hidden="true" />
      </button>
      <div
        className="site-menu-backdrop"
        data-open={open}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        id={panelId}
        className="site-menu-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="site-menu-head">
          <span>{productName}</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="site-menu-close"
            aria-label="Close site navigation"
            onClick={() => setOpen(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={17} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Site mobile">
          {siteLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === "builder" && link.href === "/builder" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
