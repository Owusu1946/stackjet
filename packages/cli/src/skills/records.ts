import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { skillsLockFileName } from "@expojet/brand";
import { assertNoSymlinkAncestors, getPresetsDirectory, writeSkillRecord } from "@expojet/core";
import { z } from "zod";
import type { SkillAgent, SkillScope } from "./agents.js";
import { catalogVersion } from "./catalog.js";

const entrySchema = z.object({
  skill: z.string(),
  repository: z.string(),
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  destination: z.string(),
  agents: z.array(z.string()),
  provenance: z.enum(["official", "community"]),
});
const recordSchema = z
  .object({
    version: z.literal(1),
    catalogVersion: z.number().int().positive(),
    entries: z.array(entrySchema),
  })
  .strict();
export type SkillRecordEntry = Omit<z.infer<typeof entrySchema>, "agents"> & {
  agents: SkillAgent[];
};

export function skillsRecordPath(project: string, scope: SkillScope): string {
  return join(scope === "project" ? project : getPresetsDirectory(), skillsLockFileName);
}

export function readSkillsRecord(path: string): z.infer<typeof recordSchema> {
  assertNoSymlinkAncestors(path);
  if (!existsSync(path)) return { version: 1, catalogVersion, entries: [] };
  // A malformed record is never discarded merely to make installation succeed.
  return recordSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

export function saveSkillsRecords(path: string, updates: readonly SkillRecordEntry[]) {
  const record = readSkillsRecord(path);
  const entries = new Map(record.entries.map((entry) => [entry.destination, entry]));
  for (const entry of updates) {
    const existing = entries.get(entry.destination);
    entries.set(entry.destination, {
      ...entry,
      agents: [...new Set([...(existing?.agents ?? []), ...entry.agents])].sort(),
    });
  }
  writeSkillRecord(
    path,
    `${JSON.stringify({ version: 1, catalogVersion, entries: [...entries.values()].sort((a, b) => a.destination.localeCompare(b.destination)) }, null, 2)}\n`,
  );
}
