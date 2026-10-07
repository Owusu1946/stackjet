import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agentEnvironment, resolveSkillTargets } from "./agents.js";

const env = {
  home: join(process.cwd(), "home"),
  configHome: join(process.cwd(), "config"),
  claudeHome: join(process.cwd(), "custom claude"),
};
describe("agent destinations", () => {
  it("deduplicates only shared project paths", () => {
    expect(
      resolveSkillTargets(
        process.cwd(),
        ["codex", "cursor", "codex", "claude-code"],
        "project",
        env,
      ),
    ).toHaveLength(2);
    expect(resolveSkillTargets(process.cwd(), ["codex", "cursor"], "global", env)).toHaveLength(2);
  });
  it("honors global overrides and distinguishes shared directory", () => {
    const targets = resolveSkillTargets(
      process.cwd(),
      ["claude-code", "opencode", "universal", "codex"],
      "global",
      env,
    );
    expect(targets.map((t) => t.root)).toEqual([
      join(env.claudeHome, "skills"),
      join(env.configHome, "opencode/skills"),
      join(env.configHome, "agents/skills"),
      join(env.home, ".agents/skills"),
    ]);
  });
  it("rejects relative overrides", () => {
    expect(() => agentEnvironment({ CLAUDE_CONFIG_DIR: "../other" })).toThrow("absolute");
  });
});
