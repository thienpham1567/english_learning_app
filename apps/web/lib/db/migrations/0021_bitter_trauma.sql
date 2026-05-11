CREATE TABLE "youtube_video_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"video_id" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text,
	"channel_title" text,
	"duration_sec" integer,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "daily_challenge_user_date_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "youtube_video_history_user_video_idx" ON "youtube_video_history" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "youtube_video_history_user_updated_idx" ON "youtube_video_history" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_challenge_user_date_idx" ON "daily_challenge" USING btree ("user_id","challenge_date");