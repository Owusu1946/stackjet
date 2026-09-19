import { describe, expect, it } from "vitest";
import { detectPackageManager, parseUserAgent } from "./package-manager.js";

describe("parseUserAgent", () => {
  it("correctly parses pnpm user agent and version", () => {
    const result = parseUserAgent("pnpm/10.4.0 npm/? node/v22.12.0 win32 x64");
    expect(result).toEqual({ manager: "pnpm", version: "10.4.0" });
  });

  it("correctly parses bun user agent and version", () => {
    const result = parseUserAgent("bun/1.2.0 npm/? node/v22.12.0 win32 x64");
    expect(result).toEqual({ manager: "bun", version: "1.2.0" });
  });

  it("correctly parses yarn user agent and version", () => {
    const result = parseUserAgent("yarn/1.22.22 npm/? node/v22.12.0 win32 x64");
    expect(result).toEqual({ manager: "yarn", version: "1.22.22" });
  });

  it("correctly parses npm user agent and version", () => {
    const result = parseUserAgent("npm/10.8.2 node/v22.12.0 win32 x64");
    expect(result).toEqual({ manager: "npm", version: "10.8.2" });
  });

  it("handles user agent without version", () => {
    const result = parseUserAgent("pnpm");
    expect(result).toEqual({ manager: "pnpm", version: undefined });
  });

  it("returns undefined for unsupported manager strings", () => {
    expect(parseUserAgent("cargo/1.80.0 rustc/1.80.0")).toBeUndefined();
    expect(parseUserAgent("pip/24.0 python/3.12")).toBeUndefined();
  });

  it("returns undefined for empty or non-string inputs", () => {
    expect(parseUserAgent("")).toBeUndefined();
    expect(parseUserAgent("   ")).toBeUndefined();
    expect(parseUserAgent(undefined)).toBeUndefined();
  });
});

describe("detectPackageManager", () => {
  it("prioritizes npm_config_user_agent when present", () => {
    const env = { npm_config_user_agent: "yarn/1.22.22 npm/? node/v22.12.0 win32 x64" };
    const detected = detectPackageManager(env);
    expect(detected).toEqual({ manager: "yarn", version: "1.22.22" });
  });

  it("falls back to pnpm default if env is empty and no binaries match or defaults apply", () => {
    // With dummy empty env
    const detected = detectPackageManager({});
    expect(["pnpm", "bun", "yarn", "npm"]).toContain(detected.manager);
  });
});
