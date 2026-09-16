import { useClerk, useUser } from "@clerk/expo";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useOnboarding } from "@/features/onboarding/provider";

export default function HomeScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const onboarding = useOnboarding();
  return <Screen><View className="flex-1 justify-between py-10" testID="protected-home"><View className="gap-3"><Text className="text-sm font-semibold uppercase tracking-widest text-brand">Protected</Text><Text className="text-4xl font-black text-ink">Welcome{user?.firstName ? `, ${user.firstName}` : ""}.</Text><Text className="text-base text-muted">The secure session restored before this route became available.</Text></View><View className="gap-3"><PrimaryButton label="Reset onboarding" onPress={() => void onboarding.reset()} /><PrimaryButton label="Sign out" onPress={() => void signOut()} testID="sign-out" /></View></View></Screen>;
}
