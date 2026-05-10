ALTER TABLE "toeic_attempt" ADD COLUMN "question_ids" jsonb;--> statement-breakpoint
ALTER TABLE "toeic_attempt" ADD COLUMN "reading_started_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "toeic_attempt_user_mode_inprogress_idx" ON "toeic_attempt" USING btree ("user_id","mode","started_at");--> statement-breakpoint
CREATE INDEX "toeic_speaking_response_session_idx" ON "toeic_speaking_response" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "toeic_writing_response_session_idx" ON "toeic_writing_response" USING btree ("session_id");