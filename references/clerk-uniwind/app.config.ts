import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Stackjet Clerk Reference",
  slug: "stackjet-clerk-reference",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "stackjetclerk",
  userInterfaceStyle: "automatic",
  ios: { bundleIdentifier: "com.stackjet.reference.clerk", supportsTablet: true },
  android: { package: "com.stackjet.reference.clerk", predictiveBackGestureEnabled: false },
  plugins: ["expo-router", "expo-secure-store", "@clerk/expo"],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
