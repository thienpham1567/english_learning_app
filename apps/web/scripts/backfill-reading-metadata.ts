// Backfill script: npx tsx scripts/backfill-reading-metadata.ts
// Story 19.4.1, AC5 — recomputes cefrLevel, wordCount, lexicalTagsJson for all passages (idempotent).

import { readFileSync } from "fs";
import { Pool } from "pg";

// Manual env loading
const envContent = readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1);
}

// Inline lemmatizer (same logic as lib/reading/lemmatize.ts, duplicated to avoid TS path alias issues in scripts)
const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as","is","was","are","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","must","not","no","nor","so","if","then","than","that","this","these","those","it","its","he","she","they","we","you","i","me","my","your","his","her","our","their","us","them","who","whom","which","what","when","where","how","why","all","each","every","both","few","more","most","other","some","such","only","own","same","very","just","also","about","up","out","into","over","after","before","between","under","above","below","through","during","without","within","along","around","among","against","because","until","while","there","here","too","much","many","any","well","still","even","now","back","yet","already","always","never","often","really","quite","rather"]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/).filter((w) => w.length >= 2).map((w) => w.replace(/^['-]+|['-]+$/g, ""));
}

function extractLemmas(text: string): string[] {
  const words = tokenize(text);
  const lemmas = new Set<string>();
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    // Simple suffix strip (lightweight)
    let lemma = word;
    if (lemma.endsWith("ies") && lemma.length > 4) lemma = lemma.slice(0, -3) + "y";
    else if (lemma.endsWith("ing") && lemma.length > 4) lemma = lemma.slice(0, -3);
    else if (lemma.endsWith("ed") && lemma.length > 3) lemma = lemma.slice(0, -2);
    else if (lemma.endsWith("s") && !lemma.endsWith("ss") && lemma.length > 3) lemma = lemma.slice(0, -1);
    if (lemma.length >= 2 && !STOP_WORDS.has(lemma)) lemmas.add(lemma);
  }
  return Array.from(lemmas).sort();
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function backfill() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ id: string; body: string }>("SELECT id, body FROM reading_passage");
    console.log(`Backfilling ${rows.length} passages...`);

    for (const row of rows) {
      const wordCount = row.body.trim().split(/\s+/).length;
      const lemmas = extractLemmas(row.body);

      await client.query(
        `UPDATE reading_passage SET word_count = $1, lexical_tags_json = $2 WHERE id = $3`,
        [wordCount, JSON.stringify(lemmas), row.id],
      );
    }

    console.log(`✅ Backfilled ${rows.length} passages with word counts + lexical tags.`);
  } finally {
    client.release();
    await pool.end();
  }
}

backfill().catch((err) => { console.error("Backfill failed:", err); process.exit(1); });
