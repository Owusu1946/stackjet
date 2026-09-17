import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export function getEnv() { return createEnv({ server: {
  DATABASE_URL: z.string().url(), DIRECT_DATABASE_URL: z.string().url(), CLERK_SECRET_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000), ALLOWED_ORIGINS: z.string().default("http://localhost:8081"),
}, runtimeEnv: process.env, emptyStringAsUndefined: true }); }
