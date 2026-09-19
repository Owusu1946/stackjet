import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth/index.js";
type Variables = { requestId: string };
const failure = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });
export function createApp() { return new Hono<{ Variables: Variables }>()
  .use("*", async (c, next) => { c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID()); await next(); c.header("x-request-id", c.get("requestId")); })
  .use("*", secureHeaders())
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .get("/health", (c) => c.json({ ok: true, service: "expojet-api", auth: "better-auth-experimental" }))
  .get("/v1/me", async (c) => { const session = await auth.api.getSession({ headers: c.req.raw.headers }); if (!session) return c.json(failure("UNAUTHORIZED", "Authentication is required", c.get("requestId")), 401); return c.json({ user: session.user }); })
  .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
  .onError((error, c) => { console.error(error); return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500); }); }
export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
