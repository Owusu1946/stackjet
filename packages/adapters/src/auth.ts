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
    <Text style={styles.eyebrow}>STACKJET</Text><Text style={styles.title}>Welcome</Text>
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

export function authAdapter(id: "better-auth" | "clerk" | "none") {
  return id === "clerk"
    ? clerkAuthAdapter
    : id === "better-auth"
      ? betterAuthAdapter
      : noneAuthAdapter;
}
