import "../src/style-entry";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "../src/data/provider";
import { OnboardingProvider } from "../src/onboarding/provider";
import { SessionProvider } from "../src/session/provider";
import { ThemeProvider } from "../src/theme/provider";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <ThemeProvider>
        <SessionProvider>
          <DataProvider>
            <OnboardingProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </OnboardingProvider>
          </DataProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}
