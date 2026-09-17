import { Redirect } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../src/session/provider";

export default function SignInScreen() {
  const session = useSession();
  if (session.status === "authenticated") return <Redirect href="/" />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>Connect an authentication adapter to enable sign-in.</Text>
      <Button title="Continue without authentication" onPress={session.signIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24 },
  title: { fontSize: 30, fontWeight: "700" },
  body: { fontSize: 16, color: "#52606d" },
});
