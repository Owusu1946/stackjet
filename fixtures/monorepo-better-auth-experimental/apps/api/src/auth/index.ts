import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema.js";
import { getEnv } from "../env.js";
const env = getEnv();
export const auth = betterAuth({ baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET, database: drizzleAdapter(getDb(), { provider: "pg", schema }), emailAndPassword: { enabled: true }, trustedOrigins: env.ALLOWED_ORIGINS.split(","), plugins: [expo()] });
