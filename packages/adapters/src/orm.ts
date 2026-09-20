import type { Operation } from "@expojet/core";
import type { DatabaseAdapter, OrmAdapter } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

// Drizzle Schemas
const drizzlePgSchema = `import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("profiles_clerk_user_id_idx").on(table.clerkUserId)],
);

export type Profile = typeof profiles.$inferSelect;
`;

const drizzleBetterAuthSuffix = `
export const user = pgTable("user", { id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(), emailVerified: boolean("email_verified").notNull().default(false), image: text("image"), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow() });
export const session = pgTable("session", { id: text("id").primaryKey(), expiresAt: timestamp("expires_at").notNull(), token: text("token").notNull().unique(), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(), ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }) }, (table) => [index("session_user_id_idx").on(table.userId)]);
export const account = pgTable("account", { id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at"), refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), scope: text("scope"), password: text("password"), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow() }, (table) => [index("account_user_id_idx").on(table.userId)]);
export const verification = pgTable("verification", { id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at").notNull(), createdAt: timestamp("created_at").defaultNow(), updatedAt: timestamp("updated_at").defaultNow() }, (table) => [index("verification_identifier_idx").on(table.identifier)]);
`;

const drizzleSqliteSchema = `import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    displayName: text("display_name"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("profiles_clerk_user_id_idx").on(table.clerkUserId)],
);

export type Profile = typeof profiles.$inferSelect;
`;

// Drizzle Clients
const drizzleNeonClient = `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  database ??= drizzle(neon(getEnv().DATABASE_URL), { schema });
  return database;
}
`;

const drizzlePostgresClient = `import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!database) {
    const pool = new pg.Pool({ connectionString: getEnv().DATABASE_URL });
    database = drizzle(pool, { schema });
  }
  return database;
}
`;

const drizzleSqliteClient = `import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!database) {
    const client = createClient({ url: getEnv().DATABASE_URL });
    database = drizzle(client, { schema });
  }
  return database;
}
`;

const drizzleStandaloneSqliteClient = `import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("expojet.db");
export const db = drizzle(expoDb, { schema });
`;

// Drizzle Configs
const drizzlePgConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!,
  },
});
`;

const drizzleSqliteConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:local.db",
  },
});
`;

// Drizzle Migrations
const drizzlePgMigration = `CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_user_id" text NOT NULL UNIQUE,
  "display_name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "profiles_clerk_user_id_idx" ON "profiles" ("clerk_user_id");
`;

const drizzleSqliteMigration = `CREATE TABLE IF NOT EXISTS \`profiles\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`clerk_user_id\` text NOT NULL UNIQUE,
  \`display_name\` text,
  \`created_at\` integer NOT NULL,
  \`updated_at\` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS \`profiles_clerk_user_id_idx\` ON \`profiles\` (\`clerk_user_id\`);
`;

const drizzleBetterAuthMigration = `CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY,"name" text NOT NULL,"email" text NOT NULL UNIQUE,"email_verified" boolean DEFAULT false NOT NULL,"image" text,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL);\nCREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY,"expires_at" timestamp NOT NULL,"token" text NOT NULL UNIQUE,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL,"ip_address" text,"user_agent" text,"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade);\nCREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");\nCREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY,"account_id" text NOT NULL,"provider_id" text NOT NULL,"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,"access_token" text,"refresh_token" text,"id_token" text,"access_token_expires_at" timestamp,"refresh_token_expires_at" timestamp,"scope" text,"password" text,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL);\nCREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");\nCREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY,"identifier" text NOT NULL,"value" text NOT NULL,"expires_at" timestamp NOT NULL,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now());\nCREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");\n`;

// Prisma Templates
function makePrismaSchema(database: DatabaseAdapter) {
  const provider = database === "sqlite" ? "sqlite" : "postgresql";
  const directUrlLine =
    database === "neon" || database === "postgres" || database === "supabase"
      ? '  directUrl = env("DIRECT_DATABASE_URL")\n'
      : "";

  return `datasource db {
  provider  = "${provider}"
  url       = env("DATABASE_URL")
${directUrlLine}}

generator client {
  provider = "prisma-client-js"
}

model Profile {
  id          String   @id @default(uuid())
  clerkUserId String   @unique @map("clerk_user_id")
  displayName String?  @map("display_name")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([clerkUserId])
  @@map("profiles")
}
`;
}

const prismaClient = `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function getDb() {
  return prisma;
}

export type Profile = {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};
`;

