import { dirname, resolve } from "node:path";
import { ExitCode, loadProjectContext } from "@expojet/core";
import { CliError } from "../errors.js";
import type { CliIo } from "../io.js";
import { runSkillsFlow } from "./flow.js";
import type { SkillsOptions } from "./options.js";
import { stackFromManifest } from "./recommend.js";

export async function runSkillsInstall(options: SkillsOptions, io: CliIo) {
  let root = resolve(io.cwd);
  for (;;) {
    const project = loadProjectContext(root);
    if (project) return runSkillsFlow(root, stackFromManifest(project.manifest), options, io);
    const parent = dirname(root);
    if (parent === root) break;
    root = parent;
  }
  throw new CliError(
    "No generated project manifest found",
    ExitCode.ProjectState,
    "Run skills install inside a generated project.",
  );
}
