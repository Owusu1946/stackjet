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
import {
  Bell,
  Check,
  ChevronRight,
  Compass,
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
  | "info";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
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
};

export function Icon({ name, size = 24, color = "#000", strokeWidth = 2 }: IconProps) {
  const Component = ICON_MAP[name] ?? Home;
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}

export { Bell, Check, ChevronRight, Compass, Home, Info, Menu, Settings, User };
`;

const hugeiconsIconSource = `import React from "react";
import {
  ArrowRight01Icon,
  CompassIcon,
  Home01Icon,
  type IconSvgProps,
  InformationCircleIcon,
  Menu01Icon,
  Notification03Icon,
  Settings02Icon,
  Tick01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

export type IconName =
  | "home"
  | "user"
  | "settings"
  | "bell"
  | "menu"
  | "chevron-right"
  | "check"
  | "compass"
  | "info";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const ICON_MAP: Record<IconName, React.FC<IconSvgProps>> = {
  home: Home01Icon,
  user: UserIcon,
  settings: Settings02Icon,
  bell: Notification03Icon,
  menu: Menu01Icon,
  "chevron-right": ArrowRight01Icon,
  check: Tick01Icon,
  compass: CompassIcon,
  info: InformationCircleIcon,
};

export function Icon({ name, size = 24, color = "#000", strokeWidth = 1.5 }: IconProps) {
  const icon = ICON_MAP[name] ?? Home01Icon;
  return <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />;
}

export { HugeiconsIcon };
`;

const expoIconSource = `import React from "react";
import { Ionicons } from "@expo/vector-icons";

export type IconName =
  | "home"
  | "user"
  | "settings"
  | "bell"
  | "menu"
  | "chevron-right"
  | "check"
  | "compass"
  | "info";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
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
        version: "^14.1.0",
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
