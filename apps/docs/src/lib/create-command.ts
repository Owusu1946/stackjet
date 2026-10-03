import { commandName, createPackageName } from "@expojet/brand";

export const packageManagers = ["pnpm", "npm", "bun", "yarn"] as const;
export type PackageManager = (typeof packageManagers)[number];

const starters: Record<PackageManager, string> = {
  pnpm: `pnpm create ${commandName}@latest`,
  npm: `npx ${createPackageName}@latest`,
  bun: `bun create ${commandName}@latest`,
  yarn: `yarn create ${commandName}`,
};

/** The SDK 58 beta pack does not support Yarn. */
export function supportsPackageManager(sdk: number, manager: PackageManager) {
  return !(sdk === 58 && manager === "yarn");
}

/**
 * The create command the Stack Builder and the home page hand to users. The CLI does not infer
 * the package manager from the runner, so the command always names it.
 */
export function createCommand(manager: PackageManager, projectName: string, flags: string[]) {
  return [starters[manager], projectName, `--package-manager ${manager}`, ...flags].join(" ");
}
