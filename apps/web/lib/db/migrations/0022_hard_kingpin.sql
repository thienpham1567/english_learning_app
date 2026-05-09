CREATE TABLE "toeic_vocab" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"pos" text NOT NULL,
	"ipa" text,
	"meaning_vi" text NOT NULL,
	"meaning_en" text NOT NULL,
	"example_en" text,
	"example_vi" text,
	"topic" text NOT NULL,
	"level" text DEFAULT 'intermediate' NOT NULL,
	"audio_url" text,
	"frequency" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "toeic_vocab_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE INDEX "toeic_vocab_topic_idx" ON "toeic_vocab" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "toeic_vocab_level_idx" ON "toeic_vocab" USING btree ("level");