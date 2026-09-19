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
  try {
    await execa(packageManager, ["install"], {
      cwd: destination,
      stdio: "pipe",
      shell: false,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function initGitRepository(destination: string, _io?: CliIo): Promise<GitInitResult> {
  try {
    await execa("git", ["--version"], { stdio: "ignore", shell: false });
  } catch {
    return { success: false, reason: "git-not-found" };
  }

  try {
    const check = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: destination,
      stdio: "pipe",
      reject: false,
      shell: false,
    });
    if (check.exitCode === 0) {
      return { success: false, reason: "already-in-git" };
    }
  } catch {
    // If command errors, assume not in a worktree
  }

  try {
    await execa("git", ["init"], { cwd: destination, stdio: "pipe", shell: false });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      reason: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
