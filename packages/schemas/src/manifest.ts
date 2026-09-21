import { z } from "zod";
import {
  analyticsAdapters,
  authAdapters,
  backendAdapters,
  databaseAdapters,
  iconLibraries,
  monitoringAdapters,
  navigationAdapters,
  navigationTypes,
  ormAdapters,
  packageManagers,
  socialProviders,
  stateAdapters,
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
    navigationType: z.enum(navigationTypes).optional(),
    backend: z.enum(backendAdapters).optional(),
    auth: z.enum(authAdapters),
    socialProviders: z.array(z.enum(socialProviders)).optional(),
    style: z.enum(styleAdapters),
    database: z.enum(databaseAdapters).optional(),
    orm: z.enum(ormAdapters).optional(),
    icons: z.enum(iconLibraries).optional(),
    state: z.enum(stateAdapters).optional(),
    analytics: z.enum(analyticsAdapters).optional(),
    monitoring: z.enum(monitoringAdapters).optional(),
  }),
  features: z
    .object({
      onboarding: z.boolean().optional(),
      darkMode: z.boolean().optional(),
      liquidGlass: z.boolean().optional(),
      typescript: z.boolean().optional(),
      eas: z.boolean().optional(),
    })
    .optional(),
});

export type ExpojetManifest = z.infer<typeof expojetManifestSchema>;

export const stackjetManifestSchema = expojetManifestSchema;
export type StackjetManifest = ExpojetManifest;
