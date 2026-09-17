import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { features } from "../src/expojet-features";
import { useOnboarding } from "../src/onboarding/provider";
import { useSession } from "../src/session/provider";

export default function IndexScreen() {
  const session = useSession();
  const onboarding = useOnboarding();
  if (session.status === "loading" || onboarding.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "unauthenticated") return <Redirect href="/(public)/sign-in" />;
  if (features.onboarding && !onboarding.complete) return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(app)" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
