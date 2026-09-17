import { useHostedAuth } from "@clerk/expo/hosted-auth";
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
