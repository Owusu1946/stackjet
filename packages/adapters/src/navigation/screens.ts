import type { CreateInput } from "@expojet/schemas";
import { brandTitle } from "../shared/adapter-kit.js";

export function makeDefaultSignInScreen(_auth: CreateInput["auth"]) {
  return `import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useSession } from "../session/provider";

export function SignInScreen({ navigation }: { navigation?: any }) {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container} testID="auth-screen">
      <Text style={styles.eyebrow}>${brandTitle}</Text>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        testID="email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        testID="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        testID="sign-in"
        title="Sign In"
        onPress={() => {
          if (typeof session.signIn === "function") {
            (session.signIn as any)({ email, password });
          }
        }}
      />
      {navigation ? (
        <Button
          testID="goto-sign-up"
          title="Don't have an account? Sign Up"
          onPress={() => navigation.navigate("SignUp")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
});
`;
}

export function makeDefaultSignUpScreen() {
  return `import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useSession } from "../session/provider";

export function SignUpScreen({ navigation }: { navigation?: any }) {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <View style={styles.container} testID="sign-up-screen">
      <Text style={styles.eyebrow}>${brandTitle}</Text>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        testID="name"
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        testID="email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        testID="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        testID="sign-up"
        title="Sign Up"
        onPress={() => {
          if (typeof (session as any).signUp === "function") {
            (session as any).signUp({ email, password, displayName: name });
          } else {
            session.signIn();
          }
        }}
      />
      {navigation ? (
        <Button
          testID="goto-sign-in"
          title="Already have an account? Sign In"
          onPress={() => navigation.navigate("SignIn")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 24, backgroundColor: "#f4f6fb" },
  eyebrow: { color: "#315efb", fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, backgroundColor: "white" },
});
`;
}
