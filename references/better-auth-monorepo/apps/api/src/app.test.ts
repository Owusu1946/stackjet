import { beforeAll, describe, expect, it } from "vitest";

let app: typeof import("./app.js").app;

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
  process.env.BETTER_AUTH_SECRET = "phase-zero-test-secret-with-32-characters";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.ALLOWED_ORIGINS = "stackjetbetterauth://";
  ({ app } = await import("./app.js"));
}, 30_000);

describe("reference API", () => {
  it("reports health without exposing configuration", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ service: "stackjet-better-auth-reference", version: "0.1.0" });
  });

  it("rejects a missing session", async () => {
    const response = await app.request("/v1/me");
    expect(response.status).toBe(401);
  });
});
