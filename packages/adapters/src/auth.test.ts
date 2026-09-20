import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  authAdapter,
  betterAuthAdapter,
  clerkAuthAdapter,
  firebaseAuthAdapter,
  jwtAuthAdapter,
  noneAuthAdapter,
  supabaseAuthAdapter,
} from "./auth.js";

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

describe("auth adapters", () => {
  it("resolves auth adapter by id", () => {
    expect(authAdapter("clerk")).toBe(clerkAuthAdapter);
    expect(authAdapter("better-auth")).toBe(betterAuthAdapter);
    expect(authAdapter("supabase")).toBe(supabaseAuthAdapter);
    expect(authAdapter("firebase")).toBe(firebaseAuthAdapter);
    expect(authAdapter("jwt")).toBe(jwtAuthAdapter);
    expect(authAdapter("none")).toBe(noneAuthAdapter);
  });

  describe("clerkAuthAdapter", () => {
    it("plans Clerk dependencies, env, and provider in standalone", () => {
      const ops = clerkAuthAdapter.plan(makeInput({ structure: "standalone", auth: "clerk" }), {});
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("@clerk/expo");

      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");

      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/session/provider.tsx");
      expect(paths).toContain("app/(public)/sign-in.tsx");
      expect(paths).toContain("app/(public)/sign-up.tsx");
      const signIn = ops.find(
        (op) => op.type === "write-file" && op.path === "app/(public)/sign-in.tsx",
      );
      expect(signIn?.type === "write-file" && signIn.content).toContain("useSignIn");
      expect(signIn?.type === "write-file" && signIn.content).not.toContain("useHostedAuth");
    });
  });

  describe("betterAuthAdapter", () => {
    it("plans Better Auth client and dependencies in monorepo", () => {
      const ops = betterAuthAdapter.plan(
        makeInput({ structure: "monorepo", auth: "better-auth" }),
        {},
      );
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("@better-auth/expo");
      expect(deps).toContain("better-auth");

      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("apps/mobile/src/auth/client.ts");
    });
  });

  describe("supabaseAuthAdapter", () => {
    it("plans Supabase client, storage adapter, and public keys in standalone", () => {
      const ops = supabaseAuthAdapter.plan(
        makeInput({ structure: "standalone", auth: "supabase" }),
        {},
      );
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("@supabase/supabase-js");
      expect(deps).toContain("expo-secure-store");

      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("EXPO_PUBLIC_SUPABASE_URL");
      expect(envVars).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");

      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/supabase/client.ts");
      expect(paths).toContain("src/session/provider.tsx");
      expect(paths).toContain("app/(public)/sign-in.tsx");
      expect(paths).toContain(".maestro/supabase-auth.yaml");
    });

    it("plans mobile workspace paths in monorepo", () => {
      const ops = supabaseAuthAdapter.plan(
        makeInput({ structure: "monorepo", auth: "supabase" }),
        {},
      );
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("apps/mobile/src/supabase/client.ts");
      expect(paths).toContain("apps/mobile/src/session/provider.tsx");
      expect(paths).toContain("apps/mobile/app/(public)/sign-in.tsx");
    });
  });

  describe("firebaseAuthAdapter", () => {
    it("plans Firebase SDK, async storage, and public keys in standalone", () => {
      const ops = firebaseAuthAdapter.plan(
        makeInput({ structure: "standalone", auth: "firebase" }),
        {},
      );
      const deps = ops
        .filter((op) => op.type === "add-dependency")
        .map((op) => op.type === "add-dependency" && op.name);
      expect(deps).toContain("firebase");
      expect(deps).toContain("@react-native-async-storage/async-storage");

      const envVars = ops
        .filter((op) => op.type === "add-env")
        .map((op) => op.type === "add-env" && op.variable.name);
      expect(envVars).toContain("EXPO_PUBLIC_FIREBASE_API_KEY");
      expect(envVars).toContain("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN");
      expect(envVars).toContain("EXPO_PUBLIC_FIREBASE_PROJECT_ID");
      expect(envVars).toContain("EXPO_PUBLIC_FIREBASE_APP_ID");

      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/firebase/client.ts");
      expect(paths).toContain("src/session/provider.tsx");
      expect(paths).toContain("app/(public)/sign-in.tsx");
      expect(paths).toContain(".maestro/firebase-auth.yaml");
    });

    it("plans mobile workspace paths in monorepo", () => {
      const ops = firebaseAuthAdapter.plan(
        makeInput({ structure: "monorepo", auth: "firebase" }),
        {},
      );
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("apps/mobile/src/firebase/client.ts");
      expect(paths).toContain("apps/mobile/src/session/provider.tsx");
    });
  });

  describe("noneAuthAdapter", () => {
    it("plans guest session provider in standalone", () => {
      const ops = noneAuthAdapter.plan(makeInput({ structure: "standalone", auth: "none" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/session/provider.tsx");
    });
  });

  describe("jwtAuthAdapter", () => {
    it("plans jwt client, session provider, sign-in/up screens, and maestro in standalone", () => {
      const ops = jwtAuthAdapter.plan(makeInput({ structure: "standalone", auth: "jwt" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/auth/jwt-client.ts");
      expect(paths).toContain("src/session/provider.tsx");
      expect(paths).toContain("app/(public)/sign-in.tsx");
      expect(paths).toContain("app/(public)/sign-up.tsx");
      expect(paths).toContain(".maestro/jwt-auth.yaml");
    });

    it("omits app/ routes when navigation is react-navigation", () => {
      const ops = jwtAuthAdapter.plan(
        makeInput({ structure: "standalone", auth: "jwt", navigation: "react-navigation" }),
        {},
      );
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("src/auth/jwt-client.ts");
      expect(paths).toContain("src/session/provider.tsx");
      expect(paths).not.toContain("app/(public)/sign-in.tsx");
      expect(paths).not.toContain("app/(public)/sign-up.tsx");
    });

    it("plans mobile workspace paths in monorepo", () => {
      const ops = jwtAuthAdapter.plan(makeInput({ structure: "monorepo", auth: "jwt" }), {});
      const paths = ops
        .filter((op) => op.type === "write-file")
        .map((op) => op.type === "write-file" && op.path);
      expect(paths).toContain("apps/mobile/src/auth/jwt-client.ts");
      expect(paths).toContain("apps/mobile/src/session/provider.tsx");
    });
  });
});
