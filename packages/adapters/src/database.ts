import type { Operation } from "@expojet/core";
import type { DatabaseAdapter } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

const dockerComposePostgres = `services:
  postgres:
    image: postgres:16-alpine
    container_name: expojet-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: expojet
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d expojet"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

export const neonDatabaseAdapter: Adapter = {
  id: "database:neon",
  version: "1.0.0",
  kind: "database",
  displayName: "Neon Serverless Postgres",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];
    const operations: Operation[] = [
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DATABASE_URL",
          classification: "server-secret",
          description: "Pooled Neon URL for application traffic",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DIRECT_DATABASE_URL",
          classification: "server-secret",
          description: "Direct Neon URL for migrations",
        },
        owner: this.id,
      },
    ];
    if (input.orm === "none") {
      operations.push({
        type: "add-dependency",
        workspace: "apps/api",
        name: "@neondatabase/serverless",
        version: "^1.0.1",
        kind: "dependencies",
        owner: this.id,
      });
    }
    return operations;
  },
};

export const postgresDatabaseAdapter: Adapter = {
  id: "database:postgres",
  version: "1.0.0",
  kind: "database",
  displayName: "Local PostgreSQL (Docker)",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];
    const operations: Operation[] = [
      {
        type: "write-file",
        path: "docker-compose.yml",
        content: dockerComposePostgres,
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DATABASE_URL",
          classification: "server-secret",
          description:
            "Local PostgreSQL URL (postgresql://postgres:postgres@localhost:5432/expojet)",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DIRECT_DATABASE_URL",
          classification: "server-secret",
          description: "Direct PostgreSQL URL for migrations",
        },
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: ".",
        name: "db:up",
        command: "docker compose up -d",
        owner: this.id,
      },
      {
        type: "add-script",
        workspace: ".",
        name: "db:down",
        command: "docker compose down",
        owner: this.id,
      },
    ];
    if (input.orm === "none") {
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
    }
    return operations;
  },
};

export const sqliteDatabaseAdapter: Adapter = {
  id: "database:sqlite",
  version: "1.0.0",
  kind: "database",
  displayName: "SQLite",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const isStandalone = input.structure === "standalone";
    if (isStandalone) {
      return [
        {
          type: "add-dependency",
          workspace: ".",
          name: "expo-sqlite",
          version: "~15.1.2",
          kind: "dependencies",
          owner: this.id,
        },
      ];
    }
    const operations: Operation[] = [
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DATABASE_URL",
          classification: "server-secret",
          description: "SQLite database file path or URL (e.g. file:local.db)",
        },
        owner: this.id,
      },
    ];
    if (input.orm === "none") {
      operations.push({
        type: "add-dependency",
        workspace: "apps/api",
        name: "@libsql/client",
        version: "^0.14.0",
        kind: "dependencies",
        owner: this.id,
      });
    }
    return operations;
  },
};

export const noneDatabaseAdapter: Adapter = {
  id: "database:none",
  version: "1.0.0",
  kind: "database",
  displayName: "No database",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan() {
    return [];
  },
};

export function databaseAdapter(id: DatabaseAdapter): Adapter {
  switch (id) {
    case "neon":
      return neonDatabaseAdapter;
    case "postgres":
      return postgresDatabaseAdapter;
    case "sqlite":
      return sqliteDatabaseAdapter;
    case "none":
      return noneDatabaseAdapter;
  }
}
