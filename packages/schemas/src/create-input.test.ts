import { describe, expect, it } from "vitest";
import { createInputSchema, projectNameSchema } from "./create-input.js";

describe("projectNameSchema", () => {
  it.each(["my-app", "app_2", "app.mobile"])("accepts %s", (name) => {
    expect(projectNameSchema.parse(name)).toBe(name);
  });

  it.each(["../escape", "My App", "", ".hidden"])("rejects %s", (name) => {
    expect(projectNameSchema.safeParse(name).success).toBe(false);
  });
});

describe("createInputSchema", () => {
  const base = {
    projectName: "my-app",
    destination: "my-app",
    structure: "standalone" as const,
    packageManager: "pnpm" as const,
    auth: "clerk" as const,
    style: "uniwind" as const,
    database: "none" as const,
    orm: "none" as const,
    onboarding: true,
    darkMode: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57 as const,
  };

  it("accepts a supported Clerk project and applies defaults", () => {
    const { install: _i, git: _g, ...withoutDefaults } = base;
    expect(createInputSchema.parse(withoutDefaults)).toEqual(base);
  });

  it("accepts monorepo-web structure", () => {
    const result = createInputSchema.parse({ ...base, structure: "monorepo-web" });
    expect(result.structure).toBe("monorepo-web");
  });

  it("accepts custom darkMode toggle", () => {
    const result = createInputSchema.parse({ ...base, darkMode: false });
    expect(result.darkMode).toBe(false);
  });

  it("rejects Better Auth outside a monorepo", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        auth: "better-auth",
        structure: "standalone",
        database: "neon",
        orm: "drizzle",
      }).success,
    ).toBe(false);
  });

  it("accepts Better Auth in monorepo and monorepo-web with Drizzle", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        auth: "better-auth",
        structure: "monorepo",
        database: "neon",
        orm: "drizzle",
      }).success,
    ).toBe(true);
    expect(
      createInputSchema.safeParse({
        ...base,
        auth: "better-auth",
        structure: "monorepo-web",
        database: "postgres",
        orm: "drizzle",
      }).success,
    ).toBe(true);
  });

  it("rejects standalone with postgres or neon", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "neon",
        orm: "drizzle",
      }).success,
    ).toBe(false);
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "postgres",
        orm: "prisma",
      }).success,
    ).toBe(false);
  });

  it("accepts standalone with sqlite or none", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "sqlite",
        orm: "drizzle",
      }).success,
    ).toBe(true);
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "none",
        orm: "none",
      }).success,
    ).toBe(true);
  });

  it("rejects ORM when database is none", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "monorepo",
        database: "none",
        orm: "drizzle",
      }).success,
    ).toBe(false);
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "monorepo",
        database: "none",
        orm: "prisma",
      }).success,
    ).toBe(false);
  });

  it("accepts postgres with prisma in monorepo", () => {
    const result = createInputSchema.parse({
      ...base,
      structure: "monorepo",
      database: "postgres",
      orm: "prisma",
    });
    expect(result.database).toBe("postgres");
    expect(result.orm).toBe("prisma");
  });

  it("accepts supabase and firebase auth adapters", () => {
    expect(createInputSchema.safeParse({ ...base, auth: "supabase" }).success).toBe(true);
    expect(createInputSchema.safeParse({ ...base, auth: "firebase" }).success).toBe(true);
    expect(
      createInputSchema.safeParse({
        ...base,
        auth: "supabase",
        structure: "monorepo",
        database: "supabase",
        orm: "drizzle",
      }).success,
    ).toBe(true);
  });

  it("accepts supabase database in standalone and monorepo", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "supabase",
        orm: "none",
      }).success,
    ).toBe(true);
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "monorepo",
        database: "supabase",
        orm: "prisma",
      }).success,
    ).toBe(true);
  });

  it("rejects prisma in standalone", () => {
    expect(
      createInputSchema.safeParse({
        ...base,
        structure: "standalone",
        database: "sqlite",
        orm: "prisma",
      }).success,
    ).toBe(false);
  });

  it.each(["nativewind", "unistyles", "stylesheet", "uniwind"] as const)(
    "accepts style adapter %s",
    (style) => {
      const result = createInputSchema.parse({ ...base, style });
      expect(result.style).toBe(style);
    },
  );
});
