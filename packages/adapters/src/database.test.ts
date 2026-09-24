import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  databaseAdapter,
  neonDatabaseAdapter,
  noneDatabaseAdapter,
  postgresDatabaseAdapter,
  sqliteDatabaseAdapter,
  supabaseDatabaseAdapter,
} from "./database.js";

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
    monitoring: "none",
    backend: "hono",
    auth: "clerk",
    style: "uniwind",
    database: "neon",
    orm: "drizzle",
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

describe("database adapters", () => {
  it("resolves database adapter by id", () => {
    expect(databaseAdapter("neon")).toBe(neonDatabaseAdapter);
    expect(databaseAdapter("postgres")).toBe(postgresDatabaseAdapter);
    expect(databaseAdapter("sqlite")).toBe(sqliteDatabaseAdapter);
    expect(databaseAdapter("supabase")).toBe(supabaseDatabaseAdapter);
    expect(databaseAdapter("none")).toBe(noneDatabaseAdapter);
  });

  describe("neonDatabaseAdapter", () => {
    it("plans Neon env variables in monorepo", () => {
      const ops = neonDatabaseAdapter.plan(makeInput({ database: "neon" }), {});
      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);

      expect(envVars).toContain("DATABASE_URL");
      expect(envVars).toContain("DIRECT_DATABASE_URL");
    });

    it("adds driver dependency if orm is none", () => {
      const ops = neonDatabaseAdapter.plan(makeInput({ database: "neon", orm: "none" }), {});
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);

      expect(deps).toContain("@neondatabase/serverless");
    });

    it("returns empty operations in standalone mode", () => {
      const ops = neonDatabaseAdapter.plan(makeInput({ structure: "standalone" }), {});
      expect(ops).toHaveLength(0);
    });
  });

  describe("postgresDatabaseAdapter", () => {
    it("plans docker-compose.yml and local postgres env in monorepo", () => {
      const ops = postgresDatabaseAdapter.plan(makeInput({ database: "postgres" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);

      expect(paths).toContain("docker-compose.yml");

      const scripts = ops
        .filter((op) => op.type === "add-script")
        .map((op) => op.type === "add-script" && op.name);
      expect(scripts).toContain("db:up");
      expect(scripts).toContain("db:down");

      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("DATABASE_URL");
      expect(envVars).toContain("DIRECT_DATABASE_URL");
    });

    it("adds pg dependency if orm is none", () => {
      const ops = postgresDatabaseAdapter.plan(
        makeInput({ database: "postgres", orm: "none" }),
        {},
      );
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("pg");
      expect(deps).toContain("@types/pg");
    });
  });

  describe("sqliteDatabaseAdapter", () => {
    it("adds expo-sqlite in standalone mode", () => {
      const ops = sqliteDatabaseAdapter.plan(
        makeInput({ structure: "standalone", database: "sqlite" }),
        {},
      );
      expect(ops).toHaveLength(1);
      expect(ops[0]).toMatchObject({
        type: "add-dependency",
        name: "expo-sqlite",
        workspace: ".",
      });
    });

    it("plans DATABASE_URL in monorepo mode", () => {
      const ops = sqliteDatabaseAdapter.plan(
        makeInput({ structure: "monorepo", database: "sqlite" }),
        {},
      );
      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("DATABASE_URL");
    });
  });

  describe("supabaseDatabaseAdapter", () => {
    it("plans client dependency and public keys in standalone mode without supabase auth", () => {
      const ops = supabaseDatabaseAdapter.plan(
        makeInput({ structure: "standalone", database: "supabase", auth: "clerk" }),
        {},
      );
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("@supabase/supabase-js");

      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("EXPO_PUBLIC_SUPABASE_URL");
      expect(envVars).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
    });

    it("returns empty operations in standalone if auth is already supabase", () => {
      const ops = supabaseDatabaseAdapter.plan(
        makeInput({ structure: "standalone", database: "supabase", auth: "supabase" }),
        {},
      );
      expect(ops).toHaveLength(0);
    });

    it("plans pooled and direct database URLs plus service role key in monorepo mode", () => {
      const ops = supabaseDatabaseAdapter.plan(
        makeInput({ structure: "monorepo", database: "supabase" }),
        {},
      );
      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("DATABASE_URL");
      expect(envVars).toContain("DIRECT_DATABASE_URL");
      expect(envVars).toContain("SUPABASE_SERVICE_ROLE_KEY");
    });
  });

  describe("noneDatabaseAdapter", () => {
    it("returns empty operations", () => {
      expect(
        noneDatabaseAdapter.plan(makeInput({ database: "none", orm: "none" }), {}),
      ).toHaveLength(0);
    });
  });
});
