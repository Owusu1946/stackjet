"use client";

import {
  type ParserMap,
  parseAsBoolean,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import { createSerializer } from "nuqs/server";

/**
 * The Builder's configuration lives in the URL.
 *
 * `/builder` is a marketing surface whose output is a CLI command. A visitor who configures a
 * stack should be able to bookmark it, share it, or open it on their phone, and the URL is the
 * only thing that survives all three. `nuqs` owns the round trip, so the component keeps a plain
 * `useState`-shaped API and the parsing, defaults, validation and history behaviour are declared
 * once, here.
 *
 * The short parameter names (`layout`, `db`, `glass`, `dark`) are the *keys of the parser map
 * itself*, not a renaming layer. That is deliberate: a rename applied only on serialization would
 * produce links the reader cannot parse back. Naming them here means reading and writing share one
 * spelling, and `createSerializer` below inherits it for free.
 *
 * Every literal parser doubles as validation: a hand-edited `?auth=admin` or `?sdk=99` falls back
 * to the default rather than reaching the generator as an unsupported value.
 *
 * `withDefault` implies `clearOnDefault`, so only non-default values reach the URL. A link to the
 * default stack stays `/builder` instead of carrying twenty redundant parameters.
 */

const configParams = {
  sdk: parseAsNumberLiteral([57, 58]).withDefault(57),
  structure: parseAsStringLiteral(["standalone", "monorepo", "monorepo-web"]).withDefault(
    "standalone",
  ),
  navigation: parseAsStringLiteral(["router", "react-navigation"]).withDefault("router"),
  layout: parseAsStringLiteral(["tabs", "drawer", "both", "stack"]).withDefault("tabs"),
  auth: parseAsStringLiteral(["clerk", "better-auth", "supabase", "firebase", "none"]).withDefault(
    "clerk",
  ),
  socials: parseAsString.withDefault("google,apple"),
  style: parseAsStringLiteral(["uniwind", "nativewind", "unistyles", "stylesheet"]).withDefault(
    "uniwind",
  ),
  icons: parseAsStringLiteral(["lucide", "hugeicons", "expo"]).withDefault("lucide"),
  state: parseAsStringLiteral(["none", "zustand", "mobx"]).withDefault("none"),
  backend: parseAsStringLiteral(["none", "hono", "express", "nestjs", "convex"]).withDefault(
    "none",
  ),
  db: parseAsStringLiteral(["none", "neon", "postgres", "sqlite", "supabase"]).withDefault("none"),
  orm: parseAsStringLiteral(["none", "drizzle", "prisma"]).withDefault("none"),
  analytics: parseAsStringLiteral(["none", "posthog", "aptabase"]).withDefault("none"),
  monitoring: parseAsStringLiteral(["none", "sentry"]).withDefault("none"),
  // A feature can be genuinely on or genuinely off, so `false` has to survive in the URL. That is
  // `parseAsBoolean`'s default, and it is the one behaviour this file relies on: the feature that
  // defaults to off is omitted when off, and the four that default to on are written as `dark=0`
  // when a visitor turns them off.
  glass: parseAsBoolean,
  onboarding: parseAsBoolean,
  dark: parseAsBoolean,
  haptics: parseAsBoolean,
  eas: parseAsBoolean,
  name: parseAsString.withDefault("my-expojet-app"),
  pm: parseAsStringLiteral(["pnpm", "npm", "bun", "yarn"]).withDefault("pnpm"),
} as const satisfies ParserMap;

/** The URL shape, with the short names the parsers are keyed by. */
export type BuilderUrlState = Values<typeof configParams>;

/** Builds a shareable link for a configuration. Reads and writes use the same parameter names. */
export const serializeBuilderState = createSerializer(configParams);

export function socialsFromParam(value: string): string[] {
  return value.split(",").filter(Boolean);
}

export function socialsToParam(values: string[]): string {
  return values.join(",");
}

export { configParams };
