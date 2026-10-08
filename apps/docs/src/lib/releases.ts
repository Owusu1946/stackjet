import { releaseVersion } from "@expojet/brand";

/** Release notes, newest first. The changelog page and the home page read from here. */
export const releases = [
  {
    version: releaseVersion,
    date: "October 8, 2026",
    summary: "Optional, stack-aware agent skills for your coding tools.",
    changes: [
      "Pinned direct CLI runtime dependencies to reviewed versions and clarified team setup and EAS deployment responsibilities.",
      "Choose recommended skills or customize individual Expo and selected backend skills after setup; installation is optional and skipped by default.",
      "Install skills later with expojet skills install, with coding-agent selection and project or global scope.",
      "Preview pinned sources and destinations, preserve existing edits, and retry partial installations safely.",
      "Record skill provenance separately without changing your app manifest or generated application files.",
    ],
  },
  {
    version: "0.8.0",
    date: "October 2, 2026",
    summary: "Optional SDK 58 beta support and more reliable project generation.",
    changes: [
      "Added optional Expo SDK 58 beta support in the CLI and Stack Builder; SDK 57 remains the default.",
      "Preserved SDK, analytics, haptics, and social-provider choices when saving and loading presets.",
      "Fixed partial configuration precedence, interactive shorthand flags, and cancellation handling.",
      "Unified generated-project and Stack Builder preview rendering, with 64 generated-output baseline scenarios.",
      "Strengthened overlapping JSON and composition conflict checks, Metro ownership checks, and copied-tree symlink validation.",
      "Improved doctor checks for known server credentials in mobile files. A shared composition-ownership edge case remains tracked in GitHub issue #84.",
    ],
  },
  {
    version: "0.7.0",
    date: "September 23, 2026",
    summary:
      "Tactile Haptics Engine, Sentry error monitoring in Stack Builder, and CLI diagnostics.",
    changes: [
      "Added Tactile Haptics Engine with expo-haptics integration, cross-platform safety, and pre-wired interactive feedback in ThemeToggle, CounterCard, and navigation tabs.",
      "Added Sentry error monitoring adapter with native crash handling, side-effect initialization, and Stack Builder integration.",
      "Added doctor diagnostic checks for haptics integrity and lockfile synchronization.",
      "Fixed dark mode color consistency and text contrast on the landing page and documentation navigation surfaces.",
      "Fixed Clerk unconfigured environment runtime safety and socials CLI flag mapping.",
    ],
  },
  {
    version: "0.6.3",
    date: "September 21, 2026",
    summary: "Landing analytics, generated app assets, and release polish.",
    changes: [
      "Added Vercel Web Analytics to measure Expojet landing-page visitors and page views.",
      "Added the default Expo icon, splash, adaptive icon, monochrome icon, and favicon asset set to generated projects.",
      "Updated the public version surfaces and fixed the landing build's Biome import-order check.",
    ],
  },
  {
    version: "0.6.2",
    date: "September 21, 2026",
    summary: "Supabase email OTP authentication and clearer generated-project guidance.",
    changes: [
      "Added eight-digit Supabase email OTP authentication with boxed-code verification and resend support.",
      "Documented Supabase SMTP and Magic link or OTP template setup, including the {{ .Token }} variable.",
      "Improved generated auth guidance so OTP projects do not depend on localhost redirects.",
    ],
  },
  {
    version: "0.6.1",
    date: "September 20, 2026",
    summary: "Earlier validation and stronger generated Clerk and Convex projects.",
    changes: [
      "Validate project names, destinations, presets, and incompatible options before the interactive flow reaches its end.",
      "Fix generated Clerk and Convex user synchronization, global dark mode, and onboarding-before-auth routing.",
    ],
  },
  {
    version: "0.5.1",
    date: "September 20, 2026",
    summary: "Configurable social sign-in and a visual Expo stack builder.",
    changes: [
      "Choose Google, Apple, Facebook, and Microsoft sign-in during setup with multi-select support.",
      "Generated auth screens now use Clerk browser SSO with provider-specific SVG icons.",
      "Configure the complete Expojet stack in a dedicated guided builder and copy a production-ready CLI command.",
      "Stack choices use locally bundled technology icons, smooth step navigation, and automatic compatibility normalization.",
      "Preview the exact generated file tree and file contents directly from the same operation plan used by the CLI executor.",
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
