import type { Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();
const noneEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url().optional(), EXPO_PUBLIC_CONVEX_URL: z.string().optional() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL }, emptyStringAsUndefined: true });\n`;
const clerkEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url().optional(), EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).default("pk_test_placeholder"), EXPO_PUBLIC_CONVEX_URL: z.string().optional() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL }, emptyStringAsUndefined: true });\n`;

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
  const publishableKey = env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey === "pk_test_placeholder") {
    return (
      <SessionContext.Provider
        value={{
          status: "unauthenticated",
          user: null,
          signIn: () => {},
          signOut: () => {},
        }}
      >
        {children}
      </SessionContext.Provider>
    );
  }
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><ClerkSession>{children}</ClerkSession></ClerkProvider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
`;

const clerkSignIn = `import { useSignIn } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession(); const router = useRouter(); const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState(""); const [password, setPassword] = useState(""); const [code, setCode] = useState(""); const [newPassword, setNewPassword] = useState(""); const [mode, setMode] = useState<"sign-in" | "forgot" | "reset">("sign-in"); const [actionError, setActionError] = useState<string | null>(null);
  if (session.status === "authenticated") return <Redirect href="/" />;
  async function submit() { setActionError(null); const { error } = await signIn.password({ emailAddress, password }); if (error || signIn.status !== "complete") return; await signIn.finalize({ navigate: () => router.replace("/") }); }
  async function sendReset() { setActionError(null); const { error: createError } = await signIn.create({ identifier: emailAddress }); if (createError) return setActionError(createError.message); const { error } = await signIn.resetPasswordEmailCode.sendCode(); if (error) setActionError(error.message); else setMode("reset"); }
  async function verifyReset() { setActionError(null); const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code }); if (error) setActionError(error.message); else setMode("forgot"); }
  async function finishReset() { const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword }); if (error) setActionError(error.message); else { setMode("sign-in"); setPassword(""); } }
  const resetCode = mode === "reset"; const resetPassword = mode === "forgot" && signIn.status === "needs_new_password";
  return <View style={styles.container} testID="auth-screen"><Text style={styles.eyebrow}>EXPOJET</Text><Text style={styles.title}>{resetCode ? "Check your email" : resetPassword ? "Choose a new password" : mode === "forgot" ? "Forgot password" : "Welcome back"}</Text>{resetCode ? <><TextInput testID="reset-code" keyboardType="number-pad" placeholder="Verification code" value={code} onChangeText={setCode} style={styles.input} /><Button title="Verify code" disabled={fetchStatus === "fetching"} onPress={() => void verifyReset()} /><Button title="Resend code" onPress={() => void sendReset()} /></> : resetPassword ? <><TextInput testID="new-password" secureTextEntry placeholder="New password" value={newPassword} onChangeText={setNewPassword} style={styles.input} /><Button title="Update password" disabled={fetchStatus === "fetching"} onPress={() => void finishReset()} /></> : <><TextInput testID="email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={emailAddress} onChangeText={setEmailAddress} style={styles.input} />{mode === "sign-in" ? <TextInput testID="password" secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} /> : null}<Text>{actionError ?? errors?.fields?.identifier?.message ?? errors?.fields?.password?.message ?? ""}</Text>{mode === "sign-in" ? <><Button testID="sign-in" title="Sign in" disabled={fetchStatus === "fetching"} onPress={() => void submit()} /><Button title="Forgot password" onPress={() => setMode("forgot")} /><Button testID="goto-sign-up" title="Create account" onPress={() => router.push("/(public)/sign-up")} /></> : <Button title="Send reset code" disabled={fetchStatus === "fetching"} onPress={() => void sendReset()} />}</>}</View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" }, eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 }, title: { fontSize: 36, fontWeight: "800" }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14 }, error: { color: "#b42318" } });
`;

const clerkSignUp = `import { useSignUp } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignUpScreen() {
  const session = useSession(); const router = useRouter(); const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState(""); const [password, setPassword] = useState(""); const [code, setCode] = useState(""); const [actionError, setActionError] = useState<string | null>(null);
  if (session.status === "authenticated") return <Redirect href="/" />;
  const verifying = signUp.status === "missing_requirements" && signUp.unverifiedFields?.includes("email_address");
  async function submit() { setActionError(null); const { error } = await signUp.password({ emailAddress, password }); if (error) return setActionError(error.message); const result = await signUp.verifications.sendEmailCode(); if (result.error) setActionError(result.error.message); }
  async function resend() { const { error } = await signUp.verifications.sendEmailCode(); if (error) setActionError(error.message); else setActionError("A new verification code was sent."); }
  async function verify() { const { error } = await signUp.verifications.verifyEmailCode({ code }); if (error || signUp.status !== "complete") { if (error) setActionError(error.message); return; } await signUp.finalize({ navigate: () => router.replace("/") }); }
  return <View style={styles.container} testID="sign-up-screen"><Text style={styles.title}>{verifying ? "Check your email" : "Create account"}</Text>{verifying ? <><TextInput testID="code" keyboardType="number-pad" placeholder="Verification code" value={code} onChangeText={setCode} style={styles.input} /><Button testID="verify-sign-up" title="Verify" disabled={fetchStatus === "fetching"} onPress={() => void verify()} /><Button title="Resend code" onPress={() => void resend()} /></> : <><TextInput testID="email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={emailAddress} onChangeText={setEmailAddress} style={styles.input} /><TextInput testID="password" secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} /><Button testID="sign-up" title="Create account" disabled={fetchStatus === "fetching"} onPress={() => void submit()} /></>}{actionError || errors?.global?.[0]?.message ? <Text style={styles.error}>{actionError ?? errors.global[0].message}</Text> : null}<View nativeID="clerk-captcha" /><Button title="Back to sign in" onPress={() => router.replace("/(public)/sign-in")} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" }, title: { fontSize: 30, fontWeight: "700" }, input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14 }, error: { color: "#b42318" } });
