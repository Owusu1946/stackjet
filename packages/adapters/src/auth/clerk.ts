import type { Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { brandTitle, mobileLocation, noOptions } from "../shared/adapter-kit.js";
import { sdkVersion } from "../versions.js";

const clerkEnv = `import { createEnv } from "@t3-oss/env-core";\nimport { z } from "zod";\nexport const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url().optional(), EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).default("pk_test_placeholder"), EXPO_PUBLIC_CONVEX_URL: z.string().optional() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL }, emptyStringAsUndefined: true });\n`;

const clerkProvider = `import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
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

function ClerkMissingKeyNotice() {
  return (
    <View style={noticeStyles.container} testID="auth-screen">
      <Text style={noticeStyles.eyebrow}>${brandTitle}</Text>
      <Text style={noticeStyles.title}>Clerk Key Required</Text>
      <Text style={noticeStyles.body}>
        Please set <Text style={noticeStyles.code}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text> in your <Text style={noticeStyles.code}>.env</Text> file to enable authentication.
      </Text>
    </View>
  );
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
        <ClerkMissingKeyNotice />
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

const noticeStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  body: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 22, maxWidth: 360 },
  code: { fontWeight: "700", color: "#0f172a" },
});
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
  return <View style={styles.container} testID="auth-screen"><Text style={styles.eyebrow}>${brandTitle}</Text><Text style={styles.title}>{resetCode ? "Check your email" : resetPassword ? "Choose a new password" : mode === "forgot" ? "Forgot password" : "Welcome back"}</Text>{resetCode ? <><TextInput testID="reset-code" keyboardType="number-pad" placeholder="Verification code" value={code} onChangeText={setCode} style={styles.input} /><Button title="Verify code" disabled={fetchStatus === "fetching"} onPress={() => void verifyReset()} /><Button title="Resend code" onPress={() => void sendReset()} /></> : resetPassword ? <><TextInput testID="new-password" secureTextEntry placeholder="New password" value={newPassword} onChangeText={setNewPassword} style={styles.input} /><Button title="Update password" disabled={fetchStatus === "fetching"} onPress={() => void finishReset()} /></> : <><TextInput testID="email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={emailAddress} onChangeText={setEmailAddress} style={styles.input} />{mode === "sign-in" ? <TextInput testID="password" secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} /> : null}<Text>{actionError ?? errors?.fields?.identifier?.message ?? errors?.fields?.password?.message ?? ""}</Text>{mode === "sign-in" ? <><Button testID="sign-in" title="Sign in" disabled={fetchStatus === "fetching"} onPress={() => void submit()} /><Button title="Forgot password" onPress={() => setMode("forgot")} /><Button testID="goto-sign-up" title="Create account" onPress={() => router.push("/(public)/sign-up")} /></> : <Button title="Send reset code" disabled={fetchStatus === "fetching"} onPress={() => void sendReset()} />}</>}</View>;
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
  return <View style={styles.container} testID="sign-up-screen"><Text style={styles.title}>{verifying ? "Check your email" : "Create account"}</Text>{verifying ? <><TextInput testID="code" keyboardType="number-pad" placeholder="Verification code" value={code} onChangeText={setCode} style={styles.input} /><Button testID="verify-sign-up" title="Verify" disabled={fetchStatus === "fetching"} onPress={() => void verify()} /><Button title="Resend code" onPress={() => void resend()} /></> : <><TextInput testID="email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={emailAddress} onChangeText={setEmailAddress} style={styles.input} /><TextInput testID="password" secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} /><Button testID="sign-up" title="Create account" disabled={fetchStatus === "fetching"} onPress={() => void submit()} /></>}{actionError || errors?.global?.[0]?.message ? <Text style={styles.error}>{actionError ?? errors?.global?.[0]?.message}</Text> : null}<View nativeID="clerk-captcha" /><Button title="Back to sign in" onPress={() => router.replace("/(public)/sign-in")} /></View>;
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

export const socialIconSource = `import { SvgXml } from "react-native-svg";
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

export const clerkAuthAdapter: Adapter = {
  id: "auth:clerk",
  version: "1.0.0",
  kind: "auth",
  displayName: "Clerk hosted authentication",
  capabilities: () => ({
    sdk: [57, 58],
    requires: ["deep-links", "secure-store"],
    conflicts: ["auth:better-auth"],
  }),
  optionsSchema: () => noOptions,
  plan(input) {
    const { root, workspace } = mobileLocation(input.structure);
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
        version: sdkVersion(input.sdk, "expo-auth-session"),
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-crypto",
        version: sdkVersion(input.sdk, "expo-crypto"),
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-web-browser",
        version: sdkVersion(input.sdk, "expo-web-browser"),
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
