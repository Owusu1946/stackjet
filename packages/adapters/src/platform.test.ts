import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { monorepoPlatformAdapter } from "./platform.js";

function makeInput(overrides: Partial<CreateInput>): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "monorepo",
    packageManager: "pnpm",
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

describe("monorepoPlatformAdapter", () => {
  it("provides noDataProvider in standalone mode", () => {
    const operations = monorepoPlatformAdapter.plan(makeInput({ structure: "standalone" }), {});
    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      type: "write-file",
      path: "src/data/provider.tsx",
    });
  });

  it("plans mobile and api workspaces in monorepo mode", () => {
    const operations = monorepoPlatformAdapter.plan(makeInput({ structure: "monorepo" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("package.json");
    expect(paths).toContain("turbo.json");
    expect(paths).toContain("pnpm-workspace.yaml");
    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/api/src/app.ts");
    expect(paths).toContain("apps/mobile/src/data/provider.tsx");
    expect(paths).not.toContain("apps/web/package.json");
  });

  it("plans web, mobile, and api workspaces in monorepo-web mode", () => {
    const operations = monorepoPlatformAdapter.plan(makeInput({ structure: "monorepo-web" }), {});
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("package.json");
    expect(paths).toContain("turbo.json");
    expect(paths).toContain("pnpm-workspace.yaml");
    expect(paths).toContain("apps/api/package.json");
    expect(paths).toContain("apps/api/src/app.ts");
    expect(paths).toContain("apps/mobile/src/data/provider.tsx");
    // Web application paths
    expect(paths).toContain("apps/web/package.json");
    expect(paths).toContain("apps/web/tsconfig.json");
    expect(paths).toContain("apps/web/next.config.ts");
    expect(paths).toContain("apps/web/app/layout.tsx");
    expect(paths).toContain("apps/web/app/page.tsx");
    expect(paths).toContain("apps/web/app/providers.tsx");
    expect(paths).toContain("apps/web/src/api.ts");
  });
});
