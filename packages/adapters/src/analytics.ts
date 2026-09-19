import type { Operation } from "@expojet/core";
import type { AnalyticsAdapter, CreateInput } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const posthogClientSource = `import PostHog from "posthog-react-native";

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const posthog = apiKey
  ? new PostHog(apiKey, {
      host,
      disabled: false,
    })
  : null;
`;

const posthogProviderSource = `import React, { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { posthog } from "./posthog";

export interface AnalyticsContextValue {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => {},
  identify: () => {},
  reset: () => {},
});

function PostHogAnalyticsInner({ children }: PropsWithChildren) {
  const client = usePostHog();
  const value = useMemo<AnalyticsContextValue>(
    () => ({
      track: (event, properties) => {
        client?.capture(event, properties);
      },
      identify: (userId, traits) => {
        client?.identify(userId, traits);
      },
      reset: () => {
        client?.reset();
      },
    }),
    [client],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!apiKey) {
    return <PostHogAnalyticsInner>{children}</PostHogAnalyticsInner>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        host,
        enableSessionReplay: false,
      }}
      autocapture={true}
    >
      <PostHogAnalyticsInner>{children}</PostHogAnalyticsInner>
    </PostHogProvider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  posthog?.capture(name, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  posthog?.identify(userId, traits);
}

export function resetAnalytics(): void {
  posthog?.reset();
}
`;

const aptabaseClientSource = `import Aptabase, { trackEvent as aptabaseTrack } from "@aptabase/react-native";

let initialized = false;

export function initAptabaseClient(): void {
  if (initialized) return;
  const appKey = process.env.EXPO_PUBLIC_APTABASE_KEY;
  if (!appKey) return;
  const host = process.env.EXPO_PUBLIC_APTABASE_HOST;
  Aptabase.init(appKey, host ? { host } : undefined);
  initialized = true;
}

export { aptabaseTrack };
`;

const aptabaseProviderSource = `import React, { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { aptabaseTrack, initAptabaseClient } from "./aptabase";

export interface AnalyticsContextValue {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => {},
  identify: () => {},
  reset: () => {},
});

export function AnalyticsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    initAptabaseClient();
  }, []);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      track: (event, properties) => {
        aptabaseTrack(event, properties as Record<string, string | number | boolean>);
      },
      identify: () => {
        // Aptabase is privacy-first without user tracking identifiers
      },
      reset: () => {},
    }),
    [],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  aptabaseTrack(name, properties as Record<string, string | number | boolean>);
}

export function identifyUser(_userId: string, _traits?: Record<string, unknown>): void {
  // Aptabase does not track identifiable user profiles by privacy-first design
}

export function resetAnalytics(): void {
  // No-op for privacy-first Aptabase
}
`;

const analyticsIndexSource = `export {
  AnalyticsProvider,
  useAnalytics,
  trackEvent,
  identifyUser,
  resetAnalytics,
  type AnalyticsContextValue,
} from "./provider";
`;

export const posthogAnalyticsAdapter: Adapter = {
  id: "analytics:posthog",
  version: "1.0.0",
  kind: "analytics",
  displayName: "PostHog Mobile Analytics",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "posthog-react-native",
        version: "^4.0.1",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-file-system",
        version: "~19.0.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "expo-application",
        version: "~7.0.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_POSTHOG_KEY",
          classification: "public",
          description: "PostHog project API key",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_POSTHOG_HOST",
          classification: "public",
          description: "PostHog instance host (defaults to https://us.i.posthog.com)",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/posthog.ts`,
        content: posthogClientSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/provider.tsx`,
        content: posthogProviderSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/index.ts`,
        content: analyticsIndexSource,
        owner: this.id,
      },
    ];
  },
};

export const aptabaseAnalyticsAdapter: Adapter = {
  id: "analytics:aptabase",
  version: "1.0.0",
  kind: "analytics",
  displayName: "Aptabase Privacy Analytics",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@aptabase/react-native",
        version: "^0.2.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_APTABASE_KEY",
          classification: "public",
          description: "Aptabase app key",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_APTABASE_HOST",
          classification: "public",
          description: "Aptabase self-hosted host (optional)",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/aptabase.ts`,
        content: aptabaseClientSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/provider.tsx`,
        content: aptabaseProviderSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/analytics/index.ts`,
        content: analyticsIndexSource,
        owner: this.id,
      },
    ];
  },
};

export const noneAnalyticsAdapter: Adapter = {
  id: "analytics:none",
  version: "1.0.0",
  kind: "analytics",
  displayName: "None",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(_input: CreateInput): Operation[] {
    return [];
  },
};

export function analyticsAdapter(id: AnalyticsAdapter): Adapter {
  switch (id) {
    case "posthog":
      return posthogAnalyticsAdapter;
    case "aptabase":
      return aptabaseAnalyticsAdapter;
    case "none":
      return noneAnalyticsAdapter;
  }
}
