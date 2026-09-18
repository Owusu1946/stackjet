import { z } from "zod";
import {
  authAdapters,
  backendAdapters,
  databaseAdapters,
  navigationAdapters,
  ormAdapters,
  packageManagers,
  structures,
  styleAdapters,
} from "./create-input.js";

export const expojetManifestSchema = z.object({
  $schema: z.string().optional(),
  generatorVersion: z.string().min(1),
  sdk: z.literal(57),
  sdkPackSha256: z.string().regex(/^[a-f0-9]{64}$/),
  structure: z.enum(structures),
  packageManager: z.enum(packageManagers),
  adapters: z.object({
    navigation: z.enum(navigationAdapters).optional(),
    backend: z.enum(backendAdapters).optional(),
    auth: z.enum(authAdapters),
    style: z.enum(styleAdapters),
    database: z.enum(databaseAdapters).optional(),
    orm: z.enum(ormAdapters).optional(),
  }),
  features: z
    .object({
      onboarding: z.boolean().optional(),
      darkMode: z.boolean().optional(),
    })
    .optional(),
});

export type ExpojetManifest = z.infer<typeof expojetManifestSchema>;

export const stackjetManifestSchema = expojetManifestSchema;
export type StackjetManifest = ExpojetManifest;
