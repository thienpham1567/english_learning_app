CREATE TABLE "tts_audio_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cache_key" text NOT NULL,
	"audio_base64" text NOT NULL,
	"mime_type" text DEFAULT 'audio/wav' NOT NULL,
	"text_preview" text,
	"voice_role" text NOT NULL,
	"speed" real DEFAULT 1 NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tts_audio_cache_user_key_idx" ON "tts_audio_cache" USING btree ("user_id","cache_key");--> statement-breakpoint
CREATE INDEX "tts_audio_cache_user_lru_idx" ON "tts_audio_cache" USING btree ("user_id","last_used_at");