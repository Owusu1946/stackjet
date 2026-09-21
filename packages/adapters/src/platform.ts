import { productName } from "@expojet/brand";
import type { Operation } from "@expojet/core";
import type { BackendAdapter, PackageManager } from "@expojet/schemas";
import { z } from "zod";
import { backendAdapter } from "./backend.js";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();
const brandTitle = productName.toUpperCase();

function makeRootPackage(packageManager: PackageManager, hasDb = true) {
  const dbGenerate =
    packageManager === "npm"
      ? "npm run db:generate --workspace=@expojet/api"
      : packageManager === "yarn"
        ? "yarn workspace @expojet/api db:generate"
        : `${packageManager} --filter @expojet/api db:generate`;
  const dbMigrate =
    packageManager === "npm"
      ? "npm run db:migrate --workspace=@expojet/api"
      : packageManager === "yarn"
        ? "yarn workspace @expojet/api db:migrate"
        : `${packageManager} --filter @expojet/api db:migrate`;

  const packageManagerVersion =
    packageManager === "pnpm"
      ? "pnpm@10.33.0"
      : packageManager === "npm"
        ? "npm@10.9.2"
        : packageManager === "yarn"
          ? "yarn@1.22.22"
          : "bun@1.2.0";

  const scripts: Record<string, string> = {
    dev: "turbo dev",
    build: "turbo build",
    typecheck: "turbo typecheck",
    test: "turbo test",
  };
  if (hasDb) {
    scripts["db:generate"] = dbGenerate;
    scripts["db:migrate"] = dbMigrate;
  }

  return `${JSON.stringify(
    {
      name: "expojet-workspace",
      private: true,
      packageManager: packageManagerVersion,
      workspaces: ["apps/*", "packages/*"],
      scripts,
      devDependencies: { turbo: "^2.5.6", typescript: "~6.0.3" },
    },
    null,
    2,
  )}\n`;
}

function makeWebPackage(packageManager: PackageManager, backend: string = "hono") {
  const contractVersion =
    packageManager === "npm" || packageManager === "yarn" ? "*" : "workspace:*";
  const dependencies: Record<string, string> = {
    "@expojet/api-contract": contractVersion,
    "@tanstack/react-query": "^5.87.1",
    next: "^15.1.7",
    react: "19.2.3",
    "react-dom": "19.2.3",
  };
  if (backend === "hono") {
    dependencies.hono = "^4.9.8";
  }

  return `${JSON.stringify(
    {
      name: "@expojet/web",
      private: true,
      type: "module",
      scripts: {
        dev: "next dev --turbopack",
        build: "next build",
        start: "next start",
        typecheck: "tsc --noEmit",
        test: "vitest run",
      },
      dependencies,
      devDependencies: {
        "@types/node": "^24.3.1",
        "@types/react": "19.2.18",
        "@types/react-dom": "19.2.18",
        typescript: "~6.0.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

const webTsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

const webNextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@expojet/api-contract"],
};

export default nextConfig;
`;

const webNextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;

const webProviders = `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

export function Providers({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;

const webLayout = `import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers.js";

export const metadata: Metadata = {
  title: "${productName} Web",
  description: "Next.js web application powered by ${productName} monorepo",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

const webPage = `export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "36rem",
          width: "100%",
          backgroundColor: "#131b2e",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          border: "1px solid #1e293b",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <span
          style={{
            color: "#38bdf8",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          ${brandTitle} MONOREPO
        </span>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            margin: "0.75rem 0 0.5rem 0",
            letterSpacing: "-0.025em",
          }}
        >
          Expo + Web + API
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
          Your full-stack web and mobile workspace is active. The Next.js client and Expo mobile
          app share typed API contracts with the backend.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            paddingTop: "1rem",
            borderTop: "1px solid #1e293b",
          }}
        >
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Next.js 15 App Router
          </span>
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Typed API Client
          </span>
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Expo SDK 57
          </span>
        </div>
      </div>
    </main>
  );
}
`;

const webPageTest = `import { describe, expect, it } from "vitest";
import HomePage from "./page.js";

describe("Web HomePage", () => {
  it("renders the component", () => {
    const element = HomePage();
    expect(element).toBeDefined();
  });
});
`;

const webApiClient = `import type { AppType } from "@expojet/api-contract";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function createWebApiClient(getToken?: () => Promise<string | null>) {
  return hc<AppType>(apiUrl, {
    fetch: async (input: string | Request | URL, init?: RequestInit) => {
      const token = getToken ? await getToken() : null;
      const headers = new Headers(init?.headers);
      if (token) headers.set("authorization", "Bearer " + token);
      return fetch(input instanceof URL ? input.toString() : input, { ...init, headers });
    },
  });
}
`;

const webApiClientFetch = `import type { HealthResponse, MeResponse } from "@expojet/api-contract";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function createWebApiClient(getToken?: () => Promise<string | null>) {
  return {
    v1: {
      me: {
        $get: async () => {
          const token = getToken ? await getToken() : null;
          const headers = new Headers();
          if (token) headers.set("authorization", "Bearer " + token);
          const res = await fetch(apiUrl + "/v1/me", { headers });
          return {
            ok: res.ok,
            status: res.status,
            json: () => res.json() as Promise<MeResponse>,
          };
        },
      },
    },
    health: {
      $get: async () => {
        const res = await fetch(apiUrl + "/health");
        return {
          ok: res.ok,
          status: res.status,
          json: () => res.json() as Promise<HealthResponse>,
        };
      },
    },
  };
}
`;

const betterAuthSource = `import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema.js";
import { getEnv } from "../env.js";

const env = getEnv();
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  trustedOrigins: env.ALLOWED_ORIGINS.split(","),
  plugins: [expo()],
});
`;

const dataProvider = `import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

export function DataProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;

const noDataProvider = `import type { PropsWithChildren } from "react";
export function DataProvider({ children }: PropsWithChildren) { return children; }
`;

const useMe = `import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "./api";

export function useMe() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["me"],
    enabled: Boolean(isSignedIn),
    queryFn: async () => {
      const response = await createApiClient(getToken).v1.me.$get();
      if (!response.ok) throw new Error("Unable to load profile");
      return response.json();
    },
  });
}
`;

const useMeSupabase = `import { useQuery } from "@tanstack/react-query";
import { useSession } from "../session/provider";
import { supabase } from "../supabase/client";
import { createApiClient } from "./api";

