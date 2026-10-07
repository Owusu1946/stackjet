import type {
  AnalyticsAdapter,
  IconLibrary,
  MonitoringAdapter,
  StateAdapter,
} from "@expojet/schemas";
import { firstEnabled } from "./resolve.js";

/** Raw Commander options. Every field is a string, boolean, or list, exactly as parsed. */
export interface CreateFlags {
  config?: string;
  destination?: string;
  sdk?: string;
  structure?: string;
  packageManager?: string;
  navigation?: string;
  navigationType?: string;
  backend?: string;
  auth?: string;
  socials?: string[];
  socialProviders?: string[];
  style?: string;
  icons?: string;
  lucide?: boolean;
  hugeicons?: boolean;
  expoIcons?: boolean;
  state?: string;
  zustand?: boolean;
  mobx?: boolean;
  liquidGlass?: boolean;
  analytics?: string;
  posthog?: boolean;
  aptabase?: boolean;
  monitoring?: string;
  sentry?: boolean;
  database?: string;
  orm?: string;
  onboarding?: boolean;
  darkMode?: boolean;
  haptics?: boolean;
  eas?: boolean;
  install?: boolean;
  git?: boolean;
  allowCurrentDirectory?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  experimental?: boolean;
  preset?: string;
  savePreset?: string;
  typescript?: boolean;
  skills?: boolean;
  skillAgents?: string[];
  skillsScope?: string;
  skill?: string[];
}

/**
 * The boolean shorthands predate the valued flags they stand in for. They live here
 * so interactive and `--yes` runs cannot disagree about what `--lucide` means.
 */
export function shorthandChoices(flags: CreateFlags) {
  return {
    icons: firstEnabled<IconLibrary>([
      [flags.hugeicons, "hugeicons"],
      [flags.expoIcons, "expo"],
      [flags.lucide, "lucide"],
    ]),
    state: firstEnabled<StateAdapter>([
      [flags.zustand, "zustand"],
      [flags.mobx, "mobx"],
    ]),
    analytics: firstEnabled<AnalyticsAdapter>([
      [flags.posthog, "posthog"],
      [flags.aptabase, "aptabase"],
    ]),
    monitoring: flags.sentry ? ("sentry" as MonitoringAdapter) : undefined,
  };
}
