import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CreateInput } from "@stackjet/schemas";
import { describe, expect, it } from "vitest";
import { buildCreatePlan, generateCreatePlan } from "./generation.js";

function input(destination: string): CreateInput {
  return {
    projectName: "generated-app",
    destination,
    structure: "standalone",
    packageManager: "pnpm",
    auth: "none",
    style: "stylesheet",
    onboarding: false,
    eas: false,
    sdk: 57,
  };
}

describe("Phase 2 generation", () => {
  it("generates a standalone no-auth fixture", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "stackjet-generate-")), "generated-app");
    const result = generateCreatePlan(input(destination), false);
    expect(result.committed).toBe(true);
    expect(JSON.parse(readFileSync(join(destination, "package.json"), "utf8"))).toMatchObject({
      name: "generated-app",
      dependencies: { expo: "~57.0.23", "expo-router": "~57.0.21" },
    });
    expect(JSON.parse(readFileSync(join(destination, "app.json"), "utf8"))).toMatchObject({
      expo: { slug: "generated-app", scheme: "generated-app" },
    });
    expect(readFileSync(join(destination, "stackjet.jsonc"), "utf8")).not.toContain("secret");
  });

  it("previews the exact plan without creating a target", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "stackjet-preview-")), "generated-app");
    const result = generateCreatePlan(input(destination), true);
    expect(result.committed).toBe(false);
    expect(result.files).toContain("app/index.tsx");
    expect(existsSync(destination)).toBe(false);
  });

  it("rejects adapter selections before execution", () => {
    const unsupported = { ...input("unused"), auth: "clerk" as const };
    expect(() => buildCreatePlan(unsupported)).toThrow("standalone + no auth + StyleSheet only");
  });
});
