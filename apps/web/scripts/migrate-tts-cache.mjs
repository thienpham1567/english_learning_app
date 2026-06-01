// Quick migration script — create tts_audio_cache table
import pg from "pg";

const sql = `
CREATE TABLE IF NOT EXISTS "tts_audio_cache" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "cache_key" text NOT NULL,
  "audio_base64" text NOT NULL,
  "mime_type" text DEFAULT 'audio/wav' NOT NULL,
  "text_preview" text,
  "voice_role" text NOT NULL,
  "speed" real DEFAULT 1 NOT NULL,
  "size_bytes" integer DEFAULT 0 NOT NULL,
  "last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tts_audio_cache_user_key_idx" 
  ON "tts_audio_cache" USING btree ("user_id","cache_key");

CREATE INDEX IF NOT EXISTS "tts_audio_cache_user_lru_idx" 
  ON "tts_audio_cache" USING btree ("user_id","last_used_at");
`;

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to database");
  await client.query(sql);
  console.log("tts_audio_cache table created!");
  const result = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_name = 'tts_audio_cache'"
  );
  console.log("Verified:", result.rows.length, "table(s) found");
  await client.end();
}

main().catch((err) => { console.error("Failed:", err.message); process.exit(1); });
