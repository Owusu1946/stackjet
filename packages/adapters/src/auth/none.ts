import type { Adapter } from "../contract.js";
import { mobileLocation, noOptions } from "../shared/adapter-kit.js";

export const noneEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url().optional(), EXPO_PUBLIC_CONVEX_URL: z.string().optional() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL }, emptyStringAsUndefined: true });\n`;

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

export const noneAuthAdapter: Adapter = {
  id: "auth:none",
  version: "1.0.0",
  kind: "auth",
  displayName: "No authentication",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root } = mobileLocation(input.structure);
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
