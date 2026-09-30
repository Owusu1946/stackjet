import { type CreateInput, createConfigSchema } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { presetConfigFrom } from "./presets.js";

/**
 * The preset schema defaults every absent key, so a dropped field does not fail
 * validation -- it regenerates a different project. These assertions fail on an
 * omission rather than on a wrong value.
 */
describe("presetConfigFrom", () => {
  const input = {
    projectName: "demo",
    destination: "/tmp/demo",
    structure: "monorepo",
    packageManager: "pnpm",
    navigation: "react-navigation",
    navigationType: "drawer",
    backend: "nestjs",
    auth: "supabase",
    socialProviders: ["google", "apple"],
    style: "unistyles",
    icons: "hugeicons",
    state: "mobx",
    liquidGlass: false,
    haptics: false,
    analytics: "aptabase",
    monitoring: "sentry",
    database: "postgres",
    orm: "prisma",
    onboarding: false,
    darkMode: false,
    hapticsDuplicate: undefined,
    eas: false,
    install: false,
    git: false,
    typescript: false,
    sdk: 58,
  } as unknown as CreateInput;

  it("carries every resolved choice, so the preset regenerates the same project", () => {
    const config = createConfigSchema.parse(presetConfigFrom(input));
    expect(config).toMatchObject({
      structure: "monorepo",
      packageManager: "pnpm",
      navigation: "react-navigation",
      navigationType: "drawer",
      typescript: false,
      backend: "nestjs",
      auth: "supabase",
      socialProviders: ["google", "apple"],
      style: "unistyles",
      icons: "hugeicons",
      state: "mobx",
      liquidGlass: false,
      haptics: false,
      analytics: "aptabase",
      monitoring: "sentry",
      database: "postgres",
      orm: "prisma",
      onboarding: false,
      darkMode: false,
      eas: false,
      sdk: 58,
    });
  });

  it("round-trips an SDK 58 project with haptics disabled", () => {
    // Reproduced in review: these two were dropped, so the preset schema filled in
    // SDK 57 and haptics enabled, and the second project differed from the first.
    const config = createConfigSchema.parse(presetConfigFrom(input));
    expect(config.sdk).toBe(58);
    expect(config.haptics).toBe(false);
  });

  it("omits nothing the input decided, so nothing falls back to a default", () => {
    const config = createConfigSchema.parse(presetConfigFrom(input));
    for (const [key, value] of Object.entries(config)) {
      expect(value, `${key} fell back to a default`).not.toBeUndefined();
    }
  });
});
