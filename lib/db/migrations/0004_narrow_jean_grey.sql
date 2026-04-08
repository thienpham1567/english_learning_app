CREATE TABLE "writing_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"prompt" text NOT NULL,
	"text" text NOT NULL,
	"word_count" integer NOT NULL,
	"overall_band" real NOT NULL,
	"scores" jsonb NOT NULL,
	"feedback" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
