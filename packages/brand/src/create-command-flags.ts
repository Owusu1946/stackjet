/** Optional create CLI flags derived from auth selection (Stack Builder + CLI). */
export function appendAuthCreateFlags(
  flags: string[],
  auth: string,
  socials: readonly string[] = [],
): void {
  if (auth === "better-auth") flags.push("--experimental");
  if (auth === "clerk" && socials.length > 0) flags.push(`--socials ${socials.join(" ")}`);
}