export const drizzleOrmAdapter: Adapter = {
  id: "orm:drizzle",
  version: "1.0.0",
  kind: "orm",
  displayName: "Drizzle ORM",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: ["orm:prisma"] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") {
      if (input.database !== "sqlite") return [];
      return [
        {
          type: "add-dependency",
          workspace: ".",
          name: "drizzle-orm",
          version: "^0.45.2",
          kind: "dependencies",
          owner: this.id,
        },
        {
          type: "add-dependency",
          workspace: ".",
          name: "drizzle-kit",
          version: "^0.31.4",
          kind: "devDependencies",
          owner: this.id,
        },
        {
          type: "write-file",
          path: "src/db/schema.ts",
          content: drizzleSqliteSchema,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "src/db/client.ts",
          content: drizzleStandaloneSqliteClient,
          owner: this.id,
        },
      ];
    }

    const isSqlite = input.database === "sqlite";
    const isPostgres = input.database === "postgres" || input.database === "supabase";
    const isNeon = input.database === "neon";
    const isBetterAuth = input.auth === "better-auth";

    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace: "apps/api",
        name: "drizzle-orm",
        version: "^0.45.2",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace: "apps/api",
        name: "drizzle-kit",
        version: "^0.31.4",
        kind: "devDependencies",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:generate",
        command: "drizzle-kit generate",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:migrate",
        command: "drizzle-kit migrate",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:studio",
        command: "drizzle-kit studio",
        owner: this.id,
      },
    ];

    if (isNeon) {
      operations.push({
        type: "add-dependency",
        workspace: "apps/api",
        name: "@neondatabase/serverless",
        version: "^1.0.1",
        kind: "dependencies",
        owner: this.id,
      });
    } else if (isPostgres) {
      operations.push(
        {
          type: "add-dependency",
          workspace: "apps/api",
          name: "pg",
          version: "^8.13.3",
          kind: "dependencies",
          owner: this.id,
        },
        {
          type: "add-dependency",
          workspace: "apps/api",
          name: "@types/pg",
          version: "^8.11.11",
          kind: "devDependencies",
          owner: this.id,
        },
      );
    } else if (isSqlite) {
      operations.push({
        type: "add-dependency",
        workspace: "apps/api",
        name: "@libsql/client",
        version: "^0.14.0",
        kind: "dependencies",
        owner: this.id,
      });
    }

    const clientSource = isSqlite
      ? drizzleSqliteClient
      : isPostgres
        ? drizzlePostgresClient
        : drizzleNeonClient;
    const configSource = isSqlite ? drizzleSqliteConfig : drizzlePgConfig;
    const migrationSource = isSqlite ? drizzleSqliteMigration : drizzlePgMigration;
    let schemaSource = isSqlite ? drizzleSqliteSchema : drizzlePgSchema;

    if (isBetterAuth && !isSqlite) {
      schemaSource =
        schemaSource.replace("{ index,", "{ boolean, index,") + drizzleBetterAuthSuffix;
    }

    operations.push(
      {
        type: "write-file",
        path: "apps/api/src/db/schema.ts",
        content: schemaSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/db/client.ts",
        content: clientSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/drizzle.config.ts",
        content: configSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/drizzle/0000_profiles.sql",
        content: migrationSource,
        owner: this.id,
      },
    );

    if (isBetterAuth && !isSqlite) {
      operations.push({
        type: "write-file",
        path: "apps/api/drizzle/0001_better_auth.sql",
        content: drizzleBetterAuthMigration,
        owner: this.id,
      });
    }

    return operations;
  },
};

export const prismaOrmAdapter: Adapter = {
  id: "orm:prisma",
  version: "1.0.0",
  kind: "orm",
  displayName: "Prisma ORM",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: ["orm:drizzle"] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];

    return [
      {
        type: "add-dependency",
        workspace: "apps/api",
        name: "@prisma/client",
        version: "^6.4.1",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace: "apps/api",
        name: "prisma",
        version: "^6.4.1",
        kind: "devDependencies",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:generate",
        command: "prisma generate",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:migrate",
        command: "prisma migrate dev",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: "apps/api",
        name: "db:studio",
        command: "prisma studio",
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/prisma/schema.prisma",
        content: makePrismaSchema(input.database),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/db/client.ts",
        content: prismaClient,
        owner: this.id,
      },
    ];
  },
};

export const noneOrmAdapter: Adapter = {
  id: "orm:none",
  version: "1.0.0",
  kind: "orm",
  displayName: "No ORM",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan() {
    return [];
  },
};

export function ormAdapter(id: OrmAdapter): Adapter {
  switch (id) {
    case "drizzle":
      return drizzleOrmAdapter;
    case "prisma":
      return prismaOrmAdapter;
    case "none":
      return noneOrmAdapter;
  }
}
