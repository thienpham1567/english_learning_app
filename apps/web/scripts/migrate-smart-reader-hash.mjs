import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE smart_reader_history
        ADD COLUMN IF NOT EXISTS source_text_hash TEXT;

      CREATE INDEX IF NOT EXISTS smart_reader_history_hash_idx
        ON smart_reader_history (source_text_hash);
    `);
    console.log("✅ source_text_hash column + index added successfully");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
