CREATE TABLE "toeic_dictation_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"audio_url" text NOT NULL,
	"level" text DEFAULT 'intermediate' NOT NULL,
	"topic" text DEFAULT 'general' NOT NULL,
	"vocab_hints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"voice" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "toeic_question" ADD COLUMN "audio_segments" jsonb;--> statement-breakpoint
CREATE INDEX "toeic_dictation_item_level_idx" ON "toeic_dictation_item" USING btree ("level");--> statement-breakpoint
CREATE INDEX "toeic_dictation_item_topic_idx" ON "toeic_dictation_item" USING btree ("topic");