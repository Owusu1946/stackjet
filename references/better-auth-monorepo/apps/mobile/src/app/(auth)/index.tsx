import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { authClient } from "@/lib/auth-client";

export default function AuthScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(mode: "sign-in" | "sign-up") {
    setBusy(true);
    setError(null);

    try {
      const result = mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            name: name || email.split("@")[0] || "Stackjet user",
            email,
            password,
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
      }
    } catch {
      setError("Could not reach the authentication server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4" testID="auth-loaded">
            <Text className="text-sm font-semibold uppercase tracking-widest text-brand">
              Experimental SDK 57 gate
            </Text>
            <Text className="text-4xl font-black text-ink">Better Auth, owned end to end.</Text>
            <TextInput
              className="rounded-xl bg-panel p-4 text-ink"
              accessibilityLabel="Name"
              placeholder="Name (for sign up)"
              placeholderTextColor="#777482"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="rounded-xl bg-panel p-4 text-ink"
              accessibilityLabel="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#777482"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              className="rounded-xl bg-panel p-4 text-ink"
              accessibilityLabel="Password"
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#777482"
              value={password}
              onChangeText={setPassword}
            />
            {error ? (
              <Text className="text-danger" accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              label="Sign in"
              busy={busy}
              onPress={() => void authenticate("sign-in")}
              testID="sign-in"
            />
            <PrimaryButton
              label="Create account"
              busy={busy}
              onPress={() => void authenticate("sign-up")}
              testID="sign-up"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
