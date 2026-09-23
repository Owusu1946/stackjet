import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { monitoringAdapter, noneMonitoringAdapter, sentryMonitoringAdapter } from "./monitoring.js";

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

describe("monitoringAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(monitoringAdapter("sentry")).toBe(sentryMonitoringAdapter);
    expect(monitoringAdapter("none")).toBe(noneMonitoringAdapter);
  });
});

describe("sentryMonitoringAdapter", () => {
  it("plans Sentry dependency, env vars, app plugin, and files in standalone mode", () => {
    const operations = sentryMonitoringAdapter.plan(
      makeInput({ monitoring: "sentry", structure: "standalone" }),
      {},
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));
    expect(deps).toContain("@sentry/react-native");

    const envs = operations.filter((op) => op.type === "add-env");
    const envNames = envs.map((op) => (op.type === "add-env" ? op.variable.name : null));
    expect(envNames).toContain("EXPO_PUBLIC_SENTRY_DSN");
    expect(envNames).toContain("SENTRY_AUTH_TOKEN");
    expect(envNames).toContain("SENTRY_ORG");
    expect(envNames).toContain("SENTRY_PROJECT");

    const publicEnv = envs.find(
      (op) => op.type === "add-env" && op.variable.name === "EXPO_PUBLIC_SENTRY_DSN",
    );
    expect(publicEnv && "variable" in publicEnv && publicEnv.variable.classification).toBe(
      "public",
    );

    const secretEnv = envs.find(
      (op) => op.type === "add-env" && op.variable.name === "SENTRY_AUTH_TOKEN",
    );
    expect(secretEnv && "variable" in secretEnv && secretEnv.variable.classification).toBe(
      "server-secret",
    );

    const appConfigOp = operations.find((op) => op.type === "compose-app-config");
    expect(appConfigOp).toBeDefined();
    if (appConfigOp && "contribution" in appConfigOp) {
      expect(appConfigOp.contribution.plugin).toBe("@sentry/react-native/expo");
    }

    const initOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/monitoring/init.ts",
    );
    expect(initOp).toBeDefined();
    if (initOp && "content" in initOp) {
      expect(initOp.content).toContain("Sentry.init");
      expect(initOp.content).toContain("EXPO_PUBLIC_SENTRY_DSN");
    }

    const indexOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/monitoring/index.ts",
    );
    expect(indexOp).toBeDefined();
    if (indexOp && "content" in indexOp) {
      expect(indexOp.content).toContain("captureException");
    }
  });

  it("plans Sentry under apps/mobile in monorepo mode", () => {
    const operations = sentryMonitoringAdapter.plan(
      makeInput({ monitoring: "sentry", structure: "monorepo" }),
      {},
    );

    const initOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/monitoring/init.ts",
    );
    expect(initOp).toBeDefined();

    const depOp = operations.find(
      (op) => op.type === "add-dependency" && op.name === "@sentry/react-native",
    );
    expect(depOp && "workspace" in depOp && depOp.workspace).toBe("apps/mobile");

    const envOp = operations.find(
      (op) => op.type === "add-env" && op.variable.name === "EXPO_PUBLIC_SENTRY_DSN",
    );
    expect(envOp && "workspace" in envOp && envOp.workspace).toBe("apps/mobile");
  });
});

describe("noneMonitoringAdapter", () => {
  it("emits exactly two write-file operations for no-op stubs", () => {
    const operations = noneMonitoringAdapter.plan(makeInput({ monitoring: "none" }), {});
    expect(operations).toHaveLength(2);
    expect(operations.every((op) => op.type === "write-file")).toBe(true);

    const initOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/monitoring/init.ts",
    );
    expect(initOp).toBeDefined();
    if (initOp && "content" in initOp) {
      expect(initOp.content).not.toContain("Sentry");
    }

    const indexOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/monitoring/index.ts",
    );
    expect(indexOp).toBeDefined();
  });

  it("emits no dependency or env operations", () => {
    const operations = noneMonitoringAdapter.plan(makeInput({ monitoring: "none" }), {});
    expect(operations.filter((op) => op.type === "add-dependency")).toHaveLength(0);
    expect(operations.filter((op) => op.type === "add-env")).toHaveLength(0);
  });

  it("places no-op stubs under apps/mobile in monorepo mode", () => {
    const operations = noneMonitoringAdapter.plan(
      makeInput({ monitoring: "none", structure: "monorepo" }),
      {},
    );
    const initOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/monitoring/init.ts",
    );
    expect(initOp).toBeDefined();
  });
});
