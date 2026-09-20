import type { Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const glassCardSource = `import React from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";

export interface GlassCardProps extends ViewProps {
  glassEffectStyle?: "regular" | "clear";
  intensity?: number;
  tint?: "systemMaterial" | "systemChromeMaterial" | "light" | "dark" | "default";
}

export function GlassCard({
  children,
  style,
  glassEffectStyle = "regular",
  intensity = 60,
  tint = "systemMaterial",
  ...props
}: GlassCardProps) {
  let canUseGlass = false;
  try {
    canUseGlass = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    canUseGlass = false;
  }

  if (canUseGlass) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        style={[styles.glassCard, style]}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.fallbackContainer, style]} {...props}>
      <BlurView
        intensity={intensity}
        tint={tint as any}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  fallbackContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: Platform.OS === "android" ? "rgba(255, 255, 255, 0.85)" : "transparent",
  },
  content: {
    padding: 20,
  },
});
`;

export const liquidGlassAdapter: Adapter = {
  id: "feature:liquid-glass",
  version: "1.0.0",
  kind: "liquid-glass",
  displayName: "Liquid Glass Engine",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "expo-glass-effect",
        version: "~57.0.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-blur",
        version: "~57.0.2",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/ui/glass-card.tsx`,
        content: glassCardSource,
        owner: this.id,
      },
    ];
  },
};

export const noLiquidGlassAdapter: Adapter = {
  id: "feature:liquid-glass-none",
  version: "1.0.0",
  kind: "liquid-glass",
  displayName: "None",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(_input: CreateInput): Operation[] {
    return [];
  },
};

export function getLiquidGlassAdapter(enabled: boolean): Adapter {
  return enabled ? liquidGlassAdapter : noLiquidGlassAdapter;
}
