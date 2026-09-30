import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CreateConfig } from "@expojet/schemas";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CliError } from "../errors.js";

type Answer = string | number | boolean | string[] | symbol;
type Replies = Record<string, Answer>;

const CANCEL = Symbol("clack:cancel");

const asked: string[] = [];
let replies: Replies = {};
let savedPresets: { name: string; config: CreateConfig }[] = [];

/** What each question answers when a test does not say otherwise. */
const DEFAULT_REPLIES: Replies = {
  "Expo SDK version": 57,
  "Would you like to use TypeScript with this project?": true,
  "Project structure": "standalone",
  // The detected-manager question embeds a version, so it is matched by prefix.
  "We detected pnpm": true,
  Navigation: "router",
  "Navigation type": "tabs",
  "Backend API": "none",
  "Backend Framework": "hono",
  Authentication: "clerk",
  "Social sign-in providers (optional)": [],
  Styling: "uniwind",
  Icons: "lucide",
  "State management": "none",
  "Enable Liquid Glass UI engine? (Native iOS 26 + cross-platform blur)": true,
  "Mobile analytics": "none",
  "Error monitoring": "none",
  Database: "none",
  ORM: "none",
  "Include onboarding?": true,
  "Include dark mode?": true,
  "Include Tactile Haptics Engine (expo-haptics)?": true,
  "Configure EAS?": true,
  "Install dependencies?": false,
  "Initialize a git repository?": false,
  "Would you like to save this configuration as a preset for future use?": false,
  // The plan summary is restated at the end so the user sees what will be built.
  "Plan ": true,
};

/** Exact message first, then the longest declared prefix. */
function lookup(table: Replies, message: string): Answer | undefined {
  if (message in table) return table[message];
  const prefix = Object.keys(table)
    .filter((key) => message.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? table[prefix] : undefined;
}

vi.mock("@clack/prompts", () => {
  const next = async (message: string) => {
    asked.push(message);
    const answer = lookup(replies, message) ?? lookup(DEFAULT_REPLIES, message);
    if (answer === undefined) throw new Error(`unexpected prompt: ${message}`);
    return answer;
  };
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    log: { success: vi.fn(), warn: vi.fn() },
    note: vi.fn(),
    isCancel: (value: unknown) => value === CANCEL,
    confirm: ({ message }: { message: string }) => next(message),
    text: ({ message }: { message: string }) => next(message),
    select: ({ message }: { message: string }) => next(message),
    multiselect: ({ message }: { message: string }) => next(message),
  };
});

vi.mock("../banner.js", () => ({ renderHeroBanner: vi.fn() }));

// Presets live in the user's home directory, so they are stubbed to keep the
// prompt sequence deterministic and the real store untouched.
vi.mock("@expojet/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@expojet/core")>()),
  loadPresets: vi.fn(async () => savedPresets),
  getPresetSync: vi.fn(() => undefined),
  savePreset: vi.fn(async () => {}),
}));

const { promptCreate } = await import("./prompts.js");
const { CliError: CliErrorClass } = await import("../errors.js");
const { ExitCode, savePreset } = (await import("@expojet/core")) as unknown as {
  ExitCode: typeof import("@expojet/core").ExitCode;
  savePreset: { mock: { calls: unknown[][] } };
};

let cwd: string;

const run = (flags = {}, config: CreateConfig = {}) => promptCreate("my-app", flags, config, cwd);

beforeEach(() => {
  asked.length = 0;
  replies = {};
  savedPresets = [];
  savePreset.mock.calls.length = 0;
  cwd = mkdtempSync(join(tmpdir(), "expojet-prompt-"));
});

afterEach(() => {
  asked.length = 0;
  replies = {};
});

