import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Stackjet Better Auth Reference",
  slug: "stackjet-better-auth-reference",
  version: "0.1.0",
  scheme: "stackjetbetterauth",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: { bundleIdentifier: "com.stackjet.reference.betterauth", supportsTablet: true },
  android: { package: "com.stackjet.reference.betterauth", predictiveBackGestureEnabled: false },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
