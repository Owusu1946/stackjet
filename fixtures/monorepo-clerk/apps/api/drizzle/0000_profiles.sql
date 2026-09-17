CREATE TABLE IF NOT EXISTS "profiles" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"clerk_user_id" text NOT NULL UNIQUE,"display_name" text,"created_at" timestamptz DEFAULT now() NOT NULL,"updated_at" timestamptz DEFAULT now() NOT NULL);
CREATE INDEX IF NOT EXISTS "profiles_clerk_user_id_idx" ON "profiles" ("clerk_user_id");