describe("promptCreate", () => {
  it("collects every unanswered choice and returns a valid input", async () => {
    const input = await run();
    expect(input).toMatchObject({
      projectName: "my-app",
      structure: "standalone",
      navigation: "router",
      navigationType: "tabs",
      auth: "clerk",
      style: "uniwind",
      icons: "lucide",
      sdk: 57,
    });
    expect(asked).toContain("Styling");
    expect(asked).toContain("Include dark mode?");
  });

  it("does not ask for the project name when one is supplied", async () => {
    await run();
    expect(asked).not.toContain("Project name");
  });

  it("does not ask about a choice the flags already made", async () => {
    const input = await run({ style: "nativewind", navigationType: "drawer" });
    expect(asked).not.toContain("Styling");
    expect(asked).not.toContain("Navigation type");
    expect(input).toMatchObject({ style: "nativewind", navigationType: "drawer" });
  });

  it("does not ask about a choice the config file already made", async () => {
    const input = await run({}, { style: "unistyles", monitoring: "sentry" });
    expect(asked).not.toContain("Styling");
    expect(asked).not.toContain("Error monitoring");
    expect(input).toMatchObject({ style: "unistyles", monitoring: "sentry" });
  });

  it("lets a flag override the config file", async () => {
    const input = await run({ style: "nativewind" }, { style: "unistyles" });
    expect(input.style).toBe("nativewind");
  });

  it("expands a boolean shorthand into its valued flag", async () => {
    const input = await run({ lucide: true, zustand: true, posthog: true, sentry: true });
    expect(asked).not.toContain("Icons");
    expect(asked).not.toContain("State management");
    expect(asked).not.toContain("Mobile analytics");
    expect(asked).not.toContain("Error monitoring");
    expect(input).toMatchObject({
      icons: "lucide",
      state: "zustand",
      analytics: "posthog",
      monitoring: "sentry",
    });
  });

  it("prefers a shorthand over the config file, matching how --yes resolves them", async () => {
    const input = await run({ lucide: true }, { icons: "hugeicons" });
    expect(input.icons).toBe("lucide");
  });

  it("falls back to the config file when no shorthand is passed", async () => {
    const input = await run({}, { icons: "hugeicons" });
    expect(input.icons).toBe("hugeicons");
  });

  it("offers the saved presets and folds the chosen one in", async () => {
    savedPresets = [{ name: "my-stack", config: { style: "nativewind", icons: "expo" } }];
    replies["Would you like to use a saved preset?"] = true;
    replies["Select a saved preset"] = "my-stack";
    const input = await run();
    expect(asked).toContain("Would you like to use a saved preset?");
    expect(input).toMatchObject({ style: "nativewind", icons: "expo" });
  });

  it("skips the preset question when nothing is saved", async () => {
    await run();
    expect(asked).not.toContain("Would you like to use a saved preset?");
  });

  it("keeps the config file over a chosen preset", async () => {
    savedPresets = [{ name: "my-stack", config: { style: "nativewind" } }];
    replies["Would you like to use a saved preset?"] = true;
    replies["Select a saved preset"] = "my-stack";
    const input = await run({}, { style: "unistyles" });
    expect(input.style).toBe("unistyles");
  });

  it("ignores an unsupported --sdk and asks instead of failing", async () => {
    const input = await run({ sdk: "99" });
    expect(asked).toContain("Expo SDK version");
    expect(input.sdk).toBe(57);
  });

  it("keeps Convex's own storage even when a database was requested", async () => {
    const input = await run({
      structure: "standalone",
      backend: "convex",
      database: "sqlite",
      orm: "drizzle",
    });
    expect(input).toMatchObject({ database: "none", orm: "none" });
    expect(asked).not.toContain("Database");
    expect(asked).not.toContain("ORM");
  });

  it("does not offer an ORM once the database is none", async () => {
    await run();
    expect(asked).toContain("Database");
    expect(asked).not.toContain("ORM");
  });

  it("offers the ORM once a monorepo has a Postgres database", async () => {
    const input = await run({ structure: "monorepo", backend: "hono", database: "neon" }, {});
    expect(asked).toContain("ORM");
    expect(input.orm).toBe("none");
    expect(input.structure).toBe("monorepo");
  });

  it("only asks for social providers when the chosen auth supports them", async () => {
    await run({ auth: "supabase" });
    expect(asked).not.toContain("Social sign-in providers (optional)");
  });

  it("asks for social providers for Clerk", async () => {
    await run({ auth: "clerk" });
    expect(asked).toContain("Social sign-in providers (optional)");
  });

  it("treats an aborted prompt as a cancellation rather than a value", async () => {
    replies["Styling"] = CANCEL;
    const thrown = await run().then(
      () => undefined,
      (error: CliError) => error,
    );
    expect(thrown).toBeInstanceOf(CliErrorClass);
    expect(thrown?.exitCode).toBe(ExitCode.Cancelled);
  });

  it("treats declining the final confirmation as a cancellation", async () => {
    replies[`Plan my-app with Expo SDK 57, clerk, uniwind, none database, and none ORM?`] = false;
    await expect(run()).rejects.toThrow(CliErrorClass);
  });

  // Reproduced in review: `Boolean(await p.confirm(...))` turned the abort symbol
  // into `true`, so the run carried on to the plan confirmation and exit code 0.
  it("stops on an aborted boolean question rather than reading the symbol as an answer", async () => {
    replies["Enable Liquid Glass UI engine? (Native iOS 26 + cross-platform blur)"] = CANCEL;
    const thrown = await run().then(
      () => undefined,
      (error: CliError) => error,
    );
    expect(thrown).toBeInstanceOf(CliErrorClass);
    expect(thrown?.exitCode).toBe(ExitCode.Cancelled);
    expect(asked).not.toContain("Plan ");
  });

  it("stops on an aborted select question", async () => {
    replies.Database = CANCEL;
    await expect(run()).rejects.toThrow(CliErrorClass);
  });

  it("stops on an aborted multiselect question", async () => {
    replies["Social sign-in providers (optional)"] = CANCEL;
    await expect(run()).rejects.toThrow(CliErrorClass);
  });

  it("stops on an aborted saved-preset question", async () => {
    savedPresets = [{ name: "my-stack", config: {} }];
    replies["Would you like to use a saved preset?"] = CANCEL;
    await expect(run()).rejects.toThrow(CliErrorClass);
    expect(asked).not.toContain("Select a saved preset");
  });

  it("stops on an aborted preset-name question and saves nothing", async () => {
    replies["Would you like to save this configuration as a preset for future use?"] = true;
    replies["Preset name"] = CANCEL;
    const thrown = await run().then(
      () => undefined,
      (error: CliError) => error,
    );
    expect(thrown).toBeInstanceOf(CliErrorClass);
    expect(thrown?.exitCode).toBe(ExitCode.Cancelled);
    expect(savePreset.mock.calls).toHaveLength(0);
  });

  it("rejects the experimental auth provider without the opt-in", async () => {
    await expect(run({ auth: "better-auth" })).rejects.toThrow(/--experimental/);
  });
});
