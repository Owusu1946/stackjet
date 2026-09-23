import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExitCode, loadPresets, savePreset } from "@expojet/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CliIo } from "./io.js";
import { runProgram } from "./program.js";

function captureIo(cwd: string) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const io: CliIo = {
    cwd,
    stdout: (message) => stdout.push(message),
    stderr: (message) => stderr.push(message),
  };
  return { io, stdout, stderr };
}

describe("CLI preset workflow", () => {
  let tempConfigDir: string;
  let workDir: string;
  let originalConfigDir: string | undefined;

  beforeEach(() => {
    tempConfigDir = mkdtempSync(join(tmpdir(), "expojet-cli-presets-test-"));
    workDir = mkdtempSync(join(tmpdir(), "expojet-work-"));
    originalConfigDir = process.env.EXPOJET_CONFIG_DIR;
    process.env.EXPOJET_CONFIG_DIR = tempConfigDir;
  });

  afterEach(() => {
    if (originalConfigDir !== undefined) {
      process.env.EXPOJET_CONFIG_DIR = originalConfigDir;
    } else {
      delete process.env.EXPOJET_CONFIG_DIR;
    }
  });

  it("lists empty state when no presets are saved", async () => {
    const { io, stdout } = captureIo(workDir);
    const code = await runProgram(["node", "expojet", "preset", "list"], io);
    expect(code).toBe(ExitCode.Success);
    expect(stdout.join("\n")).toContain("No saved presets found");
  });

  it("saves a preset via --save-preset and shows it via preset show", async () => {
    const { io, stdout } = captureIo(workDir);
    const code = await runProgram(
      [
        "node",
        "expojet",
        "create",
        "saved-app",
        "--save-preset",
        "starter-pack",
        "--auth",
        "clerk",
        "--socials",
        "google",
        "apple",
        "--style",
        "uniwind",
        "--yes",
        "--dry-run",
      ],
      io,
    );
    expect(code).toBe(ExitCode.Success);
    expect(stdout.join("\n")).toContain('Preset "starter-pack" saved');

    // Verify it exists in storage
    const presets = await loadPresets(tempConfigDir);
    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe("starter-pack");
    expect(presets[0]?.config.auth).toBe("clerk");
    expect(presets[0]?.config.socialProviders).toEqual(["google", "apple"]);
    expect(presets[0]?.config.style).toBe("uniwind");

    // Check preset list output
    const listIo = captureIo(workDir);
    const listCode = await runProgram(["node", "expojet", "preset", "list"], listIo.io);
    expect(listCode).toBe(ExitCode.Success);
    expect(listIo.stdout.join("\n")).toContain("starter-pack");

    // Check preset show output
    const showIo = captureIo(workDir);
    const showCode = await runProgram(
      ["node", "expojet", "preset", "show", "starter-pack"],
      showIo.io,
    );
    expect(showCode).toBe(ExitCode.Success);
    expect(showIo.stdout.join("\n")).toContain("Preset: starter-pack");
    expect(showIo.stdout.join("\n")).toContain('"auth": "clerk"');
  });

  it("applies a saved preset via --preset", async () => {
    await savePreset(
      {
        name: "custom-auth",
        createdAt: "2026-09-19T10:00:00.000Z",
        config: {
          structure: "standalone",
          auth: "supabase",
          style: "nativewind",
          database: "sqlite",
          orm: "drizzle",
        },
      },
      tempConfigDir,
    );

    const { io, stdout } = captureIo(workDir);
    const code = await runProgram(
      [
        "node",
        "expojet",
        "create",
        "preset-consumer",
        "--preset",
        "custom-auth",
        "--yes",
        "--dry-run",
      ],
      io,
    );
    expect(code).toBe(ExitCode.Success);
    const output = stdout.join("\n");
    expect(output).toContain("Authentication: supabase");
    expect(output).toContain("Styling: nativewind");
    expect(output).toContain("Database: sqlite");
    expect(output).toContain("ORM: drizzle");
  });

  it("deletes a preset via preset remove", async () => {
    await savePreset(
      {
        name: "temp-preset",
        createdAt: "2026-09-19T10:00:00.000Z",
        config: {},
      },
      tempConfigDir,
    );

    const { io, stdout } = captureIo(workDir);
    const code = await runProgram(["node", "expojet", "preset", "remove", "temp-preset"], io);
    expect(code).toBe(ExitCode.Success);
    expect(stdout.join("\n")).toContain('Preset "temp-preset" removed successfully');

    const presets = await loadPresets(tempConfigDir);
    expect(presets).toHaveLength(0);
  });

  it("fails gracefully when loading a nonexistent preset", async () => {
    const { io, stderr } = captureIo(workDir);
    const code = await runProgram(
      ["node", "expojet", "create", "fail-app", "--preset", "ghost-preset", "--yes", "--dry-run"],
      io,
    );
    expect(code).toBe(ExitCode.InvalidInput);
    expect(stderr.join("\n")).toContain('Preset "ghost-preset" not found');
  });

  it("fails gracefully when showing or removing a nonexistent preset", async () => {
    const showIo = captureIo(workDir);
    const showCode = await runProgram(["node", "expojet", "preset", "show", "missing"], showIo.io);
    expect(showCode).toBe(ExitCode.InvalidInput);
    expect(showIo.stderr.join("\n")).toContain('Preset "missing" not found');

    const removeIo = captureIo(workDir);
    const removeCode = await runProgram(
      ["node", "expojet", "preset", "remove", "missing"],
      removeIo.io,
    );
    expect(removeCode).toBe(ExitCode.InvalidInput);
    expect(removeIo.stderr.join("\n")).toContain('Preset "missing" not found');
  });
});
