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
    navigationType: "tabs",
    typescript: true,
    icons: "lucide",
    state: "none",
    liquidGlass: false,
    analytics: "none",
    monitoring: "none",
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
  it("plans tabs layout for Expo Router in standalone", () => {
    const operations = routerNavigationAdapter.plan(
      makeInput({ navigation: "router", navigationType: "tabs" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("app/(app)/_layout.tsx");
    expect(paths).toContain("app/(app)/index.tsx");
    expect(paths).toContain("app/(app)/profile.tsx");
    expect(paths).not.toContain("app/_layout.tsx");

    const layoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/_layout.tsx",
    );
    expect(layoutOp?.type === "write-file" && layoutOp.content).toContain("<Tabs");

    const deps = operations.filter((op) => op.type === "add-dependency");
    expect(deps).toHaveLength(0);
  });

  it("plans drawer layout for Expo Router with gesture handler dependency and root wrap", () => {
    const operations = routerNavigationAdapter.plan(
      makeInput({ navigation: "router", navigationType: "drawer" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("app/_layout.tsx");
    expect(paths).toContain("app/(app)/_layout.tsx");
    expect(paths).toContain("app/(app)/index.tsx");
    expect(paths).toContain("app/(app)/profile.tsx");

    const rootLayoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/_layout.tsx",
    );
    expect(rootLayoutOp?.type === "write-file" && rootLayoutOp.content).toContain(
      "GestureHandlerRootView",
    );

    const appLayoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/_layout.tsx",
    );
    expect(appLayoutOp?.type === "write-file" && appLayoutOp.content).toContain("<Drawer");

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/drawer");
    expect(deps).toContain("react-native-gesture-handler");
    expect(
      operations.find(
        (op) => op.type === "add-dependency" && op.name === "react-native-gesture-handler",
      ),
    ).toMatchObject({ version: "~2.32.0" });
  });

  it("plans both (drawer + tabs) layout for Expo Router with nested tab group and settings", () => {
    const operations = routerNavigationAdapter.plan(
      makeInput({ navigation: "router", navigationType: "both" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("app/_layout.tsx");
    expect(paths).toContain("app/(app)/_layout.tsx");
    expect(paths).toContain("app/(app)/(tabs)/_layout.tsx");
    expect(paths).toContain("app/(app)/(tabs)/index.tsx");
    expect(paths).toContain("app/(app)/(tabs)/profile.tsx");
    expect(paths).toContain("app/(app)/settings.tsx");

    const appLayoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/_layout.tsx",
    );
    expect(appLayoutOp?.type === "write-file" && appLayoutOp.content).toContain(
      '<Drawer.Screen\n        name="(tabs)"',
    );

    const tabsLayoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/(tabs)/_layout.tsx",
    );
    expect(tabsLayoutOp?.type === "write-file" && tabsLayoutOp.content).toContain("<Tabs");
  });

  it.each(["tabs", "both"] as const)(
    "uses native tabs for Liquid Glass with Expo Router %s navigation",
    (navigationType) => {
      const operations = routerNavigationAdapter.plan(
        makeInput({ navigation: "router", navigationType, liquidGlass: true }),
        {},
      );
      const layoutPath =
        navigationType === "both" ? "app/(app)/(tabs)/_layout.tsx" : "app/(app)/_layout.tsx";
      const layoutOp = operations.find((op) => op.type === "write-file" && op.path === layoutPath);
      const content = layoutOp?.type === "write-file" ? layoutOp.content : "";

      expect(content).toContain('from "expo-router/unstable-native-tabs"');
      expect(content).toContain("<NativeTabs");
      expect(content).toContain('sf={{ default: "house", selected: "house.fill" }}');
      expect(content).toContain('md="home"');
      expect(content).not.toContain("GlassTabBarBackground");
      expect(content).not.toContain("paddingBottom: 110");
    },
  );

  it("plans stack layout for Expo Router with link navigation", () => {
    const operations = routerNavigationAdapter.plan(
      makeInput({ navigation: "router", navigationType: "stack" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("app/(app)/_layout.tsx");
    expect(paths).toContain("app/(app)/index.tsx");
    expect(paths).toContain("app/(app)/profile.tsx");

    const layoutOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/_layout.tsx",
    );
    expect(layoutOp?.type === "write-file" && layoutOp.content).toContain("<Stack");

    const indexOp = operations.find(
      (op) => op.type === "write-file" && op.path === "app/(app)/index.tsx",
    );
    expect(indexOp?.type === "write-file" && indexOp.content).toContain('href="/profile"');
  });

  it("plans router navigation files under apps/mobile/ in monorepo", () => {
    const operations = routerNavigationAdapter.plan(
      makeInput({
        structure: "monorepo",
        navigation: "router",
        navigationType: "both",
        backend: "hono",
      }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/mobile/app/_layout.tsx");
    expect(paths).toContain("apps/mobile/app/(app)/_layout.tsx");
    expect(paths).toContain("apps/mobile/app/(app)/(tabs)/_layout.tsx");
    expect(paths).toContain("apps/mobile/app/(app)/(tabs)/index.tsx");
  });
});

describe("reactNavigationAdapter", () => {
  it.each(["tabs", "both"] as const)(
    "rejects Liquid Glass with React Navigation %s",
    (navigationType) => {
      expect(() =>
        reactNavigationAdapter.plan(
          makeInput({ navigation: "react-navigation", navigationType, liquidGlass: true }),
          {},
        ),
      ).toThrow(
        "Native Liquid Glass tabs in Expo Go require the Expo Router navigation adapter on SDK 57",
      );
    },
  );

  it("plans tabs layout for React Navigation in standalone", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ navigation: "react-navigation", navigationType: "tabs" }),
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

    const appNavOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/navigation/AppNavigator.tsx",
    );
    expect(appNavOp?.type === "write-file" && appNavOp.content).toContain(
      "createBottomTabNavigator",
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/native");
    expect(deps).toContain("@react-navigation/native-stack");
    expect(deps).toContain("@react-navigation/bottom-tabs");
    expect(deps).not.toContain("@react-navigation/drawer");

    const patch = operations.find((op) => op.type === "patch-json" && op.path === "package.json");
    expect(patch).toBeDefined();
    if (patch && patch.type === "patch-json") {
      expect(patch.edits).toContainEqual({ path: ["main"], value: "index.js" });
    }
  });

  it("plans drawer layout for React Navigation with gesture handler and DrawerNavigator", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ navigation: "react-navigation", navigationType: "drawer" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("src/navigation/AppNavigator.tsx");
    const appNavOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/navigation/AppNavigator.tsx",
    );
    expect(appNavOp?.type === "write-file" && appNavOp.content).toContain("createDrawerNavigator");

    const appOp = operations.find((op) => op.type === "write-file" && op.path === "src/App.tsx");
    expect(appOp?.type === "write-file" && appOp.content).toContain("GestureHandlerRootView");

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/drawer");
    expect(deps).toContain("react-native-gesture-handler");
    expect(deps).not.toContain("@react-navigation/bottom-tabs");
  });

  it("plans both layout for React Navigation with Drawer + TabNavigator and SettingsScreen", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ navigation: "react-navigation", navigationType: "both" }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("src/navigation/AppNavigator.tsx");
    expect(paths).toContain("src/navigation/TabNavigator.tsx");
    expect(paths).toContain("src/screens/SettingsScreen.tsx");

    const appNavOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/navigation/AppNavigator.tsx",
    );
    expect(appNavOp?.type === "write-file" && appNavOp.content).toContain("createDrawerNavigator");
    expect(appNavOp?.type === "write-file" && appNavOp.content).toContain("TabNavigator");

    const tabNavOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/navigation/TabNavigator.tsx",
    );
    expect(tabNavOp?.type === "write-file" && tabNavOp.content).toContain(
      "createBottomTabNavigator",
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/bottom-tabs");
    expect(deps).toContain("@react-navigation/drawer");
    expect(deps).toContain("react-native-gesture-handler");
  });

  it("plans stack layout for React Navigation with native stack and without bottom tabs", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({ navigation: "react-navigation", navigationType: "stack" }),
      {},
    );
    const appNavOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/navigation/AppNavigator.tsx",
    );
    expect(appNavOp?.type === "write-file" && appNavOp.content).toContain(
      "createNativeStackNavigator",
    );

    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => op.type === "add-dependency" && op.name);
    expect(deps).toContain("@react-navigation/native");
    expect(deps).toContain("@react-navigation/native-stack");
    expect(deps).not.toContain("@react-navigation/bottom-tabs");
    expect(deps).not.toContain("@react-navigation/drawer");
  });

  it("plans react navigation files under apps/mobile/ in monorepo", () => {
    const operations = reactNavigationAdapter.plan(
      makeInput({
        structure: "monorepo",
        navigation: "react-navigation",
        navigationType: "both",
        backend: "hono",
      }),
      {},
    );
    const paths = operations
      .map((op) => (op.type === "write-file" ? op.path : null))
      .filter(Boolean);

    expect(paths).toContain("apps/mobile/index.js");
    expect(paths).toContain("apps/mobile/src/App.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/RootNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/AppNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/TabNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/navigation/AuthNavigator.tsx");
    expect(paths).toContain("apps/mobile/src/screens/SettingsScreen.tsx");
  });
});
