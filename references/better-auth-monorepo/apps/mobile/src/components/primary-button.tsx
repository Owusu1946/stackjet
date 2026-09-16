import { ActivityIndicator, Pressable, Text } from "react-native";
type Props = { label: string; onPress(): void; busy?: boolean; testID?: string };
export function PrimaryButton({ label, onPress, busy = false, testID }: Props) { return <Pressable accessibilityRole="button" className="min-h-12 items-center justify-center rounded-2xl bg-brand px-5" disabled={busy} onPress={onPress} testID={testID}>{busy ? <ActivityIndicator color="#0b0d15" /> : <Text className="font-bold text-canvas">{label}</Text>}</Pressable>; }
