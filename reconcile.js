const fs = require("fs");
const crypto = require("crypto");
const { Client } = require("pg");
const DIR = "apps/web/lib/db/migrations";
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Pending tag -> verification queries that must ALL be true before marking applied.
const CHECKS = {
  "0006_giant_lila_cheney": [
    ["activity_log table", "select to_regclass('public.activity_log') is not null as ok"],
    [
      "user_streak.xp_total column",
      "select exists(select 1 from information_schema.columns where table_name='user_streak' and column_name='xp_total') as ok",
    ],
  ],
  "0029_absent_spyke": [
    ["tts_audio_cache table", "select to_regclass('public.tts_audio_cache') is not null as ok"],
  ],
  "0030_modern_infant_terrible": [
    ["morpheme_lesson_cache", "select to_regclass('public.morpheme_lesson_cache') is not null as ok"],
    ["morpheme_progress", "select to_regclass('public.morpheme_progress') is not null as ok"],
    [
      "enum morphology",
      "select exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='activity_type' and e.enumlabel='morphology') as ok",
    ],
  ],
};

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const journal = JSON.parse(fs.readFileSync(`${DIR}/meta/_journal.json`, "utf8"));

  for (const [tag, checks] of Object.entries(CHECKS)) {
    const entry = journal.entries.find((e) => e.tag === tag);
    const hash = sha256(fs.readFileSync(`${DIR}/${tag}.sql`, "utf8"));
    const exists = await c.query("select 1 from drizzle.__drizzle_migrations where hash=$1", [hash]);
    if (exists.rowCount) {
      console.log(`${tag}: already in journal — skip`);
      continue;
    }
    let allOk = true;
    for (const [label, q] of checks) {
      const r = await c.query(q);
      const ok = r.rows[0].ok === true;
      if (!ok) allOk = false;
      console.log(`  ${tag} · ${label}: ${ok ? "present" : "MISSING"}`);
    }
    if (!allOk) {
      console.log(`${tag}: NOT marking applied (something missing — needs manual DDL)`);
      continue;
    }
    await c.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1,$2)", [
      hash,
      entry.when,
    ]);
    console.log(`${tag}: marked applied ✓`);
  }
  await c.end();
})().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
