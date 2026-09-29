import { promises as fs, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Preset, presetSchema } from "@expojet/schemas";

// Sync and async variants exist because the non-interactive CLI path is synchronous. Every rule is
// a pure function below so the two cannot disagree about validation or name matching.

export function getPresetsDirectory(customDir?: string): string {
  if (customDir) return customDir;
  if (process.env.EXPOJET_CONFIG_DIR) return process.env.EXPOJET_CONFIG_DIR;
  return path.join(os.homedir(), ".expojet");
}

export function getPresetsFilePath(customDir?: string): string {
  return path.join(getPresetsDirectory(customDir), "presets.json");
}

const sameName = (left: Preset, right: string) => left.name.toLowerCase() === right.toLowerCase();

function parsePresets(raw: string): Preset[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    const result = presetSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

function serialize(presets: Preset[]): string {
  return `${JSON.stringify(presets, null, 2)}\n`;
}

function upsert(presets: Preset[], preset: Preset): Preset[] {
  const validated = presetSchema.parse(preset);
  const index = presets.findIndex((existing) => sameName(existing, validated.name));
  if (index < 0) return [...presets, validated];
  return presets.map((existing, at) => (at === index ? validated : existing));
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "ENOENT"
  );
}

export async function loadPresets(customDir?: string): Promise<Preset[]> {
  try {
    return parsePresets(await fs.readFile(getPresetsFilePath(customDir), "utf8"));
  } catch (error) {
    if (isMissingFile(error) || error instanceof SyntaxError) return [];
    throw error;
  }
}

export function loadPresetsSync(customDir?: string): Preset[] {
  try {
    return parsePresets(readFileSync(getPresetsFilePath(customDir), "utf8"));
  } catch {
    return [];
  }
}

export async function getPreset(name: string, customDir?: string): Promise<Preset | undefined> {
  return (await loadPresets(customDir)).find((preset) => sameName(preset, name));
}

export function getPresetSync(name: string, customDir?: string): Preset | undefined {
  return loadPresetsSync(customDir).find((preset) => sameName(preset, name));
}

export async function listPresets(customDir?: string): Promise<Preset[]> {
  return loadPresets(customDir);
}

export async function savePreset(preset: Preset, customDir?: string): Promise<void> {
  const dir = getPresetsDirectory(customDir);
  await fs.mkdir(dir, { recursive: true });
  const next = upsert(await loadPresets(customDir), preset);
  await fs.writeFile(getPresetsFilePath(customDir), serialize(next), "utf8");
}

export function savePresetSync(preset: Preset, customDir?: string): void {
  mkdirSync(getPresetsDirectory(customDir), { recursive: true });
  writeFileSync(
    getPresetsFilePath(customDir),
    serialize(upsert(loadPresetsSync(customDir), preset)),
    "utf8",
  );
}

export async function deletePreset(name: string, customDir?: string): Promise<boolean> {
  const presets = await loadPresets(customDir);
  const remaining = presets.filter((preset) => !sameName(preset, name));
  if (remaining.length === presets.length) return false;
  await fs.mkdir(getPresetsDirectory(customDir), { recursive: true });
  await fs.writeFile(getPresetsFilePath(customDir), serialize(remaining), "utf8");
  return true;
}
