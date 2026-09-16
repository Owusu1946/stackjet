import { z } from "zod";

export const structures = ["standalone", "monorepo"] as const;
export const packageManagers = ["pnpm", "npm", "bun"] as const;
export const authAdapters = ["clerk", "better-auth", "none"] as const;
export const styleAdapters = ["uniwind", "stylesheet"] as const;

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
  onboarding: z.boolean(),
  eas: z.boolean(),
  sdk: z.literal(57).default(57),
});

export const createInputSchema = createInputObjectSchema.superRefine((input, context) => {
  if (input.auth === "better-auth" && input.structure !== "monorepo") {
    context.addIssue({
      code: "custom",
      path: ["auth"],
      message: "Better Auth requires the monorepo structure in the SDK 57 pack",
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
