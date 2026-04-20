CREATE TABLE "pronunciation_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reference_text" text NOT NULL,
	"transcript" text NOT NULL,
	"overall" integer NOT NULL,
	"accent" text DEFAULT 'us' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pronunciation_attempt_user_created_idx" ON "pronunciation_attempt" USING btree ("user_id","created_at");