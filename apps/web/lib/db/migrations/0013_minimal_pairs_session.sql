CREATE TABLE "minimal_pairs_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"total" integer NOT NULL,
	"correct" integer NOT NULL,
	"focus_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tag_stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "minimal_pairs_session_user_created_idx" ON "minimal_pairs_session" USING btree ("user_id","created_at");
