import type { CreateConfig, CreateInput } from "@expojet/schemas";

/**
 * The subset of a resolved input that a preset stores. Both the interactive
 * "save this as a preset" question and `--save-preset` project through here, so a
 * choice cannot be remembered from one path and dropped from the other.
 */
export function presetConfigFrom(input: CreateInput): CreateConfig {
  return {
    structure: input.structure,
    packageManager: input.packageManager,
    navigation: input.navigation,
    navigationType: input.navigationType,
    backend: input.backend,
    auth: input.auth,
    socialProviders: input.socialProviders,
    style: input.style,
    icons: input.icons,
    state: input.state,
    liquidGlass: input.liquidGlass,
    analytics: input.analytics,
    monitoring: input.monitoring,
    database: input.database,
    orm: input.orm,
    onboarding: input.onboarding,
    darkMode: input.darkMode,
    eas: input.eas,
    typescript: input.typescript,
  };
}
