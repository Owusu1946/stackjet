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
    eas: true,
    sdk: 57 as const,
  };

  it("accepts a supported Clerk project", () => {
    expect(createInputSchema.parse(base)).toEqual(base);
  });

  it("rejects Better Auth outside a monorepo", () => {
    expect(createInputSchema.safeParse({ ...base, auth: "better-auth" }).success).toBe(false);
  });
});
