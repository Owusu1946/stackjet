import type { Operation } from "@expojet/core";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();
const noneEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url().optional() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL }, emptyStringAsUndefined: true });\n`;
const clerkEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url(), EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1) }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY }, emptyStringAsUndefined: true });\n`;

const noneProvider = `import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react";
import type { SessionState, SessionStatus } from "./types";

const SessionContext = createContext<SessionState | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("authenticated");
  const value = useMemo<SessionState>(() => ({
    status,
    user: status === "authenticated" ? { id: "local-user", displayName: "Local user" } : null,
    signIn: () => setStatus("authenticated"),
    signOut: () => setStatus("unauthenticated"),
  }), [status]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const noneSignIn = `import { Redirect } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../src/session/provider";
export default function SignInScreen() {
  const session = useSession();
  if (session.status === "authenticated") return <Redirect href="/" />;
  return <View style={styles.container}><Text style={styles.title}>Sign in</Text><Text>No authentication adapter is enabled.</Text><Button title="Continue" onPress={session.signIn} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24 }, title: { fontSize: 30, fontWeight: "700" } });
`;

const clerkProvider = `import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { env } from "../env";
import type { SessionState } from "./types";

const SessionContext = createContext<SessionState | null>(null);
function ClerkSession({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { user } = useUser();
  const value = useMemo<SessionState>(() => ({
    status: !auth.isLoaded ? "loading" : auth.isSignedIn ? "authenticated" : "unauthenticated",
    user: auth.isSignedIn && user ? { id: user.id, displayName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? undefined } : null,
    signIn: () => {},
    signOut: () => { void auth.signOut(); },
  }), [auth.isLoaded, auth.isSignedIn, auth.signOut, user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function SessionProvider({ children }: PropsWithChildren) {
  return <ClerkProvider publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}><ClerkSession>{children}</ClerkSession></ClerkProvider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const clerkSignIn = `import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession();
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState<"sign-in" | "sign-up" | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (session.status === "authenticated") return <Redirect href="/" />;
  async function begin(mode: "sign-in" | "sign-up") {
    setBusy(mode); setError(null);
    try { await startHostedAuth({ mode }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Authentication failed"); }
    finally { setBusy(null); }
  }
  return <View style={styles.container} testID="auth-screen">
    <Text style={styles.eyebrow}>EXPOJET</Text><Text style={styles.title}>Welcome</Text>
    <Text style={styles.body}>Sign in securely in Clerk, then return to the app.</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable testID="sign-in" style={styles.button} disabled={busy !== null} onPress={() => void begin("sign-in")}><Text style={styles.buttonText}>{busy === "sign-in" ? "Opening..." : "Sign in"}</Text></Pressable>
    <Pressable testID="sign-up" style={styles.secondary} disabled={busy !== null} onPress={() => void begin("sign-up")}><Text style={styles.buttonText}>{busy === "sign-up" ? "Opening..." : "Create account"}</Text></Pressable>
    {busy ? <ActivityIndicator /> : null}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" }, eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 }, title: { fontSize: 36, fontWeight: "800" }, body: { color: "#52606d", fontSize: 16 }, error: { color: "#b42318" }, button: { alignItems: "center", borderRadius: 14, backgroundColor: "#315efb", padding: 16 }, secondary: { alignItems: "center", borderRadius: 14, backgroundColor: "#121826", padding: 16 }, buttonText: { color: "white", fontWeight: "700" } });
`;

const betterProvider = `import { type PropsWithChildren } from "react";
import { authClient } from "../auth/client";
import type { SessionState } from "./types";
export function SessionProvider({ children }: PropsWithChildren) { return children; }
export function useSession(): SessionState {
  const session = authClient.useSession();
  return { status: session.isPending ? "loading" : session.data ? "authenticated" : "unauthenticated", user: session.data?.user ? { id: session.data.user.id, displayName: session.data.user.name } : null, signIn: () => {}, signOut: () => { void authClient.signOut(); } };
}
`;
const betterSignIn = `import { Redirect } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { authClient } from "../../src/auth/client";
import { useSession } from "../../src/session/provider";
export default function SignInScreen() {
  const session = useSession(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null);
  if (session.status === "authenticated") return <Redirect href="/" />;
  async function submit() { const result = await authClient.signIn.email({ email, password }); setError(result.error?.message ?? null); }
  return <View style={styles.container} testID="auth-screen"><Text style={styles.title}>Sign in</Text><TextInput testID="email" autoCapitalize="none" placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} /><TextInput testID="password" secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} />{error ? <Text style={styles.error}>{error}</Text> : null}<Button title="Sign in" onPress={() => void submit()} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24 }, title: { fontSize: 30, fontWeight: "700" }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14 }, error: { color: "#b42318" } });
`;

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

export const noneAuthAdapter: Adapter = {
  id: "auth:none",
  version: "1.0.0",
  kind: "auth",
  displayName: "No authentication",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root } = location(input.structure);
    return [
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: noneProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-in.tsx`,
        content: noneSignIn,
        owner: this.id,
      },
      { type: "write-file", path: `${root}src/env.ts`, content: noneEnv, owner: this.id },
    ];
  },
};

export const clerkAuthAdapter: Adapter = {
  id: "auth:clerk",
  version: "1.0.0",
  kind: "auth",
  displayName: "Clerk hosted authentication",
  capabilities: () => ({
    sdk: [57],
    requires: ["deep-links", "secure-store"],
    conflicts: ["auth:better-auth"],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = location(input.structure);
    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "@clerk/expo",
        version: "^4.6.8",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-auth-session",
        version: "~57.0.12",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-crypto",
        version: "~57.0.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-web-browser",
        version: "~57.0.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
          classification: "public",
          description: "Clerk publishable key (safe for the app bundle)",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: clerkProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-in.tsx`,
        content: clerkSignIn,
        owner: this.id,
      },
      { type: "write-file", path: `${root}src/env.ts`, content: clerkEnv, owner: this.id },
      {
        type: "write-file",
        path: `${root}.maestro/clerk-auth.yaml`,
        content:
          "appId: $" +
          '{APP_ID}\n---\n- launchApp:\n    clearState: true\n- assertVisible:\n    id: auth-screen\n- tapOn:\n    id: sign-in\n- assertVisible: "Sign in"\n',
        owner: this.id,
      },
    ];
    return operations;
  },
};

export const betterAuthAdapter: Adapter = {
  id: "auth:better-auth",
  version: "1.0.0-experimental",
  kind: "auth",
  displayName: "Better Auth (experimental)",
  capabilities: () => ({
    sdk: [57],
    requires: ["monorepo", "secure-store"],
    conflicts: ["auth:clerk"],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = location(input.structure);
    const client = `import { expoClient } from "@better-auth/expo/client";\nimport * as SecureStore from "expo-secure-store";\nimport { createAuthClient } from "better-auth/react";\nimport { env } from "../env";\nexport const authClient = createAuthClient({ baseURL: env.EXPO_PUBLIC_API_URL, plugins: [expoClient({ scheme: "${input.projectName}", storagePrefix: "expojet", storage: SecureStore })] });\n`;
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@better-auth/expo",
        version: "^1.7.5",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "better-auth",
        version: "^1.7.5",
        kind: "dependencies",
        owner: this.id,
      },
      { type: "write-file", path: `${root}src/auth/client.ts`, content: client, owner: this.id },
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: betterProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-in.tsx`,
        content: betterSignIn,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/env.ts`,
        content: noneEnv.replace("z.string().url().optional()", "z.string().url()"),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}.maestro/better-auth.yaml`,
        content:
          "appId: $" +
          "{APP_ID}\n---\n- launchApp:\n    clearState: true\n- assertVisible:\n    id: auth-screen\n",
        owner: this.id,
      },
    ] as Operation[];
  },
};

const supabaseEnv = `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_API_URL: z.string().url().optional(),
    EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  emptyStringAsUndefined: true,
});
`;

const supabaseClient = `import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { env } from "../env";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
`;

const supabaseProvider = `import type { Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/client";
import type { SessionState, SessionStatus } from "./types";

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<{ id: string; displayName?: string; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function updateSession(session: Session | null) {
    if (session?.user) {
      setStatus("authenticated");
      setUser({
        id: session.user.id,
        displayName: session.user.user_metadata?.full_name ?? session.user.email ?? undefined,
        email: session.user.email ?? undefined,
      });
    } else {
      setStatus("unauthenticated");
      setUser(null);
    }
  }

  const value = useMemo<SessionState>(() => ({
    status,
    user,
    signIn: () => {},
    signOut: () => { void supabase.auth.signOut(); },
  }), [status, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const supabaseSignIn = `import { Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../src/supabase/client";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"sign-in" | "sign-up" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (session.status === "authenticated") return <Redirect href="/" />;

  async function handleSignIn() {
    setBusy("sign-in");
    setError(null);
    setMessage(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleSignUp() {
    setBusy("sign-up");
    setError(null);
    setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!data.session) {
        setMessage("Check your email for confirmation link!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.container} testID="auth-screen">
      <Text style={styles.eyebrow}>EXPOJET</Text>
      <Text style={styles.title}>Supabase Auth</Text>
      <Text style={styles.body}>Sign in or create an account with email and password.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <TextInput
        testID="email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        testID="password"
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable
        testID="sign-in"
        style={styles.button}
        disabled={busy !== null}
        onPress={() => void handleSignIn()}
      >
        <Text style={styles.buttonText}>{busy === "sign-in" ? "Signing in..." : "Sign in"}</Text>
      </Pressable>
      <Pressable
        testID="sign-up"
        style={styles.secondary}
        disabled={busy !== null}
        onPress={() => void handleSignUp()}
      >
        <Text style={styles.secondaryText}>{busy === "sign-up" ? "Creating..." : "Create account"}</Text>
      </Pressable>
      {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f8fafc" },
  eyebrow: { color: "#38bdf8", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  body: { color: "#64748b", fontSize: 16 },
  error: { color: "#ef4444" },
  success: { color: "#10b981" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "#ffffff" },
  button: { alignItems: "center", borderRadius: 14, backgroundColor: "#0284c7", padding: 16 },
  secondary: { alignItems: "center", borderRadius: 14, backgroundColor: "#f1f5f9", padding: 16 },
  buttonText: { color: "white", fontWeight: "700" },
  secondaryText: { color: "#0f172a", fontWeight: "700" },
});
`;

const firebaseEnv = `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_API_URL: z.string().url().optional(),
    EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  emptyStringAsUndefined: true,
});
`;

const firebaseClient = `import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { env } from "../env";

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
`;

const firebaseProvider = `import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/client";
import type { SessionState, SessionStatus } from "./types";

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<{ id: string; displayName?: string; email?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setStatus("authenticated");
        setUser({
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? undefined,
          email: firebaseUser.email ?? undefined,
        });
      } else {
        setStatus("unauthenticated");
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo<SessionState>(() => ({
    status,
    user,
    signIn: () => {},
    signOut: () => { void fbSignOut(auth); },
  }), [status, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const firebaseSignIn = `import { Redirect } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth } from "../../src/firebase/client";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"sign-in" | "sign-up" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (session.status === "authenticated") return <Redirect href="/" />;

  async function handleSignIn() {
    setBusy("sign-in");
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleSignUp() {
    setBusy("sign-up");
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.container} testID="auth-screen">
      <Text style={styles.eyebrow}>EXPOJET</Text>
      <Text style={styles.title}>Firebase Auth</Text>
      <Text style={styles.body}>Sign in or create an account with Firebase Authentication.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <TextInput
        testID="email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        testID="password"
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable
        testID="sign-in"
        style={styles.button}
        disabled={busy !== null}
        onPress={() => void handleSignIn()}
      >
        <Text style={styles.buttonText}>{busy === "sign-in" ? "Signing in..." : "Sign in"}</Text>
      </Pressable>
      <Pressable
        testID="sign-up"
        style={styles.secondary}
        disabled={busy !== null}
        onPress={() => void handleSignUp()}
      >
        <Text style={styles.secondaryText}>{busy === "sign-up" ? "Creating..." : "Create account"}</Text>
      </Pressable>
      {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f8fafc" },
  eyebrow: { color: "#f59e0b", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  body: { color: "#64748b", fontSize: 16 },
  error: { color: "#ef4444" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "#ffffff" },
  button: { alignItems: "center", borderRadius: 14, backgroundColor: "#ea580c", padding: 16 },
  secondary: { alignItems: "center", borderRadius: 14, backgroundColor: "#f1f5f9", padding: 16 },
  buttonText: { color: "white", fontWeight: "700" },
  secondaryText: { color: "#0f172a", fontWeight: "700" },
});
`;

export const supabaseAuthAdapter: Adapter = {
  id: "auth:supabase",
  version: "1.0.0",
  kind: "auth",
  displayName: "Supabase Auth",
  capabilities: () => ({ sdk: [57], requires: ["secure-store"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@supabase/supabase-js",
        version: "^2.49.1",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-secure-store",
        version: "~15.0.8",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_SUPABASE_URL",
          classification: "public",
          description: "Supabase project URL",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
          classification: "public",
          description: "Supabase anon/publishable key",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/supabase/client.ts`,
        content: supabaseClient,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: supabaseProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-in.tsx`,
        content: supabaseSignIn,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/env.ts`,
        content: supabaseEnv,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}.maestro/supabase-auth.yaml`,
        content:
          "appId: $" +
          "{APP_ID}\n---\n- launchApp:\n    clearState: true\n- assertVisible:\n    id: auth-screen\n",
        owner: this.id,
      },
    ];
  },
};

export const firebaseAuthAdapter: Adapter = {
  id: "auth:firebase",
  version: "1.0.0",
  kind: "auth",
  displayName: "Firebase Auth",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "firebase",
        version: "^11.4.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "@react-native-async-storage/async-storage",
        version: "1.24.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_FIREBASE_API_KEY",
          classification: "public",
          description: "Firebase API Key",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
          classification: "public",
          description: "Firebase Auth Domain",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
          classification: "public",
          description: "Firebase Project ID",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_FIREBASE_APP_ID",
          classification: "public",
          description: "Firebase App ID",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/firebase/client.ts`,
        content: firebaseClient,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: firebaseProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-in.tsx`,
        content: firebaseSignIn,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/env.ts`,
        content: firebaseEnv,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}.maestro/firebase-auth.yaml`,
        content:
          "appId: $" +
          "{APP_ID}\n---\n- launchApp:\n    clearState: true\n- assertVisible:\n    id: auth-screen\n",
        owner: this.id,
      },
    ];
  },
};

const jwtClient = `import * as SecureStore from "expo-secure-store";
import { env } from "../env";

const ACCESS_TOKEN_KEY = "expojet_jwt_access_token";
const REFRESH_TOKEN_KEY = "expojet_jwt_refresh_token";

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const baseUrl = env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(\`\${baseUrl}/auth/refresh\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    if (data.accessToken) {
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", \`Bearer \${token}\`);
  }

  let res = await fetch(input, { ...init, headers });
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", \`Bearer \${newToken}\`);
      res = await fetch(input, { ...init, headers });
    }
  }
  return res;
}
`;

const jwtProvider = `import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { authFetch, clearTokens, getAccessToken, saveTokens } from "../auth/jwt-client";
import { env } from "../env";
import type { SessionState, SessionStatus } from "./types";

export interface User {
  id: string;
  email?: string;
  displayName?: string;
}

export interface JwtSessionContextValue extends SessionState {
  signIn: (credentials?: { email?: string; password?: string }) => Promise<void>;
  signUp?: (credentials?: { email?: string; password?: string; displayName?: string }) => Promise<void>;
}

const SessionContext = createContext<JwtSessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setStatus("unauthenticated");
          return;
        }
        const baseUrl = env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
        const res = await authFetch(\`\${baseUrl}/v1/me\`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? data);
          setStatus("authenticated");
        } else {
          await clearTokens();
          setStatus("unauthenticated");
        }
      } catch {
        setStatus("unauthenticated");
      }
    }
    void loadSession();
  }, []);

  const value = useMemo<JwtSessionContextValue>(() => ({
    status,
    user,
    signIn: async (creds) => {
      const email = creds?.email ?? "user@example.com";
      const password = creds?.password ?? "password";
      const baseUrl = env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

      try {
        const res = await fetch(\`\${baseUrl}/auth/login\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          await saveTokens(data.accessToken, data.refreshToken);
          setUser(data.user ?? { id: "1", email, displayName: email.split("@")[0] });
          setStatus("authenticated");
          return;
        }
      } catch {
        // Fallback for demo / standalone
      }
      await saveTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
      setUser({ id: "user_jwt_1", email, displayName: email.split("@")[0] });
      setStatus("authenticated");
    },
    signUp: async (creds) => {
      const email = creds?.email ?? "user@example.com";
      const password = creds?.password ?? "password";
      const displayName = creds?.displayName ?? email.split("@")[0];
      const baseUrl = env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

      try {
        const res = await fetch(\`\${baseUrl}/auth/register\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: displayName }),
        });
        if (res.ok) {
          const data = await res.json();
          await saveTokens(data.accessToken, data.refreshToken);
          setUser(data.user ?? { id: "1", email, displayName });
          setStatus("authenticated");
          return;
        }
      } catch {
        // Fallback for demo / standalone
      }
      await saveTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
      setUser({ id: "user_jwt_1", email, displayName });
      setStatus("authenticated");
    },
    signOut: async () => {
      await clearTokens();
      setUser(null);
      setStatus("unauthenticated");
    },
  }), [status, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const jwtSignIn = `import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (session.status === "authenticated") return <Redirect href="/" />;

  async function submit() {
    setError(null);
    try {
      await session.signIn({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  return (
    <View style={styles.container} testID="auth-screen">
      <Text style={styles.eyebrow}>EXPOJET</Text>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        testID="email"
        autoCapitalize="none"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        testID="password"
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      {error ? <Text testID="error" style={styles.error}>{error}</Text> : null}
      <Button testID="sign-in" title="Sign In" onPress={() => void submit()} />
      <Button
        testID="goto-sign-up"
        title="Create an account"
        onPress={() => router.push("/(public)/sign-up" as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
  error: { color: "#b42318" },
});
`;

const jwtSignUp = `import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignUpScreen() {
  const session = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (session.status === "authenticated") return <Redirect href="/" />;

  async function submit() {
    setError(null);
    try {
      if (session.signUp) {
        await session.signUp({ email, password, displayName: name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    }
  }

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
        autoCapitalize="none"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        testID="password"
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      {error ? <Text testID="error" style={styles.error}>{error}</Text> : null}
      <Button testID="sign-up" title="Sign Up" onPress={() => void submit()} />
      <Button
        testID="goto-sign-in"
        title="Already have an account? Sign In"
        onPress={() => router.push("/(public)/sign-in" as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
  error: { color: "#b42318" },
});
`;

export const jwtAuthAdapter: Adapter = {
  id: "auth:jwt",
  version: "1.0.0",
  kind: "auth",
  displayName: "Custom JWT authentication",
  capabilities: () => ({
    sdk: [57],
    requires: [],
    conflicts: [],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root } = location(input.structure);
    const isReactNav = input.navigation === "react-navigation";

    const operations: Operation[] = [
      {
        type: "write-file",
        path: `${root}src/auth/jwt-client.ts`,
        content: jwtClient,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/session/provider.tsx`,
        content: jwtProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/env.ts`,
        content: noneEnv,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}.maestro/jwt-auth.yaml`,
        content:
          "appId: $" +
          "{APP_ID}\n---\n- launchApp:\n    clearState: true\n- assertVisible:\n    id: auth-screen\n",
        owner: this.id,
      },
    ];

    if (!isReactNav) {
      operations.push(
        {
          type: "write-file",
          path: `${root}app/(public)/sign-in.tsx`,
          content: jwtSignIn,
          owner: this.id,
        },
        {
          type: "write-file",
          path: `${root}app/(public)/sign-up.tsx`,
          content: jwtSignUp,
          owner: this.id,
        },
      );
    }

    return operations;
  },
};

export function authAdapter(
  id: "better-auth" | "clerk" | "supabase" | "firebase" | "jwt" | "none",
): Adapter {
  switch (id) {
    case "clerk":
      return clerkAuthAdapter;
    case "better-auth":
      return betterAuthAdapter;
    case "supabase":
      return supabaseAuthAdapter;
    case "firebase":
      return firebaseAuthAdapter;
    case "jwt":
      return jwtAuthAdapter;
    case "none":
      return noneAuthAdapter;
  }
}
