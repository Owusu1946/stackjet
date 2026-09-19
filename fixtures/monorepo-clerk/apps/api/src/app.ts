import { verifyToken as verifyClerkToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { secureHeaders } from "hono/secure-headers";
import { getDb } from "./db/client.js";
import { profiles, type Profile } from "./db/schema.js";
import { getEnv } from "./env.js";

type Variables = { requestId: string; userId: string };
type Dependencies = { verifyToken(token: string): Promise<{ sub?: string | null }>; findProfile(userId: string): Promise<Profile | null> };
const defaults: Dependencies = {
  verifyToken: (token) => verifyClerkToken(token, { secretKey: getEnv().CLERK_SECRET_KEY }),
  async findProfile(userId) { return (await getDb().select().from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))[0] ?? null; },
};
const failure = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });
export function createApp(overrides: Partial<Dependencies> = {}) {
  const dependencies = { ...defaults, ...overrides };
  const auth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const header = c.req.header("authorization");
    if (!header?.startsWith("Bearer ")) return c.json(failure("UNAUTHORIZED", "A bearer token is required", c.get("requestId")), 401);
    try {
      const claims = await dependencies.verifyToken(header.slice(7));
      if (!claims.sub) throw new Error("Token has no subject");
      c.set("userId", claims.sub); await next();
    } catch { return c.json(failure("UNAUTHORIZED", "The bearer token is invalid", c.get("requestId")), 401); }
  });
  return new Hono<{ Variables: Variables }>()
    .use("*", async (c, next) => { c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID()); await next(); c.header("x-request-id", c.get("requestId")); })
    .use("*", secureHeaders())
    .use("/v1/*", cors({ origin: (origin) => { const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081").split(","); return allowed.includes(origin) ? origin : allowed[0]!; }, credentials: true }))
    .get("/health", (c) => c.json({ ok: true, service: "expojet-api" }))
    .get("/v1/me", auth, async (c) => { const userId = c.get("userId"); return c.json({ user: { id: userId }, profile: await dependencies.findProfile(userId) }); })
    .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
    .onError((error, c) => { console.error(error); return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500); });
}
export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
