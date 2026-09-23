import { productName } from "@expojet/brand";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { gitConfig } from "@/lib/shared";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ active }: { active: "home" | "builder" }) {
  return (
    <header className="site-header">
      <Link href="/" className="site-header-brand" aria-label={`${productName} home`}>
        <Image src="/brand/expojet-mark.svg" alt="" width={28} height={28} priority />
        <span>{productName.toLowerCase()}</span>
      </Link>
      <nav aria-label="Site">
        <Link href="/" aria-current={active === "home" ? "page" : undefined}>
          Home
        </Link>
        <Link href="/docs">Docs</Link>
        <Link href="/builder" aria-current={active === "builder" ? "page" : undefined}>
          Builder
        </Link>
        <a
          className="site-header-github"
          href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
