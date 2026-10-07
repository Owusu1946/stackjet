import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeNonInteractiveCreate } from "../create/index.js";
import { runSkillsFlow } from "./flow.js";

describe("skills previews", () => {
  it.each(["57", "58"])("previews SDK %s without writes or downloads", async (sdk) => {
    const root = mkdtempSync(join(tmpdir(), "skills-preview-"));
    const input = normalizeNonInteractiveCreate("app", { yes: true, sdk, auth: "none" }, {}, root);
    const output: string[] = [];
    const code = await runSkillsFlow(
      input.destination,
      input,
      { dryRun: true, yes: true, skill: ["expo-overview"] },
      { cwd: root, stdout: (line) => output.push(line), stderr: (line) => output.push(line) },
    );
    expect(code).toBe(0);
    expect(readdirSync(root)).toEqual([]);
    expect(output.join("\n")).toContain("expo-overview");
    expect(output.join("\n")).not.toContain("expo-router:");
  });
  it("rejects unrelated selections without creating files", async () => {
    const root = mkdtempSync(join(tmpdir(), "skills-preview-invalid-"));
    const input = normalizeNonInteractiveCreate("app", { yes: true, auth: "none" }, {}, root);
    await expect(
      runSkillsFlow(
        input.destination,
        input,
        { dryRun: true, yes: true, skill: ["hono"] },
        { cwd: root, stdout: () => {}, stderr: () => {} },
      ),
    ).rejects.toThrow("not applicable");
    expect(readdirSync(root)).toEqual([]);
  });
});
