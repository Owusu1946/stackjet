import { z } from "zod";
import { packageManagers } from "./create-input.js";

export const sdkPackManifestSchema = z.object({
  $schema: z.string().optional(),
  sdk: z.literal(57),
  status: z.enum(["experimental", "stable"]),
  source: z.object({
    kind: z.literal("create-expo-app"),
    template: z.string().min(1),
    syncedAt: z.iso.datetime(),
  }),
  supportedPackageManagers: z.array(z.enum(packageManagers)).min(1),
  newArchitecture: z.boolean(),
  checks: z.array(z.enum(["typecheck", "test", "expo-doctor", "expo-export"])),
  filesSha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export type SdkPackManifest = z.infer<typeof sdkPackManifestSchema>;
