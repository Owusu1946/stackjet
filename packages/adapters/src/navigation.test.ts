import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  navigationAdapter,
  reactNavigationAdapter,
  routerNavigationAdapter,
} from "./navigation.js";

function makeInput(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "standalone",
    packageManager: "pnpm",
    navigation: "router",
    backend: "none",
    auth: "none",
    style: "uniwind",
    database: "none",
    orm: "none",
    onboarding: true,
    darkMode: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57,
    ...overrides,
  };
}

describe("navigationAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(navigationAdapter("router")).toBe(routerNavigationAdapter);
    expect(navigationAdapter("react-navigation")).toBe(reactNavigationAdapter);
  });
});

describe("routerNavigationAdapter", () => {
  it("returns empty plan because router uses default template tree", () => {
    const operations = routerNavigationAdapter.plan(makeInput({ navigation: "router" }), {});
    expect(operations).toHaveLength(0);
  });
});

describe("reactNavigationAdapter", () => {
  it("plans react navigation dependencies, root entry, navigators, and screens in standalone", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ navigation: "react-navigation" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("index.js");
    expect(paths).toContain("src/App.tsx");
    expect(paths).toContain("src/navigation/RootNavigator.tsx");
    expect(paths).toContain("src/navigation/AppNavigator.tsx");
    expect(paths).toContain("src/navigation/AuthNavigator.tsx");
    expect(paths).toContain("src/screens/HomeScreen.tsx");
    expect(paths).toContain("src/screens/ProfileScreen.tsx");
    expect(paths).toContain("src/screens/SignInScreen.tsx");
    expect(paths).toContain("src/screens/SignUpScreen.tsx");

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/native");
    expect(deps).toContain("@react-navigation/native-stack");
    expect(deps).toContain("@react-navigation/bottom-tabs");

    const patch = operations.find((op) => op.type === "patch-json" && op.path === "package.json");
    expect(patch).toBeDefined();
    if (patch && patch.type === "patch-json") {
      expect(patch.edits).toContainEqual({ path: ["main"], value: "index.js" });
    }
  });

  it("plans react navigation files under apps/mobile/ in monorepo", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ structure: "monorepo", navigation: "react-navigation", backend: "hono" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/mobile/index.js");
    expect(paths).toContain("apps/mobile/src/App.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/RootNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/AppNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/AuthNavigator.tsx");
  });
});
