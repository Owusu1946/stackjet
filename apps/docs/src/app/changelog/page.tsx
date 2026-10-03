import { createPackageName, productName } from "@expojet/brand";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { releases } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes and product updates for Expojet.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogPage() {
  return (
    <main className="changelog-page mx-auto min-h-screen w-full max-w-4xl px-6 py-10 sm:px-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} aria-hidden="true" />
        Back to {productName}
      </Link>
      <header className="mt-6 border-b border-fd-border pb-5">
        <h1 className="text-4xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-2 max-w-2xl text-base text-fd-muted-foreground">
          Product updates for {createPackageName}, the production-ready Expo starter.
        </p>
      </header>
      <div className="divide-y divide-fd-border">
        {releases.map((release) => (
          <article key={release.version} className="py-7 first:pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-2xl font-semibold">v{release.version}</h2>
              <time className="text-sm text-fd-muted-foreground">{release.date}</time>
            </div>
            <p className="mt-2 text-fd-muted-foreground">{release.summary}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-fd-foreground/85">
              {release.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
