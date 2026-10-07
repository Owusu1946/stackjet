import { existsSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { commandName } from "@expojet/brand";
import { ExitCode, redactText } from "@expojet/core";
import { CliError } from "../errors.js";
import type { CliIo } from "../io.js";
import { agentLabels, resolveSkillTargets, skillAgents } from "./agents.js";
import { skillSources } from "./catalog.js";
import { installSelectedSkills } from "./install.js";
import { parseSkillsOptions, type SkillsOptions } from "./options.js";
import { recommendSkills, type SkillsStack } from "./recommend.js";

function selected<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) throw new CliError("Cancelled", ExitCode.Cancelled);
  return value as Exclude<T, symbol>;
}

export function interactiveSkills() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export async function runSkillsFlow(
  project: string,
  stack: SkillsStack,
  options: SkillsOptions,
  io: CliIo,
) {
  const interactive = interactiveSkills() && !options.yes;
  const parsed = parseSkillsOptions(options, interactive);
  const recommendations = recommendSkills(stack);
  let skills = recommendations.skills;
  if (options.skill) {
    const ids = new Set(options.skill);
    for (const id of ids) {
      if (!skills.some((skill) => skill.id === id))
        throw new CliError(`Skill is not applicable to this stack: ${id}`, ExitCode.InvalidInput);
    }
    skills = skills.filter((skill) => ids.has(skill.id));
  } else if (interactive && !options.dryRun) {
    const choice = selected(
      await p.select({
        message: "Install agent skills?",
        initialValue: "skip",
        options: [
          { value: "recommended", label: "Install recommended" },
          { value: "customize", label: "Customize" },
          { value: "skip", label: "Skip" },
        ],
      }),
    );
    if (choice === "skip") return ExitCode.Success;
    if (choice === "customize") {
      const ids = selected(
        await p.multiselect({
          message: "Select individual skills (Space toggles)",
          required: false,
          initialValues: skills.map((skill) => skill.id),
          options: skills.map((skill) => ({
            value: skill.id,
            label: `${skill.group} / ${skill.name}`,
            hint: skill.description,
          })),
        }),
      );
      skills = skills.filter((skill) => ids.includes(skill.id));
    }
  }
  if (!skills.length) {
    io.stdout("No skills selected. Nothing installed.");
    return ExitCode.Success;
  }
  let agents = parsed.agents;
  if (!agents.length && interactive && !options.dryRun) {
    agents = selected(
      await p.multiselect({
        message: "Which coding agents?",
        required: true,
        options: skillAgents.map((agent) => ({ value: agent, label: agentLabels[agent] })),
      }),
    );
  }
  // Read-only previews can use the shared directory without implying consent to installation.
  if (!agents.length && options.dryRun) agents = ["universal"];
  let scope = parsed.scope;
  if (interactive && !options.scope && !options.dryRun)
    scope = selected(
      await p.select({
        message: "Installation scope",
        initialValue: "project",
        options: [
          { value: "project", label: "Project — recommended" },
          { value: "global", label: "Global — all projects" },
        ],
      }),
    );
  const targets = resolveSkillTargets(project, agents, scope);
  io.stdout(`Agent skills preview (${scope}):`);
  for (const skill of skills) {
    const source = skillSources[skill.source];
    io.stdout(
      `  ${skill.name}: ${source.repository}@${source.commit} (${source.provenance}, ${source.license})`,
    );
    for (const target of targets) {
      const path = join(target.root, skill.name);
      io.stdout(
        `    ${path}${existsSync(path) ? " — exists; identical content will be skipped, differing content preserved" : " — new"}`,
      );
    }
  }
  if (recommendations.gaps.length)
    io.stdout(`No reviewed skill coverage: ${recommendations.gaps.join(", ")}.`);
  io.stdout(
    "Skills contain instructions, not SDK compatibility certification. Review them before trusting an agent.",
  );
  if (options.dryRun) return ExitCode.Success;
  if (!options.yes) {
    if (!interactive)
      throw new CliError(
        "Use --yes to confirm noninteractive skills installation",
        ExitCode.InvalidInput,
      );
    if (
      !selected(
        await p.confirm({
          message: "Install these skills? Existing edits will never be replaced.",
          initialValue: false,
        }),
      )
    )
      return ExitCode.Success;
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.on("SIGINT", cancel);
  try {
    const result = await installSelectedSkills(
      { project, scope, skills, targets },
      controller.signal,
    );
    for (const status of ["installed", "unchanged", "conflicted", "failed"] as const)
      io.stdout(
        `${status}: ${result.outcomes.filter((outcome) => outcome.status === status).length}`,
      );
    for (const outcome of result.outcomes.filter(
      (item) => item.status === "failed" || item.status === "conflicted",
    ))
      io.stderr(
        `${outcome.status}: ${outcome.destination}${outcome.detail ? ` — ${redactText(outcome.detail)}` : " — existing content preserved"}`,
      );
    if (result.recordError) io.stderr(`Installation record failed: ${result.recordError}`);
    const failed =
      result.cancelled ||
      result.recordError ||
      result.outcomes.some(
        (outcome) => outcome.status === "failed" || outcome.status === "conflicted",
      );
    if (failed)
      io.stdout(
        `Retry from this project: ${commandName} skills install --yes --agents ${agents.join(" ")} --scope ${scope} --skill ${skills.map((skill) => skill.id).join(" ")}`,
      );
    else io.stdout("Skills ready. Reload your coding agent if it has not discovered them yet.");
    return result.cancelled ? ExitCode.Cancelled : failed ? ExitCode.Unexpected : ExitCode.Success;
  } finally {
    process.removeListener("SIGINT", cancel);
  }
}
