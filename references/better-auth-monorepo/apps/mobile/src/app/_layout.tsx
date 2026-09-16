import "../global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";

function RouteTree() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Protected guard={!session}><Stack.Screen name="(auth)" /></Stack.Protected><Stack.Protected guard={Boolean(session)}><Stack.Screen name="(app)" /></Stack.Protected></Stack>;
}
export default function RootLayout() { return <SafeAreaProvider><QueryClientProvider client={queryClient}><RouteTree /></QueryClientProvider></SafeAreaProvider>; }
