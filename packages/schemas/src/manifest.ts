import { z } from "zod";
import { authAdapters, packageManagers, structures, styleAdapters } from "./create-input.js";

export const stackjetManifestSchema = z.object({
  $schema: z.string().optional(),
  generatorVersion: z.string().min(1),
  sdk: z.literal(57),
  sdkPackSha256: z.string().regex(/^[a-f0-9]{64}$/),
  structure: z.enum(structures),
  packageManager: z.enum(packageManagers),
  adapters: z.object({
    auth: z.enum(authAdapters),
    style: z.enum(styleAdapters),
  }),
  features: z
    .object({
      onboarding: z.boolean().optional(),
      darkMode: z.boolean().optional(),
    })
    .optional(),
});

export type StackjetManifest = z.infer<typeof stackjetManifestSchema>;
