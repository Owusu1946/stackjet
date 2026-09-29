import type { Operation } from "@expojet/core";
import type { Adapter } from "../contract.js";
import { brandTitle, mobileLocation, noOptions } from "../shared/adapter-kit.js";
import { noneEnv } from "./none.js";

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

  const baseUrl = env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("EXPO_PUBLIC_API_URL is required for JWT authentication");
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
        const baseUrl = env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) throw new Error("EXPO_PUBLIC_API_URL is required for JWT authentication");
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
      const baseUrl = env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("EXPO_PUBLIC_API_URL is required for JWT authentication");

      try {
        const res = await fetch(\`\${baseUrl}/auth/login\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Sign in failed");
        if (!data?.accessToken || !data?.user) throw new Error("The authentication server returned an invalid response");
        await saveTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        setStatus("authenticated");
      } catch (error) {
        setStatus("unauthenticated");
        throw error;
      }
    },
    signUp: async (creds) => {
      const email = creds?.email ?? "user@example.com";
      const password = creds?.password ?? "password";
      const displayName = creds?.displayName ?? email.split("@")[0];
      const baseUrl = env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("EXPO_PUBLIC_API_URL is required for JWT authentication");

      try {
        const res = await fetch(\`\${baseUrl}/auth/register\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: displayName }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Account creation failed");
        if (!data?.accessToken || !data?.user) throw new Error("The authentication server returned an invalid response");
        await saveTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        setStatus("authenticated");
      } catch (error) {
        setStatus("unauthenticated");
        throw error;
      }
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
      <Text style={styles.eyebrow}>${brandTitle}</Text>
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
      <Text style={styles.eyebrow}>${brandTitle}</Text>
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
    sdk: [57, 58],
    requires: [],
    conflicts: [],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root } = mobileLocation(input.structure);
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
