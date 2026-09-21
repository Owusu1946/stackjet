import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { getLiquidGlassAdapter, liquidGlassAdapter, noLiquidGlassAdapter } from "./liquid-glass.js";

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
    liquidGlass: true,
    analytics: "none",
    monitoring: "none",
    backend: "none",
    auth: "none",
    style: "uniwind",
    database: "none",
    orm: "none",
    onboarding: true,
    darkMode: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57,
    ...overrides,
  };
}

describe("getLiquidGlassAdapter selector", () => {
  it("resolves the correct adapter based on boolean flag", () => {
    expect(getLiquidGlassAdapter(true)).toBe(liquidGlassAdapter);
    expect(getLiquidGlassAdapter(false)).toBe(noLiquidGlassAdapter);
  });
});

describe("liquidGlassAdapter", () => {
  it("plans dependencies and GlassCard in standalone mode", () => {
    const operations = liquidGlassAdapter.plan(
      makeInput({ liquidGlass: true, structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("expo-glass-effect");
    expect(deps).toContain("expo-blur");

    const glassCardOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/ui/glass-card.tsx",
    );
    expect(glassCardOp).toBeDefined();
    if (glassCardOp && "content" in glassCardOp) {
      expect(glassCardOp.content).toContain('from "expo-glass-effect"');
      expect(glassCardOp.content).toContain('from "expo-blur"');
      expect(glassCardOp.content).toContain("isGlassEffectAPIAvailable");
      expect(glassCardOp.content).toContain("GlassView");
      expect(glassCardOp.content).toContain("BlurView");
      expect(glassCardOp.content).toContain("export function GlassCard");
    }

    expect(
      operations.some(
        (op) =>
          op.type === "write-file" && op.path === "src/components/ui/glass-tab-bar-background.tsx",
      ),
    ).toBe(false);
  });

  it("plans liquid glass under apps/mobile in monorepo mode", () => {
    const operations = liquidGlassAdapter.plan(
      makeInput({ liquidGlass: true, structure: "monorepo" }),
      {},
    );
    const glassCardOp = operations.find(
      (op) =>
        op.type === "write-file" && op.path === "apps/mobile/src/components/ui/glass-card.tsx",
    );
    expect(glassCardOp).toBeDefined();

    const deps = operations.filter((op) => op.type === "add-dependency");
    for (const dep of deps) {
      if (dep.type === "add-dependency") {
        expect(dep.workspace).toBe("apps/mobile");
      }
    }
  });
});

describe("noLiquidGlassAdapter", () => {
  it("emits zero operations", () => {
    const operations = noLiquidGlassAdapter.plan(makeInput({ liquidGlass: false }), {});
    expect(operations).toHaveLength(0);
  });
});
