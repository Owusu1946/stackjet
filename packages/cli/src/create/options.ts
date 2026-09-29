import {
  type AnalyticsAdapter,
  authAdapters,
  type IconLibrary,
  type PackageManager,
  packageManagers,
  type SocialProvider,
  type StateAdapter,
  type SupportedSdk,
  socialProviders,
  styleAdapters,
} from "@expojet/schemas";

export interface Choice<T extends string | number> {
  value: T;
  label: string;
}

const choice = <T extends string | number>(value: T, label: string): Choice<T> => ({
  value,
  label,
});

/** Build options from an ordered value list and a label table, so no value is ever unlabelled. */
function labelled<T extends string | number>(
  values: readonly T[],
  labels: Readonly<Record<string, string>>,
): Choice<T>[] {
  return values.map((value) => choice(value, labels[String(value)] ?? String(value)));
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const sdkOptions: Choice<SupportedSdk>[] = [
  choice(57, "SDK 57 (stable)"),
  choice(58, "SDK 58 (preview)"),
];

export const packageManagerOptions: Choice<PackageManager>[] = packageManagers.map((value) =>
  choice(value, value),
);

export const structureOptions = labelled(["standalone", "monorepo", "monorepo-web"], {
  standalone: "Single Expo app",
  monorepo: "Expo + API monorepo",
  "monorepo-web": "Expo + web + shared API monorepo",
});

export const navigationOptions = labelled(["router", "react-navigation"], {
  router: "Expo Router (File-based routing, recommended)",
  "react-navigation": "React Navigation (Component-based routing)",
});

export const navigationTypeOptions = labelled(["tabs", "drawer", "both", "stack"], {
  tabs: "Tabs (Bottom tabs, recommended)",
  drawer: "Drawer (Side menu drawer)",
  both: "Both (Drawer containing tabs)",
  stack: "Stack (Header-driven stack navigation)",
});

export const standaloneBackendOptions = labelled(["none", "convex"], {
  none: "None (Client only)",
  convex: "Convex (Reactive cloud backend)",
});

export const monorepoBackendOptions = labelled(["hono", "express", "nestjs", "convex"], {
  hono: "Hono (Lightweight & typed RPC, recommended)",
  express: "Express (Classic enterprise REST API)",
  nestjs: "NestJS (Modular enterprise API)",
  convex: "Convex (Reactive cloud backend)",
});

const authLabels: Record<string, string> = {
  clerk: "Clerk",
  "better-auth": "Better Auth (experimental)",
  supabase: "Supabase Auth",
  firebase: "Firebase Auth",
  jwt: "Custom JWT (Self-hosted)",
  none: "None",
};

const STANDALONE_AUTH = ["clerk", "supabase", "firebase", "none"] as const;

/**
 * A client-only app has no API to issue tokens from, so JWT is unavailable there.
 * Better Auth is still gated behind `--experimental` at the point of selection.
 */
export function authOptions(structure: string, experimental: boolean): Choice<string>[] {
  const ids =
    structure === "standalone"
      ? STANDALONE_AUTH
      : authAdapters.filter((id) => id !== "jwt" && (id !== "better-auth" || experimental));
  return labelled(ids, authLabels);
}

export const socialOptions = socialProviders.map((value) => choice(value, capitalize(value)));

export const styleOptions = labelled(styleAdapters, {
  stylesheet: "React Native StyleSheet",
  nativewind: "NativeWind",
  unistyles: "Unistyles 3.0",
  uniwind: "Uniwind",
});

export const iconOptions = labelled(["lucide", "hugeicons", "expo"] satisfies IconLibrary[], {
  lucide: "Lucide (Clean, modern, tree-shakeable, recommended)",
  hugeicons: "Hugeicons (Sharp stroke & rich collection)",
  expo: "Expo Vector Icons (Classic built-in Ionicons)",
});

export const stateOptions = labelled(["none", "zustand", "mobx"] satisfies StateAdapter[], {
  none: "None (React state / Context)",
  zustand: "Zustand (Lightweight hooks-based store, recommended)",
  mobx: "MobX (Observable reactive store with mobx-react-lite)",
});

export const analyticsOptions = labelled(
  ["none", "posthog", "aptabase"] satisfies AnalyticsAdapter[],
  {
    none: "None (Zero telemetry / offline)",
    posthog: "PostHog (Full product analytics, autocapture, session replays, recommended)",
    aptabase: "Aptabase (Privacy-first, lightweight, open-source analytics)",
  },
);

export const monitoringOptions = labelled(["none", "sentry"], {
  none: "None (No error monitoring)",
  sentry: "Sentry (Crash reporting, performance traces, EAS source map uploads)",
});

/**
 * Which databases a project can use depends on what else is already chosen, and
 * a standalone app has no Postgres to talk to. The caller passes the decision
 * rather than this module reading flags, so the rule stays visible at the call site.
 */
export function databaseOptions(
  context: "standalone" | "better-auth" | "monorepo",
): Choice<string>[] {
  if (context === "standalone") {
    return labelled(["none", "sqlite", "supabase"], {
      none: "None",
      sqlite: "Local SQLite (expo-sqlite)",
      supabase: "Supabase (Cloud)",
    });
  }
  const server = labelled(["neon", "supabase", "postgres"], {
    neon: "Neon Serverless Postgres (recommended)",
    supabase: "Supabase Postgres (Cloud)",
    postgres: "Local PostgreSQL (Docker)",
  });
  if (context === "better-auth") return server;
  return [...server, choice("sqlite", "SQLite (LibSQL)"), choice("none", "None")];
}

export function ormOptions(context: "standalone" | "monorepo"): Choice<string>[] {
  if (context === "standalone") {
    return labelled(["drizzle", "none"], {
      drizzle: "Drizzle ORM (recommended)",
      none: "None (Raw SQLite)",
    });
  }
  return labelled(["drizzle", "prisma", "none"], {
    drizzle: "Drizzle ORM (recommended)",
    prisma: "Prisma ORM",
    none: "None (Raw driver)",
  });
}

export const socialProviderValues = (value: string): SocialProvider => value as SocialProvider;
