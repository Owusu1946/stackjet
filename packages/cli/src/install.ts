import { existsSync } from "node:fs";
import { join } from "node:path";
import type { PackageManager } from "@expojet/schemas";
import { execa } from "execa";
import type { CliIo } from "./io.js";

export interface InstallResult {
  success: boolean;
  error?: string;
}

export interface GitInitResult {
  success: boolean;
  reason?: "git-not-found" | "already-in-git" | "failed";
  error?: string;
}

export async function installDependencies(
  destination: string,
  packageManager: PackageManager,
  _io?: CliIo,
): Promise<InstallResult> {
  const args = ["install"];
  const isPnpm = packageManager === "pnpm";
  const hasWorkspaceConfig = existsSync(join(destination, "pnpm-workspace.yaml"));

  // If pnpm is used without a local pnpm-workspace.yaml, ignore any enclosing monorepo
  // workspace so packages are installed directly into the target project's node_modules.
  if (isPnpm && !hasWorkspaceConfig) {
    args.push("--ignore-workspace");
  }

  try {
    await execa(packageManager, args, {
      cwd: destination,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      env: {
        ...process.env,
        CI: "true",
      },
    });

    const hasNodeModules =
      existsSync(join(destination, "node_modules")) ||
      existsSync(join(destination, "apps/mobile/node_modules"));

    if (!hasNodeModules) {
      return {
        success: false,
        error: "node_modules directory was not created after install completed.",
      };
    }

    return { success: true };
  } catch (error) {
    const execaError = error as { stderr?: string; stdout?: string; message?: string };
    const detail = execaError.stderr || execaError.stdout || execaError.message || String(error);
    return {
      success: false,
      error: detail.trim(),
    };
  }
}

export async function initGitRepository(destination: string, _io?: CliIo): Promise<GitInitResult> {
  try {
    await execa("git", ["--version"], { stdio: "ignore", shell: process.platform === "win32" });
  } catch {
    return { success: false, reason: "git-not-found" };
  }

  try {
    const check = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: destination,
      stdio: "pipe",
      reject: false,
      shell: process.platform === "win32",
    });
    if (check.exitCode === 0) {
      return { success: false, reason: "already-in-git" };
    }
  } catch {
    // If command errors, assume not in a worktree
  }

  try {
    await execa("git", ["init"], {
      cwd: destination,
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      reason: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
