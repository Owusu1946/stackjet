import type { Operation } from "@expojet/core";
import type { CreateInput, NavigationAdapter } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const rootAppSource = `import { NavigationContainer } from "@react-navigation/native";
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

const appNavigatorSource = `import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
`;

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

const homeScreenSource = `import { StyleSheet, Text, View } from "react-native";
import { BrandCard } from "../components/brand-card";
import { useSession } from "../session/provider";

export function HomeScreen() {
  const session = useSession();
  return (
    <View style={styles.container} testID="home-screen">
      <BrandCard />
      {session.user ? (
        <Text style={styles.welcome} testID="welcome-text">
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

const profileScreenSource = `import { Button, StyleSheet, Text, View } from "react-native";
import { useSession } from "../session/provider";
import { useTheme } from "../theme/provider";

export function ProfileScreen() {
  const session = useSession();
  const { mode, setMode } = useTheme();

  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.detail}>User: {session.user?.displayName ?? session.user?.id ?? "Guest"}</Text>
      <Text style={styles.detail}>Theme: {mode}</Text>
      <Button
        title={\`Switch to \${mode === "dark" ? "light" : "dark"} mode\`}
        onPress={() => setMode(mode === "dark" ? "light" : "dark")}
      />
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

function makeDefaultSignInScreen(_auth: CreateInput["auth"]) {
  return `import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useSession } from "../session/provider";

export function SignInScreen({ navigation }: { navigation?: any }) {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container} testID="auth-screen">
      <Text style={styles.eyebrow}>EXPOJET</Text>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        testID="email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        testID="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        testID="sign-in"
        title="Sign In"
        onPress={() => {
          if (typeof session.signIn === "function") {
            (session.signIn as any)({ email, password });
          }
        }}
      />
      {navigation ? (
        <Button
          testID="goto-sign-up"
          title="Don't have an account? Sign Up"
          onPress={() => navigation.navigate("SignUp")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
});
`;
}

function makeDefaultSignUpScreen() {
  return `import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useSession } from "../session/provider";

export function SignUpScreen({ navigation }: { navigation?: any }) {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <View style={styles.container} testID="sign-up-screen">
      <Text style={styles.eyebrow}>EXPOJET</Text>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        testID="name"
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        testID="email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        testID="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        testID="sign-up"
        title="Sign Up"
        onPress={() => {
          if (typeof (session as any).signUp === "function") {
            (session as any).signUp({ email, password, displayName: name });
          } else {
            session.signIn();
          }
        }}
      />
      {navigation ? (
        <Button
          testID="goto-sign-in"
          title="Already have an account? Sign In"
          onPress={() => navigation.navigate("SignIn")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
});
`;
}

export const routerNavigationAdapter: Adapter = {
  id: "navigation:router",
  version: "1.0.0",
  kind: "navigation",
  displayName: "Expo Router",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan() {
    return [];
  },
};

export const reactNavigationAdapter: Adapter = {
  id: "navigation:react-navigation",
  version: "1.0.0",
  kind: "navigation",
  displayName: "React Navigation",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { workspace, root } = location(input.structure);
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
      {
        type: "add-dependency",
        workspace,
        name: "@react-navigation/bottom-tabs",
        version: "^7.0.14",
        kind: "dependencies",
        owner: this.id,
      },
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
        content: rootAppSource,
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
        content: appNavigatorSource,
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
        content: homeScreenSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/screens/ProfileScreen.tsx`,
        content: profileScreenSource,
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
    ];

    return operations;
  },
};

export function navigationAdapter(id: NavigationAdapter): Adapter {
  switch (id) {
    case "router":
      return routerNavigationAdapter;
    case "react-navigation":
      return reactNavigationAdapter;
  }
}
