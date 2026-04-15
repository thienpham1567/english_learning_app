ALTER TYPE "public"."activity_type" ADD VALUE 'study_set' BEFORE 'writing_practice';--> statement-breakpoint
CREATE INDEX "activity_log_user_created_idx" ON "activity_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "conversation_user_updated_idx" ON "conversation" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "daily_challenge_user_date_idx" ON "daily_challenge" USING btree ("user_id","challenge_date");--> statement-breakpoint
CREATE INDEX "error_log_user_review_idx" ON "error_log" USING btree ("user_id","is_resolved","next_review_at");--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "writing_submission_user_created_idx" ON "writing_submission" USING btree ("user_id","created_at");