import { isAbsolute, normalize, resolve, sep } from "node:path";

export class UnsafePlanPathError extends Error {
  override name = "UnsafePlanPathError";
}

export function resolvePlanPath(root: string, plannedPath: string) {
  const hasControlCharacter = [...plannedPath].some((character) => character.charCodeAt(0) < 32);
  if (!plannedPath || isAbsolute(plannedPath) || hasControlCharacter) {
    throw new UnsafePlanPathError(`Unsafe planned path: ${plannedPath}`);
  }
  const normalized = normalize(plannedPath);
  if (normalized === ".." || normalized.startsWith(`..${sep}`)) {
    throw new UnsafePlanPathError(`Planned path escapes the staging directory: ${plannedPath}`);
  }
  const absolute = resolve(root, normalized);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (absolute !== root && !absolute.startsWith(rootPrefix)) {
    throw new UnsafePlanPathError(`Planned path escapes the staging directory: ${plannedPath}`);
  }
  return absolute;
}
