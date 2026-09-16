import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeNonInteractiveCreate } from "./create.js";
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

describe("non-interactive create", () => {
  it("normalizes documented defaults", () => {
    const cwd = mkdtempSync(join(tmpdir(), "stackjet-cli-"));
    const input = normalizeNonInteractiveCreate("my-app", { yes: true }, {}, cwd);
    expect(input).toMatchObject({
      projectName: "my-app",
      structure: "standalone",
      packageManager: "pnpm",
      auth: "clerk",
      style: "uniwind",
      onboarding: true,
      eas: true,
      sdk: 57,
    });
  });

  it("supports flag equivalents for disabling optional features", () => {
    const cwd = mkdtempSync(join(tmpdir(), "stackjet-cli-"));
    const input = normalizeNonInteractiveCreate(
      "minimal-app",
      { yes: true, onboarding: false, eas: false },
      {},
      cwd,
    );
    expect(input).toMatchObject({ onboarding: false, eas: false });
  });
});

describe("commands", () => {
  it("prints secret-free info outside a generated project", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "stackjet-cli-")));
    expect(await runProgram(["node", "stackjet", "info"], capture.io)).toBe(0);
    expect(capture.stdout.join("\n")).toContain("Project: not detected");
  });

  it("rejects an unknown flag before any write", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "stackjet-cli-")));
    expect(
      await runProgram(["node", "stackjet", "create", "my-app", "--yes", "--wat"], capture.io),
    ).toBe(2);
  });
});
