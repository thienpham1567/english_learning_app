CREATE TABLE "daily_challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"challenge_date" text NOT NULL,
	"exercises" jsonb NOT NULL,
	"answers" jsonb,
	"score" integer,
	"completed_at" timestamp with time zone,
	"time_elapsed_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streak" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_completed_date" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
