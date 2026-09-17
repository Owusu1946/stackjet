import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadProjectContext, runDoctorChecks } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
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
    darkMode: true,
    eas: false,
    install: false,
    git: false,
    sdk: 57,
  };
}

describe("Phase 2 generation", () => {
  it("generates a standalone no-auth fixture", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-generate-")), "generated-app");
    const result = generateCreatePlan(input(destination), false);
    expect(result.committed).toBe(true);
    expect(JSON.parse(readFileSync(join(destination, "package.json"), "utf8"))).toMatchObject({
      name: "generated-app",
      dependencies: { expo: "~57.0.23", "expo-router": "~57.0.21" },
    });
    expect(JSON.parse(readFileSync(join(destination, "app.json"), "utf8"))).toMatchObject({
      expo: { slug: "generated-app", scheme: "generated-app" },
    });
    expect(readFileSync(join(destination, "expojet.jsonc"), "utf8")).not.toContain("secret");
  });

  it("previews the exact plan without creating a target", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "stackjet-preview-")), "generated-app");
    const result = generateCreatePlan(input(destination), true);
    expect(result.committed).toBe(false);
    expect(result.files).toContain("app/index.tsx");
    expect(existsSync(destination)).toBe(false);
  });

  it("plans Clerk hosted authentication", () => {
    const plan = buildCreatePlan({ ...input("unused"), auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "add-dependency", name: "@clerk/expo" }),
        expect.objectContaining({ type: "write-file", path: ".maestro/clerk-auth.yaml" }),
      ]),
    );
  });

  it("plans the typed Hono and Neon monorepo", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo", auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "apps/api/src/app.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/mobile/src/data/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "packages/api-contract/src/index.ts" }),
      ]),
    );
  });

  it("plans the full-stack web and mobile monorepo (monorepo-web)", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo-web", auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "apps/api/src/app.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/mobile/src/data/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/package.json" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/app/layout.tsx" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/app/page.tsx" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/src/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "packages/api-contract/src/index.ts" }),
      ]),
    );
  });

  it("plans the theme engine and dark mode tokens", () => {
    const plan = buildCreatePlan({ ...input("unused"), darkMode: true });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "src/theme/tokens.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/theme/provider.tsx" }),
        expect.objectContaining({ type: "write-file", path: "src/components/theme-toggle.tsx" }),
      ]),
    );
  });

  it("keeps server secrets out of mobile operations", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo", auth: "clerk" });
    const mobile = JSON.stringify(
      plan.operations.filter(
        (operation) => "path" in operation && operation.path.startsWith("apps/mobile/"),
      ),
    );
    expect(mobile).not.toMatch(/CLERK_SECRET_KEY|DIRECT_DATABASE_URL|DATABASE_URL/);
  });

  it("applies the Uniwind adapter without direct filesystem writes", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "uniwind" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "compose-metro" }),
        expect.objectContaining({ type: "add-dependency", name: "uniwind" }),
      ]),
    );
  });

  it("applies the NativeWind adapter with Metro composition and tailwind config", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "nativewind" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "compose-metro",
          contribution: expect.objectContaining({
            module: "nativewind/metro",
            exportName: "withNativeWind",
          }),
        }),
        expect.objectContaining({ type: "add-dependency", name: "nativewind" }),
        expect.objectContaining({ type: "add-dependency", name: "tailwindcss" }),
        expect.objectContaining({ type: "write-file", path: "tailwind.config.js" }),
        expect.objectContaining({ type: "write-file", path: "src/global.css" }),
        expect.objectContaining({ type: "write-file", path: "src/nativewind-env.d.ts" }),
      ]),
    );
  });

  it("applies the Unistyles adapter with themes and unistyles configuration", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "unistyles" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "add-dependency", name: "react-native-unistyles" }),
        expect.objectContaining({ type: "write-file", path: "src/unistyles.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/style-entry.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/components/brand-card.tsx" }),
      ]),
    );
  });

  it("generates an atomic monorepo-web project that passes doctor checks", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "stackjet-monorepo-web-")), "web-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo-web",
        auth: "clerk",
        style: "uniwind",
        darkMode: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.structure).toBe("monorepo-web");
    expect(project?.manifest.features?.darkMode).toBe(true);

    const checks = runDoctorChecks(project);
    const workspacesCheck = checks.find((c) => c.name === "Monorepo workspaces");
    expect(workspacesCheck?.status).toBe("pass");

    const secretBoundaryCheck = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretBoundaryCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "apps/web/package.json"))).toBe(true);
    expect(existsSync(join(destination, "apps/web/app/layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "apps/web/app/page.tsx"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/package.json"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/src/theme/tokens.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/package.json"))).toBe(true);
    expect(existsSync(join(destination, "packages/api-contract/package.json"))).toBe(true);
  });
});
