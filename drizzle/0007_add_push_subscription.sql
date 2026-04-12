-- Migration: Add push_subscription table for Web Push notifications
CREATE TABLE IF NOT EXISTS push_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscription_user ON push_subscription(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscription_endpoint ON push_subscription(endpoint);
