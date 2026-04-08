CREATE TABLE "flashcard_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_query_vocabulary_cache_query_fk" FOREIGN KEY ("query") REFERENCES "public"."vocabulary_cache"("query") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "flashcard_progress_user_query_idx" ON "flashcard_progress" USING btree ("user_id","query");