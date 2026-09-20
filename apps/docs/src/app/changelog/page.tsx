import { createPackageName, productName, releaseVersion } from "@expojet/brand";
import Link from "next/link";

const releases = [
  {
    version: releaseVersion,
    date: "September 20, 2026",
    summary: "Configurable social sign-in for Clerk-powered Expo apps.",
    changes: [
      "Choose Google, Apple, Facebook, and Microsoft sign-in during setup with multi-select support.",
      "Generated auth screens now use Clerk browser SSO with provider-specific SVG icons.",
    ],
  },
  {
    version: "0.5.0",
    date: "September 20, 2026",
    summary: "A stronger production foundation for generated Expo apps.",
    changes: [
      "Added native-feeling liquid-glass navigation and safe-area defaults for Expo Go.",
      "Added custom Clerk sign-in, verification, resend, and forgot-password flows.",
      "Added multi-step onboarding, reset controls, and theme-aware navigation surfaces.",
      "Improved Expo assets, adapter output, and production rollout checks.",
    ],
  },
  {
    version: "0.4.0",
    date: "September 2026",
    summary: "Expanded the generator across the Expo application stack.",
    changes: [
      "Added EAS profiles, icon and state adapters, liquid-glass components, themes, presets, and analytics adapters.",
      "Improved package-manager detection and cross-platform dependency installation.",
    ],
  },
  {
    version: "0.3.0",
    date: "September 2026",
    summary: "Introduced the ecosystem schemas, preset engine, and navigation matrix.",
    changes: [
      "Added validated schemas, preset commands, package-manager selection, and TypeScript controls.",
      "Added Expo Router and React Navigation layouts for tabs, drawers, both, and stack configurations.",
    ],
  },
  {
    version: "0.2.1",
    date: "September 2026",
    summary: "Completed the Expojet rebrand and SDK pack integrity work.",
    changes: [
      "Removed remaining Stackjet branding from generated apps and fixtures.",
      "Updated the SDK pack metadata, schemas, security documentation, and compatibility references.",
    ],
  },
  {
    version: "0.2.0",
    date: "September 2026",
    summary: "Added the backend, database, ORM, and authentication adapter matrix.",
    changes: [
      "Added Neon, Postgres, SQLite, Drizzle, Prisma, Supabase, Firebase, Convex, Express, NestJS, and JWT support.",
      "Added strict mobile secret isolation and backend-aware doctor diagnostics.",
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
