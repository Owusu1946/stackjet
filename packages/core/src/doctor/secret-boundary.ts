import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The lookbehind covers the whole alternation, not just part of it. Guarding only some names meant
// `EXPO_PUBLIC_CLERK_SECRET_KEY` still matched the bare `CLERK_SECRET_KEY` alternative and the
// doctor reported a leak in a correctly prefixed variable.
// Adding /g here would make `test` stateful via lastIndex and silently alternate results.
export const MOBILE_SECRET_PATTERN =
  /(?<!EXPO_PUBLIC_)(CLERK_SECRET_KEY|BETTER_AUTH_SECRET|SUPABASE_SERVICE_ROLE_KEY|DIRECT_DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|DATABASE_URL|SUPABASE_URL|POSTHOG_API_KEY|POSTHOG_KEY|POSTHOG_SECRET|APTABASE_KEY|APTABASE_SECRET|SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT)/;

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
