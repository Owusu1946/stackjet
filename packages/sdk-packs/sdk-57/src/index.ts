import type { SdkPackManifest } from "@expojet/schemas";
import { sdk57FilesSha256 } from "./template.generated.js";

export { sdk57Files, sdk57FilesSha256 } from "./template.generated.js";

export const sdk57Manifest = {
  $schema: "../../schemas/sdk-pack.schema.json",
  sdk: 57 as const,
  status: "stable" as const,
  source: {
    kind: "create-expo-app" as const,
    template: "default@sdk-57",
    syncedAt: "2026-09-15T00:00:00.000Z",
  },
  supportedPackageManagers: ["pnpm", "npm", "bun"] as const,
  newArchitecture: true,
  checks: ["typecheck", "test", "expo-doctor", "expo-export"] as const,
  filesSha256: sdk57FilesSha256,
} satisfies SdkPackManifest;
