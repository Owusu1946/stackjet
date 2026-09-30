import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Server credentials. `EXPO_PUBLIC_` publishes a value in the app bundle; it does
 * not turn a server credential into a public one, so the prefix grants no
 * exemption here. Naming one of these in mobile code is the leak itself.
 */
const SERVER_CREDENTIALS = [
  "CLERK_SECRET_KEY",
  "BETTER_AUTH_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DIRECT_DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
] as const;

/**
 * Ingestion keys, connection strings, and project identifiers a client SDK is
 * expected to carry. A finding only when the name appears without its public
 * prefix, because these are documented as public in a mobile app.
 */
const CLIENT_INGESTION = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "POSTHOG_API_KEY",
  "POSTHOG_KEY",
  "POSTHOG_SECRET",
  "APTABASE_KEY",
  "APTABASE_SECRET",
] as const;

export const MOBILE_SECRET_PATTERN = new RegExp(
  [...SERVER_CREDENTIALS, ...CLIENT_INGESTION.map((name) => `(?<!EXPO_PUBLIC_)${name}`)].join("|"),
);

const skippedDirectories = new Set(["node_modules", ".expo", "dist", "dist-ios"]);

export function treeContains(directory: string, pattern: RegExp): boolean {
  if (!existsSync(directory)) return false;
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (skippedDirectories.has(entry.name)) return false;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return treeContains(path, pattern);
    return /\.(?:ts|tsx|js|jsx|json)$/.test(entry.name) && pattern.test(readFileSync(path, "utf8"));
  });
}
