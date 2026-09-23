import type { Operation } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const hapticsSource = `import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Tactile feedback engine providing consistent, safe haptics across mobile platforms.
 * Safe for web and devices without haptic motors (no unhandled rejections).
 */
export const haptic = {
  /** Crisp, subtle tick for tab changes, segment switches, and picker scrolls */
  selection: () => {
    if (Platform.OS === "web") return;
    Haptics.selectionAsync().catch(() => {});
  },
  /** Light tap for button presses, icon toggles, and counter increments */
  light: () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** Medium tap for modal dismissals, pull-to-refresh snaps, and state resets */
  medium: () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  /** Heavy punch for destructive actions, long-press triggers, and prominent confirmations */
  heavy: () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  /** Notification feedback for completed tasks, successful saves, and checkouts */
  success: () => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** Notification feedback for warnings, validation alerts, and limits reached */
  warning: () => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  /** Notification feedback for errors, failed operations, and rejected actions */
  error: () => {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
`;

const noHapticsSource = `// Haptics disabled — this module provides no-op stubs so calls safely resolve without adding dependencies.
export const haptic = {
  selection: () => {},
  light: () => {},
  medium: () => {},
  heavy: () => {},
  success: () => {},
  warning: () => {},
  error: () => {},
};
`;

export const hapticsAdapter: Adapter = {
  id: "feature:haptics",
  version: "1.0.0",
  kind: "feature",
  displayName: "Tactile Haptics Engine",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "expo-haptics",
        version: "~57.0.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/haptics/index.ts`,
        content: hapticsSource,
        owner: this.id,
      },
    ];
  },
};

export const noHapticsAdapter: Adapter = {
  id: "feature:haptics-none",
  version: "1.0.0",
  kind: "feature",
  displayName: "None",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { root } = location(input.structure);
    return [
      {
        type: "write-file",
        path: `${root}src/haptics/index.ts`,
        content: noHapticsSource,
        owner: this.id,
      },
    ];
  },
};

export function getHapticsAdapter(enabled: boolean): Adapter {
  return enabled ? hapticsAdapter : noHapticsAdapter;
}
