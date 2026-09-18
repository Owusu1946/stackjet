import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { drizzleOrmAdapter, noneOrmAdapter, ormAdapter, prismaOrmAdapter } from "./orm.js";

function makeInput(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "monorepo",
    packageManager: "pnpm",
    navigation: "router",
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

describe("ORM adapters", () => {
  it("resolves ORM adapter by id", () => {
    expect(ormAdapter("drizzle")).toBe(drizzleOrmAdapter);
    expect(ormAdapter("prisma")).toBe(prismaOrmAdapter);
    expect(ormAdapter("none")).toBe(noneOrmAdapter);
  });

  describe("drizzleOrmAdapter", () => {
    it("plans Drizzle files and Neon client in monorepo with Neon", () => {
      const ops = drizzleOrmAdapter.plan(makeInput({ database: "neon", orm: "drizzle" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);

      expect(paths).toContain("apps/api/src/db/schema.ts");
      expect(paths).toContain("apps/api/src/db/client.ts");
      expect(paths).toContain("apps/api/drizzle.config.ts");
      expect(paths).toContain("apps/api/drizzle/0000_profiles.sql");

      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("drizzle-orm");
      expect(deps).toContain("drizzle-kit");
      expect(deps).toContain("@neondatabase/serverless");

      const scripts = ops
        .filter((op) => op.type === "add-script")
        .map((op) => op.type === "add-script" && op.name);
      expect(scripts).toContain("db:generate");
      expect(scripts).toContain("db:migrate");
      expect(scripts).toContain("db:studio");
    });

    it("plans Drizzle with Postgres in monorepo", () => {
      const ops = drizzleOrmAdapter.plan(makeInput({ database: "postgres", orm: "drizzle" }), {});
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("drizzle-orm");
      expect(deps).toContain("pg");
      expect(deps).toContain("@types/pg");
    });

    it("plans Drizzle with SQLite in monorepo", () => {
      const ops = drizzleOrmAdapter.plan(makeInput({ database: "sqlite", orm: "drizzle" }), {});
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("drizzle-orm");
      expect(deps).toContain("@libsql/client");
    });

    it("plans Drizzle with SQLite in standalone mode", () => {
      const ops = drizzleOrmAdapter.plan(
        makeInput({ structure: "standalone", database: "sqlite", orm: "drizzle" }),
        {},
      );
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/db/schema.ts");
      expect(paths).toContain("src/db/client.ts");

      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("drizzle-orm");
      expect(deps).toContain("drizzle-kit");
    });
  });

  describe("prismaOrmAdapter", () => {
    it("plans Prisma files and scripts in monorepo", () => {
      const ops = prismaOrmAdapter.plan(makeInput({ database: "postgres", orm: "prisma" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);

      expect(paths).toContain("apps/api/prisma/schema.prisma");
      expect(paths).toContain("apps/api/src/db/client.ts");

      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("@prisma/client");
      expect(deps).toContain("prisma");

      const scripts = ops
        .filter((op) => op.type === "add-script")
        .map((op) => op.type === "add-script" && op.name);
      expect(scripts).toContain("db:generate");
      expect(scripts).toContain("db:migrate");
      expect(scripts).toContain("db:studio");
    });
  });

  describe("noneOrmAdapter", () => {
    it("returns empty operations", () => {
      expect(noneOrmAdapter.plan(makeInput({ orm: "none" }), {})).toHaveLength(0);
    });
  });
});
