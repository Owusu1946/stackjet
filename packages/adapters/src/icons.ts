import type { Operation } from "@expojet/core";
import type { CreateInput, IconLibrary } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const lucideIconSource = `import React from "react";
import type { ColorValue } from "react-native";
import {
  Bell,
  Check,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  Home,
  Info,
  type LucideIcon,
  Menu,
  Settings,
  User,
} from "lucide-react-native";

export type IconName =
  | "home"
  | "user"
  | "settings"
  | "bell"
  | "menu"
  | "chevron-right"
  | "check"
  | "compass"
  | "info"
  | "eye"
  | "eye-off";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}

const ICON_MAP: Record<IconName, LucideIcon> = {
  home: Home,
  user: User,
  settings: Settings,
  bell: Bell,
  menu: Menu,
  "chevron-right": ChevronRight,
  check: Check,
  compass: Compass,
  info: Info,
  eye: Eye,
  "eye-off": EyeOff,
};

export function Icon({ name, size = 24, color = "#000", strokeWidth = 2 }: IconProps) {
  const Component = ICON_MAP[name] ?? Home;
  return <Component size={size} color={color as string} strokeWidth={strokeWidth} />;
}

export { Bell, Check, ChevronRight, Compass, Eye, EyeOff, Home, Info, Menu, Settings, User };
`;

const hugeiconsIconSource = `import React from "react";
import type { ColorValue } from "react-native";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon";
import Menu01Icon from "@hugeicons/core-free-icons/Menu01Icon";
import Notification03Icon from "@hugeicons/core-free-icons/Notification03Icon";
import Settings02Icon from "@hugeicons/core-free-icons/Settings02Icon";
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import EyeIcon from "@hugeicons/core-free-icons/EyeIcon";
import EyeClosedIcon from "@hugeicons/core-free-icons/EyeClosedIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";
type IconSvgObject = readonly (readonly [string, { readonly [key: string]: string | number }])[];

export type IconName =
  | "home"
  | "user"
  | "settings"
  | "bell"
  | "menu"
  | "chevron-right"
  | "check"
  | "compass"
  | "info"
  | "eye"
  | "eye-off";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}

const ICON_MAP: Record<IconName, IconSvgObject> = {
  home: Home01Icon,
  user: UserIcon,
  settings: Settings02Icon,
  bell: Notification03Icon,
  menu: Menu01Icon,
  "chevron-right": ArrowRight01Icon,
  check: Tick01Icon,
  compass: CompassIcon,
  info: InformationCircleIcon,
  eye: EyeIcon,
  "eye-off": EyeClosedIcon,
};

export function Icon({ name, size = 24, color = "#000", strokeWidth = 1.5 }: IconProps) {
  const icon = ICON_MAP[name] ?? Home01Icon;
  return <HugeiconsIcon icon={icon} size={size} color={color as string} strokeWidth={strokeWidth} />;
}

export { HugeiconsIcon };
`;

const expoIconSource = `import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";

export type IconName =
  | "home"
  | "user"
  | "settings"
  | "bell"
  | "menu"
  | "chevron-right"
  | "check"
  | "compass"
  | "info"
  | "eye"
  | "eye-off";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

const ICON_MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  home: "home-outline",
  user: "person-outline",
  settings: "settings-outline",
  bell: "notifications-outline",
  menu: "menu-outline",
  "chevron-right": "chevron-forward-outline",
  check: "checkmark-outline",
  compass: "compass-outline",
  info: "information-circle-outline",
  eye: "eye-outline",
  "eye-off": "eye-off-outline",
};

export function Icon({ name, size = 24, color = "#000" }: IconProps) {
  const iconName = ICON_MAP[name] ?? "home-outline";
  return <Ionicons name={iconName} size={size} color={color} />;
}

export { Ionicons };
`;

export const lucideIconAdapter: Adapter = {
  id: "icons:lucide",
  version: "1.0.0",
  kind: "icons",
  displayName: "Lucide React Native",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "lucide-react-native",
        version: "^1.16.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "react-native-svg",
        version: "^15.11.2",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/ui/icon.tsx`,
        content: lucideIconSource,
        owner: this.id,
      },
    ];
  },
};

export const hugeiconsIconAdapter: Adapter = {
  id: "icons:hugeicons",
  version: "1.0.0",
  kind: "icons",
  displayName: "Hugeicons React Native",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@hugeicons/react-native",
        version: "^1.0.16",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "@hugeicons/core-free-icons",
        version: "^4.3.4",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "react-native-svg",
        version: "^15.11.2",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/ui/icon.tsx`,
        content: hugeiconsIconSource,
        owner: this.id,
      },
    ];
  },
};

export const expoIconAdapter: Adapter = {
  id: "icons:expo",
  version: "1.0.0",
  kind: "icons",
  displayName: "Expo Vector Icons",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@expo/vector-icons",
        version: "^15.0.2",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-font",
        version: "~57.0.4",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-asset",
        version: "~57.0.18",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/ui/icon.tsx`,
        content: expoIconSource,
        owner: this.id,
      },
    ];
  },
};

export function iconAdapter(id: IconLibrary): Adapter {
  switch (id) {
    case "lucide":
      return lucideIconAdapter;
    case "hugeicons":
      return hugeiconsIconAdapter;
    case "expo":
      return expoIconAdapter;
  }
}

export const iconsAdapter = iconAdapter;
