"use client";

import { productName } from "@expojet/brand";
import { GithubIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { gitConfig } from "@/lib/shared";
import { ThemeToggle } from "./theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { siteLinks } from "./site-links";

// Slide-in navigation sheet for compact viewports. Also carries the theme
// switcher and GitHub link, which move out of the header on small screens.
export function SiteMenu({ active }: { active: "home" | "builder" }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="site-menu-button" aria-label="Open site navigation">
        <HugeiconsIcon icon={Menu01Icon} size={19} aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" aria-label="Site navigation">
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <div className="site-menu-head">
          <Image src="/brand/expojet-mark.svg" alt="" width={24} height={24} priority />
          <span>{productName}</span>
        </div>
        <nav className="site-menu-nav" aria-label="Site mobile">
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
        <div className="site-menu-foot">
          <ThemeToggle />
          <a
            className="site-menu-github"
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <HugeiconsIcon icon={GithubIcon} size={20} aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
