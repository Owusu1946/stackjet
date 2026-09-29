import type { Operation } from "@expojet/core";
import type { CreateInput, NavigationType } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { mobileLocation, noOptions } from "../shared/adapter-kit.js";
import { makeDefaultSignInScreen, makeDefaultSignUpScreen } from "./screens.js";

function makeReactNavApp(hasGesture: boolean) {
  if (hasGesture) {
    return `import "./monitoring/init";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "./data/provider";
import { RootNavigator } from "./navigation/RootNavigator";
import { SessionProvider } from "./session/provider";
import { ThemeProvider, useTheme } from "./theme/provider";

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
`;
  }

  return `import "./monitoring/init";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "./data/provider";
import { RootNavigator } from "./navigation/RootNavigator";
import { SessionProvider } from "./session/provider";
import { ThemeProvider, useTheme } from "./theme/provider";

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
`;
}

const rootIndexSource = `import { registerRootComponent } from "expo";
import App from "./src/App";

registerRootComponent(App);
`;

const rootNavigatorSource = `import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSession } from "../session/provider";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <View style={styles.center} testID="loading-screen">
        <ActivityIndicator size="large" color="#315efb" />
      </View>
    );
  }

  if (session.status === "authenticated") {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
`;

function makeReactNavAppNavigator(navigationType: NavigationType) {
  if (navigationType === "drawer") {
    return `import { createDrawerNavigator } from "@react-navigation/drawer";
import { Icon } from "../components/ui/icon";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Drawer = createDrawerNavigator();

export function AppNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: "#315efb",
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          drawerIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}
`;
  }

  if (navigationType === "both") {
    return `import { createDrawerNavigator } from "@react-navigation/drawer";
import { Icon } from "../components/ui/icon";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TabNavigator } from "./TabNavigator";

const Drawer = createDrawerNavigator();

export function AppNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: "#315efb",
      }}
    >
      <Drawer.Screen
        name="Main"
        component={TabNavigator}
        options={{
          title: "Home",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => <Icon name="menu" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }) => <Icon name="settings" color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}
`;
  }

  if (navigationType === "stack") {
    return `import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: "#315efb",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
`;
  }

  return `import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "../components/ui/icon";
import { haptic } from "../haptics";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#315efb",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
    </Tab.Navigator>
  );
}
`;
}

function makeReactNavTabNavigator() {
  return `import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "../components/ui/icon";
import { haptic } from "../haptics";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#315efb",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
        listeners={{
          tabPress: () => {
            haptic.selection();
          },
        }}
      />
    </Tab.Navigator>
  );
}
`;
}

const authNavigatorSource = `import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign In" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Sign Up" }} />
    </Stack.Navigator>
  );
}
`;

function makeReactNavHomeScreen(state: CreateInput["state"] = "none") {
  const counterImport =
    state !== "none" ? 'import { CounterCard } from "../components/counter-card";\n' : "";
  const counterComponent = state !== "none" ? "      <CounterCard />\n" : "";

  return `import { Button, StyleSheet, Text, View } from "react-native";
import { BrandCard } from "../components/brand-card";
${counterImport}import { useSession } from "../session/provider";
import { useTheme } from "../theme/provider";

export function HomeScreen({ navigation }: { navigation?: any }) {
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
      {navigation?.navigate ? (
        <Button title="Go to Profile" onPress={() => navigation.navigate("Profile")} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: "#f4f6fb",
  },
  welcome: { fontSize: 16, color: "#52606d", textAlign: "center" },
});
`;
}

const reactNavProfileScreenSource = `import { Button, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../session/provider";
import { useOnboarding } from "../onboarding/provider";
import { useTheme } from "../theme/provider";

export function ProfileScreen() {
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
      <Button title="Sign out" onPress={session.signOut} color="#b42318" />
      <Button title="Show onboarding again" onPress={() => void onboarding.reset().then(() => router.replace("/(onboarding)"))} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#f4f6fb" },
  title: { fontSize: 24, fontWeight: "700" },
  detail: { fontSize: 16, color: "#52606d" },
});
`;

const reactNavSettingsScreenSource = `import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/provider";

export function SettingsScreen() {
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

export const reactNavigationAdapter: Adapter = {
  id: "navigation:react-navigation",
  version: "1.0.0",
  kind: "navigation",
  displayName: "React Navigation",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { workspace, root } = mobileLocation(input.structure);
    const navType = input.navigationType ?? "tabs";
    if (input.liquidGlass && (navType === "tabs" || navType === "both")) {
      throw new Error(
        `Native Liquid Glass tabs in Expo Go require the Expo Router navigation adapter on SDK ${input.sdk}`,
      );
    }
    const hasGesture = navType === "drawer" || navType === "both";

    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "@react-navigation/native",
        version: "^7.0.14",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "@react-navigation/native-stack",
        version: "^7.0.14",
        kind: "dependencies",
        owner: this.id,
      },
    ];

    if (navType === "tabs" || navType === "both") {
      operations.push({
        type: "add-dependency",
        workspace,
        name: "@react-navigation/bottom-tabs",
        version: "^7.0.14",
        kind: "dependencies",
        owner: this.id,
      });
    }

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

    operations.push(
      {
        type: "patch-json",
        path: `${root}package.json`,
        edits: [
          {
            path: ["main"],
            value: "index.js",
          },
        ],
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}index.js`,
        content: rootIndexSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/App.tsx`,
        content: makeReactNavApp(hasGesture),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/navigation/RootNavigator.tsx`,
        content: rootNavigatorSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/navigation/AppNavigator.tsx`,
        content: makeReactNavAppNavigator(navType),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/navigation/AuthNavigator.tsx`,
        content: authNavigatorSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/screens/HomeScreen.tsx`,
        content: makeReactNavHomeScreen(input.state),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/screens/ProfileScreen.tsx`,
        content: reactNavProfileScreenSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/screens/SignInScreen.tsx`,
        content: makeDefaultSignInScreen(input.auth),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/screens/SignUpScreen.tsx`,
        content: makeDefaultSignUpScreen(),
        owner: this.id,
      },
    );

    if (navType === "both") {
      operations.push(
        {
          type: "write-file",
          path: `${root}src/navigation/TabNavigator.tsx`,
          content: makeReactNavTabNavigator(),
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}src/screens/SettingsScreen.tsx`,
          content: reactNavSettingsScreenSource,
          owner: this.id,
        },
      );
    }

    return operations;
  },
};
