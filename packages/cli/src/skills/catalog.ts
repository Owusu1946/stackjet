export const catalogVersion = 1;
export const skillsInstallerVersion = "1.7.1";

export const skillSources = {
  expo: {
    repository: "expo/skills",
    commit: "d4f484024fec15196bfd3c272e953e3f983972cf",
    license: "MIT",
    licensePath: "LICENSE",
    provenance: "official",
  },
  clerk: {
    repository: "clerk/skills",
    commit: "9502ec5575247ac2d5a229b9e96a3be700a4a19a",
    license: "MIT (skill frontmatter)",
    licensePath: null,
    provenance: "official",
  },
  hono: {
    repository: "honojs/skills",
    commit: "8b1938be37331c68a02c3b75896b2ea3839d7d09",
    license: "MIT",
    licensePath: "LICENSE",
    provenance: "official",
  },
  prisma: {
    repository: "prisma/skills",
    commit: "be16a8740d01363d13552b317042431ee8dfc581",
    license: "MIT",
    licensePath: "LICENSE",
    provenance: "official",
  },
  neon: {
    repository: "neondatabase/agent-skills",
    commit: "bfd013c352ed31b57a573e4f60263afc5fdd7f7a",
    license: "Apache-2.0",
    licensePath: "LICENSE",
    provenance: "official",
  },
  supabase: {
    repository: "supabase/agent-skills",
    commit: "c9be0e931b7930f7d02126d04774d904c381e7d7",
    license: "MIT",
    licensePath: "LICENSE",
    provenance: "official",
  },
} as const;

export type SkillSourceId = keyof typeof skillSources;
export type SkillGroup = "Expo" | "Authentication" | "Backend" | "Database/ORM" | "Web";
export type SkillCondition =
  | "always"
  | "router"
  | "glass"
  | "eas"
  | "clerk"
  | "clerk-web"
  | "hono"
  | "prisma"
  | "neon"
  | "supabase";

export interface CatalogSkill {
  id: string;
  source: SkillSourceId;
  name: string;
  path: string;
  group: SkillGroup;
  condition: SkillCondition;
  description: string;
}

function expo(name: string, condition: SkillCondition, description: string): CatalogSkill {
  return {
    id: name,
    source: "expo",
    name,
    path: `plugins/expo/skills/${name}`,
    group: "Expo",
    condition,
    description,
  };
}

// Source revisions are reviewed with catalog changes, never resolved during app generation.
export const skillCatalog: readonly CatalogSkill[] = [
  expo("expo-overview", "always", "Navigate Expo tooling and documentation"),
  expo("expo-project-structure", "always", "Organize an Expo application"),
  expo("expo-native-ui", "always", "Build native-feeling mobile interfaces"),
  expo("expo-data-fetching", "always", "Fetch data and handle loading and failures"),
  expo("expo-router", "router", "File-based navigation with Expo Router"),
  expo("expo-ui", "glass", "Native UI and Liquid Glass"),
  expo("eas-workflows", "eas", "EAS build and release workflows"),
  expo("eas-app-stores", "eas", "App-store submission"),
  {
    id: "clerk-expo",
    source: "clerk",
    name: "clerk-expo",
    path: "skills/clerk-expo",
    group: "Authentication",
    condition: "clerk",
    description: "Clerk mobile authentication; follow the installed package version",
  },
  {
    id: "clerk-nextjs-patterns",
    source: "clerk",
    name: "clerk-nextjs-patterns",
    path: "skills/clerk-nextjs-patterns",
    group: "Web",
    condition: "clerk-web",
    description: "Clerk patterns for the Next.js workspace",
  },
  {
    id: "hono",
    source: "hono",
    name: "hono",
    path: "skills/hono",
    group: "Backend",
    condition: "hono",
    description: "Hono API development",
  },
  {
    id: "prisma-cli",
    source: "prisma",
    name: "prisma-cli",
    path: "prisma-cli",
    group: "Database/ORM",
    condition: "prisma",
    description: "Prisma CLI workflows",
  },
  {
    id: "prisma-client-api",
    source: "prisma",
    name: "prisma-client-api",
    path: "prisma-client-api",
    group: "Database/ORM",
    condition: "prisma",
    description: "Query through Prisma Client",
  },
  {
    id: "prisma-database-setup",
    source: "prisma",
    name: "prisma-database-setup",
    path: "prisma-database-setup",
    group: "Database/ORM",
    condition: "prisma",
    description: "Configure Prisma database connections",
  },
  {
    id: "neon-postgres",
    source: "neon",
    name: "neon-postgres",
    path: "plugins/neon-postgres/skills/neon-postgres",
    group: "Database/ORM",
    condition: "neon",
    description: "Neon PostgreSQL development",
  },
  {
    id: "supabase-postgres-best-practices",
    source: "supabase",
    name: "supabase-postgres-best-practices",
    path: "skills/supabase-postgres-best-practices",
    group: "Database/ORM",
    condition: "supabase",
    description: "Supabase PostgreSQL query and schema practices (not mobile auth)",
  },
];
