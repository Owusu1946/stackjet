import type { Adapter } from "../contract.js";
import { brandTitle, mobileLocation, noOptions } from "../shared/adapter-kit.js";

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
      <Text style={styles.eyebrow}>${brandTitle}</Text>
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

export const firebaseAuthAdapter: Adapter = {
  id: "auth:firebase",
  version: "1.0.0",
  kind: "auth",
  displayName: "Firebase Auth",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = mobileLocation(input.structure);
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
