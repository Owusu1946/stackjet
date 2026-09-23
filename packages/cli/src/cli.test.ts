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
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const input = normalizeNonInteractiveCreate("my-app", { yes: true }, {}, cwd);
    expect(input).toMatchObject({
      projectName: "my-app",
      structure: "standalone",
      packageManager: "pnpm",
      auth: "clerk",
      style: "uniwind",
      onboarding: true,
      darkMode: true,
      eas: true,
      install: true,
      git: true,
      sdk: 57,
    });
  });

  it("supports flag equivalents for disabling optional features", () => {
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const input = normalizeNonInteractiveCreate(
      "minimal-app",
      { yes: true, onboarding: false, darkMode: false, eas: false, install: false, git: false },
      {},
      cwd,
    );
    expect(input).toMatchObject({
      onboarding: false,
      darkMode: false,
      eas: false,
      install: false,
      git: false,
    });
  });

  it("supports monorepo-web structure flag", () => {
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const input = normalizeNonInteractiveCreate(
      "web-monorepo-app",
      { yes: true, structure: "monorepo-web" },
      {},
      cwd,
    );
    expect(input.structure).toBe("monorepo-web");
  });

  it("supports typescript flag toggling", () => {
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const inputTs = normalizeNonInteractiveCreate(
      "ts-app",
      { yes: true, typescript: true },
      {},
      cwd,
    );
    expect(inputTs.typescript).toBe(true);

    const inputNoTs = normalizeNonInteractiveCreate(
      "no-ts-app",
      { yes: true, typescript: false },
      {},
      cwd,
    );
    expect(inputNoTs.typescript).toBe(false);
  });

  it("supports navigation-type flag", () => {
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const inputDrawer = normalizeNonInteractiveCreate(
      "drawer-app",
      { yes: true, navigationType: "drawer" },
      {},
      cwd,
    );
    expect(inputDrawer.navigationType).toBe("drawer");

    const inputBoth = normalizeNonInteractiveCreate(
      "both-app",
      { yes: true, navigationType: "both" },
      {},
      cwd,
    );
    expect(inputBoth.navigationType).toBe("both");

    const inputStack = normalizeNonInteractiveCreate(
      "stack-app",
      { yes: true, navigationType: "stack" },
      {},
      cwd,
    );
    expect(inputStack.navigationType).toBe("stack");
  });

  it("supports socials flag", () => {
    const cwd = mkdtempSync(join(tmpdir(), "expojet-cli-"));
    const input = normalizeNonInteractiveCreate(
      "social-app",
      { yes: true, socials: ["google", "apple"] },
      {},
      cwd,
    );
    expect(input.socialProviders).toEqual(["google", "apple"]);
  });
});

describe("commands", () => {
  it("prints secret-free info outside a generated project", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(await runProgram(["node", "expojet", "info"], capture.io)).toBe(0);
    expect(capture.stdout.join("\n")).toContain("Project: not detected");
  });

  it("rejects an unknown flag before any write", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(
      await runProgram(["node", "expojet", "create", "my-app", "--yes", "--wat"], capture.io),
    ).toBe(2);
  });

  it("requires the experimental gate for Better Auth", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(
      await runProgram(
        [
          "node",
          "expojet",
          "create",
          "auth-app",
          "--yes",
          "--structure",
          "monorepo",
          "--auth",
          "better-auth",
          "--dry-run",
        ],
        capture.io,
      ),
    ).toBe(2);
    expect(capture.stderr.join("\n")).toContain("requires --experimental");
  });

  it("runs create with --dry-run, --no-install, and --no-git", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(
      await runProgram(
        [
          "node",
          "expojet",
          "create",
          "smoke-app",
          "--yes",
          "--dry-run",
          "--no-install",
          "--no-git",
        ],
        capture.io,
      ),
    ).toBe(0);
    expect(capture.stdout.join("\n")).toContain("Dry run validated");
  });

  it("runs create with --navigation-type drawer --dry-run", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(
      await runProgram(
        [
          "node",
          "expojet",
          "create",
          "drawer-app",
          "--yes",
          "--navigation-type",
          "drawer",
          "--dry-run",
          "--no-install",
          "--no-git",
        ],
        capture.io,
      ),
    ).toBe(0);
    expect(capture.stdout.join("\n")).toContain("Navigation: router (drawer)");
  });

  it("runs create with --socials google apple --dry-run", async () => {
    process.exitCode = 0;
    const capture = captureIo(mkdtempSync(join(tmpdir(), "expojet-cli-")));
    expect(
      await runProgram(
        [
          "node",
          "expojet",
          "create",
          "social-app",
          "--yes",
          "--socials",
          "google",
          "apple",
          "--dry-run",
          "--no-install",
          "--no-git",
        ],
        capture.io,
      ),
    ).toBe(0);
    expect(capture.stdout.join("\n")).toContain("Dry run validated");
  });
});
