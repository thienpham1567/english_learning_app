ALTER TYPE "public"."activity_type" ADD VALUE 'grammar_lesson' BEFORE 'writing_practice';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'diagnostic_test';--> statement-breakpoint
CREATE TABLE "diagnostic_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"overall_cefr" text NOT NULL,
	"confidence" real NOT NULL,
	"skill_breakdown" jsonb NOT NULL,
	"answers" jsonb,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_module" text NOT NULL,
	"question_stem" text NOT NULL,
	"options" jsonb,
	"user_answer" text NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation_en" text,
	"explanation_vi" text,
	"grammar_topic" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"review_count" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp with time zone,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"step_index" integer NOT NULL,
	"score" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"module" text NOT NULL,
	"current_level" real DEFAULT 5 NOT NULL,
	"accuracy_last_10" real DEFAULT 0.7 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD COLUMN "mastery_level" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD COLUMN "ease_factor" real DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD COLUMN "interval" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD COLUMN "next_review" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_skill_profile_user_module_idx" ON "user_skill_profile" USING btree ("user_id","module");