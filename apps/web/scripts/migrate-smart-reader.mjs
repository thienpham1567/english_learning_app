import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS smart_reader_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        source_text TEXT NOT NULL,
        result JSONB NOT NULL,
        difficulty_level TEXT NOT NULL DEFAULT 'intermediate',
        preview TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS smart_reader_history_user_created_idx
        ON smart_reader_history (user_id, created_at);
    `);
    console.log("✅ smart_reader_history table created successfully");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
