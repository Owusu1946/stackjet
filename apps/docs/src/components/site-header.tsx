import { productName } from "@expojet/brand";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { gitConfig } from "@/lib/shared";
import { siteLinks } from "./site-links";
import { SiteMenu } from "./site-menu";
import { SiteSearch } from "./site-search";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ active }: { active: "home" | "builder" }) {
  return (
    <header className="site-header">
      <Link href="/" className="site-header-brand" aria-label={`${productName} home`}>
        <Image src="/brand/expojet-mark.svg" alt="" width={24} height={24} priority />
        <span>{productName}</span>
      </Link>
      <nav className="site-header-links" aria-label="Site">
        {siteLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active === "builder" && link.href === "/builder" ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="site-header-actions">
        <SiteSearch />
        <ThemeToggle />
        <a
          className="site-header-github"
          href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <HugeiconsIcon icon={GithubIcon} size={20} aria-hidden="true" />
        </a>
      </div>
      <SiteMenu active={active} />
    </header>
  );
}
