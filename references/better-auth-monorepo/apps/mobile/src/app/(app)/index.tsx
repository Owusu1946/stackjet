import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export default function HomeScreen() {
  const me = useQuery({ queryKey: ["me"], queryFn: async () => { const response = await api.v1.me.$get(); if (!response.ok) throw new Error(response.status === 401 ? "Session rejected" : "API request failed"); return response.json(); } });
  return <Screen><View className="flex-1 justify-between py-10" testID="protected-home"><View className="gap-3"><Text className="text-sm font-semibold uppercase tracking-widest text-brand">Authenticated API</Text><Text className="text-4xl font-black text-ink">{me.data && "user" in me.data ? me.data.user.name : "Loading profile…"}</Text><Text className="text-base text-muted">{me.error instanceof Error ? me.error.message : me.data && "user" in me.data ? me.data.user.email : null}</Text></View><PrimaryButton label="Sign out" onPress={() => void authClient.signOut()} testID="sign-out" /></View></Screen>;
}
