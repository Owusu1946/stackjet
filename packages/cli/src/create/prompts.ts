import * as p from "@clack/prompts";
import { createPackageName } from "@expojet/brand";
import {
  detectPackageManager,
  ExitCode,
  getPresetSync,
  loadPresets,
  savePreset,
  validateProjectPath,
} from "@expojet/core";
import {
  type CreateConfig,
  type CreateInput,
  createInputSchema,
  supportedSdks,
} from "@expojet/schemas";
import { renderHeroBanner } from "../banner.js";
import { CliError } from "../errors.js";
import { type CreateFlags, shorthandChoices } from "./flags.js";
import {
  analyticsOptions,
  authOptions,
  databaseOptions,
  iconOptions,
  monitoringOptions,
  monorepoBackendOptions,
  navigationOptions,
  navigationTypeOptions,
  ormOptions,
  packageManagerOptions,
  sdkOptions,
  socialOptions,
  standaloneBackendOptions,
  stateOptions,
  structureOptions,
  styleOptions,
} from "./options.js";
import { presetConfigFrom } from "./presets.js";
import { cancelled, isUnresolved, resolveChoice } from "./resolve.js";

/**
 * Ask for whatever the flags, shorthands, and config file did not already decide.
 * Each value goes through `resolveChoice` so the precedence is stated once, and
 * the earlier answers are visible to the later questions — the database options
 * depend on the structure, and the ORM options depend on the database.
 */
