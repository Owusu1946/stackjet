import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export const env = createEnv({ clientPrefix: "EXPO_PUBLIC_", client: { EXPO_PUBLIC_API_URL: z.string().url() }, runtimeEnv: { EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL }, emptyStringAsUndefined: true });
