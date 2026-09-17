import { Redirect } from "expo-router";
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