export async function promptCreate(
  projectNameArgument: string | undefined,
  flags: CreateFlags,
  config: CreateConfig,
  cwd: string,
): Promise<CreateInput> {
  renderHeroBanner();
  p.intro("Create an Expo application");

  const activeConfig = { ...(await resolvePreset(flags)), ...config };
  const shorthand = shorthandChoices(flags);

  const sdk = await resolveChoice(
    [supportedSdk(flags), activeConfig.sdk],
    async () =>
      (await p.select({
        message: "Expo SDK version",
        options: sdkOptions,
        initialValue: 57,
      })) as CreateInput["sdk"],
  );

  const projectName = await resolveChoice(
    [projectNameArgument, activeConfig.projectName],
    async () => String(await p.text({ message: "Project name", placeholder: "my-app" })),
  );

  // Fail before asking the remaining configuration questions when the name or
  // destination can never be used. The final validation below remains the
  // authoritative guard for races and programmatic callers.
  const destination = flags.destination ?? activeConfig.destination ?? String(projectName);
  const validatedPath = validateProjectPath({
    cwd,
    destination,
    projectName: String(projectName),
    allowCurrentDirectory: flags.allowCurrentDirectory ?? false,
  });

  const typescript = await confirm(flags.typescript, activeConfig.typescript, {
    message: "Would you like to use TypeScript with this project?",
    initialValue: true,
  });

  const detected = detectPackageManager();
  const packageManager = await resolveChoice(
    [flags.packageManager, activeConfig.packageManager],
    async () => {
      const keepDetected = await p.confirm({
        message: `We detected ${detected.manager}${detected.version ? ` v${detected.version}` : ""} as your preferred package manager. Would you like to continue using it?`,
        initialValue: true,
      });
      if (keepDetected) return detected.manager as CreateInput["packageManager"];
      return (await p.select({
        message: "Which package manager would you like to use?",
        options: packageManagerOptions,
      })) as CreateInput["packageManager"];
    },
  );

  const structure = await resolveChoice(
    [flags.structure, activeConfig.structure],
    async () =>
      (await p.select({
        message: "Project structure",
        options: structureOptions,
      })) as CreateInput["structure"],
  );

  const navigation = await resolveChoice(
    [flags.navigation, activeConfig.navigation],
    async () =>
      (await p.select({
        message: "Navigation",
        options: navigationOptions,
      })) as CreateInput["navigation"],
  );

  const navigationType = await resolveChoice(
    [flags.navigationType, activeConfig.navigationType],
    async () =>
      (await p.select({
        message: "Navigation type",
        options: navigationTypeOptions,
      })) as CreateInput["navigationType"],
  );

  const backend = await resolveChoice(
    [flags.backend, activeConfig.backend],
    async () =>
      (await p.select({
        message: structure === "standalone" ? "Backend API" : "Backend Framework",
        options: structure === "standalone" ? standaloneBackendOptions : monorepoBackendOptions,
      })) as CreateInput["backend"],
  );

  const auth = await resolveChoice(
    [flags.auth, activeConfig.auth],
    async () =>
      (await p.select({
        message: "Authentication",
        options: authOptions(structure, flags.experimental ?? false),
      })) as CreateInput["auth"],
  );
  if (auth === "better-auth" && !flags.experimental) {
    throw new CliError(
      "Better Auth is experimental and requires --experimental",
      ExitCode.InvalidInput,
      "Add --experimental, or choose Clerk, Supabase, Firebase, or no auth.",
    );
  }

  const socialProviders = auth === "clerk" ? await askSocialProviders(flags, activeConfig) : [];

  const style = await resolveChoice(
    [flags.style, activeConfig.style],
    async () =>
      (await p.select({ message: "Styling", options: styleOptions })) as CreateInput["style"],
  );

  const icons = await resolveChoice(
    [flags.icons, shorthand.icons, activeConfig.icons],
    async () =>
      (await p.select({ message: "Icons", options: iconOptions })) as CreateInput["icons"],
  );

  const state = await resolveChoice(
    [flags.state, shorthand.state, activeConfig.state],
    async () =>
      (await p.select({
        message: "State management",
        options: stateOptions,
      })) as CreateInput["state"],
  );

  const liquidGlass = await resolveChoice([flags.liquidGlass, activeConfig.liquidGlass], async () =>
    Boolean(
      await p.confirm({
        message: "Enable Liquid Glass UI engine? (Native iOS 26 + cross-platform blur)",
        initialValue: true,
      }),
    ),
  );

  const analytics = await resolveChoice(
    [flags.analytics, shorthand.analytics, activeConfig.analytics],
    async () =>
      (await p.select({
        message: "Mobile analytics",
        options: analyticsOptions,
      })) as CreateInput["analytics"],
  );

  const monitoring = await resolveChoice(
    [flags.monitoring, shorthand.monitoring, activeConfig.monitoring],
    async () =>
      (await p.select({
        message: "Error monitoring",
        options: monitoringOptions,
      })) as CreateInput["monitoring"],
  );

  const isConvex = backend === "convex";
  const database = isConvex
    ? ("none" as const)
    : await resolveChoice([flags.database, activeConfig.database], async () => {
        const context =
          structure === "standalone"
            ? "standalone"
            : auth === "better-auth"
              ? "better-auth"
              : "monorepo";
        return (await p.select({
          message: "Database",
          options: databaseOptions(context),
        })) as CreateInput["database"];
      });

  // Convex owns its storage and a standalone Supabase project is already talking to
  // its database, so an ORM would be a third way to reach the same rows.
  const ormIsRedundant =
    isConvex || database === "none" || (structure === "standalone" && database === "supabase");
  const orm = ormIsRedundant
    ? ("none" as const)
    : await resolveChoice([flags.orm, activeConfig.orm], async () => {
        if (auth === "better-auth") return "drizzle" as const;
        return (await p.select({
          message: "ORM",
          options: ormOptions(structure === "standalone" ? "standalone" : "monorepo"),
        })) as CreateInput["orm"];
      });
  const draftValidation = createInputSchema.safeParse({
    projectName: validatedPath.projectName,
    destination: validatedPath.absolutePath,
    structure,
    packageManager,
    navigation,
    navigationType,
    backend,
    auth,
    socialProviders,
    style: style ?? "uniwind",
    icons,
    state,
    liquidGlass,
    analytics,
    monitoring,
    database,
    orm,
    onboarding: true,
    darkMode: true,
    haptics: true,
    eas: true,
    install: true,
    git: true,
    typescript,
    sdk,
  });
  if (!draftValidation.success) throw draftValidation.error;

  const onboarding = await confirm(flags.onboarding, activeConfig.onboarding, {
    message: "Include onboarding?",
    initialValue: true,
  });
  const darkMode = await confirm(flags.darkMode, activeConfig.darkMode, {
    message: "Include dark mode?",
    initialValue: true,
  });
  const haptics = await confirm(flags.haptics, activeConfig.haptics, {
    message: "Include Tactile Haptics Engine (expo-haptics)?",
    initialValue: true,
  });
  const eas = await confirm(flags.eas, activeConfig.eas, {
    message: "Configure EAS?",
    initialValue: true,
  });
  const install = await confirm(flags.install, activeConfig.install, {
    message: "Install dependencies?",
    initialValue: true,
  });
  const git = await confirm(flags.git, activeConfig.git, {
    message: "Initialize a git repository?",
    initialValue: true,
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
    socialProviders,
    style,
    icons,
    state,
    liquidGlass,
    analytics,
    monitoring,
    database,
    orm,
    onboarding,
    darkMode,
    haptics,
    eas,
    install,
    git,
    typescript,
    sdk,
  });

  const confirmed = await p.confirm({ message: confirmMessage(input), initialValue: true });
  cancelled(confirmed);
  if (!confirmed) throw new CliError("Cancelled", ExitCode.Cancelled);

  await offerToSavePreset(input);
  return input;
}

