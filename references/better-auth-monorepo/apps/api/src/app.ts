import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth/index.js";
import { allowedOrigins } from "./env.js";

export const app = new Hono()
  .use("*", secureHeaders())
  .use("/api/*", cors({ origin: allowedOrigins, credentials: true }))
  .all("/api/auth/*", (c) => auth.handler(c.req.raw))
  .get("/health", (c) => c.json({ service: "stackjet-better-auth-reference", version: "0.1.0" } as const, 200))
  .get("/v1/me", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "unauthorized" } as const, 401);
    return c.json({ user: { id: session.user.id, email: session.user.email, name: session.user.name } }, 200);
  });

export type AppType = typeof app;
