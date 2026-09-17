import { Text, View } from "react-native";

export function BrandCard() {
  return (
    <View className="gap-2 rounded-3xl bg-white p-6">
      <Text className="text-xs font-bold tracking-widest text-blue-600">STACKJET</Text>
      <Text className="text-3xl font-bold text-slate-950">Your Expo app is ready.</Text>
      <Text className="text-base text-slate-600">The Uniwind adapter is active.</Text>
    </View>
  );
}
