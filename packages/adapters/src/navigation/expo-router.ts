import type { Operation } from "@expojet/core";
import type { CreateInput, NavigationType } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { mobileLocation, noOptions } from "../shared/adapter-kit.js";

function makeRouterRootLayout(hasGesture: boolean) {
  if (hasGesture) {
    return `import "../src/monitoring/init";
import "../src/style-entry";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "../src/data/provider";
import { OnboardingProvider } from "../src/onboarding/provider";
import { SessionProvider } from "../src/session/provider";
import { ThemeProvider } from "../src/theme/provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <ThemeProvider>
        <SessionProvider>
          <DataProvider>
            <OnboardingProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </OnboardingProvider>
          </DataProvider>
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
`;
  }
  return `import "../src/monitoring/init";
import "../src/style-entry";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "../src/data/provider";
import { OnboardingProvider } from "../src/onboarding/provider";
import { SessionProvider } from "../src/session/provider";
import { ThemeProvider } from "../src/theme/provider";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <ThemeProvider>
        <SessionProvider>
          <DataProvider>
            <OnboardingProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </OnboardingProvider>
          </DataProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}
`;
}

function makeRouterProtectedLayout(navigationType: NavigationType, liquidGlass: boolean = false) {
  if (navigationType === "drawer") {
    return `import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Icon } from "../../src/components/ui/icon";
import { useSession } from "../../src/session/provider";
import { useTheme } from "../../src/theme/provider";

export default function ProtectedLayout() {
  const session = useSession();
  const { colors } = useTheme();
  if (session.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.background },
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: { color: colors.text },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
`;
  }

  if (navigationType === "both") {
    return `import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Icon } from "../../src/components/ui/icon";
import { useSession } from "../../src/session/provider";
import { useTheme } from "../../src/theme/provider";

export default function ProtectedLayout() {
  const session = useSession();
  const { colors } = useTheme();
  if (session.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.background },
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: { color: colors.text },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: "Tabs",
          drawerLabel: "Tabs",
          drawerIcon: ({ color, size }) => <Icon name="menu" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => <Icon name="settings" color={color} size={size} />,
          headerShown: true,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
`;
  }

  if (navigationType === "stack") {
    return `import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function ProtectedLayout() {
  const session = useSession();
  if (session.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#315efb",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
`;
  }

  if (liquidGlass) {
    return `import { DarkTheme, DefaultTheme, Redirect, ThemeProvider } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ActivityIndicator, DynamicColorIOS, Platform, StyleSheet, View } from "react-native";
import { useSession } from "../../src/session/provider";
import { useTheme } from "../../src/theme/provider";

const tabTint =
  Platform.OS === "ios" ? DynamicColorIOS({ light: "#315efb", dark: "#7c9cff" }) : "#315efb";

export default function ProtectedLayout() {
  const session = useSession();
  const { resolvedMode } = useTheme();
  if (session.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;

  return (
    <ThemeProvider value={resolvedMode === "dark" ? DarkTheme : DefaultTheme}>
      <NativeTabs tintColor={tabTint} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
`;
  }

  return `import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Icon } from "../../src/components/ui/icon";
import { haptic } from "../../src/haptics";
import { useSession } from "../../src/session/provider";

export default function ProtectedLayout() {
  const session = useSession();
  if (session.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#315efb",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
`;
}

function makeRouterTabLayout(liquidGlass: boolean = false) {
  if (liquidGlass) {
    return `import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useTheme } from "../../../src/theme/provider";

const tabTint =
  Platform.OS === "ios" ? DynamicColorIOS({ light: "#315efb", dark: "#7c9cff" }) : "#315efb";

export default function TabLayout() {
  const { resolvedMode } = useTheme();
  return (
    <ThemeProvider value={resolvedMode === "dark" ? DarkTheme : DefaultTheme}>
      <NativeTabs tintColor={tabTint} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
`;
  }

  return `import { Tabs } from "expo-router";
import { Icon } from "../../../src/components/ui/icon";
import { haptic } from "../../../src/haptics";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#315efb",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
    </Tabs>
  );
}
`;
}

