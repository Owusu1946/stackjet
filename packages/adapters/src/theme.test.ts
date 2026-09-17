import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { themeAdapter } from "./theme.js";

function makeInput(overrides: Partial<CreateInput>): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "standalone",
    packageManager: "pnpm",
    auth: "clerk",
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

describe("themeAdapter", () => {
  it("generates dynamic theme engine when darkMode is true", () => {
    const operations = themeAdapter.plan(makeInput({ darkMode: true }), {});
    const providerOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/theme/provider.tsx",
    );
    expect(providerOp).toBeDefined();
    if (providerOp && providerOp.type === "write-file") {
      expect(providerOp.content).toContain("expo-secure-store");
      expect(providerOp.content).toContain("useNativeColorScheme");
      expect(providerOp.content).toContain("ThemeProvider");
    }

    const toggleOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/theme-toggle.tsx",
    );
    expect(toggleOp).toBeDefined();
  });

  it("generates fixed light theme engine when darkMode is false", () => {
    const operations = themeAdapter.plan(makeInput({ darkMode: false }), {});
    const providerOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/theme/provider.tsx",
    );
    expect(providerOp).toBeDefined();
    if (providerOp && providerOp.type === "write-file") {
      expect(providerOp.content).not.toContain("expo-secure-store");
      expect(providerOp.content).toContain('colorScheme: "light"');
    }
  });

  it("targets apps/mobile in monorepo and monorepo-web", () => {
    const operations = themeAdapter.plan(makeInput({ structure: "monorepo" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);
    expect(paths).toContain("apps/mobile/src/theme/tokens.ts");
    expect(paths).toContain("apps/mobile/src/theme/provider.tsx");
    expect(paths).toContain("apps/mobile/src/components/theme-toggle.tsx");

    const webOperations = themeAdapter.plan(makeInput({ structure: "monorepo-web" }), {});
    const webPaths = webOperations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);
    expect(webPaths).toContain("apps/mobile/src/theme/tokens.ts");
  });
});
