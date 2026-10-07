import type { CreateInput, ExpojetManifest } from "@expojet/schemas";
import { type SkillCondition, skillCatalog } from "./catalog.js";

export interface SkillsStack {
  structure: CreateInput["structure"];
  navigation: CreateInput["navigation"];
  auth: CreateInput["auth"];
  backend: CreateInput["backend"];
  database: CreateInput["database"];
  orm: CreateInput["orm"];
  style: CreateInput["style"];
  monitoring: CreateInput["monitoring"];
  analytics: CreateInput["analytics"];
  state: CreateInput["state"];
  liquidGlass: boolean;
  eas: boolean;
}

export function stackFromManifest(manifest: ExpojetManifest): SkillsStack {
  return {
    structure: manifest.structure,
    navigation: manifest.adapters.navigation ?? "router",
    auth: manifest.adapters.auth,
    backend: manifest.adapters.backend ?? "none",
    database: manifest.adapters.database ?? "none",
    orm: manifest.adapters.orm ?? "none",
    style: manifest.adapters.style,
    monitoring: manifest.adapters.monitoring ?? "none",
    analytics: manifest.adapters.analytics ?? "none",
    state: manifest.adapters.state ?? "none",
    liquidGlass: manifest.features?.liquidGlass ?? false,
    eas: manifest.features?.eas ?? false,
  };
}

export function recommendSkills(stack: SkillsStack) {
  const applicable: Record<SkillCondition, boolean> = {
    always: true,
    router: stack.navigation === "router",
    glass: stack.liquidGlass,
    eas: stack.eas,
    clerk: stack.auth === "clerk",
    "clerk-web": stack.auth === "clerk" && stack.structure === "monorepo-web",
    hono: stack.backend === "hono",
    prisma: stack.orm === "prisma",
    neon: stack.database === "neon",
    supabase: stack.database === "supabase",
    web: stack.structure === "monorepo-web",
    convex: stack.backend === "convex",
  };
  const skills = skillCatalog.filter((skill) => applicable[skill.condition]);
  const gaps: string[] = [];
  if (!["none", "clerk"].includes(stack.auth)) gaps.push(`${stack.auth} authentication`);
  if (!["none", "hono", "convex"].includes(stack.backend)) gaps.push(`${stack.backend} backend`);
  if (stack.orm === "drizzle") gaps.push("Drizzle ORM");
  if (stack.database === "sqlite") gaps.push("SQLite-specific guidance");
  if (stack.navigation === "react-navigation") gaps.push("React Navigation-specific guidance");
  if (stack.style !== "stylesheet") gaps.push(`${stack.style} styling`);
  if (stack.state !== "none") gaps.push(`${stack.state} state management`);
  if (stack.analytics !== "none") gaps.push(`${stack.analytics} analytics`);
  if (stack.monitoring !== "none") gaps.push(`${stack.monitoring} monitoring`);
  return { skills, gaps };
}
