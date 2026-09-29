import { createPackageName } from "@expojet/brand";
import { detectPackageManager, ExitCode, getPresetSync, validateProjectPath } from "@expojet/core";
import {
  type CreateConfig,
  type CreateInput,
  createInputSchema,
  type SocialProvider,
} from "@expojet/schemas";
import { CliError } from "../errors.js";
import { type CreateFlags, shorthandChoices } from "./flags.js";

/**
 * Build the input without asking anything, for `--yes` and CI. Precedence matches
 * the interactive path: an explicit flag, then a boolean shorthand, then the
 * config file, then the default. Each default below is the value the prompt would
 * have offered, so `--yes` and a scripted answer describe the same project.
 */
export function normalizeNonInteractiveCreate(
  projectNameArgument: string | undefined,
  flags: CreateFlags,
  config: CreateConfig,
  cwd: string,
): CreateInput {
  const effectiveConfig: CreateConfig = { ...presetConfig(flags), ...config };
  const shorthand = shorthandChoices(flags);

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
  const backend =
    flags.backend ?? effectiveConfig.backend ?? (structure === "standalone" ? "none" : "hono");
  const navigation = flags.navigation ?? effectiveConfig.navigation ?? "router";
  const navigationType = flags.navigationType ?? effectiveConfig.navigationType ?? "tabs";
  const database =
    flags.database ??
    effectiveConfig.database ??
    (structure === "standalone" || backend === "convex" ? "none" : "neon");
  const orm =
    flags.orm ??
    effectiveConfig.orm ??
    (database === "none" ||
    (structure === "standalone" && database === "supabase") ||
    backend === "convex"
      ? "none"
      : "drizzle");

  return createInputSchema.parse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure,
    packageManager:
      flags.packageManager ?? effectiveConfig.packageManager ?? detectPackageManager().manager,
    navigation,
    navigationType,
    icons: flags.icons ?? shorthand.icons ?? effectiveConfig.icons ?? "lucide",
    state: flags.state ?? shorthand.state ?? effectiveConfig.state ?? "none",
    liquidGlass: flags.liquidGlass ?? effectiveConfig.liquidGlass ?? false,
    analytics: flags.analytics ?? shorthand.analytics ?? effectiveConfig.analytics ?? "none",
    monitoring: flags.monitoring ?? shorthand.monitoring ?? effectiveConfig.monitoring ?? "none",
    backend,
    auth: flags.auth ?? effectiveConfig.auth ?? "clerk",
    socialProviders: (flags.socials ??
      flags.socialProviders ??
      effectiveConfig.socialProviders ??
      []) as SocialProvider[],
    style: flags.style ?? effectiveConfig.style ?? "uniwind",
    database,
    orm,
    onboarding: flags.onboarding ?? effectiveConfig.onboarding ?? true,
    darkMode: flags.darkMode ?? effectiveConfig.darkMode ?? true,
    haptics: flags.haptics ?? effectiveConfig.haptics ?? true,
    eas: flags.eas ?? effectiveConfig.eas ?? true,
    install: flags.install ?? effectiveConfig.install ?? true,
    git: flags.git ?? effectiveConfig.git ?? true,
    typescript: flags.typescript ?? effectiveConfig.typescript ?? true,
    sdk: flags.sdk ? Number(flags.sdk) : (effectiveConfig.sdk ?? 57),
  });
}

function presetConfig(flags: CreateFlags): CreateConfig | undefined {
  if (!flags.preset) return undefined;
  const preset = getPresetSync(flags.preset);
  if (!preset) {
    throw new CliError(
      `Preset "${flags.preset}" not found`,
      ExitCode.InvalidInput,
      `Run "${createPackageName.replace("create-", "")} preset list" to view available presets.`,
    );
  }
  return preset.config;
}
