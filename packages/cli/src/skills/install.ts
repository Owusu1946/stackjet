import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { assertNoSymlinkAncestors, installSkillDirectory, redactText } from "@expojet/core";
import { acquireSkillSource } from "./acquire.js";
import type { SkillScope, SkillTarget } from "./agents.js";
import { type CatalogSkill, type SkillSourceId, skillSources } from "./catalog.js";
import {
  readSkillsRecord,
  type SkillRecordEntry,
  saveSkillsRecords,
  skillsRecordPath,
} from "./records.js";

export interface SkillOutcome {
  skill: string;
  destination: string;
  status: "installed" | "unchanged" | "conflicted" | "failed";
  detail?: string;
}
export interface SkillsInstallRequest {
  project: string;
  scope: SkillScope;
  skills: readonly CatalogSkill[];
  targets: readonly SkillTarget[];
}
export interface SkillsInstallResult {
  outcomes: SkillOutcome[];
  cancelled: boolean;
  recordError?: string;
}
export type AcquireSkills = typeof acquireSkillSource;

export async function installSelectedSkills(
  request: SkillsInstallRequest,
  signal?: AbortSignal,
  acquire: AcquireSkills = acquireSkillSource,
): Promise<SkillsInstallResult> {
  const result: SkillsInstallResult = { outcomes: [], cancelled: false };
  if (request.skills.length === 0 || request.targets.length === 0) return result;
  const recordPath = skillsRecordPath(request.project, request.scope);
  readSkillsRecord(recordPath);
  for (const target of request.targets) assertNoSymlinkAncestors(target.root);
  const grouped = new Map<SkillSourceId, CatalogSkill[]>();
  for (const skill of request.skills) {
    const selected = grouped.get(skill.source) ?? [];
    if (!selected.some((existing) => existing.id === skill.id)) selected.push(skill);
    grouped.set(skill.source, selected);
  }
  const workspace = mkdtempSync(join(tmpdir(), "expojet-skills-"));
  const updates: SkillRecordEntry[] = [];
  try {
    for (const [sourceId, skills] of grouped) {
      if (signal?.aborted) {
        result.cancelled = true;
        break;
      }
      let staged: Map<string, string>;
      try {
        staged = await acquire(sourceId, skills, workspace, undefined, signal);
      } catch (error) {
        if (signal?.aborted) {
          result.cancelled = true;
          break;
        }
        for (const skill of skills)
          for (const target of request.targets) {
            result.outcomes.push({
              skill: skill.id,
              destination: join(target.root, skill.name),
              status: "failed",
              detail: redactText(error instanceof Error ? error.message : String(error)),
            });
          }
        continue;
      }
      for (const skill of skills) {
        for (const target of request.targets) {
          if (signal?.aborted) {
            result.cancelled = true;
            break;
          }
          const destination = join(target.root, skill.name);
          try {
            const directory = staged.get(skill.id);
            if (!directory) throw new Error("Installer did not produce the requested skill");
            const outcome = installSkillDirectory(directory, target.root, skill.name);
            result.outcomes.push({ skill: skill.id, destination, status: outcome.status });
            if (outcome.status !== "conflicted") {
              const source = skillSources[skill.source];
              updates.push({
                skill: skill.id,
                repository: source.repository,
                commit: source.commit,
                provenance: source.provenance,
                hash: outcome.hash,
                agents: target.agents,
                destination:
                  request.scope === "project"
                    ? relative(request.project, destination).replaceAll("\\", "/")
                    : destination,
              });
            }
          } catch (error) {
            result.outcomes.push({
              skill: skill.id,
              destination,
              status: "failed",
              detail: redactText(error instanceof Error ? error.message : String(error)),
            });
          }
        }
        if (result.cancelled) break;
      }
      if (result.cancelled) break;
    }
    if (updates.length) {
      try {
        saveSkillsRecords(recordPath, updates);
      } catch (error) {
        result.recordError = redactText(error instanceof Error ? error.message : String(error));
      }
    }
    return result;
  } finally {
    // workspace is an exclusively created temporary directory, never a user destination.
    rmSync(workspace, { recursive: true });
  }
}
