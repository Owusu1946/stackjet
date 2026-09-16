import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import { ExitCode, ProjectPathError, validateProjectPath } from "@stackjet/core";
import {
  authAdapters,
  type CreateConfig,
  type CreateInput,
  createConfigSchema,
  createInputSchema,
  packageManagers,
  styleAdapters,
} from "@stackjet/schemas";
import { ZodError } from "zod";
import { CliError } from "./errors.js";
import { generateCreatePlan } from "./generation.js";
import type { CliIo } from "./io.js";

export interface CreateFlags {
  config?: string;
  destination?: string;
  structure?: string;
  packageManager?: string;
  auth?: string;
  style?: string;
  onboarding?: boolean;
  eas?: boolean;
  allowCurrentDirectory?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

function readConfig(cwd: string, configPath?: string): CreateConfig {
  if (!configPath) return {};
  const absolutePath = resolve(cwd, configPath);
  try {
    return createConfigSchema.parse(JSON.parse(readFileSync(absolutePath, "utf8")));
  } catch (error) {
    throw new CliError(
      `Could not load a valid create config from ${configPath}: ${error instanceof Error ? error.message : "unknown error"}`,
      ExitCode.InvalidInput,
      "Correct the config file and run the command again.",
    );
  }
}

export function normalizeNonInteractiveCreate(
  projectNameArgument: string | undefined,
  flags: CreateFlags,
  config: CreateConfig,
  cwd: string,
): CreateInput {
  const projectName = projectNameArgument ?? config.projectName;
  if (!projectName) {
    throw new CliError(
      "Project name is required in --yes mode",
      ExitCode.InvalidInput,
      "Pass a project name, for example: create-stackjet my-app --yes.",
    );
  }
  const destination = flags.destination ?? config.destination ?? projectName;
  const validatedPath = validateProjectPath({
    cwd,
    destination,
    projectName,
    allowCurrentDirectory: flags.allowCurrentDirectory ?? false,
  });
  return createInputSchema.parse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure: flags.structure ?? config.structure ?? "standalone",
    packageManager: flags.packageManager ?? config.packageManager ?? "pnpm",
    auth: flags.auth ?? config.auth ?? "clerk",
    style: flags.style ?? config.style ?? "uniwind",
    onboarding: flags.onboarding ?? config.onboarding ?? true,
    eas: flags.eas ?? config.eas ?? true,
    sdk: 57,
  });
}

function cancelled(value: unknown): asserts value is Exclude<typeof value, symbol> {
  if (p.isCancel(value)) {
    p.cancel("Creation cancelled. No files were written.");
    throw new CliError("Cancelled", ExitCode.Cancelled);
  }
}

async function promptCreate(
  projectNameArgument: string | undefined,
  flags: CreateFlags,
  config: CreateConfig,
  cwd: string,
) {
  p.intro("Create an Expo application");
  const projectName =
    projectNameArgument ??
    config.projectName ??
    (await p.text({ message: "Project name", placeholder: "my-app" }));
  cancelled(projectName);

  const structure =
    flags.structure ??
    config.structure ??
    (await p.select({
      message: "Project structure",
      options: [
        { value: "standalone", label: "Expo app" },
        { value: "monorepo", label: "Expo + Hono API monorepo" },
      ],
    }));
  cancelled(structure);

  const packageManager =
    flags.packageManager ??
    config.packageManager ??
    (await p.select({
      message: "Package manager",
      options: packageManagers.map((value) => ({ value, label: value })),
    }));
  cancelled(packageManager);

  const availableAuth = structure === "monorepo" ? authAdapters : ["clerk", "none"];
  const auth =
    flags.auth ??
    config.auth ??
    (await p.select({
      message: "Authentication",
      options: availableAuth.map((value) => ({
        value,
        label:
          value === "better-auth"
            ? "Better Auth (experimental)"
            : value === "none"
              ? "None"
              : "Clerk",
      })),
    }));
  cancelled(auth);

  const style =
    flags.style ??
    config.style ??
    (await p.select({
      message: "Styling",
      options: styleAdapters.map((value) => ({
        value,
        label: value === "stylesheet" ? "React Native StyleSheet" : "Uniwind",
      })),
    }));
  cancelled(style);

  const onboarding =
    flags.onboarding ??
    config.onboarding ??
    (await p.confirm({ message: "Include onboarding?", initialValue: true }));
  cancelled(onboarding);
  const eas =
    flags.eas ?? config.eas ?? (await p.confirm({ message: "Configure EAS?", initialValue: true }));
  cancelled(eas);

  const destination = flags.destination ?? config.destination ?? String(projectName);
  const validatedPath = validateProjectPath({
    cwd,
    destination,
    projectName: String(projectName),
    allowCurrentDirectory: flags.allowCurrentDirectory ?? false,
  });
  const input = createInputSchema.parse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure,
    packageManager,
    auth,
    style,
    onboarding,
    eas,
    sdk: 57,
  });
  const confirmed = await p.confirm({
    message: `Plan ${input.projectName} with Expo SDK 57, ${input.auth}, and ${input.style}?`,
    initialValue: true,
  });
  cancelled(confirmed);
  if (!confirmed) throw new CliError("Cancelled", ExitCode.Cancelled);
  return input;
}

function printResult(
  input: CreateInput,
  result: { files: string[]; committed: boolean },
  io: CliIo,
) {
  io.stdout(result.committed ? "✓ Project generated atomically" : "✓ Dry run validated");
  io.stdout(`  Project: ${input.projectName}`);
  io.stdout(`  Destination: ${input.destination}`);
  io.stdout(`  Structure: ${input.structure}`);
  io.stdout(`  Package manager: ${input.packageManager}`);
  io.stdout(`  Authentication: ${input.auth}`);
  io.stdout(`  Styling: ${input.style}`);
  io.stdout(`  Files: ${result.files.length}`);
  io.stdout("  Foundation: Expo SDK 57, Expo Router, strict TypeScript, tests");
  io.stdout("");
  if (result.committed) {
    io.stdout(`Next: cd ${input.projectName}`);
    io.stdout(`Then: ${input.packageManager} install`);
    io.stdout(`Then: ${input.packageManager} start`);
  } else {
    for (const file of result.files) io.stdout(`  + ${file}`);
    io.stdout("No destination files were written.");
  }
}

export async function runCreate(projectName: string | undefined, flags: CreateFlags, io: CliIo) {
  const config = readConfig(io.cwd, flags.config);
  try {
    const input = flags.yes
      ? normalizeNonInteractiveCreate(projectName, flags, config, io.cwd)
      : await promptCreate(projectName, flags, config, io.cwd);
    const result = generateCreatePlan(input, flags.dryRun ?? false);
    printResult(input, result, io);
    return ExitCode.Success;
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error instanceof ProjectPathError) {
      throw new CliError(
        error.message,
        ExitCode.InvalidInput,
        "Choose a new, empty destination and try again.",
      );
    }
    if (error instanceof ZodError) {
      throw new CliError(
        error.issues[0]?.message ?? "Invalid create options",
        ExitCode.InvalidInput,
        "Correct the options or config, then run the command again.",
      );
    }
    throw error;
  }
}
