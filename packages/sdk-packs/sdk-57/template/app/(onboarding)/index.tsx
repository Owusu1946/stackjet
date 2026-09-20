import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../../src/onboarding/provider";
import { useTheme } from "../../src/theme/provider";

const steps = [
  {
    eyebrow: "WELCOME",
    title: "A calm place to start",
    body: "Your app is ready with a thoughtful foundation for the work ahead.",
  },
  {
    eyebrow: "YOUR SPACE",
    title: "Make it yours",
    body: "Choose your preferences now. You can change them any time from Profile.",
  },
  {
    eyebrow: "ALL SET",
    title: "Ready when you are",
    body: "Finish setup and land on your home screen.",
  },
] as const;

export default function OnboardingScreen() {
  const onboarding = useOnboarding();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = step === steps.length - 1;
  async function finish() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onboarding.finish();
      router.replace("/(app)");
    } catch {
      setError("We could not save your progress. Please try again.");
    } finally {
      setPending(false);
    }
  }
  const current = steps[step];
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Onboarding step ${step + 1} of ${steps.length}`}
          style={styles.progress}
        >
          {steps.map((item, index) => (
            <View
              key={item.eyebrow}
              style={[
                styles.dot,
                { backgroundColor: index <= step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
        <Animated.View
          key={step}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.copy}
        >
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{current.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{current.body}</Text>
        </Animated.View>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep((value) => value - 1)}
            style={styles.back}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={() => (last ? void finish() : setStep((value) => value + 1))}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
            pending && styles.disabled,
          ]}
          testID="onboarding-next"
        >
          {pending ? (
            <ActivityIndicator color={colors.primaryForeground as string} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {last ? "Get started" : "Continue"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: "center", gap: 24 },
  progress: { flexDirection: "row", gap: 8 },
  dot: { width: 28, height: 4, borderRadius: 4 },
  copy: { gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "800" },
  body: { fontSize: 17, lineHeight: 25 },
  error: { color: "#b42318" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  back: { minHeight: 48, justifyContent: "center", paddingHorizontal: 8 },
  backText: { fontSize: 16, fontWeight: "600" },
  button: {
    minHeight: 48,
    minWidth: 132,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 18,
  },
  buttonText: { fontWeight: "700" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
});
