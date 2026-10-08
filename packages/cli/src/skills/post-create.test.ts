import { describe, expect, it } from "vitest";
import { createSkillsOptions, validateCreateSkills } from "./post-create.js";

describe("post-create skills options", () => {
  it("does not infer installation consent from --yes", () => {
    expect(() => validateCreateSkills({ yes: true })).not.toThrow();
    expect(() => validateCreateSkills({ yes: true, skills: false })).not.toThrow();
    expect(() => validateCreateSkills({ yes: true, skills: true })).toThrow("requires --agents");
  });
  it("keeps skill options out of generation input", () => {
    expect(
      createSkillsOptions({
        yes: true,
        skills: true,
        skillAgents: ["codex"],
        skillsScope: "global",
        skill: ["expo-overview"],
      }),
    ).toEqual({ yes: true, agents: ["codex"], scope: "global", skill: ["expo-overview"] });
  });
  it("rejects contradictory flags", () => {
    expect(() => validateCreateSkills({ skills: false, skillAgents: ["codex"] })).toThrow(
      "require --skills",
    );
    expect(() => validateCreateSkills({ skillsScope: "global" })).toThrow("require --skills");
  });
  it("does not require agents for read-only previews", () => {
    expect(() => validateCreateSkills({ yes: true, dryRun: true, skills: true })).not.toThrow();
  });
});
