import { createPackageName, productName, releaseVersion } from "@expojet/brand";
import Link from "next/link";

const releases = [
  {
    version: releaseVersion,
    date: "September 20, 2026",
    summary: "A sturdier foundation for generated Expo apps.",
    changes: [
      "Native-feeling liquid-glass navigation and safe-area defaults for Expo Go.",
      "Custom Clerk sign-in, verification, resend, and forgot-password flows.",
      "Multi-step onboarding with reset controls and theme-aware surfaces.",
      "More reliable Expo assets, adapter output, and production rollout checks.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      <Link href="/" className="text-sm text-fd-muted-foreground hover:text-fd-foreground">
        ← Back to {productName}
      </Link>
      <header className="mt-10 border-b border-fd-border pb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
          {productName}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-4 max-w-2xl text-lg text-fd-muted-foreground">
          Product updates for {createPackageName}, the production-ready Expo starter.
        </p>
      </header>
      <div className="divide-y divide-fd-border">
        {releases.map((release) => (
          <article key={release.version} className="py-10 first:pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-2xl font-semibold">v{release.version}</h2>
              <time className="text-sm text-fd-muted-foreground">{release.date}</time>
            </div>
            <p className="mt-3 text-fd-muted-foreground">{release.summary}</p>
            <ul className="mt-6 list-disc space-y-3 pl-5 text-fd-foreground/85">
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
