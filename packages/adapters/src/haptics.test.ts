import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { getHapticsAdapter, hapticsAdapter, noHapticsAdapter } from "./haptics.js";

function makeInput(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "standalone",
    packageManager: "pnpm",
    navigation: "router",
    navigationType: "tabs",
    typescript: true,
    icons: "lucide",
    state: "none",
    liquidGlass: false,
    analytics: "none",
    monitoring: "none",
    backend: "none",
    auth: "none",
    style: "uniwind",
    database: "none",
    orm: "none",
    onboarding: true,
    darkMode: true,
    haptics: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57,
    ...overrides,
  };
}

describe("getHapticsAdapter selector", () => {
  it("resolves the correct adapter for boolean flags", () => {
    expect(getHapticsAdapter(true)).toBe(hapticsAdapter);
    expect(getHapticsAdapter(false)).toBe(noHapticsAdapter);
  });
});

describe("hapticsAdapter", () => {
  it("plans expo-haptics dependency and haptic utility in standalone mode", () => {
    const operations = hapticsAdapter.plan(makeInput({ haptics: true, structure: "standalone" }), {});

    const deps = operations.filter((op) => op.type === "add-dependency");
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({
      type: "add-dependency",
      name: "expo-haptics",
      version: "~57.0.3",
      workspace: ".",
    });

    const fileOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/haptics/index.ts",
    );
    expect(fileOp).toBeDefined();
    if (fileOp && "content" in fileOp) {
      expect(fileOp.content).toContain('import * as Haptics from "expo-haptics"');
      expect(fileOp.content).toContain("selection:");
      expect(fileOp.content).toContain("light:");
      expect(fileOp.content).toContain("medium:");
      expect(fileOp.content).toContain("heavy:");
      expect(fileOp.content).toContain("success:");
      expect(fileOp.content).toContain("warning:");
      expect(fileOp.content).toContain("error:");
      expect(fileOp.content).toContain('Platform.OS === "web"');
    }
  });

  it("plans expo-haptics under apps/mobile in monorepo mode", () => {
    const operations = hapticsAdapter.plan(makeInput({ haptics: true, structure: "monorepo" }), {});

    const fileOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/haptics/index.ts",
    );
    expect(fileOp).toBeDefined();

    const depOp = operations.find(
      (op) => op.type === "add-dependency" && op.name === "expo-haptics",
    );
    expect(depOp && "workspace" in depOp && depOp.workspace).toBe("apps/mobile");
  });
});

describe("noHapticsAdapter", () => {
  it("emits write-file for no-op stubs with no dependencies", () => {
    const operations = noHapticsAdapter.plan(makeInput({ haptics: false, structure: "standalone" }), {});
    expect(operations).toHaveLength(1);
    expect(operations[0].type).toBe("write-file");

    const fileOp = operations[0];
    if (fileOp && "content" in fileOp) {
      expect(fileOp.path).toBe("src/haptics/index.ts");
      expect(fileOp.content).not.toContain("expo-haptics");
      expect(fileOp.content).toContain("selection: () => {}");
      expect(fileOp.content).toContain("light: () => {}");
      expect(fileOp.content).toContain("medium: () => {}");
      expect(fileOp.content).toContain("success: () => {}");
    }
  });

  it("places no-op stubs under apps/mobile in monorepo mode", () => {
    const operations = noHapticsAdapter.plan(makeInput({ haptics: false, structure: "monorepo" }), {});
    const fileOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/haptics/index.ts",
    );
    expect(fileOp).toBeDefined();
  });
});