export function useMe() {
  const { session } = useSession();
  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return useQuery({
    queryKey: ["me", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const response = await createApiClient(getToken).v1.me.$get();
      if (!response.ok) throw new Error("Unable to load profile");
      return response.json();
    },
  });
}
`;

const useMeFirebase = `import { useQuery } from "@tanstack/react-query";
import { auth } from "../firebase/client";
import { useSession } from "../session/provider";
import { createApiClient } from "./api";

export function useMe() {
  const { user } = useSession();
  const getToken = async () => {
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  };

  return useQuery({
    queryKey: ["me", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await createApiClient(getToken).v1.me.$get();
      if (!response.ok) throw new Error("Unable to load profile");
      return response.json();
    },
  });
}
`;

const useMeJwt = `import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "../auth/jwt-client";
import { useSession } from "../session/provider";
import { createApiClient } from "./api";

export function useMe() {
  const { status } = useSession();
  const getToken = async () => {
    return await getAccessToken();
  };

  return useQuery({
    queryKey: ["me"],
    enabled: status === "authenticated",
    queryFn: async () => {
      const response = await createApiClient(getToken).v1.me.$get();
      if (!response.ok) throw new Error("Unable to load profile");
      return response.json();
    },
  });
}
`;

const readme = `# ${productName} app

Expo SDK 57 mobile app with modern authentication and a typed API.

## Configure environment variables

1. Copy apps/mobile/.env.example to apps/mobile/.env and set only public mobile values.
2. Copy apps/api/.env.example to apps/api/.env and configure server-only database and authentication secrets.
3. Run pnpm install, pnpm db:migrate (if database is enabled), then pnpm dev.

Variables prefixed with EXPO_PUBLIC_ are embedded in the mobile bundle. They must never contain database URLs, Clerk secret keys, Convex admin keys, or other server secrets. Public provider keys such as Clerk publishable keys, Convex deployment URLs, and PostHog project keys are appropriate for the mobile file.

For Convex, run pnpm --filter @expojet/api dev (or npx convex dev from the Convex workspace) before launching the mobile app, and set EXPO_PUBLIC_CONVEX_URL to the deployment's .convex.cloud URL. For Clerk + Convex, configure CLERK_JWT_ISSUER_DOMAIN in the Convex deployment environment. Restart Metro with its cache cleared after changing mobile .env values.

For Supabase email OTP, enable Email under Authentication → Sign In / Providers. The generated mobile app calls signInWithOtp and verifyOtp with an eight-digit code, so it does not require emailRedirectTo or localhost redirects. Supabase's default email may display a sign-in link; to customize it for codes, configure custom SMTP, open Authentication → Emails → Magic link or OTP, and include {{ .Token }} in the email body.

See docs/deployment.md for production deployment and secret handling.
`;

const deployment = `# Deployment

