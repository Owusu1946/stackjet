import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ProjectPathError, redactText, validateProjectPath } from "./index.js";

describe("validateProjectPath", () => {
  it("resolves a safe new target", () => {
    const cwd = mkdtempSync(join(tmpdir(), "stackjet-core-"));
    expect(validateProjectPath({ cwd, destination: "my-app" }).projectName).toBe("my-app");
  });

  it("rejects traversal and non-empty targets", () => {
    const cwd = mkdtempSync(join(tmpdir(), "stackjet-core-"));
    expect(() => validateProjectPath({ cwd, destination: "../escape" })).toThrow(ProjectPathError);
    mkdirSync(join(cwd, "taken"));
    writeFileSync(join(cwd, "taken", "file.txt"), "owned");
    expect(() => validateProjectPath({ cwd, destination: "taken" })).toThrow("not empty");
  });
});

describe("redactText", () => {
  it("removes common secret forms without hiding harmless configuration", () => {
    const result = redactText(
      "DATABASE_URL=postgresql://user:pass@example.test/db\nEXPO_PUBLIC_API_URL=https://api.test\nAuthorization=Bearer abc",
    );
    expect(result).not.toContain("user:pass");
    expect(result).not.toContain("Bearer abc");
    expect(result).toContain("EXPO_PUBLIC_API_URL=https://api.test");
  });
});
