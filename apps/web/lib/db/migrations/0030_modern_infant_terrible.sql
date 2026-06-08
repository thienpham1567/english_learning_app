ALTER TYPE "public"."activity_type" ADD VALUE IF NOT EXISTS 'morphology';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "morpheme_lesson_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"morpheme_id" text NOT NULL,
	"morpheme_type" text NOT NULL,
	"lesson_version" text DEFAULT '1' NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "morpheme_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"morpheme_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"score_pct" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_studied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smart_reader_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_text" text NOT NULL,
	"source_text_hash" text,
	"result" jsonb NOT NULL,
	"difficulty_level" text DEFAULT 'intermediate' NOT NULL,
	"preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "morpheme_lesson_cache_morpheme_version_idx" ON "morpheme_lesson_cache" USING btree ("morpheme_id","lesson_version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "morpheme_progress_user_morpheme_idx" ON "morpheme_progress" USING btree ("user_id","morpheme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "morpheme_progress_user_idx" ON "morpheme_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smart_reader_history_user_created_idx" ON "smart_reader_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smart_reader_history_hash_idx" ON "smart_reader_history" USING btree ("source_text_hash");