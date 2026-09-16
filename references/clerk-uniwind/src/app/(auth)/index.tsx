import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { useState } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";

type Mode = "sign-in" | "sign-up";

export default function AuthScreen() {
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function start(mode: Mode) {
    setBusy(mode);
    setError(null);
    try { await startHostedAuth({ mode }); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : "Authentication could not start.";
      if (!/cancel|dismiss/i.test(message)) setError(message);
    } finally { setBusy(null); }
  }
  return <Screen><View className="flex-1 justify-between py-10" testID="auth-loaded"><View className="gap-4"><Text className="text-sm font-semibold uppercase tracking-widest text-brand">Stackjet proof app</Text><Text className="text-4xl font-black leading-tight text-ink">Hosted auth, protected routes, verified together.</Text><Text className="text-base leading-6 text-muted">Clerk owns the authentication UI. Stackjet owns secure session restoration and navigation policy.</Text></View><View className="gap-3">{error ? <Text className="text-danger" accessibilityRole="alert">{error}</Text> : null}<PrimaryButton label="Sign in" busy={busy === "sign-in"} onPress={() => start("sign-in")} testID="sign-in" /><PrimaryButton label="Create account" busy={busy === "sign-up"} onPress={() => start("sign-up")} testID="sign-up" /></View></View></Screen>;
}