`;

const clerkSocialButtons = `import React from "react";
import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SocialIcon, type SocialProvider } from "./social-icon";

const PROVIDERS: readonly SocialProvider[] = __SOCIAL_PROVIDERS__;
const STRATEGIES: Record<SocialProvider, string> = {
  google: "oauth_google",
  apple: "oauth_apple",
  facebook: "oauth_facebook",
  microsoft: "oauth_microsoft",
};
const LABELS: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  microsoft: "Microsoft",
};

export function SocialAuthButtons() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [pending, setPending] = React.useState<SocialProvider | null>(null);
  async function signIn(provider: SocialProvider) {
    setPending(provider);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: STRATEGIES[provider] as any });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } finally {
      setPending(null);
    }
  }
  if (!PROVIDERS.length) return null;
  return <View style={styles.social}><Text style={styles.or}>or continue with</Text>{PROVIDERS.map((provider) => <Pressable key={provider} accessibilityRole="button" accessibilityLabel={"Continue with " + LABELS[provider]} disabled={pending !== null} onPress={() => void signIn(provider)} style={styles.button}>{pending === provider ? <ActivityIndicator /> : <SocialIcon provider={provider} size={20} />}<Text style={styles.label}>{LABELS[provider]}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ social: { gap: 10, marginTop: 8 }, or: { color: "#64748b", textAlign: "center" }, button: { minHeight: 48, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16 }, label: { fontWeight: "700" } });
`;

const socialIconSource = `import { SvgXml } from "react-native-svg";
import type { ColorValue } from "react-native";
export type SocialProvider = "google" | "apple" | "facebook" | "microsoft";
const XML: Record<SocialProvider, string> = {
  google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.74-.07-1.45-.21-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.29Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.34l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.6A5.86 5.86 0 0 1 6.23 12c0-.56.1-1.1.31-1.6V7.87H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.13l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.37c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.47 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.37l3.24 2.53C7.31 8.09 9.46 6.37 12 6.37Z"/></svg>',
  apple: '<svg viewBox="0 0 24 24"><path fill="#111827" d="M17.05 12.78c-.02-2.31 1.88-3.42 1.97-3.47a4.23 4.23 0 0 0-3.33-1.8c-1.4-.15-2.73.84-3.44.84-.72 0-1.83-.82-3.01-.8a4.43 4.43 0 0 0-3.73 2.27c-1.61 2.79-.41 6.9 1.15 9.16.77 1.1 1.68 2.33 2.88 2.29 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 2.98.72 1.24-.02 2.03-1.12 2.8-2.22a9.1 9.1 0 0 0 1.27-2.57 3.98 3.98 0 0 1-2.51-3.68ZM14.8 6.04a4 4 0 0 0 .92-2.87 4.08 4.08 0 0 0-2.65 1.37 3.8 3.8 0 0 0-.95 2.76 3.37 3.37 0 0 0 2.68-1.26Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.86v-8.4H7.08V12h3.04V9.36c0-3 1.79-4.66 4.52-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.46h-2.79v8.4A12 12 0 0 0 24 12Z"/></svg>',
  microsoft: '<svg viewBox="0 0 24 24"><path fill="#f25022" d="M2 2h9.5v9.5H2z"/><path fill="#7fba00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00a4ef" d="M2 12.5h9.5V22H2z"/><path fill="#ffb900" d="M12.5 12.5H22V22h-9.5z"/></svg>',
};
export function SocialIcon({ provider, size = 20, color }: { provider: SocialProvider; size?: number; color?: ColorValue }) { return <SvgXml xml={XML[provider]} width={size} height={size} color={color as string | undefined} />; }
`;

function clerkScreenWithSocials(source: string, providers: CreateInput["socialProviders"]) {
  if (!providers?.length) return source;
  return source
    .replace(
      'import { useSignIn } from "@clerk/expo";',
      'import { useSignIn } from "@clerk/expo";\nimport { SocialAuthButtons } from "../../src/components/auth/social-buttons";',
    )
    .replace(
      'import { useSignUp } from "@clerk/expo";',
      'import { useSignUp } from "@clerk/expo";\nimport { SocialAuthButtons } from "../../src/components/auth/social-buttons";',
    )
    .replace("</View>;", "<SocialAuthButtons /></View>;");
}

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
    const selectedSocialProviders = input.socialProviders ?? [];
    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "@clerk/expo",
        version: "^4.6.8",
        kind: "dependencies",
        owner: this.id,
      },
      ...(selectedSocialProviders.length > 0
        ? [
            {
              type: "add-dependency" as const,
              workspace,
              name: "react-native-svg",
              version: "^15.11.2",
              kind: "dependencies" as const,
              owner: this.id,
            },
          ]
        : []),
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
        content: clerkScreenWithSocials(clerkSignIn, selectedSocialProviders),
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}app/(public)/sign-up.tsx`,
        content: clerkScreenWithSocials(clerkSignUp, selectedSocialProviders),
        owner: this.id,
      },
      ...(selectedSocialProviders.length > 0
        ? [
            {
              type: "write-file" as const,
              path: `${root}src/components/auth/social-buttons.tsx`,
              content: clerkSocialButtons.replace(
                "__SOCIAL_PROVIDERS__",
                JSON.stringify(selectedSocialProviders),
              ),
              owner: this.id,
            },
            {
              type: "write-file" as const,
              path: `${root}src/components/auth/social-icon.tsx`,
              content: socialIconSource,
              owner: this.id,
            },
          ]
        : []),
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
