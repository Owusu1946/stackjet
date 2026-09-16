import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>STACKJET</Text>
      <Text style={styles.title}>Your Expo app is ready.</Text>
      <Text style={styles.body}>Edit app/index.tsx to start building.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#f4f6fb",
  },
  eyebrow: {
    color: "#315efb",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#121826",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: "#52606d",
    fontSize: 16,
    textAlign: "center",
  },
});
