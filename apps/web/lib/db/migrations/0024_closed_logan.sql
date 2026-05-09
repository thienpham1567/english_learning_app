CREATE TABLE "toeic_writing_prompt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_code" text NOT NULL,
	"question_number" integer NOT NULL,
	"type" text NOT NULL,
	"image_url" text,
	"mandatory_words" jsonb,
	"email_subject" text,
	"email_body" text,
	"email_requirements" jsonb,
	"topic" text,
	"topic_vi" text,
	"prep_seconds" integer DEFAULT 0 NOT NULL,
	"write_seconds" integer NOT NULL,
	"max_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toeic_writing_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"text" text NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"rubric_scores" jsonb,
	"raw_score" integer,
	"feedback_vi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toeic_writing_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"set_code" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"raw_score" integer,
	"scaled_score" integer
);
--> statement-breakpoint
ALTER TABLE "toeic_writing_response" ADD CONSTRAINT "toeic_writing_response_session_id_toeic_writing_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."toeic_writing_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toeic_writing_response" ADD CONSTRAINT "toeic_writing_response_prompt_id_toeic_writing_prompt_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."toeic_writing_prompt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "toeic_writing_prompt_set_q_idx" ON "toeic_writing_prompt" USING btree ("set_code","question_number");--> statement-breakpoint
CREATE UNIQUE INDEX "toeic_writing_response_session_prompt_idx" ON "toeic_writing_response" USING btree ("session_id","prompt_id");--> statement-breakpoint
CREATE INDEX "toeic_writing_session_user_completed_idx" ON "toeic_writing_session" USING btree ("user_id","completed_at");