Deploy apps/api to a Node 22 host. Set server environment variables there. Run pnpm db:migrate as a release job, not from the mobile app. Point EXPO_PUBLIC_API_URL at the HTTPS API before EAS builds. Configure the generated app scheme as an allowed auth redirect.
`;

export const monorepoPlatformAdapter: Adapter = {
  id: "platform:hono",
  version: "1.0.0",
  kind: "api",
  displayName: "Hono Platform",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const backend: BackendAdapter =
      input.structure === "standalone"
        ? (input.backend ?? "none")
        : !input.backend || input.backend === "none"
          ? "hono"
          : input.backend;

    if (input.structure === "standalone") {
      if (backend === "convex") {
        return backendAdapter(backend).plan(input, {});
      }
      return [
        {
          type: "write-file",
          path: "src/data/provider.tsx",
          content: noDataProvider,
          owner: this.id,
        },
      ];
    }

    const better = input.auth === "better-auth";
    const supabase = input.auth === "supabase";
    const firebase = input.auth === "firebase";
    const hasDb = input.database !== "none" && input.orm !== "none";

    const operations: Operation[] = [
      {
        type: "write-file",
        path: "package.json",
        content: makeRootPackage(input.packageManager, hasDb),
        owner: this.id,
      },
      ...(input.packageManager === "pnpm"
        ? [
            {
              type: "write-file" as const,
              path: "pnpm-workspace.yaml",
              content: 'packages:\n  - "apps/*"\n  - "packages/*"\n',
              owner: this.id,
            },
          ]
        : []),
      {
        type: "write-file",
        path: ".gitignore",
        content: "node_modules/\n.turbo/\n.env\n.env.*\n!.env.example\ndist*/\n.expo/\n",
        owner: this.id,
      },
      {
        type: "write-file",
        path: "turbo.json",
        content:
          '{"$schema":"https://turbo.build/schema.json","tasks":{"build":{"dependsOn":["^build"],"outputs":[".next/**","!.next/cache/**","dist/**"]},"dev":{"cache":false,"persistent":true},"typecheck":{"dependsOn":["^typecheck"]},"test":{"dependsOn":["^test"]}}}\n',
        owner: this.id,
      },
      { type: "write-file", path: "README.md", content: readme, owner: this.id },
      {
        type: "write-file",
        path: "AGENTS.md",
        content:
          "# Agent notes\n\nKeep server secrets in apps/api only. Preserve the typed contract and run pnpm typecheck && pnpm test after changes.\n",
        owner: this.id,
      },
      { type: "write-file", path: "docs/deployment.md", content: deployment, owner: this.id },
    ];

    if (backend !== "convex" && backend !== "none") {
      operations.push(
        {
          type: "write-file",
          path: "apps/mobile/src/data/provider.tsx",
          content: dataProvider,
          owner: this.id,
        },
        {
          type: "add-dependency",
          workspace: "apps/mobile",
          name: "@tanstack/react-query",
          version: "^5.87.1",
          kind: "dependencies",
          owner: this.id,
        },
        {
          type: "add-env",
          workspace: "apps/api",
          variable: { name: "ALLOWED_ORIGINS", classification: "server-secret" },
          owner: this.id,
        },
      );

      if (better) {
        operations.push(
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "BETTER_AUTH_SECRET", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "BETTER_AUTH_URL", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "write-file",
            path: "apps/api/src/auth/index.ts",
            content: betterAuthSource,
            owner: this.id,
          },
        );
      } else if (input.auth === "clerk") {
        operations.push(
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "CLERK_SECRET_KEY", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "write-file",
            path: "apps/mobile/src/data/use-me.ts",
            content: useMe,
            owner: this.id,
          },
        );
      } else if (supabase) {
        operations.push(
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "SUPABASE_URL", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "SUPABASE_SERVICE_ROLE_KEY", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "write-file",
            path: "apps/mobile/src/data/use-me.ts",
            content: useMeSupabase,
            owner: this.id,
          },
        );
      } else if (firebase) {
        operations.push(
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "FIREBASE_PROJECT_ID", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "write-file",
            path: "apps/mobile/src/data/use-me.ts",
            content: useMeFirebase,
            owner: this.id,
          },
        );
      } else if (input.auth === "jwt") {
        operations.push(
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "JWT_SECRET", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "add-env",
            workspace: "apps/api",
            variable: { name: "JWT_REFRESH_SECRET", classification: "server-secret" },
            owner: this.id,
          },
          {
            type: "write-file",
            path: "apps/mobile/src/data/use-me.ts",
            content: useMeJwt,
            owner: this.id,
          },
        );
      }
    }

    // Backend-specific files from adapter
    operations.push(...backendAdapter(backend).plan(input, {}));

    if (input.structure === "monorepo-web") {
      operations.push(
        {
          type: "write-file",
          path: "apps/web/package.json",
          content: makeWebPackage(input.packageManager, backend),
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/tsconfig.json",
          content: webTsConfig,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/next.config.ts",
          content: webNextConfig,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/next-env.d.ts",
          content: webNextEnv,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/src/api.ts",
          content: backend === "hono" ? webApiClient : webApiClientFetch,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/providers.tsx",
          content: webProviders,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/layout.tsx",
          content: webLayout,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/page.tsx",
          content: webPage,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/page.test.tsx",
          content: webPageTest,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/.env.example",
          content: "NEXT_PUBLIC_API_URL=http://localhost:3000\n",
          owner: this.id,
        },
        {
          type: "add-env",
          workspace: "apps/web",
          variable: {
            name: "NEXT_PUBLIC_API_URL",
            classification: "public",
            description: "API base URL",
          },
          owner: this.id,
        },
      );
    }
    return operations;
  },
};
