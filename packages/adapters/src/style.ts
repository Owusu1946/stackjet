import type { Operation } from "@expojet/core";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

const stylesheetCard = `import { StyleSheet, Text, View } from "react-native";

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
`;

const uniwindCard = `import { Text, View } from "react-native";

export function BrandCard() {
  return (
    <View className="gap-2 rounded-3xl bg-white dark:bg-slate-900 p-6">
      <Text className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400">STACKJET</Text>
      <Text className="text-3xl font-bold text-slate-950 dark:text-slate-50">Your Expo app is ready.</Text>
      <Text className="text-base text-slate-600 dark:text-slate-400">The Uniwind adapter is active.</Text>
    </View>
  );
}
`;

const nativewindCard = `import { Text, View } from "react-native";

export function BrandCard() {
  return (
    <View className="gap-2 rounded-3xl bg-white dark:bg-slate-900 p-6">
      <Text className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400">STACKJET</Text>
      <Text className="text-3xl font-bold text-slate-950 dark:text-slate-50">Your Expo app is ready.</Text>
      <Text className="text-base text-slate-600 dark:text-slate-400">The NativeWind adapter is active.</Text>
    </View>
  );
}
`;

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

const unistylesConfigSource = `import { StyleSheet } from "react-native-unistyles";

export const lightTheme = {
  colors: {
    background: "#ffffff",
    card: "#ffffff",
    text: "#121826",
    subtext: "#52606d",
    primary: "#315efb",
  },
} as const;

export const darkTheme = {
  colors: {
    background: "#090d16",
    card: "#0f172a",
    text: "#f8fafc",
    subtext: "#94a3b8",
    primary: "#60a5fa",
  },
} as const;

export const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
} as const;

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  breakpoints,
  settings: {
    initialTheme: "light",
  },
});
`;

const unistylesCard = `import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function BrandCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>STACKJET</Text>
      <Text style={styles.title}>Your Expo app is ready.</Text>
      <Text style={styles.body}>The Unistyles adapter is active.</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: 10,
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    color: theme.colors.subtext,
    fontSize: 16,
  },
}));
`;

export const stylesheetAdapter: Adapter = {
  id: "style:stylesheet",
  version: "1.0.0",
  kind: "style",
  displayName: "React Native StyleSheet",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const root = input.structure === "standalone" ? "" : "apps/mobile/";
    return [
      {
        type: "write-file",
        path: `${root}src/style-entry.ts`,
        content: "export {};\n",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/brand-card.tsx`,
        content: stylesheetCard,
        owner: this.id,
      },
    ];
  },
};

export const uniwindAdapter: Adapter = {
  id: "style:uniwind",
  version: "1.0.0",
  kind: "style",
  displayName: "Uniwind",
  capabilities: () => ({ sdk: [57], requires: ["metro"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const workspace = input.structure === "standalone" ? "." : "apps/mobile";
    const root = workspace === "." ? "" : `${workspace}/`;
    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "uniwind",
        version: "^1.12.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "tailwindcss",
        version: "^4.3.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/global.css`,
        content: '@import "tailwindcss";\n@import "uniwind";\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/style-entry.ts`,
        content: 'import "./global.css";\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/uniwind-types.d.ts`,
        content: '/// <reference types="uniwind/types" />\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/brand-card.tsx`,
        content: uniwindCard,
        owner: this.id,
      },
      {
        type: "compose-metro",
        contribution: {
          id: this.id,
          workspace,
          module: "uniwind/metro",
          exportName: "withUniwindConfig",
          options: { cssEntryFile: "./src/global.css", dtsFile: "./src/uniwind-types.d.ts" },
        },
        owner: this.id,
      },
    ];
    return operations;
  },
};

export const nativewindAdapter: Adapter = {
  id: "style:nativewind",
  version: "1.0.0",
  kind: "style",
  displayName: "NativeWind",
  capabilities: () => ({ sdk: [57], requires: ["metro"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const workspace = input.structure === "standalone" ? "." : "apps/mobile";
    const root = workspace === "." ? "" : `${workspace}/`;
    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "nativewind",
        version: "^4.1.23",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "tailwindcss",
        version: "~3.4.17",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}tailwind.config.js`,
        content: tailwindConfig,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/global.css`,
        content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/style-entry.ts`,
        content: 'import "./global.css";\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/nativewind-env.d.ts`,
        content: '/// <reference types="nativewind/types" />\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/brand-card.tsx`,
        content: nativewindCard,
        owner: this.id,
      },
      {
        type: "compose-metro",
        contribution: {
          id: this.id,
          workspace,
          module: "nativewind/metro",
          exportName: "withNativeWind",
          options: { input: "./src/global.css" },
        },
        owner: this.id,
      },
    ];
    return operations;
  },
};

export const unistylesAdapter: Adapter = {
  id: "style:unistyles",
  version: "1.0.0",
  kind: "style",
  displayName: "Unistyles",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const workspace = input.structure === "standalone" ? "." : "apps/mobile";
    const root = workspace === "." ? "" : `${workspace}/`;
    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "react-native-unistyles",
        version: "^3.3.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/unistyles.ts`,
        content: unistylesConfigSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/style-entry.ts`,
        content: 'import "./unistyles";\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/brand-card.tsx`,
        content: unistylesCard,
        owner: this.id,
      },
    ];
    return operations;
  },
};

export function styleAdapter(id: "stylesheet" | "uniwind" | "nativewind" | "unistyles") {
  switch (id) {
    case "nativewind":
      return nativewindAdapter;
    case "unistyles":
      return unistylesAdapter;
    case "uniwind":
      return uniwindAdapter;
    default:
      return stylesheetAdapter;
  }
}
