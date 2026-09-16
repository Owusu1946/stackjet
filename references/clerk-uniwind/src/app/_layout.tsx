import "../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider, useOnboarding } from "@/features/onboarding/provider";
import { env } from "@/lib/env";

function RouteTree() {
  const { isLoaded, isSignedIn } = useAuth();
  const onboarding = useOnboarding();
  if (!isLoaded || !onboarding.isLoaded) {
    return <View className="flex-1 items-center justify-center bg-canvas" testID="auth-loading"><ActivityIndicator color="#66e3c4" size="large" /></View>;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}><Stack.Screen name="(auth)" /></Stack.Protected>
      <Stack.Protected guard={Boolean(isSignedIn && !onboarding.isComplete)}><Stack.Screen name="(onboarding)" /></Stack.Protected>
      <Stack.Protected guard={Boolean(isSignedIn && onboarding.isComplete)}><Stack.Screen name="(app)" /></Stack.Protected>
    </Stack>
  );
}

function MissingConfiguration() {
  return <View className="flex-1 items-center justify-center gap-3 bg-canvas px-8"><Text className="text-center text-2xl font-bold text-ink">Clerk key required</Text><Text className="text-center text-base text-muted">Copy .env.example to .env and add the Expo publishable key. No secret key belongs in this app.</Text></View>;
}

export default function RootLayout() {
  const publishableKey = env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return <SafeAreaProvider>{publishableKey ? <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><OnboardingProvider><RouteTree /></OnboardingProvider></ClerkProvider> : <MissingConfiguration />}</SafeAreaProvider>;
}
