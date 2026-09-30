import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ProjectContext } from "../project.js";
import { checkEnvironment, MOBILE_SECRET_PATTERN, treeContains, workspacesFor } from "./index.js";

describe("MOBILE_SECRET_PATTERN", () => {
  const serverCredentials = [
    "CLERK_SECRET_KEY",
    "BETTER_AUTH_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DIRECT_DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
  ];

  const clientIngestion = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "POSTHOG_API_KEY",
    "POSTHOG_KEY",
    "APTABASE_KEY",
    "APTABASE_SECRET",
  ];

  it.each([...serverCredentials, ...clientIngestion])("flags a bare %s", (name) => {
    expect(MOBILE_SECRET_PATTERN.test(`const key = process.env.${name};`)).toBe(true);
  });

  // EXPO_PUBLIC_ publishes a value in the bundle. It does not make a server
  // credential safe, so these stay findings with the prefix.
  it.each(serverCredentials)("still flags EXPO_PUBLIC_ %s", (name) => {
    expect(MOBILE_SECRET_PATTERN.test(`const key = process.env.EXPO_PUBLIC_${name};`)).toBe(true);
  });

  it.each(clientIngestion)("allows the public prefix on %s", (name) => {
    expect(MOBILE_SECRET_PATTERN.test(`const key = process.env.EXPO_PUBLIC_${name};`)).toBe(false);
  });

  it("flags an unprefixed DATABASE_URL while allowing the prefixed form", () => {
    expect(MOBILE_SECRET_PATTERN.test("process.env.DATABASE_URL")).toBe(true);
    expect(MOBILE_SECRET_PATTERN.test("process.env.EXPO_PUBLIC_DATABASE_URL")).toBe(false);
  });

  it("has no global flag, so repeated tests are not stateful", () => {
    // A /g regex would alternate true/false across calls via lastIndex.
    expect(MOBILE_SECRET_PATTERN.test("process.env.JWT_SECRET")).toBe(true);
    expect(MOBILE_SECRET_PATTERN.test("process.env.JWT_SECRET")).toBe(true);
  });
});

describe("treeContains", () => {
  it("searches source files and skips build output", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-boundary-"));
    writeFileSync(join(root, "app.ts"), "process.env.CLERK_SECRET_KEY");
    expect(treeContains(root, MOBILE_SECRET_PATTERN)).toBe(true);

    const clean = mkdtempSync(join(tmpdir(), "expojet-boundary-"));
    writeFileSync(join(clean, "app.ts"), "process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(treeContains(clean, MOBILE_SECRET_PATTERN)).toBe(false);
  });

  it("ignores node_modules and dist", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-boundary-"));
    mkdirSync(join(root, "node_modules"));
    writeFileSync(join(root, "node_modules", "dep.ts"), "process.env.CLERK_SECRET_KEY");
    mkdirSync(join(root, "dist"));
    writeFileSync(join(root, "dist", "out.js"), "process.env.CLERK_SECRET_KEY");
    expect(treeContains(root, MOBILE_SECRET_PATTERN)).toBe(false);
  });

  it("returns false for a directory that does not exist", () => {
    expect(treeContains(join(tmpdir(), "expojet-does-not-exist-xyz"), MOBILE_SECRET_PATTERN)).toBe(
      false,
    );
  });
});

describe("workspacesFor", () => {
  it.each([
    ["standalone", ["."]],
    ["monorepo", ["apps/mobile", "apps/api"]],
    ["monorepo-web", ["apps/mobile", "apps/api", "apps/web"]],
  ])("maps %s to its workspaces", (structure, expected) => {
    expect(workspacesFor(structure)).toEqual(expected);
  });
});

describe("checkEnvironment", () => {
  function project(root: string, structure: string): ProjectContext {
    return {
      root,
      manifestPath: join(root, "expojet.jsonc"),
      manifest: { structure, sdk: 57 } as ProjectContext["manifest"],
    };
  }

  it("reports which declared variables are still missing from .env", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-env-"));
    writeFileSync(join(root, ".env.example"), "# comment\nEXPO_PUBLIC_API_URL=\nSECRET_KEY=\n");
    writeFileSync(join(root, ".env"), "EXPO_PUBLIC_API_URL=https://api.test\n");

    const results = checkEnvironment(project(root, "standalone"));
    expect(results).toEqual([
      {
        workspace: ".",
        variable: "EXPO_PUBLIC_API_URL",
        classification: "mobile-public",
        status: "present",
      },
      {
        workspace: ".",
        variable: "SECRET_KEY",
        classification: "server-secret",
        status: "missing",
      },
    ]);
  });

  it("returns nothing for a workspace with no .env.example", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-env-"));
    expect(checkEnvironment(project(root, "standalone"))).toEqual([]);
  });
});
