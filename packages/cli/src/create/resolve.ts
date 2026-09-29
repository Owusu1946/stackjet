import * as p from "@clack/prompts";
import { ExitCode } from "@expojet/core";
import { CliError } from "../errors.js";

/** Clack returns a symbol when the user aborts a prompt. */
export function cancelled(value: unknown): asserts value is Exclude<typeof value, symbol> {
  if (p.isCancel(value)) {
    p.cancel("Creation cancelled. No files were written.");
    throw new CliError("Cancelled", ExitCode.Cancelled);
  }
}

/**
 * Resolve one configuration value from an ordered list of sources, asking only
 * when all of them are undefined. Interactive and `--yes` runs share this so
 * both read the same precedence: an explicit flag beats the config file, the
 * config file beats the default, and only an unanswered value reaches a prompt.
 */
export async function resolveChoice<T>(
  sources: readonly (T | undefined)[],
  ask: () => Promise<T>,
): Promise<T> {
  for (const source of sources) {
    if (source !== undefined) return source;
  }
  const answer = await ask();
  cancelled(answer);
  return answer;
}

/** First enabled boolean shorthand, e.g. `--lucide` standing in for `--icons lucide`. */
export function firstEnabled<T>(
  shorthands: ReadonlyArray<readonly [boolean | undefined, T]>,
): T | undefined {
  for (const [enabled, value] of shorthands) {
    if (enabled) return value;
  }
  return undefined;
}

/** `true` when no source in the list supplied a value. */
export function isUnresolved<T>(...sources: (T | undefined)[]): boolean {
  return sources.every((source) => source === undefined);
}
