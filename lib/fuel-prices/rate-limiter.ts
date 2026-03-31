const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > WINDOW_MS * 5) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Simple token-bucket rate limiter.
 * Returns { allowed: true } if the request is allowed,
 * or { allowed: false, retryAfterMs } if rate-limited.
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfterMs?: number;
  remaining?: number;
} {
  const now = Date.now();
  let bucket = buckets.get(userId);

  if (!bucket) {
    bucket = { tokens: MAX_REQUESTS, lastRefill: now };
    buckets.set(userId, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / WINDOW_MS) * MAX_REQUESTS);
  if (refill > 0) {
    bucket.tokens = Math.min(MAX_REQUESTS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const nextRefillIn = Math.ceil(
      (WINDOW_MS / MAX_REQUESTS) - (elapsed % (WINDOW_MS / MAX_REQUESTS))
    );
    return { allowed: false, retryAfterMs: nextRefillIn };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}
