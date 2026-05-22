CREATE TABLE "read_aloud_dialogue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"context" text,
	"topic" text,
	"speaker_count" integer DEFAULT 2 NOT NULL,
	"lines_json" jsonb NOT NULL,
	"voice_config_json" jsonb NOT NULL,
	"role_play_count" integer DEFAULT 0 NOT NULL,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "read_aloud_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"text" text,
	"dialogue_id" uuid,
	"voice_role" text NOT NULL,
	"speed" real DEFAULT 1 NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"shadow_score" integer,
	"shadow_details" jsonb,
	"preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "daily_challenge_user_date_idx";--> statement-breakpoint
ALTER TABLE "read_aloud_session" ADD CONSTRAINT "read_aloud_session_dialogue_id_read_aloud_dialogue_id_fk" FOREIGN KEY ("dialogue_id") REFERENCES "public"."read_aloud_dialogue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "read_aloud_dialogue_user_created_idx" ON "read_aloud_dialogue" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "read_aloud_dialogue_user_bookmarked_idx" ON "read_aloud_dialogue" USING btree ("user_id","bookmarked");--> statement-breakpoint
CREATE INDEX "read_aloud_session_user_created_idx" ON "read_aloud_session" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "read_aloud_session_user_mode_idx" ON "read_aloud_session" USING btree ("user_id","mode");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_challenge_user_date_idx" ON "daily_challenge" USING btree ("user_id","challenge_date");