import { StyleSheet, View } from "react-native";
import { BrandCard } from "../../src/components/brand-card";

export default function AppHomeScreen() {
  return (
    <View style={styles.container}>
      <BrandCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f4f6fb" },
});
