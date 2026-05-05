#!/usr/bin/env node
/**
 * Enrich Part 5 questions with correct answers and explanations via AI.
 * Reads from scraped JSON files, calls OpenRouter API in batches, and saves enriched data.
 *
 * Usage: node enrich-part5.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Config ---
const API_KEY = process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE";
const BASE_URL = process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENAI_CHAT_MODEL || "openai/gpt-5.4-nano";
const BATCH_SIZE = 10; // 10 questions per API call
const DELAY_MS = 1500; // Delay between batches

// --- Helpers ---
async function callAI(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1, // Low temp for accuracy
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseOptions(optStr) {
  // "A. write|B. wrote|C. writing|D. was written" -> ["write", "wrote", "writing", "was written"]
  return optStr.split("|").map((o) => o.replace(/^[A-D]\.\s*/, "").trim());
}

// --- Main ---
async function main() {
  // 1. Read all exam JSON files
  const indexFile = path.join(__dirname, "index.json");
  const index = JSON.parse(fs.readFileSync(indexFile, "utf-8"));

  const allQuestions = [];
  for (const exam of index.exams) {
    const filePath = path.join(__dirname, exam.file);
    const examData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const part5 = examData.questions.filter((q) => q.question_part === "5");
    for (const q of part5) {
      allQuestions.push({
        examName: exam.name,
        examId: exam.id,
        id: q.id,
        stem: q.content,
        optionsRaw: q.options,
        options: parseOptions(q.options),
        number: q.number_of_question,
      });
    }
  }

  console.log(`Total Part 5 questions: ${allQuestions.length}`);

  // 2. Process in batches
  const enriched = [];
  const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE);

  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`\nBatch ${batchNum}/${totalBatches} (Q${batch[0].number}-Q${batch[batch.length - 1].number} from ${batch[0].examName})`);

    const questionsForAI = batch.map((q, idx) => ({
      idx,
      stem: q.stem,
      options: q.options,
    }));

    const systemPrompt = `You are a TOEIC expert. For each question, determine:
1. The correct answer index (0-3)
2. A grammar explanation in English (1-2 sentences)
3. A grammar explanation in Vietnamese (1-2 sentences)
4. The grammar topic (e.g., "tenses", "prepositions", "word forms", "conjunctions", etc.)

Return JSON:
{
  "answers": [
    {
      "idx": 0,
      "correctIndex": 2,
      "explanationEn": "...",
      "explanationVi": "...",
      "grammarTopic": "..."
    }
  ]
}`;

    const userPrompt = `Determine the correct answers for these TOEIC Part 5 questions:\n\n${questionsForAI
      .map(
        (q) =>
          `[${q.idx}] ${q.stem}\n  A. ${q.options[0]}\n  B. ${q.options[1]}\n  C. ${q.options[2]}\n  D. ${q.options[3]}`
      )
      .join("\n\n")}`;

    try {
      const response = await callAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      const parsed = JSON.parse(response);
      const answers = parsed.answers;

      if (!Array.isArray(answers) || answers.length !== batch.length) {
        console.error(`  ⚠ Expected ${batch.length} answers, got ${answers?.length ?? 0}`);
        // Try to use what we got
      }

      for (const ans of answers) {
        const q = batch[ans.idx];
        if (!q) continue;
        enriched.push({
          id: q.id,
          examName: q.examName,
          examId: q.examId,
          number: q.number,
          stem: q.stem,
          options: q.options,
          correctIndex: ans.correctIndex,
          explanationEn: ans.explanationEn,
          explanationVi: ans.explanationVi,
          grammarTopic: ans.grammarTopic,
        });
      }

      console.log(`  ✓ ${answers.length} answers processed`);
    } catch (err) {
      console.error(`  ✗ Error:`, err.message);
      // Push without answers as fallback
      for (const q of batch) {
        enriched.push({
          id: q.id,
          examName: q.examName,
          examId: q.examId,
          number: q.number,
          stem: q.stem,
          options: q.options,
          correctIndex: null, // Will need manual review
          explanationEn: "",
          explanationVi: "",
          grammarTopic: "unknown",
        });
      }
    }

    if (i + BATCH_SIZE < allQuestions.length) {
      await sleep(DELAY_MS);
    }
  }

  // 3. Save enriched data
  const outputFile = path.join(__dirname, "part5-enriched.json");
  const output = {
    source: "toeic.tienganhthayquy.com",
    enrichedAt: new Date().toISOString(),
    model: MODEL,
    totalQuestions: enriched.length,
    questions: enriched,
  };
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf-8");

  const hasAnswers = enriched.filter((q) => q.correctIndex !== null).length;
  console.log(`\n=== Done ===`);
  console.log(`Total: ${enriched.length} questions`);
  console.log(`With answers: ${hasAnswers}`);
  console.log(`Missing answers: ${enriched.length - hasAnswers}`);
  console.log(`Saved to: part5-enriched.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
