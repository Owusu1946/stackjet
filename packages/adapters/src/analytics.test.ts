import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  analyticsAdapter,
  aptabaseAnalyticsAdapter,
  noneAnalyticsAdapter,
  posthogAnalyticsAdapter,
} from "./analytics.js";

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

describe("analyticsAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(analyticsAdapter("posthog")).toBe(posthogAnalyticsAdapter);
    expect(analyticsAdapter("aptabase")).toBe(aptabaseAnalyticsAdapter);
    expect(analyticsAdapter("none")).toBe(noneAnalyticsAdapter);
  });
});

describe("posthogAnalyticsAdapter", () => {
  it("plans PostHog dependencies, env vars, and files in standalone mode", () => {
    const operations = posthogAnalyticsAdapter.plan(
      makeInput({ analytics: "posthog", structure: "standalone" }),
      {},
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));
    expect(deps).toContain("posthog-react-native");
    expect(deps).toContain("expo-file-system");
    expect(deps).toContain("expo-application");

    const envs = operations
      .filter((op) => op.type === "add-env")
      .map((op) => (op.type === "add-env" ? op.variable.name : null));
    expect(envs).toContain("EXPO_PUBLIC_POSTHOG_KEY");
    expect(envs).toContain("EXPO_PUBLIC_POSTHOG_HOST");

    const clientOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/posthog.ts",
    );
    expect(clientOp).toBeDefined();
    if (clientOp && "content" in clientOp) {
      expect(clientOp.content).toContain('from "posthog-react-native"');
      expect(clientOp.content).toContain("EXPO_PUBLIC_POSTHOG_KEY");
    }

    const providerOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/provider.tsx",
    );
    expect(providerOp).toBeDefined();
    if (providerOp && "content" in providerOp) {
      expect(providerOp.content).toContain("PostHogProvider");
      expect(providerOp.content).toContain("useAnalytics");
      expect(providerOp.content).toContain("trackEvent");
    }

    const indexOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/index.ts",
    );
    expect(indexOp).toBeDefined();
  });

  it("plans PostHog under apps/mobile in monorepo mode", () => {
    const operations = posthogAnalyticsAdapter.plan(
      makeInput({ analytics: "posthog", structure: "monorepo" }),
      {},
    );

    const clientOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/analytics/posthog.ts",
    );
    expect(clientOp).toBeDefined();

    const depOp = operations.find(
      (op) => op.type === "add-dependency" && op.name === "posthog-react-native",
    );
    expect(depOp && "workspace" in depOp && depOp.workspace).toBe("apps/mobile");

    const envOp = operations.find(
      (op) => op.type === "add-env" && op.variable.name === "EXPO_PUBLIC_POSTHOG_KEY",
    );
    expect(envOp && "workspace" in envOp && envOp.workspace).toBe("apps/mobile");
  });
});

describe("aptabaseAnalyticsAdapter", () => {
  it("plans Aptabase dependencies, env vars, and files in standalone mode", () => {
    const operations = aptabaseAnalyticsAdapter.plan(
      makeInput({ analytics: "aptabase", structure: "standalone" }),
      {},
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));
    expect(deps).toContain("@aptabase/react-native");

    const envs = operations
      .filter((op) => op.type === "add-env")
      .map((op) => (op.type === "add-env" ? op.variable.name : null));
    expect(envs).toContain("EXPO_PUBLIC_APTABASE_KEY");
    expect(envs).toContain("EXPO_PUBLIC_APTABASE_HOST");

    const clientOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/aptabase.ts",
    );
    expect(clientOp).toBeDefined();
    if (clientOp && "content" in clientOp) {
      expect(clientOp.content).toContain('from "@aptabase/react-native"');
      expect(clientOp.content).toContain("initAptabaseClient");
    }

    const providerOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/provider.tsx",
    );
    expect(providerOp).toBeDefined();
    if (providerOp && "content" in providerOp) {
      expect(providerOp.content).toContain("AnalyticsProvider");
      expect(providerOp.content).toContain("useAnalytics");
    }

    const indexOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/analytics/index.ts",
    );
    expect(indexOp).toBeDefined();
  });

  it("plans Aptabase under apps/mobile in monorepo mode", () => {
    const operations = aptabaseAnalyticsAdapter.plan(
      makeInput({ analytics: "aptabase", structure: "monorepo" }),
      {},
    );

    const clientOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/analytics/aptabase.ts",
    );
    expect(clientOp).toBeDefined();

    const depOp = operations.find(
      (op) => op.type === "add-dependency" && op.name === "@aptabase/react-native",
    );
    expect(depOp && "workspace" in depOp && depOp.workspace).toBe("apps/mobile");
  });
});

describe("noneAnalyticsAdapter", () => {
  it("emits zero operations", () => {
    const operations = noneAnalyticsAdapter.plan(makeInput({ analytics: "none" }), {});
    expect(operations).toHaveLength(0);
  });
});
