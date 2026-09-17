import { StyleSheet, Text, View } from "react-native";

export function BrandCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>STACKJET</Text>
      <Text style={styles.title}>Your Expo app is ready.</Text>
      <Text style={styles.body}>The StyleSheet adapter is active.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 24, borderRadius: 24, backgroundColor: "#ffffff" },
  eyebrow: { color: "#315efb", fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#121826", fontSize: 28, fontWeight: "700" },
  body: { color: "#52606d", fontSize: 16 },
});
