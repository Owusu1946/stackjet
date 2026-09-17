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

const dynamicThemeProviderSource = `import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { lightColors, darkColors, type ColorTokens } from "./tokens";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  colorScheme: "light" | "dark";
  colors: ColorTokens;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "expojet.theme.mode";
const ThemeContext = createContext<ThemeContextValue | null>(null);

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

  const colorScheme = mode === "system" ? systemScheme : mode;
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const toggleTheme = () => {
    setMode(colorScheme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({ mode, colorScheme, colors, setMode, toggleTheme }),
    [mode, colorScheme, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
`;

const fixedLightThemeProviderSource = `import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { type ColorTokens, lightColors } from "./tokens";

export type ThemeMode = "light";

export interface ThemeContextValue {
  mode: "light";
  colorScheme: "light";
  colors: ColorTokens;
  setMode: (mode: "light") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: "light",
      colorScheme: "light",
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
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
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
        content: 'export * from "./tokens.js";\nexport * from "./provider.js";\n',
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
