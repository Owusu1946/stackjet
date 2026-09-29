import type { Adapter } from "../contract.js";
import { brandTitle, mobileLocation, noOptions } from "../shared/adapter-kit.js";

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
    void supabase.auth.getSession()
      .then(({ data: { session } }) => updateSession(session))
      .catch(() => updateSession(null));

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
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../src/supabase/client";
import { useSession } from "../../src/session/provider";

const CODE_LENGTH = 8;
function OtpBoxes({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<Array<TextInput | null>>([]);
  return <View style={styles.codeRow}>{Array.from({ length: CODE_LENGTH }, (_, index) => <TextInput key={index} ref={(ref) => { refs.current[index] = ref; }} accessibilityLabel={\`Verification digit \${index + 1}\`} keyboardType="number-pad" maxLength={1} value={value[index] ?? ""} onChangeText={(digit) => { const next = value.split(""); next[index] = digit.replace(/\\D/g, "").slice(-1); onChange(next.join("")); if (digit && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus(); }} style={styles.codeBox} />)}</View>;
}
export default function SignInScreen() {
  const session = useSession();
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [step, setStep] = useState<"email" | "code">("email"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null);
  if (session.status === "authenticated") return <Redirect href="/" />;
  async function sendCode() { setBusy(true); setError(null); const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim() }); if (authError) setError(authError.message); else { setStep("code"); setMessage(\`We sent an 8-digit code to \${email.trim()}.\`); } setBusy(false); }
  async function verifyCode() { setBusy(true); setError(null); const { error: authError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" }); if (authError) setError(authError.message); setBusy(false); }
  return <View style={styles.container} testID="auth-screen"><Text style={styles.eyebrow}>${brandTitle}</Text><Text style={styles.title}>{step === "code" ? "Check your email" : "Welcome back"}</Text><Text style={styles.body}>{step === "code" ? "Enter the 8-digit code to continue." : "Sign in or create an account with your email."}</Text>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{message ? <Text style={styles.success}>{message}</Text> : null}{step === "email" ? <><TextInput testID="email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} /><Pressable testID="send-code" style={styles.button} disabled={busy || !email.trim()} onPress={() => void sendCode()}><Text style={styles.buttonText}>{busy ? "Sending..." : "Email me a code"}</Text></Pressable></> : <><OtpBoxes value={code} onChange={setCode} /><Pressable testID="verify-code" style={styles.button} disabled={busy || code.length !== CODE_LENGTH} onPress={() => void verifyCode()}><Text style={styles.buttonText}>{busy ? "Verifying..." : "Verify code"}</Text></Pressable><Pressable style={styles.secondary} disabled={busy} onPress={() => void sendCode()}><Text style={styles.secondaryText}>Resend code</Text></Pressable></>}</View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f8fafc" }, eyebrow: { color: "#38bdf8", fontWeight: "700", letterSpacing: 2 }, title: { fontSize: 32, fontWeight: "800" }, body: { color: "#64748b", fontSize: 16 }, error: { color: "#ef4444" }, success: { color: "#10b981" }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "#ffffff" }, codeRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, codeBox: { flex: 1, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "#ffffff", textAlign: "center", fontSize: 22, fontWeight: "700" }, button: { alignItems: "center", borderRadius: 14, backgroundColor: "#0284c7", padding: 16 }, secondary: { alignItems: "center", borderRadius: 14, backgroundColor: "#f1f5f9", padding: 16 }, buttonText: { color: "white", fontWeight: "700" }, secondaryText: { color: "#0f172a", fontWeight: "700" } });
`;

export const supabaseAuthAdapter: Adapter = {
  id: "auth:supabase",
  version: "1.0.0",
  kind: "auth",
  displayName: "Supabase Auth",
  capabilities: () => ({ sdk: [57, 58], requires: ["secure-store"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = mobileLocation(input.structure);
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
