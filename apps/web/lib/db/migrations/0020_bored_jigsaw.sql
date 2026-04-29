ALTER TABLE "listening_exercise" ADD COLUMN "mode" text DEFAULT 'listening' NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_exercise" ADD COLUMN "bookmarked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_exercise" ADD COLUMN "script_revealed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_exercise" ADD COLUMN "key_phrases" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX "listening_exercise_user_bookmarked_idx" ON "listening_exercise" USING btree ("user_id","bookmarked");