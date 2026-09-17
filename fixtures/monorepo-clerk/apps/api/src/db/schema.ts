import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(), clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("profiles_clerk_user_id_idx").on(table.clerkUserId)]);
export type Profile = typeof profiles.$inferSelect;