function makeRouterHomeScreen(
  navigationType: NavigationType,
  isNestedTabs: boolean = false,
  state: CreateInput["state"] = "none",
) {
  const prefix = isNestedTabs ? "../../../" : "../../";
  const counterImport =
    state !== "none" ? `import { CounterCard } from "${prefix}src/components/counter-card";\n` : "";
  const counterComponent = state !== "none" ? "      <CounterCard />\n" : "";

  if (navigationType === "stack") {
    return `import { Link } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { BrandCard } from "${prefix}src/components/brand-card";
${counterImport}import { useSession } from "${prefix}src/session/provider";
import { useTheme } from "${prefix}src/theme/provider";

export default function AppHomeScreen() {
  const session = useSession();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="home-screen">
      <BrandCard />
${counterComponent}      {session.user ? (
        <Text style={[styles.welcome, { color: colors.textSecondary }]} testID="welcome-text">
          Welcome, {session.user.displayName ?? session.user.id}!
        </Text>
      ) : null}
      <Link href="/profile" asChild>
        <Button title="Go to Profile" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#f4f6fb" },
  welcome: { fontSize: 16, color: "#52606d", textAlign: "center" },
});
`;
  }

  return `import { StyleSheet, Text, View } from "react-native";
import { BrandCard } from "${prefix}src/components/brand-card";
${counterImport}import { useSession } from "${prefix}src/session/provider";
import { useTheme } from "${prefix}src/theme/provider";

export default function AppHomeScreen() {
  const session = useSession();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="home-screen">
      <BrandCard />
${counterComponent}      {session.user ? (
        <Text style={[styles.welcome, { color: colors.textSecondary }]} testID="welcome-text">
          Welcome, {session.user.displayName ?? session.user.id}!
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#f4f6fb" },
  welcome: { fontSize: 16, color: "#52606d", textAlign: "center" },
});
`;
}

function makeRouterProfileScreen(isNestedTabs: boolean = false) {
  const prefix = isNestedTabs ? "../../../" : "../../";
  return `import { Button, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "${prefix}src/session/provider";
import { useOnboarding } from "${prefix}src/onboarding/provider";
import { useTheme } from "${prefix}src/theme/provider";

export default function ProfileScreen() {
  const session = useSession();
  const onboarding = useOnboarding();
  const { mode, setMode, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="profile-screen">
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>User: {session.user?.displayName ?? session.user?.id ?? "Guest"}</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>Theme: {mode}</Text>
      <Button
        title={\`Switch to \${mode === "dark" ? "light" : "dark"} mode\`}
        color={colors.primary}
        onPress={() => setMode(mode === "dark" ? "light" : "dark")}
      />
      <Button title="Show onboarding again" onPress={() => void onboarding.reset().then(() => router.replace("/(onboarding)"))} />
      <Button title="Sign out" onPress={session.signOut} color="#b42318" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#f4f6fb" },
  title: { fontSize: 24, fontWeight: "700" },
  detail: { fontSize: 16, color: "#52606d" },
});
`;
}

const routerSettingsScreenSource = `import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/theme/provider";

export default function SettingsScreen() {
  const { mode } = useTheme();

  return (
    <View style={styles.container} testID="settings-screen">
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.detail}>Theme: {mode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#f4f6fb" },
  title: { fontSize: 24, fontWeight: "700" },
  detail: { fontSize: 16, color: "#52606d" },
});
`;

export const routerNavigationAdapter: Adapter = {
  id: "navigation:router",
  version: "1.0.0",
  kind: "navigation",
  displayName: "Expo Router",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { workspace, root } = mobileLocation(input.structure);
    const navType = input.navigationType ?? "tabs";
    const operations: Operation[] = [];

    const hasGesture = navType === "drawer" || navType === "both";
    if (hasGesture) {
      operations.push(
        {
          type: "add-dependency",
          workspace,
          name: "@react-navigation/drawer",
          version: "^7.0.14",
          kind: "dependencies",
          owner: this.id,
        },
        {
          type: "add-dependency",
          workspace,
          name: "react-native-gesture-handler",
          version: "~2.32.0",
          kind: "dependencies",
          owner: this.id,
        },
      );
    }

    operations.push({
      type: "write-file",
      path: `${root}app/_layout.tsx`,
      content: makeRouterRootLayout(hasGesture),
      owner: this.id,
    });

    operations.push({
      type: "write-file",
      path: `${root}app/(app)/_layout.tsx`,
      content: makeRouterProtectedLayout(navType, input.liquidGlass),
      owner: this.id,
    });

    if (navType === "both") {
      operations.push(
        {
          type: "write-file",
          path: `${root}app/(app)/(tabs)/_layout.tsx`,
          content: makeRouterTabLayout(input.liquidGlass),
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}app/(app)/(tabs)/index.tsx`,
          content: makeRouterHomeScreen(navType, true, input.state),
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}app/(app)/(tabs)/profile.tsx`,
          content: makeRouterProfileScreen(true),
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}app/(app)/settings.tsx`,
          content: routerSettingsScreenSource,
          owner: this.id,
        },
      );
    } else {
      operations.push(
        {
          type: "write-file",
          path: `${root}app/(app)/index.tsx`,
          content: makeRouterHomeScreen(navType, false, input.state),
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}app/(app)/profile.tsx`,
          content: makeRouterProfileScreen(false),
          owner: this.id,
        },
      );
    }

    return operations;
  },
};
