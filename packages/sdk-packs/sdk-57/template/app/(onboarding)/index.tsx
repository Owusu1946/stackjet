import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { useOnboarding } from "../../src/onboarding/provider";

export default function OnboardingScreen() {
  const onboarding = useOnboarding();
  const finish = async () => {
    await onboarding.finish();
    router.replace("/(app)");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to your app</Text>
      <Text style={styles.body}>This state is persisted securely on this device.</Text>
      <Button title="Get started" onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24 },
  title: { fontSize: 30, fontWeight: "700" },
  body: { fontSize: 16, color: "#52606d" },
});
