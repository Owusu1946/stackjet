import { z } from "zod";

export const structures = ["standalone", "monorepo", "monorepo-web"] as const;
export const packageManagers = ["pnpm", "npm", "bun"] as const;
export const authAdapters = ["clerk", "better-auth", "supabase", "firebase", "none"] as const;
export const styleAdapters = ["uniwind", "nativewind", "unistyles", "stylesheet"] as const;
export const databaseAdapters = ["neon", "postgres", "sqlite", "supabase", "none"] as const;
export const ormAdapters = ["drizzle", "prisma", "none"] as const;

export type DatabaseAdapter = (typeof databaseAdapters)[number];
export type OrmAdapter = (typeof ormAdapters)[number];

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, "Project name is required")
  .max(214, "Project name must be 214 characters or fewer")
  .regex(/^[a-z0-9][a-z0-9._-]*$/, {
    message: "Use lowercase letters, numbers, dots, hyphens, or underscores",
  })
  .refine((name) => !name.startsWith(".") && !name.endsWith("."), {
    message: "Project name cannot start or end with a dot",
  });

const createInputObjectSchema = z.object({
  projectName: projectNameSchema,
  destination: z.string().min(1),
  structure: z.enum(structures),
  packageManager: z.enum(packageManagers),
  auth: z.enum(authAdapters),
  style: z.enum(styleAdapters),
  database: z.enum(databaseAdapters).default("none"),
  orm: z.enum(ormAdapters).default("none"),
  onboarding: z.boolean(),
  darkMode: z.boolean().default(true),
  eas: z.boolean(),
  install: z.boolean().default(true),
  git: z.boolean().default(true),
  sdk: z.literal(57).default(57),
});

export const createInputSchema = createInputObjectSchema.superRefine((input, context) => {
  if (input.auth === "better-auth" && input.structure === "standalone") {
    context.addIssue({
      code: "custom",
      path: ["auth"],
      message: "Better Auth requires the monorepo structure in the SDK 57 pack",
    });
  }
  if (
    input.structure === "standalone" &&
    (input.database === "neon" || input.database === "postgres")
  ) {
    context.addIssue({
      code: "custom",
      path: ["database"],
      message:
        "PostgreSQL databases (Neon, Local Postgres) require a monorepo structure with an API backend. Standalone apps only support SQLite, Supabase, or None.",
    });
  }
  if (input.structure === "standalone" && input.orm === "prisma") {
    context.addIssue({
      code: "custom",
      path: ["orm"],
      message: "Prisma ORM is not supported in standalone mobile apps",
    });
  }
  if (input.database === "none" && input.orm !== "none") {
    context.addIssue({
      code: "custom",
      path: ["orm"],
      message: "Cannot select an ORM when database is 'none'",
    });
  }
  if (input.auth === "better-auth" && (input.database === "none" || input.orm !== "drizzle")) {
    context.addIssue({
      code: "custom",
      path: ["orm"],
      message: "Better Auth requires Drizzle ORM and a configured database in this version",
    });
  }
});

export type CreateInput = z.infer<typeof createInputSchema>;

export const createConfigSchema = createInputObjectSchema
  .omit({ destination: true, sdk: true })
  .partial()
  .extend({ projectName: projectNameSchema.optional(), destination: z.string().min(1).optional() })
  .strict();

export type CreateConfig = z.infer<typeof createConfigSchema>;
