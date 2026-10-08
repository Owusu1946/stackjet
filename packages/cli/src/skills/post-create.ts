import { ExitCode, redactText } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import type { CreateFlags } from "../create/flags.js";
import { CliError } from "../errors.js";
import type { CliIo } from "../io.js";
import { interactiveSkills, runSkillsFlow } from "./flow.js";
import { parseSkillsOptions, type SkillsOptions } from "./options.js";

export function createSkillsOptions(flags: CreateFlags): SkillsOptions {
  return {
    ...(flags.skillAgents ? { agents: flags.skillAgents } : {}),
    ...(flags.skillsScope ? { scope: flags.skillsScope } : {}),
    ...(flags.skill ? { skill: flags.skill } : {}),
    ...(flags.yes !== undefined ? { yes: flags.yes } : {}),
    ...(flags.dryRun !== undefined ? { dryRun: flags.dryRun } : {}),
  };
}

export function validateCreateSkills(flags: CreateFlags) {
  const explicit =
    flags.skillAgents !== undefined || flags.skillsScope !== undefined || flags.skill !== undefined;
  if (explicit && flags.skills !== true)
    throw new CliError("Skills options require --skills", ExitCode.InvalidInput);
  if (flags.skills === true)
    parseSkillsOptions(createSkillsOptions(flags), interactiveSkills() && !flags.yes);
}

export async function offerCreateSkills(input: CreateInput, flags: CreateFlags, io: CliIo) {
  if (flags.skills === false || (flags.skills !== true && (flags.yes || !interactiveSkills())))
    return;
  try {
    const code = await runSkillsFlow(input.destination, input, createSkillsOptions(flags), io);
    if (code !== ExitCode.Success)
      io.stderr("Optional skills setup is incomplete. Your generated app is preserved.");
  } catch (error) {
    if (error instanceof CliError && error.exitCode === ExitCode.Cancelled)
      io.stdout("Skills skipped. Your generated app is preserved.");
    else
      io.stderr(
        `Optional skills setup failed: ${redactText(error instanceof Error ? error.message : String(error))}. Your generated app is preserved.`,
      );
  }
}
