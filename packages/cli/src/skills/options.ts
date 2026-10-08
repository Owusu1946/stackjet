import { ExitCode } from "@expojet/core";
import { CliError } from "../errors.js";
import { type SkillAgent, type SkillScope, skillAgentSchema, skillScopeSchema } from "./agents.js";

export interface SkillsOptions {
  agents?: string[];
  scope?: string;
  skill?: string[];
  yes?: boolean;
  dryRun?: boolean;
}

export function parseSkillsOptions(options: SkillsOptions, interactive: boolean) {
  const agents: SkillAgent[] = [];
  for (const value of options.agents ?? []) {
    const result = skillAgentSchema.safeParse(value);
    if (!result.success) throw new CliError(`Unknown skill agent: ${value}`, ExitCode.InvalidInput);
    if (!agents.includes(result.data)) agents.push(result.data);
  }
  const parsedScope = skillScopeSchema.safeParse(options.scope ?? "project");
  if (!parsedScope.success)
    throw new CliError("Skills scope must be project or global", ExitCode.InvalidInput);
  const scope: SkillScope = parsedScope.data;
  if ((!interactive || options.yes) && !agents.length && !options.dryRun) {
    throw new CliError("Explicit skills installation requires --agents", ExitCode.InvalidInput);
  }
  return { agents, scope };
}
