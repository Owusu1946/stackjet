import type { Operation } from "@expojet/core";
import type { CreateInput, MonitoringAdapter } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const sentryInitSource = `import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}
`;

const sentryIndexSource = `export {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  withScope,
  wrap,
} from "@sentry/react-native";
`;

const noneInitSource = `// Monitoring disabled — this file is a no-op placeholder so imports resolve.
`;

const noneIndexSource = `export function captureException(_error: unknown): void {}
export function captureMessage(_message: string): void {}
export function setUser(_user: { id: string } | null): void {}
export function addBreadcrumb(_breadcrumb: Record<string, unknown>): void {}
export function withScope(_callback: (scope: unknown) => void): void {}
export function wrap<T>(component: T): T {
  return component;
}
`;

export const sentryMonitoringAdapter: Adapter = {
  id: "monitoring:sentry",
  version: "1.0.0",
  kind: "monitoring",
  displayName: "Sentry Error Monitoring",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "@sentry/react-native",
        version: "^6.14.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_SENTRY_DSN",
          classification: "public",
          description: "Sentry DSN for mobile error reporting",
        },
        owner: this.id,
      },
      // EAS Build secrets: these live in the mobile workspace because `eas build`
      // runs there. They appear in .env.example as documentation only — actual
      // values go in EAS Secrets or CI env. The names are added to
      // MOBILE_SECRET_PATTERN in checks.ts so doctor fails if they leak into
      // bundled .ts/.tsx/.js/.jsx source files (treeContains skips .env files).
      {
        type: "add-env",
        workspace,
        variable: {
          name: "SENTRY_AUTH_TOKEN",
          classification: "server-secret",
          description: "Sentry auth token for EAS source map uploads (CI secret, not bundled)",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "SENTRY_ORG",
          classification: "server-secret",
          description: "Sentry organization slug for source map uploads",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "SENTRY_PROJECT",
          classification: "server-secret",
          description: "Sentry project slug for source map uploads",
        },
        owner: this.id,
      },
      {
        type: "compose-app-config",
        contribution: {
          workspace,
          plugin: "@sentry/react-native/expo",
        },
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/monitoring/init.ts`,
        content: sentryInitSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/monitoring/index.ts`,
        content: sentryIndexSource,
        owner: this.id,
      },
    ];
  },
};

export const noneMonitoringAdapter: Adapter = {
  id: "monitoring:none",
  version: "1.0.0",
  kind: "monitoring",
  displayName: "None",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { root } = location(input.structure);
    return [
      {
        type: "write-file",
        path: `${root}src/monitoring/init.ts`,
        content: noneInitSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/monitoring/index.ts`,
        content: noneIndexSource,
        owner: this.id,
      },
    ];
  },
};

export function monitoringAdapter(id: MonitoringAdapter): Adapter {
  switch (id) {
    case "sentry":
      return sentryMonitoringAdapter;
    case "none":
      return noneMonitoringAdapter;
  }
}
