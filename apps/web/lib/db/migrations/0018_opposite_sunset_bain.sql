CREATE TABLE "ai_feedback_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"template_version" text NOT NULL,
	"rubric_version" text NOT NULL,
	"model_name" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"structured_output" jsonb NOT NULL,
	"latency_ms" integer NOT NULL,
	"cost_estimate" real,
	"safety_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_lesson_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" text NOT NULL,
	"topic_title" text NOT NULL,
	"exam_mode" "exam_mode" DEFAULT 'toeic' NOT NULL,
	"level" text NOT NULL,
	"lesson_version" text DEFAULT '1' NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"exam_mode" "exam_mode" DEFAULT 'toeic' NOT NULL,
	"level" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"score_pct" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_studied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"module_type" text NOT NULL,
	"content_id" text NOT NULL,
	"skill_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempt_id" text NOT NULL,
	"event_type" text NOT NULL,
	"result" text NOT NULL,
	"score" real,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"difficulty" text NOT NULL,
	"error_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_version" text,
	"rubric_version" text,
	"taxonomy_version" text DEFAULT '1.0.0' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_import" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"duration_sec" integer NOT NULL,
	"transcript_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"key_vocab_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quiz_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audio_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_summary_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"overall" real NOT NULL,
	"accuracy_score" real NOT NULL,
	"coverage_score" real NOT NULL,
	"conciseness_score" real NOT NULL,
	"key_ideas_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coverage_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_baseline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"primary_goal" text NOT NULL,
	"daily_time_budget_minutes" text DEFAULT '10' NOT NULL,
	"self_reported_weak_skill" text,
	"preferred_learning_style" text DEFAULT 'mixed' NOT NULL,
	"baseline_scores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"placement_skipped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_passage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cefr_level" text NOT NULL,
	"section" text DEFAULT 'general' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"lexical_tags_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"passage_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"passage_id" uuid NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"scroll_pct" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"skill_ids" text[] NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"estimated_minutes" real DEFAULT 5 NOT NULL,
	"review_mode" text DEFAULT 'recall' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_outcome" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_interval_days" real DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"suppression_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"proficiency" real DEFAULT 0 NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"success_streak" integer DEFAULT 0 NOT NULL,
	"failure_streak" integer DEFAULT 0 NOT NULL,
	"decay_rate" real DEFAULT 0.05 NOT NULL,
	"signal_count" integer DEFAULT 0 NOT NULL,
	"last_practiced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_review_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listening_summary_attempt" ADD CONSTRAINT "listening_summary_attempt_exercise_id_listening_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."listening_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_passage_id_reading_passage_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."reading_passage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_session" ADD CONSTRAINT "reading_session_passage_id_reading_passage_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."reading_passage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_feedback_run_user_created_idx" ON "ai_feedback_run" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_feedback_run_template_version_idx" ON "ai_feedback_run" USING btree ("template_id","template_version");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_lesson_cache_topic_mode_level_version_idx" ON "grammar_lesson_cache" USING btree ("topic_id","exam_mode","level","lesson_version");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_lesson_progress_user_topic_mode_idx" ON "grammar_lesson_progress" USING btree ("user_id","topic_id","exam_mode");--> statement-breakpoint
CREATE INDEX "grammar_lesson_progress_user_mode_idx" ON "grammar_lesson_progress" USING btree ("user_id","exam_mode");--> statement-breakpoint
CREATE INDEX "learning_event_user_created_idx" ON "learning_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "learning_event_user_module_idx" ON "learning_event" USING btree ("user_id","module_type");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_event_idempotency_idx" ON "learning_event" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "listening_import_user_created_idx" ON "listening_import" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "listening_summary_attempt_user_created_idx" ON "listening_summary_attempt" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "listening_summary_attempt_exercise_idx" ON "listening_summary_attempt" USING btree ("exercise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_baseline_user_idx" ON "onboarding_baseline" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reading_passage_level_idx" ON "reading_passage" USING btree ("cefr_level");--> statement-breakpoint
CREATE INDEX "reading_progress_user_passage_idx" ON "reading_progress" USING btree ("user_id","passage_id");--> statement-breakpoint
CREATE INDEX "reading_session_user_completed_idx" ON "reading_session" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "reading_session_user_started_idx" ON "reading_session" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_task_user_source_idx" ON "review_task" USING btree ("user_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "review_task_due_idx" ON "review_task" USING btree ("user_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_skill_state_user_skill_idx" ON "user_skill_state" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skill_state_next_review_idx" ON "user_skill_state" USING btree ("user_id","next_review_at");