function confirmMessage(input: CreateInput) {
  const backend = input.backend !== "none" ? `, ${input.backend} backend` : "";
  const monitoring = input.monitoring !== "none" ? `, ${input.monitoring} monitoring` : "";
  return `Plan ${input.projectName} with Expo SDK ${input.sdk}${backend}, ${input.auth}, ${input.style}, ${input.database} database, and ${input.orm} ORM${monitoring}?`;
}

async function offerToSavePreset(input: CreateInput) {
  const shouldSave = await p.confirm({
    message: "Would you like to save this configuration as a preset for future use?",
    initialValue: false,
  });
  if (!shouldSave) return;
  const presetName = await p.text({
    message: "Preset name",
    placeholder: "my-stack",
    validate: (value) => (String(value).trim() ? undefined : "Preset name is required"),
  });
  const name = String(presetName).trim();
  if (!name) return;
  await savePreset({
    name,
    createdAt: new Date().toISOString(),
    config: presetConfigFrom(input),
  });
  p.log.success(`Preset "${name}" saved!`);
}

async function askSocialProviders(flags: CreateFlags, config: CreateConfig) {
  return resolveChoice(
    [flags.socials ?? flags.socialProviders, config.socialProviders],
    async () =>
      (await p.multiselect({
        message: "Social sign-in providers (optional)",
        options: socialOptions,
        required: false,
      })) as CreateInput["socialProviders"],
  );
}

/** `--sdk` is a string on the way in; an unsupported value falls through to the config file. */
function supportedSdk(flags: CreateFlags): CreateInput["sdk"] | undefined {
  if (flags.sdk === undefined) return undefined;
  const requested = Number(flags.sdk);
  return supportedSdks.includes(requested as CreateInput["sdk"])
    ? (requested as CreateInput["sdk"])
    : undefined;
}

/** Load a named preset, or offer the saved ones when `--preset` was not given. */
async function resolvePreset(flags: CreateFlags): Promise<CreateConfig> {
  if (flags.preset) {
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

  const saved = await loadPresets();
  if (saved.length === 0) return {};
  const usePreset = await p.confirm({
    message: "Would you like to use a saved preset?",
    initialValue: false,
  });
  if (!usePreset) return {};
  const selected = await p.select({
    message: "Select a saved preset",
    options: saved.map((preset) => ({
      value: preset.name,
      label: preset.name,
      hint: [
        preset.config.structure ?? "standalone",
        preset.config.auth ?? "clerk",
        preset.config.style ?? "uniwind",
        preset.config.packageManager ?? "pnpm",
      ].join(", "),
    })),
  });
  return saved.find((preset) => preset.name === selected)?.config ?? {};
}

async function confirm(
  flag: boolean | undefined,
  configured: boolean | undefined,
  question: { message: string; initialValue: boolean },
): Promise<boolean> {
  if (!isUnresolved(flag, configured)) return (flag ?? configured) as boolean;
  const answer = await p.confirm(question);
  cancelled(answer);
  return Boolean(answer);
}
