import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() { database ??= drizzle(neon(getEnv().DATABASE_URL), { schema }); return database; }
