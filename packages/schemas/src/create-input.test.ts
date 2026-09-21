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
    navigation: "router" as const,
    navigationType: "tabs" as const,
    typescript: true,
    icons: "lucide" as const,
    state: "none" as const,
    liquidGlass: false,
    analytics: "none" as const,
    monitoring: "none" as const,
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
    const {
      install: _i,
      git: _g,
      navigationType: _nt,
      typescript: _ts,
      icons: _ic,
      state: _st,
      liquidGlass: _lg,
      analytics: _an,
      ...withoutDefaults
    } = base;
    expect(createInputSchema.parse(withoutDefaults)).toEqual({
      ...base,
      backend: "none",
      socialProviders: [],
    });
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

  describe("backend adapters", () => {
    it("defaults to none for standalone and hono for monorepo", () => {
      const standalone = createInputSchema.parse(base);
      expect(standalone.backend).toBe("none");

      const monorepo = createInputSchema.parse({ ...base, structure: "monorepo" });
      expect(monorepo.backend).toBe("hono");
    });

    it("accepts express and nestjs in monorepos", () => {
      const expressResult = createInputSchema.parse({
        ...base,
        structure: "monorepo",
        backend: "express",
      });
      expect(expressResult.backend).toBe("express");

      const nestResult = createInputSchema.parse({
        ...base,
        structure: "monorepo",
        backend: "nestjs",
      });
      expect(nestResult.backend).toBe("nestjs");
    });

    it("accepts convex in standalone and monorepo", () => {
      const standaloneConvex = createInputSchema.parse({
        ...base,
        structure: "standalone",
        backend: "convex",
      });
      expect(standaloneConvex.backend).toBe("convex");

      const monorepoConvex = createInputSchema.parse({
        ...base,
        structure: "monorepo",
        backend: "convex",
      });
      expect(monorepoConvex.backend).toBe("convex");
    });

    it("rejects express and nestjs in standalone mode", () => {
      expect(
        createInputSchema.safeParse({ ...base, structure: "standalone", backend: "express" })
          .success,
      ).toBe(false);
      expect(
        createInputSchema.safeParse({ ...base, structure: "standalone", backend: "nestjs" })
          .success,
      ).toBe(false);
    });

    it("rejects backend none in monorepos", () => {
      expect(
        createInputSchema.safeParse({ ...base, structure: "monorepo", backend: "none" }).success,
      ).toBe(false);
    });

    it("rejects external database or ORM with convex", () => {
      expect(
        createInputSchema.safeParse({
          ...base,
          structure: "standalone",
          backend: "convex",
          database: "sqlite",
        }).success,
      ).toBe(false);
      expect(
        createInputSchema.safeParse({
          ...base,
          structure: "monorepo",
          backend: "convex",
          orm: "drizzle",
        }).success,
      ).toBe(false);
    });
  });

  describe("navigation adapters", () => {
    it("defaults to router", () => {
      const { navigation: _nav, ...withoutNav } = base;
      const result = createInputSchema.parse(withoutNav);
      expect(result.navigation).toBe("router");
    });

    it("accepts react-navigation", () => {
      const result = createInputSchema.parse({ ...base, navigation: "react-navigation" });
      expect(result.navigation).toBe("react-navigation");
    });

    it("rejects unknown navigation adapter", () => {
      expect(
        createInputSchema.safeParse({
          ...base,
          navigation: "invalid-nav" as unknown as "router",
        }).success,
      ).toBe(false);
    });
  });

  describe("jwt authentication", () => {
    it("rejects insecure generic JWT generation", () => {
      const result = createInputSchema.safeParse({ ...base, auth: "jwt" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("Custom JWT generation is disabled");
    });
  });

  describe("ecosystem additions (Phase 8)", () => {
    it.each(["tabs", "drawer", "both", "stack"] as const)(
      "accepts navigationType %s",
      (navigationType) => {
        const result = createInputSchema.parse({ ...base, navigationType });
        expect(result.navigationType).toBe(navigationType);
      },
    );

    it.each(["lucide", "hugeicons", "expo"] as const)("accepts icon library %s", (icons) => {
      const result = createInputSchema.parse({ ...base, icons });
      expect(result.icons).toBe(icons);
    });

    it.each(["none", "zustand", "mobx"] as const)("accepts state adapter %s", (state) => {
      const result = createInputSchema.parse({ ...base, state });
      expect(result.state).toBe(state);
    });

    it.each(["none", "posthog", "aptabase"] as const)(
      "accepts analytics adapter %s",
      (analytics) => {
        const result = createInputSchema.parse({ ...base, analytics });
        expect(result.analytics).toBe(analytics);
      },
    );

    it("accepts liquidGlass toggle", () => {
      const enabled = createInputSchema.parse({ ...base, liquidGlass: true });
      expect(enabled.liquidGlass).toBe(true);
      const disabled = createInputSchema.parse({ ...base, liquidGlass: false });
      expect(disabled.liquidGlass).toBe(false);
    });

    it.each(["tabs", "both"] as const)(
      "rejects React Navigation %s with Liquid Glass because Expo Go requires Router native tabs",
      (navigationType) => {
        const result = createInputSchema.safeParse({
          ...base,
          navigation: "react-navigation",
          navigationType,
          liquidGlass: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: ["navigation"],
                message:
                  "Native Liquid Glass tabs in Expo Go require the Expo Router navigation adapter on SDK 57",
              }),
            ]),
          );
        }
      },
    );

    it("accepts typescript toggle", () => {
      const enabled = createInputSchema.parse({ ...base, typescript: true });
      expect(enabled.typescript).toBe(true);
      const disabled = createInputSchema.parse({ ...base, typescript: false });
      expect(disabled.typescript).toBe(false);
    });

    it("accepts yarn package manager", () => {
      const result = createInputSchema.parse({ ...base, packageManager: "yarn" });
      expect(result.packageManager).toBe("yarn");
    });
  });
});

describe("presetSchema", () => {
  it("validates a complete preset definition", async () => {
    const { presetSchema } = await import("./create-input.js");
    const preset = {
      name: "starter-pro",
      description: "Full-stack mobile + Hono + Neon + Zustand + Lucide",
      createdAt: "2026-09-19T10:00:00.000Z",
      config: {
        structure: "monorepo" as const,
        packageManager: "pnpm" as const,
        navigation: "router" as const,
        navigationType: "tabs" as const,
        backend: "hono" as const,
        auth: "clerk" as const,
        style: "uniwind" as const,
        database: "neon" as const,
        orm: "drizzle" as const,
        icons: "lucide" as const,
        state: "zustand" as const,
        liquidGlass: true,
        analytics: "posthog" as const,
      },
    };

    const parsed = presetSchema.parse(preset);
    expect(parsed.name).toBe("starter-pro");
    expect(parsed.config.state).toBe("zustand");
    expect(parsed.config.icons).toBe("lucide");
    expect(parsed.config.liquidGlass).toBe(true);
  });

  it("rejects preset with empty name", async () => {
    const { presetSchema } = await import("./create-input.js");
    expect(
      presetSchema.safeParse({
        name: "",
        createdAt: "2026-09-19T10:00:00.000Z",
        config: {},
      }).success,
    ).toBe(false);
  });
});
