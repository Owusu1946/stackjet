import * as p from "@clack/prompts";
import { ExitCode, type ExitCodeValue, ProjectPathError, savePreset } from "@expojet/core";
import { ZodError } from "zod";
import { CliError } from "../errors.js";
import { generateCreatePlan } from "../generation.js";
import { initGitRepository, installDependencies } from "../install.js";
import type { CliIo } from "../io.js";
import { offerCreateSkills, validateCreateSkills } from "../skills/post-create.js";
import { recommendSkills } from "../skills/recommend.js";
import { readConfig } from "./config.js";
import type { CreateFlags } from "./flags.js";
import { normalizeNonInteractiveCreate } from "./non-interactive.js";
import { presetConfigFrom } from "./presets.js";
import { promptCreate } from "./prompts.js";
import { printResult } from "./report.js";

export async function runCreate(
  projectName: string | undefined,
  flags: CreateFlags,
  io: CliIo,
): Promise<ExitCodeValue> {
  validateCreateSkills(flags);
  if (flags.savePreset !== undefined && !flags.savePreset.trim()) {
    throw new CliError(
      "Preset name cannot be empty",
      ExitCode.InvalidInput,
      "Pass a non-empty value to --save-preset.",
    );
  }
  const config = readConfig(io.cwd, flags.config);
  try {
    const input = flags.yes
      ? normalizeNonInteractiveCreate(projectName, flags, config, io.cwd)
      : await promptCreate(projectName, flags, config, io.cwd);
    for (const id of flags.skill ?? []) {
      if (!recommendSkills(input).skills.some((skill) => skill.id === id)) {
        throw new CliError(`Skill is not applicable to this stack: ${id}`, ExitCode.InvalidInput);
      }
    }
    if (input.auth === "better-auth" && !flags.experimental) {
      throw new CliError(
        "Better Auth is experimental and requires --experimental",
        ExitCode.InvalidInput,
        "Add --experimental, or use --auth clerk.",
      );
    }

    const spinner = p.spinner();
    spinner.start(
      flags.dryRun ? `Planning ${input.projectName}...` : `Scaffolding ${input.projectName}...`,
    );
    const result = generateCreatePlan(input, flags.dryRun ?? false);
    spinner.stop(result.committed ? "Files generated atomically" : "Dry run validated");

    const git = result.committed && input.git && !flags.dryRun;
    let gitInitialized: boolean | undefined;
    if (git) {
      spinner.start("Initializing git repository...");
      const outcome = await initGitRepository(input.destination, io);
      gitInitialized = outcome.success;
      spinner.stop(gitStopMessage(outcome.reason));
    }

    let installCompleted: boolean | undefined;
    if (result.committed && input.install && !flags.dryRun) {
      spinner.start(`Installing dependencies with ${input.packageManager}...`);
      const outcome = await installDependencies(input.destination, input.packageManager, io);
      installCompleted = outcome.success;
      if (outcome.success) {
        spinner.stop(`Dependencies installed with ${input.packageManager}`);
      } else {
        spinner.stop(`Failed to install dependencies with ${input.packageManager}`);
        p.log.warn(
          `Dependency install warning: ${outcome.error ?? "Installation returned non-zero exit code."}`,
        );
      }
    }

    if (flags.savePreset) {
      await savePreset({
        name: flags.savePreset,
        createdAt: new Date().toISOString(),
        config: presetConfigFrom(input),
      });
      io.stdout(`✓ Preset "${flags.savePreset}" saved.`);
    }

    if (result.committed || (flags.skills === true && flags.dryRun)) {
      await offerCreateSkills(input, flags, io);
    }
    printResult(input, result, io, { git: gitInitialized, install: installCompleted });
    return ExitCode.Success;
  } catch (error) {
    throw toCliError(error);
  }
}

function gitStopMessage(reason: "already-in-git" | "git-not-found" | string | undefined) {
  if (reason === "already-in-git") return "Already inside a git repository";
  if (reason === "git-not-found") return "Git not found on PATH, skipping git initialization";
  if (reason === undefined) return "Git repository initialized";
  return "Skipped git initialization";
}

/** One place where a generation failure becomes an exit code and a recovery hint. */
function toCliError(error: unknown): unknown {
  if (error instanceof CliError) return error;
  if (error instanceof ProjectPathError) {
    return new CliError(
      error.message,
      ExitCode.InvalidInput,
      "Choose a new, empty destination and try again.",
    );
  }
  if (error instanceof ZodError) {
    return new CliError(
      error.issues[0]?.message ?? "Invalid create options",
      ExitCode.InvalidInput,
      "Correct the options or config, then run the command again.",
    );
  }
  return error;
}
