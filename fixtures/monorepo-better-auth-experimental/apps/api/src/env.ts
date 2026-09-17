import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export function getEnv() { return createEnv({ server: {
  DATABASE_URL: z.string().url(), DIRECT_DATABASE_URL: z.string().url(), BETTER_AUTH_SECRET: z.string().min(32), BETTER_AUTH_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000), ALLOWED_ORIGINS: z.string().default("http://localhost:8081"),
}, runtimeEnv: process.env, emptyStringAsUndefined: true }); }
