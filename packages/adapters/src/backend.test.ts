import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  backendAdapter,
  convexBackendAdapter,
  expressBackendAdapter,
  honoBackendAdapter,
  nestjsBackendAdapter,
  noneBackendAdapter,
} from "./backend.js";

function makeInput(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "monorepo",
    packageManager: "pnpm",
    navigation: "router",
    navigationType: "tabs",
    typescript: true,
    icons: "lucide",
    state: "none",
    liquidGlass: false,
    analytics: "none",
    backend: "hono",
    auth: "clerk",
    style: "uniwind",
    database: "neon",
    orm: "drizzle",
    onboarding: true,
    darkMode: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57,
    ...overrides,
  };
}

describe("backendAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(backendAdapter("hono")).toBe(honoBackendAdapter);
    expect(backendAdapter("express")).toBe(expressBackendAdapter);
    expect(backendAdapter("nestjs")).toBe(nestjsBackendAdapter);
    expect(backendAdapter("convex")).toBe(convexBackendAdapter);
    expect(backendAdapter("none")).toBe(noneBackendAdapter);
  });
});

describe("honoBackendAdapter", () => {
  it("plans hono API files and mobile RPC client in monorepo", () => {
    const operations = honoBackendAdapter.plan(makeInput({ backend: "hono" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/api/tsconfig.json");
    expect(paths).toContain("apps/api/src/env.ts");
    expect(paths).toContain("apps/api/src/app.ts");
    expect(paths).toContain("apps/api/src/app.test.ts");
    expect(paths).toContain("apps/api/src/index.ts");
    expect(paths).toContain("packages/api-contract/package.json");
    expect(paths).toContain("packages/api-contract/src/index.ts");
    expect(paths).toContain("apps/mobile/src/data/api.ts");

    const mobileDeps = operations
      .filter((op) => op.type === "add-dependency" && op.workspace === "apps/mobile")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(mobileDeps).toContain("hono");
    expect(mobileDeps).toContain("@expojet/api-contract");
  });

  it("returns no operations in standalone mode", () => {
    const operations = honoBackendAdapter.plan(
      makeInput({ structure: "standalone", backend: "hono" }),
      {},
    );
    expect(operations).toHaveLength(0);
  });
});

describe("expressBackendAdapter", () => {
  it("plans express API files, supertest tests, and typed fetch client", () => {
    const operations = expressBackendAdapter.plan(makeInput({ backend: "express" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/api/src/app.ts");
    expect(paths).toContain("apps/api/src/app.test.ts");
    expect(paths).toContain("apps/api/src/index.ts");
    expect(paths).toContain("packages/api-contract/src/index.ts");
    expect(paths).toContain("apps/mobile/src/data/api.ts");

    const pkgOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/api/package.json",
    );
    const content = pkgOp && "content" in pkgOp ? pkgOp.content : "";
    expect(content).toContain('"express"');
    expect(content).toContain('"cors"');
    expect(content).toContain('"helmet"');
    expect(content).toContain('"supertest"');

    // Mobile should NOT have hono dependency
    const mobileDeps = operations
      .filter((op) => op.type === "add-dependency" && op.workspace === "apps/mobile")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(mobileDeps).toContain("@expojet/api-contract");
    expect(mobileDeps).not.toContain("hono");
  });
});

describe("nestjsBackendAdapter", () => {
  it("plans modular nestjs architecture with controllers, guards, and services", () => {
    const operations = nestjsBackendAdapter.plan(makeInput({ backend: "nestjs" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/api/tsconfig.json");
    expect(paths).toContain("apps/api/src/main.ts");
    expect(paths).toContain("apps/api/src/app.module.ts");
    expect(paths).toContain("apps/api/src/health.controller.ts");
    expect(paths).toContain("apps/api/src/me.controller.ts");
    expect(paths).toContain("apps/api/src/auth.guard.ts");
    expect(paths).toContain("apps/api/src/auth.service.ts");
    expect(paths).toContain("apps/api/src/app.test.ts");
    expect(paths).toContain("packages/api-contract/src/index.ts");
    expect(paths).toContain("apps/mobile/src/data/api.ts");

    const tsconfigOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/api/tsconfig.json",
    );
    const tsconfigContent = tsconfigOp && "content" in tsconfigOp ? tsconfigOp.content : "";
    expect(tsconfigContent).toContain('"experimentalDecorators": true');

    const pkgOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/api/package.json",
    );
    const pkgContent = pkgOp && "content" in pkgOp ? pkgOp.content : "";
    expect(pkgContent).toContain('"@nestjs/core"');
    expect(pkgContent).toContain('"@nestjs/common"');
    expect(pkgContent).toContain('"reflect-metadata"');
  });
});

describe("convexBackendAdapter", () => {
  it("scaffolds convex files, react client, and env in standalone mode", () => {
    const operations = convexBackendAdapter.plan(
      makeInput({ structure: "standalone", backend: "convex", database: "none", orm: "none" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("convex/schema.ts");
    expect(paths).toContain("convex/users.ts");
    expect(paths).toContain("convex/tsconfig.json");
    expect(paths).toContain("src/data/provider.tsx");

    const envVars = operations
      .filter((op) => op.type === "add-env")
      .map((op) => op.type === "add-env" && op.variable.name);
    expect(envVars).toContain("EXPO_PUBLIC_CONVEX_URL");

    const scripts = operations
      .filter((op) => op.type === "add-script")
      .map((op) => op.type === "add-script" && op.name);
    expect(scripts).toContain("convex:dev");
  });

  it("scaffolds convex workspace files in monorepo mode", () => {
    const operations = convexBackendAdapter.plan(
      makeInput({ structure: "monorepo", backend: "convex", database: "none", orm: "none" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/api/convex/schema.ts");
    expect(paths).toContain("apps/api/convex/users.ts");
    expect(paths).toContain("apps/api/convex/tsconfig.json");
    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/mobile/src/data/provider.tsx");
    expect(paths).toContain("packages/api-contract/package.json");
  });
});

describe("noneBackendAdapter", () => {
  it("returns empty operations", () => {
    const operations = noneBackendAdapter.plan(makeInput({ backend: "none" }), {});
    expect(operations).toHaveLength(0);
  });
});
