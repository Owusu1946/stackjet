import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import { createPackageName } from "@expojet/brand";
import {
  detectPackageManager,
  ExitCode,
  getPresetSync,
  loadPresets,
  ProjectPathError,
  savePreset,
  validateProjectPath,
} from "@expojet/core";
import {
  type AnalyticsAdapter,
  authAdapters,
  type CreateConfig,
  type CreateInput,
  createConfigSchema,
  createInputSchema,
  type IconLibrary,
  type PackageManager,
  packageManagers,
  type StateAdapter,
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
  navigationType?: string;
  backend?: string;
  auth?: string;
  style?: string;
  icons?: string;
  lucide?: boolean;
  hugeicons?: boolean;
  expoIcons?: boolean;
  state?: string;
  zustand?: boolean;
  mobx?: boolean;
  liquidGlass?: boolean;
  analytics?: string;
  posthog?: boolean;
  aptabase?: boolean;
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
  preset?: string;
  savePreset?: string;
  typescript?: boolean;
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
  let presetConfig: CreateConfig | undefined;
  if (flags.preset) {
    const preset = getPresetSync(flags.preset);
    if (!preset) {
      throw new CliError(
        `Preset "${flags.preset}" not found`,
        ExitCode.InvalidInput,
        `Run "${createPackageName.replace("create-", "")} preset list" to view available presets.`,
      );
    }
    presetConfig = preset.config;
  }

  const effectiveConfig: CreateConfig = { ...presetConfig, ...config };

  const projectName = projectNameArgument ?? effectiveConfig.projectName;
  if (!projectName) {
    throw new CliError(
      "Project name is required in --yes mode",
      ExitCode.InvalidInput,
      `Pass a project name, for example: ${createPackageName} my-app --yes.`,
    );
  }
  const destination = flags.destination ?? effectiveConfig.destination ?? projectName;
  const validatedPath = validateProjectPath({
    cwd,
    destination,
    projectName,
    allowCurrentDirectory: flags.allowCurrentDirectory ?? false,
  });

  const structure = flags.structure ?? effectiveConfig.structure ?? "standalone";
  const defaultBackend = structure === "standalone" ? "none" : "hono";
  const backend = flags.backend ?? effectiveConfig.backend ?? defaultBackend;
  const navigation = flags.navigation ?? effectiveConfig.navigation ?? "router";
  const navigationType = flags.navigationType ?? effectiveConfig.navigationType ?? "tabs";
  const defaultDatabase = structure === "standalone" || backend === "convex" ? "none" : "neon";
  const database = flags.database ?? effectiveConfig.database ?? defaultDatabase;
  const defaultOrm =
    database === "none" ||
    (structure === "standalone" && database === "supabase") ||
    backend === "convex"
      ? "none"
      : "drizzle";
  const orm = flags.orm ?? effectiveConfig.orm ?? defaultOrm;

  const detected = detectPackageManager();
  const packageManager = flags.packageManager ?? effectiveConfig.packageManager ?? detected.manager;

  let iconsFlag = flags.icons;
  if (!iconsFlag) {
    if (flags.hugeicons) iconsFlag = "hugeicons";
    else if (flags.expoIcons) iconsFlag = "expo";
    else if (flags.lucide) iconsFlag = "lucide";
  }
  const icons = iconsFlag ?? effectiveConfig.icons ?? "lucide";

  let stateFlag = flags.state;
  if (!stateFlag) {
    if (flags.zustand) stateFlag = "zustand";
    else if (flags.mobx) stateFlag = "mobx";
  }
  const state = stateFlag ?? effectiveConfig.state ?? "none";

  let analyticsFlag = flags.analytics;
  if (!analyticsFlag) {
    if (flags.posthog) analyticsFlag = "posthog";
    else if (flags.aptabase) analyticsFlag = "aptabase";
  }
  const analytics = analyticsFlag ?? effectiveConfig.analytics ?? "none";

  return createInputSchema.parse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure,
    packageManager,
    navigation,
    navigationType,
    icons,
    state,
    liquidGlass: flags.liquidGlass ?? effectiveConfig.liquidGlass ?? false,
    analytics,
    backend,
    auth: flags.auth ?? effectiveConfig.auth ?? "clerk",
    style: flags.style ?? effectiveConfig.style ?? "uniwind",
    database,
    orm,
    onboarding: flags.onboarding ?? effectiveConfig.onboarding ?? true,
    darkMode: flags.darkMode ?? effectiveConfig.darkMode ?? true,
    eas: flags.eas ?? effectiveConfig.eas ?? true,
    install: flags.install ?? effectiveConfig.install ?? true,
    git: flags.git ?? effectiveConfig.git ?? true,
    typescript: flags.typescript ?? effectiveConfig.typescript ?? true,
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

  let activeConfig = { ...config };
  if (!flags.preset) {
    const savedPresets = await loadPresets();
    if (savedPresets.length > 0) {
      const usePreset = await p.confirm({
        message: "Would you like to use a saved preset?",
        initialValue: false,
      });
      cancelled(usePreset);
      if (usePreset) {
        const selectedPresetName = await p.select({
          message: "Select a saved preset",
          options: savedPresets.map((pr) => ({
            value: pr.name,
            label: pr.name,
            hint: [
              pr.config.structure ?? "standalone",
              pr.config.auth ?? "clerk",
              pr.config.style ?? "uniwind",
              pr.config.packageManager ?? "pnpm",
            ].join(", "),
          })),
        });
        cancelled(selectedPresetName);
        const found = savedPresets.find((pr) => pr.name === selectedPresetName);
        if (found) {
          activeConfig = { ...found.config, ...activeConfig };
        }
      }
    }
  } else {
    const found = getPresetSync(flags.preset);
    if (!found) {
      throw new CliError(
        `Preset "${flags.preset}" not found`,
        ExitCode.InvalidInput,
        `Run "${createPackageName.replace("create-", "")} preset list" to view available presets.`,
      );
    }
    activeConfig = { ...found.config, ...activeConfig };
  }

  const projectName =
    projectNameArgument ??
    activeConfig.projectName ??
    (await p.text({ message: "Project name", placeholder: "my-app" }));
  cancelled(projectName);

  const typescript =
    flags.typescript ??
    activeConfig.typescript ??
    (await p.confirm({
      message: "Would you like to use TypeScript with this project?",
      initialValue: true,
    }));
  cancelled(typescript);

  let packageManager = flags.packageManager ?? activeConfig.packageManager;
  if (!packageManager) {
    const detected = detectPackageManager();
    const useDetected = await p.confirm({
      message: `We detected ${detected.manager}${detected.version ? ` v${detected.version}` : ""} as your preferred package manager. Would you like to continue using it?`,
      initialValue: true,
    });
    cancelled(useDetected);
    if (useDetected) {
      packageManager = detected.manager;
    } else {
      packageManager = (await p.select({
        message: "Which package manager would you like to use?",
        options: packageManagers.map((value) => ({ value, label: value })),
      })) as PackageManager;
      cancelled(packageManager);
    }
  }
  cancelled(packageManager);

  const structure =
    flags.structure ??
    activeConfig.structure ??
    (await p.select({
      message: "Project structure",
      options: [
        { value: "standalone", label: "Single Expo app" },
        { value: "monorepo", label: "Expo + API monorepo" },
        { value: "monorepo-web", label: "Expo + web + shared API monorepo" },
      ],
    }));
  cancelled(structure);

  const navigation =
    flags.navigation ??
    activeConfig.navigation ??
    (await p.select({
      message: "Navigation",
      options: [
        { value: "router", label: "Expo Router (File-based routing, recommended)" },
        { value: "react-navigation", label: "React Navigation (Component-based routing)" },
      ],
    }));
  cancelled(navigation);

  const navigationType =
    flags.navigationType ??
    activeConfig.navigationType ??
    (await p.select({
      message: "Navigation type",
      options: [
        { value: "tabs", label: "Tabs (Bottom tabs, recommended)" },
        { value: "drawer", label: "Drawer (Side menu drawer)" },
        { value: "both", label: "Both (Drawer containing tabs)" },
        { value: "stack", label: "Stack (Header-driven stack navigation)" },
      ],
    }));
  cancelled(navigationType);

  let backend = flags.backend ?? activeConfig.backend;
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
    activeConfig.auth ??
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
    activeConfig.style ??
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

  let icons = flags.icons ?? activeConfig.icons;
  if (!icons) {
    if (flags.hugeicons) icons = "hugeicons";
    else if (flags.expoIcons) icons = "expo";
    else if (flags.lucide) icons = "lucide";
  }
  if (!icons) {
    icons = (await p.select({
      message: "Icons",
      options: [
        { value: "lucide", label: "Lucide (Clean, modern, tree-shakeable, recommended)" },
        { value: "hugeicons", label: "Hugeicons (Sharp stroke & rich collection)" },
        { value: "expo", label: "Expo Vector Icons (Classic built-in Ionicons)" },
      ],
    })) as string;
  }
  cancelled(icons);

  let state = flags.state ?? activeConfig.state;
  if (!state) {
    if (flags.zustand) state = "zustand";
    else if (flags.mobx) state = "mobx";
  }
  if (!state) {
    state = (await p.select({
      message: "State management",
      options: [
        { value: "none", label: "None (React state / Context)" },
        { value: "zustand", label: "Zustand (Lightweight hooks-based store, recommended)" },
        { value: "mobx", label: "MobX (Observable reactive store with mobx-react-lite)" },
      ],
    })) as string;
  }
  cancelled(state);

  let liquidGlass = flags.liquidGlass ?? activeConfig.liquidGlass;
  if (liquidGlass === undefined) {
    liquidGlass = (await p.confirm({
      message: "Enable Liquid Glass UI engine? (Native iOS 26 + cross-platform blur)",
      initialValue: true,
    })) as boolean;
  }
  cancelled(liquidGlass);

  let analytics = flags.analytics ?? activeConfig.analytics;
  if (!analytics) {
    if (flags.posthog) analytics = "posthog";
    else if (flags.aptabase) analytics = "aptabase";
  }
  if (!analytics) {
    analytics = (await p.select({
      message: "Mobile analytics",
      options: [
        { value: "none", label: "None (Zero telemetry / offline)" },
        {
          value: "posthog",
          label: "PostHog (Full product analytics, autocapture, session replays, recommended)",
        },
        {
          value: "aptabase",
          label: "Aptabase (Privacy-first, lightweight, open-source analytics)",
        },
      ],
    })) as string;
  }
  cancelled(analytics);

  let database = flags.database ?? activeConfig.database;
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

  let orm = flags.orm ?? activeConfig.orm;
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
    activeConfig.onboarding ??
    (await p.confirm({ message: "Include onboarding?", initialValue: true }));
  cancelled(onboarding);
  const darkMode =
    flags.darkMode ??
    activeConfig.darkMode ??
    (await p.confirm({ message: "Include dark mode?", initialValue: true }));
  cancelled(darkMode);
  const eas =
    flags.eas ??
    activeConfig.eas ??
    (await p.confirm({ message: "Configure EAS?", initialValue: true }));
  cancelled(eas);

  const install =
    flags.install ??
    activeConfig.install ??
    (await p.confirm({ message: "Install dependencies?", initialValue: true }));
  cancelled(install);

  const git =
    flags.git ??
    activeConfig.git ??
    (await p.confirm({ message: "Initialize a git repository?", initialValue: true }));
  cancelled(git);

  const destination = flags.destination ?? activeConfig.destination ?? String(projectName);
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
    navigationType,
    backend,
    auth,
    style,
    icons: icons as IconLibrary,
    state: state as StateAdapter,
    liquidGlass,
    analytics: analytics as AnalyticsAdapter,
    database,
    orm,
    onboarding,
    darkMode,
    eas,
    install,
    git,
    typescript,
    sdk: 57,
  });
  const backendLabel = backend !== "none" ? `, ${backend} backend` : "";
  const confirmed = await p.confirm({
    message: `Plan ${input.projectName} with Expo SDK 57${backendLabel}, ${input.auth}, ${input.style}, ${input.database} database, and ${input.orm} ORM?`,
    initialValue: true,
  });
  cancelled(confirmed);
  if (!confirmed) throw new CliError("Cancelled", ExitCode.Cancelled);

  const shouldSavePreset = await p.confirm({
    message: "Would you like to save this configuration as a preset for future use?",
    initialValue: false,
  });
  cancelled(shouldSavePreset);
  if (shouldSavePreset) {
    const presetName = await p.text({
      message: "Preset name",
      placeholder: "my-stack",
    });
    cancelled(presetName);
    const validPresetName = String(presetName).trim();
    if (validPresetName) {
      await savePreset({
        name: validPresetName,
        createdAt: new Date().toISOString(),
        config: {
          structure: input.structure,
          packageManager: input.packageManager,
          navigation: input.navigation,
          navigationType: input.navigationType,
          backend: input.backend,
          auth: input.auth,
          style: input.style,
          icons: input.icons,
          state: input.state,
          liquidGlass: input.liquidGlass,
          analytics: input.analytics,
          database: input.database,
          orm: input.orm,
          onboarding: input.onboarding,
          darkMode: input.darkMode,
          eas: input.eas,
          typescript: input.typescript,
        },
      });
      p.log.success(`Preset "${validPresetName}" saved!`);
    }
  }

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
  io.stdout(`  Navigation: ${input.navigation} (${input.navigationType})`);
  io.stdout(`  Backend: ${input.backend}`);
  io.stdout(`  Authentication: ${input.auth}`);
  io.stdout(`  Styling: ${input.style}`);
  io.stdout(`  Database: ${input.database}`);
  io.stdout(`  ORM: ${input.orm}`);
  io.stdout(`  Dark mode: ${input.darkMode ? "enabled" : "disabled"}`);
  if (input.eas) io.stdout("  EAS Build: configured (development, preview, production profiles)");
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
    if (input.eas) {
      steps.push(`${stepNum++}. npx eas build --profile preview`);
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

    if (flags.savePreset) {
      await savePreset({
        name: flags.savePreset,
        createdAt: new Date().toISOString(),
        config: {
          structure: input.structure,
          packageManager: input.packageManager,
          navigation: input.navigation,
          navigationType: input.navigationType,
          backend: input.backend,
          auth: input.auth,
          style: input.style,
          icons: input.icons,
          state: input.state,
          liquidGlass: input.liquidGlass,
          database: input.database,
          orm: input.orm,
          onboarding: input.onboarding,
          darkMode: input.darkMode,
          eas: input.eas,
          typescript: input.typescript,
        },
      });
      io.stdout(`✓ Preset "${flags.savePreset}" saved.`);
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
