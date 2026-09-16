import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, parse, resolve, sep } from "node:path";
import { projectNameSchema } from "@stackjet/schemas";

const windowsReservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export class ProjectPathError extends Error {
  override name = "ProjectPathError";
}

export interface ValidateProjectPathOptions {
  cwd: string;
  destination: string;
  projectName?: string;
  allowCurrentDirectory?: boolean;
}

function samePath(left: string, right: string) {
  return process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
}

export function validateProjectPath(options: ValidateProjectPathOptions) {
  const rawDestination = options.destination.trim();
  if (!rawDestination || rawDestination.includes("\0")) {
    throw new ProjectPathError("Destination must be a valid path");
  }

  const segments = rawDestination.replaceAll("\\", "/").split("/");
  if (segments.includes("..")) {
    throw new ProjectPathError("Destination cannot contain path traversal segments");
  }

  const absolutePath = resolve(options.cwd, rawDestination);
  const root = parse(absolutePath).root;
  if (samePath(absolutePath, root) || samePath(absolutePath, homedir())) {
    throw new ProjectPathError("Destination cannot be a filesystem root or home directory");
  }
  if (samePath(absolutePath, resolve(options.cwd)) && !options.allowCurrentDirectory) {
    throw new ProjectPathError(
      "Use --allow-current-directory to explicitly target the current directory",
    );
  }

  const projectName = options.projectName ?? basename(absolutePath);
  const parsedName = projectNameSchema.safeParse(projectName);
  if (!parsedName.success) {
    throw new ProjectPathError(parsedName.error.issues[0]?.message ?? "Invalid project name");
  }
  if (windowsReservedNames.test(projectName)) {
    throw new ProjectPathError(`Project name "${projectName}" is reserved by Windows`);
  }

  if (existsSync(absolutePath) && readdirSync(absolutePath).length > 0) {
    throw new ProjectPathError("Destination already exists and is not empty");
  }

  return { absolutePath, projectName: parsedName.data, relativeDisplay: `.${sep}${projectName}` };
}
