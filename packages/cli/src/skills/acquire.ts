import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertNoSymlinkAncestors, resolvePlanPath, skillTreeHash } from "@expojet/core";
import { execa } from "execa";
import {
  type CatalogSkill,
  type SkillSourceId,
  skillSources,
  skillsInstallerVersion,
} from "./catalog.js";

export type SkillCommand = (
  file: string,
  args: string[],
  cwd: string,
  signal?: AbortSignal,
) => Promise<string>;

export const runSkillCommand: SkillCommand = async (file, args, cwd, signal) => {
  const isolatedHome = join(cwd, ".installer-home");
  mkdirSync(isolatedHome, { recursive: true });
  const result = await execa(file, args, {
    cwd,
    shell: false,
    timeout: 120_000,
    ...(signal ? { cancelSignal: signal } : {}),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      CI: "true",
      DO_NOT_TRACK: "1",
      DISABLE_TELEMETRY: "1",
      HOME: isolatedHome,
      USERPROFILE: isolatedHome,
      XDG_CONFIG_HOME: isolatedHome,
      CODEX_HOME: join(isolatedHome, "codex"),
      CLAUDE_CONFIG_DIR: join(isolatedHome, "claude"),
      npm_config_cache: join(cwd, ".npm-cache"),
      npm_config_ignore_scripts: "true",
    },
  });
  return result.stdout;
};

export function findNpmCli(): string {
  const candidates = [
    dirname(process.execPath),
    ...(process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":"),
  ];
  for (const directory of candidates) {
    const path = join(directory, "node_modules/npm/bin/npm-cli.js");
    if (existsSync(path)) return path;
  }
  throw new Error(
    "npm is required for the pinned skills installer. Install Node.js with npm, then retry.",
  );
}

export function validateSkillMetadata(directory: string, skill: CatalogSkill): string {
  const hash = skillTreeHash(directory);
  const text = readFileSync(join(directory, "SKILL.md"), "utf8").replace(/\r\n/g, "\n");
  const frontmatter = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text)?.[1];
  const name = frontmatter?.match(/^name:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
  if (name !== skill.name || !frontmatter?.match(/^description:\s*\S/m)) {
    throw new Error(`Invalid SKILL.md metadata for ${skill.name}`);
  }
  return hash;
}

export async function acquireSkillSource(
  sourceId: SkillSourceId,
  selected: readonly CatalogSkill[],
  workspace: string,
  run: SkillCommand = runSkillCommand,
  signal?: AbortSignal,
): Promise<Map<string, string>> {
  const source = skillSources[sourceId];
  const root = join(workspace, sourceId);
  const repository = join(root, "repository");
  const staging = join(root, "staging");
  mkdirSync(repository, { recursive: true });
  mkdirSync(staging);
  const git = (args: string[]) =>
    run(
      "git",
      ["-c", "core.hooksPath=/dev/null", "-c", "protocol.file.allow=never", ...args],
      repository,
      signal,
    );
  await git(["init", "--quiet"]);
  await git(["remote", "add", "origin", `https://github.com/${source.repository}.git`]);
  await git(["fetch", "--quiet", "--depth=1", "--filter=blob:none", "origin", source.commit]);
  await git([
    "sparse-checkout",
    "set",
    "--no-cone",
    ...selected.map((skill) => `/${skill.path}/`),
    ...(source.licensePath ? [`/${source.licensePath}`] : []),
  ]);
  await git(["checkout", "--quiet", "--detach", "FETCH_HEAD"]);
  if ((await git(["rev-parse", "HEAD"])).trim() !== source.commit)
    throw new Error("Skill source revision does not match the catalog");
  const npmCli = findNpmCli();
  const result = new Map<string, string>();
  for (const skill of selected) {
    if (signal?.aborted) throw new Error("Skills installation cancelled");
    const directory = resolvePlanPath(repository, skill.path);
    assertNoSymlinkAncestors(directory);
    validateSkillMetadata(directory, skill);
    if (source.licensePath) {
      const license = resolvePlanPath(repository, source.licensePath);
      assertNoSymlinkAncestors(license);
      if (!readFileSync(license, "utf8").trim()) throw new Error("Missing upstream license");
    } else if (!/^license: MIT\s*$/m.test(readFileSync(join(directory, "SKILL.md"), "utf8"))) {
      throw new Error("Missing skill license declaration");
    }
    // The third-party installer never receives real project or user destinations.
    await run(
      process.execPath,
      [
        npmCli,
        "exec",
        "--yes",
        "--ignore-scripts",
        `--package=skills@${skillsInstallerVersion}`,
        "--",
        "skills",
        "add",
        directory,
        "--skill",
        skill.name,
        "--agent",
        "universal",
        "--copy",
        "--yes",
      ],
      staging,
      signal,
    );
    const installed = join(staging, ".agents/skills", skill.name);
    validateSkillMetadata(installed, skill);
    if (source.licensePath)
      copyFileSync(
        resolvePlanPath(repository, source.licensePath),
        join(installed, "EXPOJET-UPSTREAM-LICENSE"),
      );
    writeFileSync(
      join(installed, "EXPOJET-SOURCE.json"),
      `${JSON.stringify({ repository: source.repository, commit: source.commit, license: source.license, provenance: source.provenance }, null, 2)}\n`,
      { flag: "wx" },
    );
    skillTreeHash(installed);
    result.set(skill.id, installed);
  }
  return result;
}
