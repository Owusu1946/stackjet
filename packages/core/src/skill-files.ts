import { createHash } from "node:crypto";
import {
  closeSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, parse, resolve } from "node:path";
import { resolvePlanPath } from "./plan-path.js";

export function assertNoSymlinkAncestors(path: string): void {
  let current = resolve(path);
  for (;;) {
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink())
        throw new Error(`Symlinked skill destination is not allowed: ${current}`);
      if (current !== resolve(path) && !stat.isDirectory())
        throw new Error(`Not a directory: ${current}`);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export function skillTreeHash(root: string): string {
  assertNoSymlinkAncestors(root);
  if (!lstatSync(root).isDirectory()) throw new Error("Skill must be a directory");
  const hash = createHash("sha256");
  let count = 0;
  let bytes = 0;
  function visit(directory: string, prefix: string) {
    for (const name of readdirSync(directory).sort()) {
      if (/[\\/:]/.test(name) || [...name].some((character) => character.charCodeAt(0) < 32)) {
        throw new Error("Unsafe skill filename");
      }
      const path = resolvePlanPath(root, `${prefix}${name}`);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error("Skill trees cannot contain symlinks");
      if (++count > 1000) throw new Error("Skill exceeds 1000 entries");
      const relative = `${prefix}${name}`;
      hash.update(JSON.stringify([stat.isDirectory() ? "directory" : "file", relative]));
      if (stat.isDirectory()) visit(path, `${relative}/`);
      else {
        if (!stat.isFile()) throw new Error("Skill trees may only contain regular files");
        bytes += stat.size;
        if (bytes > 25 * 1024 * 1024) throw new Error("Skill exceeds 25 MiB");
        hash.update(String(stat.size));
        hash.update(readFileSync(path));
      }
    }
  }
  visit(root, "");
  return hash.digest("hex");
}

export function inspectSkillDestination(
  path: string,
  expectedHash?: string,
): "new" | "unchanged" | "conflicted" {
  assertNoSymlinkAncestors(path);
  if (!existsSync(path)) return "new";
  if (!lstatSync(path).isDirectory()) return "conflicted";
  return expectedHash && skillTreeHash(path) === expectedHash ? "unchanged" : "conflicted";
}

export function installSkillDirectory(
  source: string,
  root: string,
  name: string,
): { status: "installed" | "unchanged" | "conflicted"; hash: string; path: string } {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error("Invalid skill directory name");
  const path = resolvePlanPath(root, name);
  const hash = skillTreeHash(source);
  assertNoSymlinkAncestors(root);
  mkdirSync(root, { recursive: true });
  assertNoSymlinkAncestors(root);
  const lock = resolvePlanPath(root, `.${name}.install-lock`);
  const handle = openSync(lock, "wx");
  let staging: string | undefined;
  try {
    const existing = inspectSkillDestination(path, hash);
    if (existing !== "new") return { status: existing, hash, path };
    staging = mkdtempSync(join(root, `.${name}.staging-`));
    cpSync(source, staging, { recursive: true, errorOnExist: true, force: false });
    if (skillTreeHash(staging) !== hash) throw new Error("Staged skill changed while copying");
    assertNoSymlinkAncestors(path);
    if (existsSync(path)) throw new Error("Skill destination appeared during installation");
    renameSync(staging, path);
    staging = undefined;
    return { status: "installed", hash, path };
  } finally {
    closeSync(handle);
    rmSync(lock);
    if (staging) rmSync(staging, { recursive: true });
  }
}

/** Only a successfully created, uniquely named sibling is ever removed. */
export function writeSkillRecord(path: string, content: string): void {
  assertNoSymlinkAncestors(path);
  const parent = dirname(path);
  if (parent === parse(parent).root)
    throw new Error("Skill records cannot live at filesystem root");
  mkdirSync(parent, { recursive: true });
  assertNoSymlinkAncestors(path);
  const staging = mkdtempSync(join(parent, `.${basename(path)}-`));
  try {
    const temporary = join(staging, "record.json");
    writeFileSync(temporary, content, { flag: "wx" });
    renameSync(temporary, path);
  } finally {
    rmSync(staging, { recursive: true });
  }
}
