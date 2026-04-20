CREATE TABLE "writing_error_pattern" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "tag" text NOT NULL,
  "count" integer NOT NULL DEFAULT 1,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "quiz_generated_at" timestamp with time zone
);

CREATE INDEX "writing_error_pattern_user_tag_idx" ON "writing_error_pattern" ("user_id", "tag");
CREATE INDEX "writing_error_pattern_user_count_idx" ON "writing_error_pattern" ("user_id", "count");
