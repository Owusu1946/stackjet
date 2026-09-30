import * as p from "@clack/prompts";
import { cancelled } from "./resolve.js";

/**
 * Clack signals an abort by resolving to a symbol, not by rejecting. Anything that
 * touches a raw answer -- coercing it to a boolean, reading its length, using it to
 * pick a branch -- sees a truthy value and carries on as if the user had answered.
 *
 * These wrappers are the only place a prompt result is unwrapped. The symbol cannot
 * escape, so a cancellation cannot be mistaken for an answer.
 */
export const ask = {
  async text(options: Parameters<typeof p.text>[0]): Promise<string> {
    const answer = await p.text(options);
    cancelled(answer);
    return String(answer);
  },

  async select<T extends string | number>(options: Parameters<typeof p.select>[0]): Promise<T> {
    const answer = await p.select(options);
    cancelled(answer);
    return answer as T;
  },

  async confirm(options: Parameters<typeof p.confirm>[0]): Promise<boolean> {
    const answer = await p.confirm(options);
    cancelled(answer);
    return answer === true;
  },

  async multiselect(options: Parameters<typeof p.multiselect>[0]): Promise<string[]> {
    const answer = await p.multiselect(options);
    cancelled(answer);
    return answer as string[];
  },
};
