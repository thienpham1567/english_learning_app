#!/usr/bin/env node
/**
 * Enrich Parts 3, 4, 6, 7 with AI-generated answers.
 * Part 1-2 are audio-only (no text to analyze), so skip.
 * Parts 3-4: Have text questions + options → AI can determine answers.
 * Parts 6-7: Have text options → AI can determine answers.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE";
const BASE_URL = process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL =
  process.env.OPENAI_CHAT_MODEL || "google/gemini-3.1-flash-lite-preview";
const BATCH_SIZE = 10;
const DELAY_MS = 1500;

async function callAI(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
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
  return optStr.split("|").map((o) => o.replace(/^[A-D]\.\s*/, "").trim());
}

async function main() {
  const indexFile = path.join(__dirname, "index.json");
  const index = JSON.parse(fs.readFileSync(indexFile, "utf-8"));

  // Collect all questions for parts 3, 4, 6, 7
  const allQuestions = [];

  for (const exam of index.exams) {
    const filePath = path.join(__dirname, exam.file);
    const examData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const q of examData.questions) {
      const part = q.question_part;
      if (!["3", "4", "6", "7"].includes(part)) continue;

      const opts = parseOptions(q.options);
      // Skip if options are just A|B|C|D (no text)
      if (opts.every((o) => o.length <= 2)) continue;

      allQuestions.push({
        examName: exam.name,
        examId: exam.id,
        id: q.id,
        part,
        content: q.content || "",
        options: opts,
        optionsRaw: q.options,
        number: q.number_of_question,
        audio: q.audio || q.parent_question?.audio || null,
        images: q.images || q.parent_question?.images || null,
        parentId: q.parent_question?.id || null,
      });
    }
  }

  console.log(`Total enrichable questions: ${allQuestions.length}`);
  const partCounts = {};
  allQuestions.forEach((q) => {
    partCounts[q.part] = (partCounts[q.part] || 0) + 1;
  });
  console.log("Per part:", partCounts);

  // Process in batches
  const enriched = [];
  const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE);

  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const parts = [...new Set(batch.map((q) => q.part))].join(",");

    console.log(
      `\nBatch ${batchNum}/${totalBatches} (Part ${parts}, ${batch[0].examName})`,
    );

    const questionsForAI = batch.map((q, idx) => ({
      idx,
      part: q.part,
      content: q.content,
      options: q.options,
    }));

    const systemPrompt = `You are a TOEIC expert. For each question, determine the correct answer.
For Part 3-4 (Listening comprehension), use the question text and options to determine the most likely correct answer.
For Part 6 (Text Completion), determine which word/phrase best completes the sentence based on grammar and context.
For Part 7 (Reading Comprehension), use the question and options to determine the correct answer.

Return JSON:
{
  "answers": [
    {
      "idx": 0,
      "correctIndex": 2,
      "explanationEn": "Brief explanation in English",
      "explanationVi": "Brief explanation in Vietnamese",
      "topic": "grammar topic or skill tested"
    }
  ]
}`;

    const userPrompt = questionsForAI
      .map(
        (q) =>
          `[${q.idx}] Part ${q.part}${q.content ? `: ${q.content}` : ""}\n  A. ${q.options[0]}\n  B. ${q.options[1]}\n  C. ${q.options[2]}${q.options[3] ? `\n  D. ${q.options[3]}` : ""}`,
      )
      .join("\n\n");

    try {
      const response = await callAI([
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Determine correct answers:\n\n${userPrompt}`,
        },
      ]);

      const parsed = JSON.parse(response);
      const answers = parsed.answers;

      for (const ans of answers || []) {
        const q = batch[ans.idx];
        if (!q) continue;
        enriched.push({
          id: q.id,
          examName: q.examName,
          examId: q.examId,
          part: q.part,
          number: q.number,
          content: q.content,
          options: q.options,
          correctIndex: ans.correctIndex,
          explanationEn: ans.explanationEn || "",
          explanationVi: ans.explanationVi || "",
          topic: ans.topic || "",
          audio: q.audio,
          images: q.images,
          parentId: q.parentId,
        });
      }

      console.log(`  ✓ ${(answers || []).length} answers`);
    } catch (err) {
      console.error(`  ✗ Error:`, err.message);
      // Fallback
      for (const q of batch) {
        enriched.push({
          id: q.id,
          examName: q.examName,
          examId: q.examId,
          part: q.part,
          number: q.number,
          content: q.content,
          options: q.options,
          correctIndex: null,
          explanationEn: "",
          explanationVi: "",
          topic: "",
          audio: q.audio,
          images: q.images,
          parentId: q.parentId,
        });
      }
    }

    if (i + BATCH_SIZE < allQuestions.length) {
      await sleep(DELAY_MS);
    }
  }

  // Save
  const outputFile = path.join(__dirname, "multipart-enriched.json");
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
  console.log(`Total: ${enriched.length}`);
  console.log(`With answers: ${hasAnswers}`);
  console.log(`Saved to: multipart-enriched.json`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
