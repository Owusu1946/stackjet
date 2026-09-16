import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useOnboarding } from "@/features/onboarding/provider";

export default function OnboardingScreen() {
  const onboarding = useOnboarding();
  return <Screen><View className="flex-1 justify-center gap-6" testID="onboarding-screen"><Text className="text-4xl font-black text-ink">One small local preference before launch.</Text><Text className="text-base leading-6 text-muted">This versioned completion flag lives on-device and does not require a profile table.</Text><PrimaryButton label="Finish onboarding" onPress={() => void onboarding.complete()} testID="complete-onboarding" /></View></Screen>;
}
