import { ActivityIndicator, Pressable, Text } from "react-native";

type Props = { label: string; onPress(): void; busy?: boolean; testID?: string };

export function PrimaryButton({ label, onPress, busy = false, testID }: Props) {
  return (
    <Pressable accessibilityRole="button" className="min-h-12 items-center justify-center rounded-2xl bg-brand px-5 active:opacity-80" disabled={busy} onPress={onPress} testID={testID}>
      {busy ? <ActivityIndicator color="#07111f" /> : <Text className="text-base font-bold text-canvas">{label}</Text>}
    </Pressable>
  );
}
