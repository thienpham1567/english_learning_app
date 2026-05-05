import { headers } from "next/headers";
import { z } from "zod";
import fs from "fs";
import path from "path";

import { auth } from "@/lib/auth";

const RequestBodySchema = z.object({
  count: z.number().int().min(1).max(30).default(10),
  examName: z.string().optional(),
});

type EnrichedQuestion = {
  id: string;
  examName: string;
  examId: string;
  number: number;
  stem: string;
  options: string[];
  correctIndex: number;
  explanationEn: string;
  explanationVi: string;
  grammarTopic: string;
};

// Cache the enriched data in memory
let cachedQuestions: EnrichedQuestion[] | null = null;

function loadQuestions(): EnrichedQuestion[] {
  if (cachedQuestions) return cachedQuestions;

  const filePath = path.join(
    process.cwd(),
    "data/toeic-exams/part5-enriched.json",
  );
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    // Filter out questions without answers
    cachedQuestions = (data.questions ?? []).filter(
      (q: EnrichedQuestion) => q.correctIndex !== null && q.correctIndex !== undefined,
    );
    return cachedQuestions!;
  } catch {
    console.error("[grammar-quiz/ets] Failed to load enriched data");
    return [];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { count, examName } = parsed.data;
  const allQuestions = loadQuestions();

  if (allQuestions.length === 0) {
    return Response.json(
      { error: "No ETS questions available" },
      { status: 404 },
    );
  }

  // Filter by exam name if specified
  let pool = examName
    ? allQuestions.filter((q) => q.examName === examName)
    : allQuestions;

  if (pool.length === 0) pool = allQuestions;

  // Randomly select `count` questions
  const selected = shuffleArray(pool).slice(0, count);

  // Map to GrammarQuestion format (same as AI-generated)
  const questions = selected.map((q) => ({
    stem: q.stem,
    options: q.options as [string, string, string, string],
    correctIndex: q.correctIndex,
    explanationEn: q.explanationEn,
    explanationVi: q.explanationVi,
    examples: ["", ""] as [string, string], // ETS doesn't have examples
    grammarTopic: q.grammarTopic,
    // Extra metadata
    _source: "ets",
    _examName: q.examName,
    _questionNumber: q.number,
  }));

  return Response.json({
    questions,
    meta: {
      source: "ets",
      totalAvailable: allQuestions.length,
      examNames: [...new Set(allQuestions.map((q) => q.examName))],
    },
  });
}
