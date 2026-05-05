import { headers } from "next/headers";
import { z } from "zod";
import fs from "fs";
import path from "path";

import { auth } from "@/lib/auth";

const RequestBodySchema = z.object({
  count: z.number().int().min(1).max(30).default(10),
  part: z.enum(["3", "4", "5", "6", "7", "listening", "reading", "all"]).default("all"),
  examName: z.string().optional(),
});

type EnrichedQuestion = {
  id: string;
  examName: string;
  examId: string;
  part: string;
  number: number;
  content: string;
  options: string[];
  correctIndex: number | null;
  explanationEn: string;
  explanationVi: string;
  topic: string;
  audio: string | null;
  images: { image_path: string }[] | null;
  parentId: string | null;
};

type Part5Question = {
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

// Cache
let cachedPart5: Part5Question[] | null = null;
let cachedMultipart: EnrichedQuestion[] | null = null;

function loadPart5(): Part5Question[] {
  if (cachedPart5) return cachedPart5;
  try {
    const filePath = path.join(process.cwd(), "data/toeic-exams/part5-enriched.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    cachedPart5 = (data.questions ?? []).filter(
      (q: Part5Question) => q.correctIndex !== null && q.correctIndex !== undefined,
    );
    return cachedPart5!;
  } catch {
    return [];
  }
}

function loadMultipart(): EnrichedQuestion[] {
  if (cachedMultipart) return cachedMultipart;
  try {
    const filePath = path.join(process.cwd(), "data/toeic-exams/multipart-enriched.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    cachedMultipart = (data.questions ?? []).filter(
      (q: EnrichedQuestion) => q.correctIndex !== null && q.correctIndex !== undefined,
    );
    return cachedMultipart!;
  } catch {
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

// Group questions by parentId (for Parts 3,4,6,7)
function groupByParent(questions: EnrichedQuestion[]): EnrichedQuestion[][] {
  const groups = new Map<string, EnrichedQuestion[]>();
  const ungrouped: EnrichedQuestion[][] = [];

  for (const q of questions) {
    if (q.parentId) {
      if (!groups.has(q.parentId)) groups.set(q.parentId, []);
      groups.get(q.parentId)!.push(q);
    } else {
      ungrouped.push([q]);
    }
  }

  const result: EnrichedQuestion[][] = [...groups.values(), ...ungrouped];
  // Sort within each group by question number
  for (const group of result) {
    group.sort((a, b) => a.number - b.number);
  }
  return result;
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

  const { count, part, examName } = parsed.data;

  // Determine which parts to include
  const partFilter = new Set<string>();
  if (part === "listening") {
    partFilter.add("3").add("4");
  } else if (part === "reading") {
    partFilter.add("5").add("6").add("7");
  } else if (part === "all") {
    ["3", "4", "5", "6", "7"].forEach((p) => partFilter.add(p));
  } else {
    partFilter.add(part);
  }

  // Combine Part 5 + multipart questions
  const allQuestions: Array<{
    id: string;
    examName: string;
    part: string;
    number: number;
    content: string;
    options: string[];
    correctIndex: number;
    explanationEn: string;
    explanationVi: string;
    topic: string;
    audio: string | null;
    images: { image_path: string }[] | null;
    parentId: string | null;
  }> = [];

  if (partFilter.has("5")) {
    const p5 = loadPart5();
    let p5pool = examName ? p5.filter((q) => q.examName === examName) : p5;
    if (p5pool.length === 0) p5pool = p5;
    for (const q of p5pool) {
      allQuestions.push({
        id: q.id,
        examName: q.examName,
        part: "5",
        number: q.number,
        content: q.stem,
        options: q.options,
        correctIndex: q.correctIndex,
        explanationEn: q.explanationEn,
        explanationVi: q.explanationVi,
        topic: q.grammarTopic,
        audio: null,
        images: null,
        parentId: null,
      });
    }
  }

  const multipart = loadMultipart();
  for (const p of ["3", "4", "6", "7"]) {
    if (!partFilter.has(p)) continue;
    let pool = multipart.filter((q) => q.part === p);
    if (examName) {
      const filtered = pool.filter((q) => q.examName === examName);
      if (filtered.length > 0) pool = filtered;
    }
    for (const q of pool) {
      if (q.correctIndex === null) continue;
      allQuestions.push({
        id: q.id,
        examName: q.examName,
        part: q.part,
        number: q.number,
        content: q.content,
        options: q.options,
        correctIndex: q.correctIndex,
        explanationEn: q.explanationEn,
        explanationVi: q.explanationVi,
        topic: q.topic,
        audio: q.audio,
        images: q.images,
        parentId: q.parentId,
      });
    }
  }

  if (allQuestions.length === 0) {
    return Response.json({ error: "No questions available for selected part" }, { status: 404 });
  }

  // For grouped parts, select by groups then flatten
  const needsGrouping = ["3", "4", "6", "7"].some((p) => partFilter.has(p));

  let selected;
  if (needsGrouping && partFilter.size === 1 && !partFilter.has("5")) {
    const groups = groupByParent(allQuestions as unknown as EnrichedQuestion[]);
    const shuffled = shuffleArray(groups);
    const result: typeof allQuestions = [];
    for (const group of shuffled) {
      if (result.length >= count) break;
      result.push(...(group as unknown as typeof allQuestions));
    }
    selected = result;
  } else {
    selected = shuffleArray(allQuestions).slice(0, count);
  }

  // Summarize available parts
  const availableParts: Record<string, number> = {};
  for (const q of allQuestions) {
    availableParts[q.part] = (availableParts[q.part] || 0) + 1;
  }

  return Response.json({
    questions: selected,
    meta: {
      source: "ets",
      totalAvailable: allQuestions.length,
      availableParts,
      examNames: [...new Set(allQuestions.map((q) => q.examName))],
    },
  });
}
