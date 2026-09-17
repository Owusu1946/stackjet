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
      createInputSchema.safeParse({ ...base, auth: "better-auth", structure: "standalone" })
        .success,
    ).toBe(false);
  });

  it("accepts Better Auth in monorepo and monorepo-web", () => {
    expect(
      createInputSchema.safeParse({ ...base, auth: "better-auth", structure: "monorepo" }).success,
    ).toBe(true);
    expect(
      createInputSchema.safeParse({ ...base, auth: "better-auth", structure: "monorepo-web" })
        .success,
    ).toBe(true);
  });

  it.each(["nativewind", "unistyles", "stylesheet", "uniwind"] as const)(
    "accepts style adapter %s",
    (style) => {
      const result = createInputSchema.parse({ ...base, style });
      expect(result.style).toBe(style);
    },
  );
});
