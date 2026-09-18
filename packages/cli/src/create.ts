import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import { createPackageName } from "@expojet/brand";
import { ExitCode, ProjectPathError, validateProjectPath } from "@expojet/core";
import {
  authAdapters,
  type CreateConfig,
  type CreateInput,
  createConfigSchema,
  createInputSchema,
  packageManagers,
  styleAdapters,
} from "@expojet/schemas";
import { ZodError } from "zod";
import { renderHeroBanner } from "./banner.js";
import { CliError } from "./errors.js";
import { generateCreatePlan } from "./generation.js";
import { initGitRepository, installDependencies } from "./install.js";
import type { CliIo } from "./io.js";

export interface CreateFlags {
  config?: string;
  destination?: string;
  structure?: string;
  packageManager?: string;
  navigation?: string;
  backend?: string;
  auth?: string;
  style?: string;
  database?: string;
  orm?: string;
  onboarding?: boolean;
  darkMode?: boolean;
  eas?: boolean;
  install?: boolean;
  git?: boolean;
  allowCurrentDirectory?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  experimental?: boolean;
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
      `Pass a project name, for example: ${createPackageName} my-app --yes.`,
    );
  }
  const destination = flags.destination ?? config.destination ?? projectName;
  const validatedPath = validateProjectPath({
    cwd,
    destination,
    projectName,
    allowCurrentDirectory: flags.allowCurrentDirectory ?? false,
  });

  const structure = flags.structure ?? config.structure ?? "standalone";
  const defaultBackend = structure === "standalone" ? "none" : "hono";
  const backend = flags.backend ?? config.backend ?? defaultBackend;
  const navigation = flags.navigation ?? config.navigation ?? "router";
  const defaultDatabase = structure === "standalone" || backend === "convex" ? "none" : "neon";
  const database = flags.database ?? config.database ?? defaultDatabase;
  const defaultOrm =
    database === "none" ||
    (structure === "standalone" && database === "supabase") ||
    backend === "convex"
      ? "none"
      : "drizzle";
  const orm = flags.orm ?? config.orm ?? defaultOrm;

  return createInputSchema.parse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure,
    packageManager: flags.packageManager ?? config.packageManager ?? "pnpm",
    navigation,
    backend,
    auth: flags.auth ?? config.auth ?? "clerk",
    style: flags.style ?? config.style ?? "uniwind",
    database,
    orm,
    onboarding: flags.onboarding ?? config.onboarding ?? true,
    darkMode: flags.darkMode ?? config.darkMode ?? true,
    eas: flags.eas ?? config.eas ?? true,
    install: flags.install ?? config.install ?? true,
    git: flags.git ?? config.git ?? true,
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
  renderHeroBanner();
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
        { value: "standalone", label: "Single Expo app" },
        { value: "monorepo", label: "Expo + API monorepo" },
        { value: "monorepo-web", label: "Expo + web + shared API monorepo" },
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

  const navigation =
    flags.navigation ??
    config.navigation ??
    (await p.select({
      message: "Navigation",
      options: [
        { value: "router", label: "Expo Router (File-based routing, recommended)" },
        { value: "react-navigation", label: "React Navigation (Component-based routing)" },
      ],
    }));
  cancelled(navigation);

  let backend = flags.backend ?? config.backend;
  if (!backend) {
    if (structure === "standalone") {
      backend = (await p.select({
        message: "Backend API",
        options: [
          { value: "none", label: "None (Client only)" },
          { value: "convex", label: "Convex (Reactive cloud backend)" },
        ],
      })) as string;
    } else {
      backend = (await p.select({
        message: "Backend Framework",
        options: [
          { value: "hono", label: "Hono (Lightweight & typed RPC, recommended)" },
          { value: "express", label: "Express (Classic enterprise REST API)" },
          { value: "nestjs", label: "NestJS (Modular enterprise API)" },
          { value: "convex", label: "Convex (Reactive cloud backend)" },
        ],
      })) as string;
    }
  }
  cancelled(backend);

  const availableAuth =
    structure !== "standalone"
      ? authAdapters.filter((value) => value !== "better-auth" || flags.experimental)
      : (["clerk", "supabase", "firebase", "jwt", "none"] as const);
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
            : value === "supabase"
              ? "Supabase Auth"
              : value === "firebase"
                ? "Firebase Auth"
                : value === "jwt"
                  ? "Custom JWT (Self-hosted)"
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
        label:
          value === "stylesheet"
            ? "React Native StyleSheet"
            : value === "nativewind"
              ? "NativeWind"
              : value === "unistyles"
                ? "Unistyles 3.0"
                : "Uniwind",
      })),
    }));
  cancelled(style);

  let database = flags.database ?? config.database;
  if (backend === "convex") {
    database = "none";
  } else if (!database) {
    if (structure === "standalone") {
      database = (await p.select({
        message: "Database",
        options: [
          { value: "none", label: "None" },
          { value: "sqlite", label: "Local SQLite (expo-sqlite)" },
          { value: "supabase", label: "Supabase (Cloud)" },
        ],
      })) as string;
    } else if (auth === "better-auth") {
      database = (await p.select({
        message: "Database",
        options: [
          { value: "neon", label: "Neon Serverless Postgres (recommended)" },
          { value: "supabase", label: "Supabase Postgres (Cloud)" },
          { value: "postgres", label: "Local PostgreSQL (Docker)" },
        ],
      })) as string;
    } else {
      database = (await p.select({
        message: "Database",
        options: [
          { value: "neon", label: "Neon Serverless Postgres (recommended)" },
          { value: "supabase", label: "Supabase Postgres (Cloud)" },
          { value: "postgres", label: "Local PostgreSQL (Docker)" },
          { value: "sqlite", label: "SQLite (LibSQL)" },
          { value: "none", label: "None" },
        ],
      })) as string;
    }
  }
  cancelled(database);

  let orm = flags.orm ?? config.orm;
  if (
    backend === "convex" ||
    database === "none" ||
    (structure === "standalone" && database === "supabase")
  ) {
    orm = "none";
  } else if (!orm) {
    if (auth === "better-auth") {
      orm = "drizzle";
    } else if (structure === "standalone") {
      orm = (await p.select({
        message: "ORM",
        options: [
          { value: "drizzle", label: "Drizzle ORM (recommended)" },
          { value: "none", label: "None (Raw SQLite)" },
        ],
      })) as string;
    } else {
      orm = (await p.select({
        message: "ORM",
        options: [
          { value: "drizzle", label: "Drizzle ORM (recommended)" },
          { value: "prisma", label: "Prisma ORM" },
          { value: "none", label: "None (Raw driver)" },
        ],
      })) as string;
    }
  }
  cancelled(orm);

  const onboarding =
    flags.onboarding ??
    config.onboarding ??
    (await p.confirm({ message: "Include onboarding?", initialValue: true }));
  cancelled(onboarding);
  const darkMode =
    flags.darkMode ??
    config.darkMode ??
    (await p.confirm({ message: "Include dark mode?", initialValue: true }));
  cancelled(darkMode);
  const eas =
    flags.eas ?? config.eas ?? (await p.confirm({ message: "Configure EAS?", initialValue: true }));
  cancelled(eas);

  const install =
    flags.install ??
    config.install ??
    (await p.confirm({ message: "Install dependencies?", initialValue: true }));
  cancelled(install);

  const git =
    flags.git ??
    config.git ??
    (await p.confirm({ message: "Initialize a git repository?", initialValue: true }));
  cancelled(git);

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
    navigation,
    backend,
    auth,
    style,
    database,
    orm,
    onboarding,
    darkMode,
    eas,
    install,
    git,
    sdk: 57,
  });
  const backendLabel = backend !== "none" ? `, ${backend} backend` : "";
  const confirmed = await p.confirm({
    message: `Plan ${input.projectName} with Expo SDK 57${backendLabel}, ${input.auth}, ${input.style}, ${input.database} database, and ${input.orm} ORM?`,
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
  status?: { git?: boolean | undefined; install?: boolean | undefined },
) {
  io.stdout(result.committed ? "✓ Project generated atomically" : "✓ Dry run validated");
  io.stdout(`  Project: ${input.projectName}`);
  io.stdout(`  Destination: ${input.destination}`);
  io.stdout(`  Structure: ${input.structure}`);
  io.stdout(`  Package manager: ${input.packageManager}`);
  io.stdout(`  Backend: ${input.backend}`);
  io.stdout(`  Authentication: ${input.auth}`);
  io.stdout(`  Styling: ${input.style}`);
  io.stdout(`  Database: ${input.database}`);
  io.stdout(`  ORM: ${input.orm}`);
  io.stdout(`  Dark mode: ${input.darkMode ? "enabled" : "disabled"}`);
  io.stdout(`  Files: ${result.files.length}`);
  io.stdout("  Foundation: Expo SDK 57, Expo Router, strict TypeScript, tests");
  if (status?.git) io.stdout("  Git: initialized");
  if (status?.install !== undefined) {
    io.stdout(`  Dependencies: ${status.install ? "installed" : "install failed"}`);
  }
  io.stdout("");
  if (result.committed) {
    const relativeTarget = input.destination === io.cwd ? "." : input.projectName;
    const steps: string[] = [
      `1. cd ${relativeTarget}`,
      `2. Copy .env.example to .env and configure keys if needed`,
    ];
    let stepNum = 3;
    if (input.backend === "convex") {
      steps.push(`${stepNum++}. ${input.packageManager} run convex:dev (start Convex dev server)`);
    }
    if (input.database === "postgres") {
      steps.push(`${stepNum++}. ${input.packageManager} run db:up (start PostgreSQL container)`);
    }
    if (status?.install === false || !input.install) {
      steps.push(`${stepNum++}. ${input.packageManager} install`);
    }
    if (input.database !== "none" && input.orm !== "none") {
      steps.push(`${stepNum++}. ${input.packageManager} run db:migrate`);
    }
    steps.push(`${stepNum++}. ${input.packageManager} run dev`);

    p.note(steps.join("\n"), "Next steps");
    p.outro(`✨ Project ${input.projectName} is ready!`);
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
    if (input.auth === "better-auth" && !flags.experimental) {
      throw new CliError(
        "Better Auth is experimental and requires --experimental",
        ExitCode.InvalidInput,
        "Add --experimental, or use --auth clerk.",
      );
    }
    const s = p.spinner();
    s.start(
      flags.dryRun ? `Planning ${input.projectName}...` : `Scaffolding ${input.projectName}...`,
    );
    const result = generateCreatePlan(input, flags.dryRun ?? false);
    s.stop(result.committed ? "Files generated atomically" : "Dry run validated");

    let gitInitialized: boolean | undefined;
    if (result.committed && input.git && !flags.dryRun) {
      s.start("Initializing git repository...");
      const gitRes = await initGitRepository(input.destination, io);
      if (gitRes.success) {
        gitInitialized = true;
        s.stop("Git repository initialized");
      } else if (gitRes.reason === "already-in-git") {
        s.stop("Already inside a git repository");
      } else if (gitRes.reason === "git-not-found") {
        s.stop("Git not found on PATH, skipping git initialization");
      } else {
        s.stop("Skipped git initialization");
      }
    }

    let installCompleted: boolean | undefined;
    if (result.committed && input.install && !flags.dryRun) {
      s.start(`Installing dependencies with ${input.packageManager}...`);
      const instRes = await installDependencies(input.destination, input.packageManager, io);
      if (instRes.success) {
        installCompleted = true;
        s.stop(`Dependencies installed with ${input.packageManager}`);
      } else {
        installCompleted = false;
        s.stop(`Failed to install dependencies with ${input.packageManager}`);
        p.log.warn(
          `Dependency install warning: ${instRes.error ?? "Installation returned non-zero exit code."}`,
        );
      }
    }

    printResult(input, result, io, { git: gitInitialized, install: installCompleted });
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
