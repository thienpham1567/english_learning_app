CREATE TABLE "writing_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exam" text NOT NULL,
	"prompt" text,
	"text" text NOT NULL,
	"overall" real NOT NULL,
	"criteria_json" jsonb NOT NULL,
	"inline_issues_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "writing_attempt_user_created_idx" ON "writing_attempt" USING btree ("user_id","created_at");
