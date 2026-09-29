import type { Operation } from "@expojet/core";
import type { Adapter } from "../contract.js";
import { noOptions } from "../shared/adapter-kit.js";

// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

const convexSchema = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
});
`;

const convexUsers = `import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

export const getMe = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const ensureMe = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? identity.name ?? existing.name,
        email: args.email ?? identity.email ?? existing.email,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name ?? identity.name,
      email: args.email ?? identity.email,
    });
  },
});

export const health = query({
  args: {},
  returns: v.object({ ok: v.boolean(), service: v.string() }),
  handler: async () => {
    return { ok: true, service: "convex-backend" };
  },
});
`;

const convexClerkAuthConfig = `import type { AuthConfig } from "convex/server";

const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!issuerDomain) throw new Error("CLERK_JWT_ISSUER_DOMAIN is required");

export default {
  providers: [{ domain: issuerDomain, applicationID: "convex" }],
} satisfies AuthConfig;
`;

const convexTsConfig = `{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["./**/*.ts"]
}
`;

const convexProvider = `import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { env } from "../env";

const convexUrl =
  (env as Record<string, string | undefined>).EXPO_PUBLIC_CONVEX_URL ||
  process.env.EXPO_PUBLIC_CONVEX_URL;

const convex = convexUrl
  ? new ConvexReactClient(convexUrl, {
      unsavedChangesWarning: false,
    })
  : null;

export function DataProvider({ children }: PropsWithChildren) {
  if (!convex) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Convex Setup Required</Text>
        <Text style={styles.body}>
          No Convex deployment URL was found in your environment.
        </Text>
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Next steps:</Text>
          <Text style={styles.step}>1. Run: npx convex dev</Text>
          <Text style={styles.step}>2. Set EXPO_PUBLIC_CONVEX_URL in .env</Text>
          <Text style={styles.step}>3. Reload this app</Text>
        </View>
      </View>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#09090b",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f43f5e",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    gap: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 4,
  },
  step: {
    fontSize: 13,
    color: "#d4d4d8",
    fontFamily: "monospace",
  },
});
`;

const convexClerkProvider = `import { useAuth, useUser } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useEffect, type PropsWithChildren } from "react";
import { useMutation } from "convex/react";
import { StyleSheet, Text, View } from "react-native";
import { env } from "../env";
import { api } from "../../convex/_generated/api";

const client = env.EXPO_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, { unsavedChangesWarning: false })
  : null;

function ConvexUserSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const ensureMe = useMutation(api.users.ensureMe);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    void ensureMe({
      name: user.fullName ?? undefined,
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
    }).catch((error) => {
      console.error("Unable to sync Clerk user to Convex", error);
    });
  }, [ensureMe, isLoaded, isSignedIn, user]);

  return null;
}

export function DataProvider({ children }: PropsWithChildren) {
  if (!client) return <View style={styles.container}><Text style={styles.title}>Convex setup required</Text><Text>Set EXPO_PUBLIC_CONVEX_URL and reload.</Text></View>;
  return <ConvexProviderWithClerk client={client} useAuth={useAuth}><ConvexUserSync />{children}</ConvexProviderWithClerk>;
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", padding: 24, gap: 8 }, title: { fontSize: 22, fontWeight: "700" } });
`;

// ---------------------------------------------------------------------------
// Adapter Implementations
// ---------------------------------------------------------------------------

export const convexBackendAdapter: Adapter = {
  id: "backend:convex",
  version: "1.0.0",
  kind: "api",
  displayName: "Convex Reactive Backend",
  capabilities: () => ({ sdk: [57, 58], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const isStandalone = input.structure === "standalone";
    const convexDir = isStandalone ? "convex" : "apps/api/convex";
    const mobileRoot = isStandalone ? "" : "apps/mobile/";
    const workspace = isStandalone ? "." : "apps/mobile";

    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "convex",
        version: "^1.19.4",
        kind: "dependencies",
        owner: this.id,
      },
      ...(isStandalone
        ? [
            {
              type: "add-dependency" as const,
              workspace: ".",
              name: "@types/node",
              version: "^24.3.1",
              kind: "devDependencies" as const,
              owner: this.id,
            },
          ]
        : []),
      {
        type: "write-file",
        path: `${convexDir}/schema.ts`,
        content: convexSchema,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${convexDir}/users.ts`,
        content: convexUsers,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${convexDir}/tsconfig.json`,
        content: convexTsConfig,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${mobileRoot}src/data/provider.tsx`,
        content: (input.auth === "clerk" ? convexClerkProvider : convexProvider).replace(
          "../../convex/_generated/api",
          isStandalone ? "../../convex/_generated/api" : "../../../api/convex/_generated/api",
        ),
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_CONVEX_URL",
          classification: "public",
          description: "Convex deployment URL",
        },
        owner: this.id,
      },
      ...(isStandalone
        ? [
            {
              type: "add-script" as const,
              workspace: ".",
              name: "convex:dev",
              command: "convex dev",
              owner: this.id,
            },
          ]
        : []),
    ];

    if (input.auth === "clerk") {
      operations.push({
        type: "write-file",
        path: `${convexDir}/auth.config.ts`,
        content: convexClerkAuthConfig,
        owner: this.id,
      });
    }

    if (!isStandalone) {
      operations.push(
        {
          type: "write-file",
          path: "apps/api/package.json",
          content: `${JSON.stringify(
            {
              name: "@expojet/api",
              private: true,
              type: "module",
              scripts: {
                dev: "convex dev",
                "convex:dev": "convex dev",
                typecheck: "tsc --noEmit",
              },
              dependencies: {
                convex: "^1.19.4",
              },
              devDependencies: {
                "@types/node": "^24.3.1",
                typescript: "~6.0.3",
              },
            },
            null,
            2,
          )}\n`,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "packages/api-contract/package.json",
          content:
            '{"name":"@expojet/api-contract","private":true,"type":"module","types":"./src/index.ts","scripts":{"typecheck":"tsc --noEmit"}}\n',
          owner: this.id,
        },
        {
          type: "write-file",
          path: "packages/api-contract/src/index.ts",
          content: 'export const backend = "convex";\n',
          owner: this.id,
        },
      );
    }

    return operations;
  },
};
