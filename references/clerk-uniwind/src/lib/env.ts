import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional() },
  runtimeEnvStrict: { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY },
  emptyStringAsUndefined: true,
});
