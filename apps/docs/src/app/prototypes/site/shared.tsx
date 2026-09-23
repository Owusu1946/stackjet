"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  Download,
  GitFork,
  Star,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CommunityData } from "./community";

export type PreviewProps = {
  view: "landing" | "docs";
  setView: (view: "landing" | "docs") => void;
  community: CommunityData;
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
      <Link href="/builder">Builder</Link>
    </nav>
  );
}

export function CopyCommand({
  value = command,
  label = "Copy",
}: {
  value?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" className="site-copy-command" onClick={copy} aria-live="polite">
      <code>{value}</code>
      <span>
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : label}
      </span>
    </button>
  );
}

export function Community({ data }: { data: CommunityData }) {
  const metrics = [
    { label: "Stars", value: data.stars, icon: Star, href: data.repository },
    { label: "Forks", value: data.forks, icon: GitFork, href: `${data.repository}/forks` },
    {
      label: "Contributors",
      value: data.contributorCount,
      icon: UsersRound,
      href: `${data.repository}/graphs/contributors`,
    },
    {
      label: "Weekly downloads",
      value: data.weeklyDownloads,
      icon: CalendarDays,
      href: `https://www.npmjs.com/package/${data.packageName}`,
    },
    {
      label: "Total downloads",
      value: data.totalDownloads,
      icon: Download,
      href: `https://www.npmjs.com/package/${data.packageName}`,
    },
  ];

  return (
    <section className="site-community" aria-labelledby="community-title">
      <div className="site-community-heading">
        <h2 id="community-title">Project activity</h2>
        <a href={data.repository} target="_blank" rel="noreferrer">
          GitHub <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
      <div className="site-metrics">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="site-metric" key={label}>
            <span className="site-metric-label">
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" /> {label}
            </span>
            <strong>{value === null ? "—" : value.toLocaleString()}</strong>
          </a>
        ))}
      </div>
      <div className="site-people">
        <div className="site-people-group">
          <div className="site-people-heading">
            <h3>Maintainers</h3>
            <span>{data.maintainers.length}</span>
          </div>
          <div className="site-person-list">
            {data.maintainers.map((person) => (
              <a href={person.html_url} target="_blank" rel="noreferrer" key={person.login}>
                <Image src={person.avatar_url} alt="" width={34} height={34} />
                <span>{person.name}</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="site-people-group site-contributor-group">
          <div className="site-people-heading">
            <h3>Contributors</h3>
            <a href={`${data.repository}/graphs/contributors`} target="_blank" rel="noreferrer">
              View all <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          {data.contributors.length > 0 ? (
            <div className="site-avatar-list">
              {data.contributors.map((person) => (
                <a
                  href={person.html_url}
                  target="_blank"
                  rel="noreferrer"
                  key={person.id}
                  aria-label={`${person.login}, ${person.contributions} contributions`}
                  title={person.login}
                >
                  <Image src={person.avatar_url} alt="" width={40} height={40} />
                </a>
              ))}
            </div>
          ) : (
            <p>Contributor data is unavailable right now.</p>
          )}
          <a
            className="site-contribute-link"
            href={`${data.repository}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            Contribute to Expojet <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
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
