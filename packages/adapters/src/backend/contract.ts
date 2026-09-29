// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

export const typedApiClientSource = `import type { HealthResponse, MeResponse } from "@expojet/api-contract";
import { env } from "../env";

export function createApiClient(getToken: () => Promise<string | null>) {
  return {
    v1: {
      me: {
        $get: async () => {
          const token = await getToken();
          const headers = new Headers();
          if (token) headers.set("authorization", "Bearer " + token);
          const response = await fetch(env.EXPO_PUBLIC_API_URL + "/v1/me", { headers });
          return {
            ok: response.ok,
            status: response.status,
            json: () => response.json() as Promise<MeResponse>,
          };
        },
      },
    },
    health: {
      $get: async () => {
        const response = await fetch(env.EXPO_PUBLIC_API_URL + "/health");
        return {
          ok: response.ok,
          status: response.status,
          json: () => response.json() as Promise<HealthResponse>,
        };
      },
    },
  };
}
`;

export const sharedContractSource = `export interface HealthResponse {
  ok: boolean;
  service: string;
}

export interface MeResponse {
  user: { id: string };
  profile: { id: string; clerkUserId?: string; displayName: string | null } | null;
}

export type AppType = {
  health: HealthResponse;
  me: MeResponse;
};
`;

export const apiTsConfig = `{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
`;

export const contractTsConfig = `{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
`;

export const contractPackageHono = `{
  "name": "@expojet/api-contract",
  "private": true,
  "type": "module",
  "types": "./src/index.ts",
  "dependencies": {
    "@expojet/api": "workspace:*"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "@types/node": "^24.3.1",
    "typescript": "~6.0.3"
  }
}
`;

export const contractPackageShared = `{
  "name": "@expojet/api-contract",
  "private": true,
  "type": "module",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "@types/node": "^24.3.1",
    "typescript": "~6.0.3"
  }
}
`;

// ---------------------------------------------------------------------------
// Convex Templates
// ---------------------------------------------------------------------------
