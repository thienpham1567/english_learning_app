CREATE TABLE "speaking_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"topic" text NOT NULL,
	"level" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"transcript" text NOT NULL,
	"overall" integer NOT NULL,
	"fluency_score" integer NOT NULL,
	"grammar_score" integer NOT NULL,
	"vocab_score" integer NOT NULL,
	"coherence_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "speaking_attempt_user_created_idx" ON "speaking_attempt" USING btree ("user_id","created_at");
