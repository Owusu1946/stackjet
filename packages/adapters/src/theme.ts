import type { Operation } from "@expojet/core";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

const themeTokensSource = `export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryForeground: string;
  card: string;
  error: string;
}

export const lightColors: ColorTokens = {
  background: "#ffffff",
  surface: "#f8fafc",
  surfaceElevated: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  primary: "#4f46e5",
  primaryForeground: "#ffffff",
  card: "#ffffff",
  error: "#ef4444",
};

export const darkColors: ColorTokens = {
  background: "#09090b",
  surface: "#18181b",
  surfaceElevated: "#27272a",
  border: "#27272a",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  primary: "#6366f1",
  primaryForeground: "#ffffff",
  card: "#18181b",
  error: "#f87171",
};
`;

const dynamicThemeProviderSource = `import React, { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance, useColorScheme as useNativeColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { lightColors, darkColors, type ColorTokens } from "./tokens";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  colorScheme: "light" | "dark";
  isDark: boolean;
  colors: ColorTokens;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "expojet.theme.mode";
const defaultThemeValue: ThemeContextValue = {
  mode: "system",
  resolvedMode: "light",
  colorScheme: "light",
  isDark: false,
  colors: lightColors,
  setMode: () => {},
  toggleTheme: () => {},
};
const ThemeContext = createContext<ThemeContextValue>(defaultThemeValue);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useNativeColorScheme() ?? "light";
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    SecureStore.setItemAsync(STORAGE_KEY, nextMode).catch(() => {});
  };

  const resolvedMode: "light" | "dark" =
    (mode === "system" ? systemScheme : mode) === "dark" ? "dark" : "light";
  const isDark = resolvedMode === "dark";
  const colorScheme = resolvedMode;
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    // Drive React Native, Uniwind/NativeWind, and any system-aware styling
    // adapter from the same persisted theme decision.
    Appearance.setColorScheme(mode === "system" ? systemScheme : resolvedMode);
  }, [mode, resolvedMode, systemScheme]);

  const toggleTheme = () => {
    setMode(colorScheme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({ mode, resolvedMode, colorScheme, isDark, colors, setMode, toggleTheme }),
    [mode, resolvedMode, colorScheme, isDark, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? defaultThemeValue;
}
`;

const fixedLightThemeProviderSource = `import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { type ColorTokens, lightColors } from "./tokens";

export type ThemeMode = "light";

export interface ThemeContextValue {
  mode: "light";
  colorScheme: "light";
  isDark: boolean;
  colors: ColorTokens;
  setMode: (mode: "light") => void;
  toggleTheme: () => void;
}

const defaultThemeValue: ThemeContextValue = {
  mode: "light",
  colorScheme: "light",
  isDark: false,
  colors: lightColors,
  setMode: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeValue);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: "light",
      colorScheme: "light",
      isDark: false,
      colors: lightColors,
      setMode: () => {},
      toggleTheme: () => {},
    }),
    [],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? defaultThemeValue;
}
`;

const themeToggleSource = `import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";

export function ThemeToggle() {
  const { colorScheme, toggleTheme } = useTheme();
  return (
    <Pressable
      testID="theme-toggle"
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.toggle,
        {
          borderColor: colorScheme === "dark" ? "#334155" : "#e2e8f0",
          backgroundColor: colorScheme === "dark" ? "#1e293b" : "#f1f5f9",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={"Toggle theme, currently " + colorScheme}
    >
      <Text style={styles.icon}>{colorScheme === "dark" ? "🌙" : "☀️"}</Text>
      <Text
        style={[
          styles.label,
          { color: colorScheme === "dark" ? "#f8fafc" : "#0f172a" },
        ]}
      >
        {colorScheme === "dark" ? "Dark" : "Light"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  icon: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: "600" },
});
`;

export const themeAdapter: Adapter = {
  id: "feature:theme",
  version: "1.0.0",
  kind: "feature",
  displayName: "Theme Engine & Dark Mode",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input): Operation[] {
    const root = input.structure === "standalone" ? "" : "apps/mobile/";
    const providerSource = input.darkMode
      ? dynamicThemeProviderSource
      : fixedLightThemeProviderSource;

    return [
      {
        type: "write-file",
        path: `${root}src/theme/tokens.ts`,
        content: themeTokensSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/theme/provider.tsx`,
        content: providerSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/theme/index.ts`,
        content: 'export * from "./tokens";\nexport * from "./provider";\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/theme-toggle.tsx`,
        content: themeToggleSource,
        owner: this.id,
      },
    ];
  },
};
