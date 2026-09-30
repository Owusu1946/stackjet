import type { CreateConfig, CreateInput } from "@expojet/schemas";

/**
 * A preset has to round-trip the exact stack the user approved, so it carries every
 * resolved choice rather than the subset one call site happened to remember. The
 * preset schema fills in defaults for absent keys, which is why an omission here
 * does not fail: it silently regenerates a different project.
 *
 * Both the interactive "save this as a preset" question and `--save-preset` project
 * through here so the two cannot drift.
 */
export function presetConfigFrom(input: CreateInput): CreateConfig {
  return {
    structure: input.structure,
    packageManager: input.packageManager,
    navigation: input.navigation,
    navigationType: input.navigationType,
    typescript: input.typescript,
    backend: input.backend,
    auth: input.auth,
    socialProviders: input.socialProviders ?? [],
    style: input.style,
    icons: input.icons,
    state: input.state,
    liquidGlass: input.liquidGlass,
    haptics: input.haptics,
    analytics: input.analytics,
    monitoring: input.monitoring,
    database: input.database,
    orm: input.orm,
    onboarding: input.onboarding,
    darkMode: input.darkMode,
    eas: input.eas,
    sdk: input.sdk,
  };
}
