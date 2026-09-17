import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
const deps = { verifyToken: vi.fn(async () => ({ sub: "user_123" })), findProfile: vi.fn(async () => null) };
describe("API contract", () => {
  it("reports health", async () => { const response = await createApp(deps).request("/health"); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ ok: true }); });
  it("normalizes missing authentication", async () => { const response = await createApp(deps).request("/v1/me"); expect(response.status).toBe(401); expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } }); });
  it("returns the Clerk subject", async () => { const response = await createApp(deps).request("/v1/me", { headers: { authorization: "Bearer test" } }); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ user: { id: "user_123" } }); });
});
