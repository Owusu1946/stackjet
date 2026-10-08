import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { z } from "zod";

export const skillAgents = [
  "codex",
  "claude-code",
  "cursor",
  "github-copilot",
  "gemini-cli",
  "opencode",
  "antigravity",
  "windsurf",
  "universal",
] as const;
export const skillAgentSchema = z.enum(skillAgents);
export type SkillAgent = z.infer<typeof skillAgentSchema>;
export const skillScopeSchema = z.enum(["project", "global"]);
export type SkillScope = z.infer<typeof skillScopeSchema>;

export const agentLabels: Record<SkillAgent, string> = {
  codex: "Codex",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  "github-copilot": "GitHub Copilot",
  "gemini-cli": "Gemini CLI",
  opencode: "OpenCode",
  antigravity: "Antigravity",
  windsurf: "Windsurf",
  universal: "Shared directory",
};
const projectPaths: Record<SkillAgent, string> = Object.fromEntries(
  skillAgents.map((agent) => [
    agent,
    agent === "claude-code"
      ? ".claude/skills"
      : agent === "windsurf"
        ? ".windsurf/skills"
        : ".agents/skills",
  ]),
) as Record<SkillAgent, string>;

export interface AgentEnvironment {
  home: string;
  configHome: string;
  claudeHome: string;
}

export function agentEnvironment(env: NodeJS.ProcessEnv = process.env): AgentEnvironment {
  const home = homedir();
  function override(value: string | undefined, fallback: string) {
    const path = value?.trim() || fallback;
    if (!isAbsolute(path)) throw new Error("Agent configuration directory must be absolute");
    return resolve(path);
  }
  return {
    home,
    configHome: override(env.XDG_CONFIG_HOME, join(home, ".config")),
    claudeHome: override(env.CLAUDE_CONFIG_DIR, join(home, ".claude")),
  };
}

export interface SkillTarget {
  root: string;
  agents: SkillAgent[];
}

// Verified against skills@1.7.1. Shared project paths do not imply shared global paths.
export function resolveSkillTargets(
  project: string,
  agents: readonly SkillAgent[],
  scope: SkillScope,
  env = agentEnvironment(),
): SkillTarget[] {
  const globalPaths: Record<SkillAgent, string> = {
    codex: join(env.home, ".agents/skills"),
    "claude-code": join(env.claudeHome, "skills"),
    cursor: join(env.home, ".cursor/skills"),
    "github-copilot": join(env.home, ".copilot/skills"),
    "gemini-cli": join(env.home, ".gemini/skills"),
    opencode: join(env.configHome, "opencode/skills"),
    antigravity: join(env.home, ".gemini/antigravity/skills"),
    windsurf: join(env.home, ".codeium/windsurf/skills"),
    universal: join(env.configHome, "agents/skills"),
  };
  const targets = new Map<string, SkillTarget>();
  for (const agent of new Set(agents)) {
    skillAgentSchema.parse(agent);
    const root = resolve(
      scope === "project" ? join(project, projectPaths[agent]) : globalPaths[agent],
    );
    const key = process.platform === "win32" ? root.toLowerCase() : root;
    const existing = targets.get(key);
    if (existing) existing.agents.push(agent);
    else targets.set(key, { root, agents: [agent] });
  }
  return [...targets.values()];
}
