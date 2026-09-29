import type { Operation } from "@expojet/core";
import type { Adapter } from "../contract.js";
import { mobileLocation, noOptions } from "../shared/adapter-kit.js";
import { noneEnv } from "./none.js";

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

export const betterAuthAdapter: Adapter = {
  id: "auth:better-auth",
  version: "1.0.0-experimental",
  kind: "auth",
  displayName: "Better Auth (experimental)",
  capabilities: () => ({
    sdk: [57, 58],
    requires: ["monorepo", "secure-store"],
    conflicts: ["auth:clerk"],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = mobileLocation(input.structure);
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
