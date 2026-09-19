import { execSync } from "node:child_process";
import type { PackageManager } from "@expojet/schemas";

export interface DetectedPackageManager {
  manager: PackageManager;
  version?: string | undefined;
}

const SUPPORTED_MANAGERS: readonly PackageManager[] = ["pnpm", "bun", "yarn", "npm"] as const;

/**
 * Extracts the package manager and version from an npm_config_user_agent string.
 * Example: `pnpm/10.4.0 npm/? node/v22.12.0 win32 x64`
 */
export function parseUserAgent(userAgent?: string): DetectedPackageManager | undefined {
  if (!userAgent || typeof userAgent !== "string") {
    return undefined;
  }
  const firstToken = userAgent.trim().split(/\s+/)[0];
  if (!firstToken) {
    return undefined;
  }
  const [rawName, rawVersion] = firstToken.split("/");
  const manager = rawName?.toLowerCase();
  if (manager === "pnpm" || manager === "bun" || manager === "yarn" || manager === "npm") {
    const version = rawVersion?.trim();
    return {
      manager,
      version: version && version.length > 0 ? version : undefined,
    };
  }
  return undefined;
}

/**
 * Probes the system PATH to get the version of a given package manager binary.
 */
export function getBinaryVersion(manager: PackageManager): string | undefined {
  try {
    const output = execSync(`${manager} --version`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 1500,
    });
    return output.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Detects the invoking package manager from environment variables (npm_config_user_agent)
 * or falls back to probing the host PATH.
 */
export function detectPackageManager(env: NodeJS.ProcessEnv = process.env): DetectedPackageManager {
  const fromAgent = parseUserAgent(env.npm_config_user_agent);
  if (fromAgent) {
    return fromAgent;
  }

  for (const candidate of SUPPORTED_MANAGERS) {
    const version = getBinaryVersion(candidate);
    if (version) {
      return { manager: candidate, version };
    }
  }

  return { manager: "pnpm" };
}
