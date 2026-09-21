import "../src/monitoring/init";
import "../src/style-entry";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DataProvider } from "../src/data/provider";
import { OnboardingProvider } from "../src/onboarding/provider";
import { SessionProvider } from "../src/session/provider";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <SessionProvider>
        <DataProvider>
          <OnboardingProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </OnboardingProvider>
        </DataProvider>
      </SessionProvider>
    </>
  );
}
