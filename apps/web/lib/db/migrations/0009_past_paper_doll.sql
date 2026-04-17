CREATE INDEX "daily_challenge_user_completed_idx" ON "daily_challenge" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "diagnostic_result_user_completed_idx" ON "diagnostic_result" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "listening_exercise_user_created_idx" ON "listening_exercise" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "push_subscription_user_enabled_idx" ON "push_subscription" USING btree ("user_id","enabled");--> statement-breakpoint
CREATE INDEX "scenario_progress_user_scenario_idx" ON "scenario_progress" USING btree ("user_id","scenario_id");