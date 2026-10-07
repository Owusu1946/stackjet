import { describe, expect, it } from "vitest";
import { parseSkillsOptions } from "./options.js";

describe("skills installation consent", () => {
  it("requires agents for noninteractive installation", () => {
    expect(() => parseSkillsOptions({ yes: true }, false)).toThrow("requires --agents");
    expect(parseSkillsOptions({ yes: true, agents: ["codex", "codex"] }, false)).toEqual({
      agents: ["codex"],
      scope: "project",
    });
  });
  it("rejects invalid agents and scopes before downloads", () => {
    expect(() => parseSkillsOptions({ agents: ["unknown"] }, true)).toThrow("Unknown skill agent");
    expect(() => parseSkillsOptions({ scope: "system" }, true)).toThrow("scope must be");
  });
  it("allows read-only previews and interactive agent selection", () => {
    expect(parseSkillsOptions({ dryRun: true }, false).agents).toEqual([]);
    expect(parseSkillsOptions({}, true).scope).toBe("project");
  });
});
