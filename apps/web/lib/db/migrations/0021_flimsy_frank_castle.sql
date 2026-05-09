CREATE TABLE "toeic_answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_index" integer,
	"is_correct" boolean,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"changed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toeic_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"exam_id" uuid,
	"part_filter" integer,
	"question_count" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"raw_listening" integer,
	"raw_reading" integer,
	"scaled_listening" integer,
	"scaled_reading" integer,
	"total_scaled" integer,
	"baseline_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "toeic_exam" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"source" text NOT NULL,
	"year" integer,
	"total_questions" integer NOT NULL,
	"has_listening" boolean DEFAULT true NOT NULL,
	"has_reading" boolean DEFAULT true NOT NULL,
	"part_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "toeic_exam_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "toeic_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"part" integer NOT NULL,
	"parent_id" uuid,
	"group_order" integer,
	"question_text" text,
	"passage_text" text,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"audio_url" text,
	"image_urls" jsonb,
	"topic" text,
	"skill_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"explanation_en" text,
	"explanation_vi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "youtube_video_history" (
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
ALTER TABLE "toeic_answer" ADD CONSTRAINT "toeic_answer_attempt_id_toeic_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."toeic_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toeic_answer" ADD CONSTRAINT "toeic_answer_question_id_toeic_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."toeic_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toeic_attempt" ADD CONSTRAINT "toeic_attempt_exam_id_toeic_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."toeic_exam"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toeic_question" ADD CONSTRAINT "toeic_question_exam_id_toeic_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."toeic_exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "toeic_answer_attempt_question_idx" ON "toeic_answer" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "toeic_answer_attempt_idx" ON "toeic_answer" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "toeic_attempt_user_mode_completed_idx" ON "toeic_attempt" USING btree ("user_id","mode","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "toeic_question_exam_number_idx" ON "toeic_question" USING btree ("exam_id","number");--> statement-breakpoint
CREATE INDEX "toeic_question_part_idx" ON "toeic_question" USING btree ("part");--> statement-breakpoint
CREATE INDEX "toeic_question_skill_ids_gin_idx" ON "toeic_question" USING gin ("skill_ids");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "youtube_video_history_user_video_idx" ON "youtube_video_history" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "youtube_video_history_user_updated_idx" ON "youtube_video_history" USING btree ("user_id","updated_at");