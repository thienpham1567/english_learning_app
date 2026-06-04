import { randomUUID } from "crypto";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("listening/generate");

import type { ListeningQuestion } from "@repo/database";
import { db, listeningExercise } from "@repo/database";
import { getExamContext, parseExamMode } from "@/lib/exam-mode/context";
import { GenerateInputSchema, type ToeicListeningPart } from "@/lib/listening/types";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/* ── TOEIC Part-specific prompt builders ── */

const TOEIC_PART_PROMPTS: Record<ToeicListeningPart, string> = {
  any: `You are a TOEIC Listening exercise creator.
Generate a short English passage and multiple-choice comprehension questions.

RULES:
- Passage length: A1/A2 = 40-80 words, B1/B2 = 80-120 words, C1/C2 = 100-150 words
- Context: business meetings, office announcements, phone conversations, travel, customer service, product launches
- Use professional/workplace English appropriate for TOEIC
- Generate exactly 4 questions testing listening comprehension
- Each question has 4 options with exactly 1 correct answer
- Questions should test: main idea, details, inference, vocabulary in context

Return ONLY valid JSON (no markdown fences):
{
  "passage": "The full passage text...",
  "questions": [
    { "question": "What is the main idea?", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}`,

  part1: `You are a TOEIC Listening Part 1 (Photographs) exercise creator.

TOEIC Part 1 FORMAT:
- Test-takers see a photograph and hear 4 short descriptions (A, B, C, D)
- They choose the description that best matches the photograph
- Descriptions are 1 sentence each, typically 8-15 words
- Only 1 description is correct; the other 3 are plausible but wrong

RULES:
- Generate a SCENE DESCRIPTION (this replaces the photo — describe what someone would see in a workplace/daily life photo)
- Scene should depict: people working, office settings, transportation, shopping, dining, outdoor activities, construction, manufacturing
- Generate 4 short audio descriptions (A, B, C, D) — each is a single sentence
- Exactly 1 description accurately matches the scene; the other 3 should be plausible distractors
- Common TOEIC traps: similar-sounding words, wrong subject/action, wrong location, wrong number of people
- The passage field should contain ALL 4 descriptions concatenated (A. ... B. ... C. ... D. ...)
- Generate 1 question: "Which description best matches the photograph?"

Return ONLY valid JSON (no markdown fences):
{
  "passage": "A. A woman is typing on a laptop. B. A man is reading a newspaper. C. Two people are shaking hands. D. A group is having lunch.",
  "sceneDescription": "A woman in a business suit is sitting at a desk, typing on a silver laptop. There is a coffee cup beside her and papers spread across the desk.",
  "questions": [
    { "question": "Which description best matches the photograph?", "options": ["A. A woman is typing on a laptop.", "B. A man is reading a newspaper.", "C. Two people are shaking hands.", "D. A group is having lunch."], "correctIndex": 0 }
  ]
}`,

  part2: `You are a TOEIC Listening Part 2 (Question-Response) exercise creator.

TOEIC Part 2 FORMAT:
- Test-takers hear a question or statement, then 3 responses (A, B, C)
- They choose the most appropriate response
- This tests natural conversational responses in workplace English

RULES:
- Generate 4 separate question-response sets
- Each set has: 1 question/statement + 3 possible responses (A, B, C)
- Question types: Wh-questions (Who/What/Where/When/Why/How), Yes/No questions, tag questions, statements requiring a response, offers/suggestions
- Exactly 1 response is appropriate; the other 2 are distractors
- Common TOEIC Part 2 traps: similar-sounding words, topic switching, overly literal responses
- The passage field should contain all questions and responses concatenated
- Context: office, meetings, phone calls, schedules, requests, suggestions

Return ONLY valid JSON (no markdown fences):
{
  "passage": "Question 1: Where is the meeting being held? A. At 3 o'clock. B. In conference room B. C. About the new project. Question 2: ...",
  "questions": [
    { "question": "Where is the meeting being held?", "options": ["A. At 3 o'clock.", "B. In conference room B.", "C. About the new project."], "correctIndex": 1 }
  ]
}`,

  part3: `You are a TOEIC Listening Part 3 (Conversations) exercise creator.

TOEIC Part 3 FORMAT:
- Test-takers hear a conversation between 2-3 people (8-12 turns)
- They answer 3 comprehension questions about the conversation
- Conversations are set in workplace/business contexts

RULES:
- Generate a natural 8-10 turn conversation between 2 speakers (Man and Woman, or use names)
- Context: office discussions, project planning, customer service calls, business trips, scheduling, hiring, training, product issues
- Passage length: 120-180 words (the full dialogue)
- Generate exactly 3 questions testing: purpose/topic, specific details, what will happen next / what is implied
- Each question has 4 options (A, B, C, D) with exactly 1 correct answer
- Format the passage as a dialogue: "Man: ... Woman: ... Man: ..."
- Questions should match real TOEIC patterns:
  • "What are the speakers mainly discussing?"
  • "What does the woman suggest?"
  • "What will the man probably do next?"
  • "Where most likely are the speakers?"

Return ONLY valid JSON (no markdown fences):
{
  "passage": "Man: Have you seen the quarterly report? Woman: Yes, I reviewed it this morning. The sales figures look promising. Man: ...",
  "questions": [
    { "question": "What are the speakers mainly discussing?", "options": ["A quarterly report", "A job interview", "A product launch", "A training session"], "correctIndex": 0 }
  ]
}`,

  part4: `You are a TOEIC Listening Part 4 (Talks) exercise creator.

TOEIC Part 4 FORMAT:
- Test-takers hear a short talk/monologue by a single speaker
- They answer 3 comprehension questions about the talk
- Talks include: announcements, voicemail messages, speeches, broadcasts, introductions, advertisements, tours

RULES:
- Generate a single-speaker talk/monologue (100-150 words)
- Talk types (pick one): office announcement, voicemail message, meeting introduction, news broadcast excerpt, store/airport announcement, tour guide narration, advertisement, training instruction, award ceremony speech
- Generate exactly 3 questions testing: purpose of the talk, specific details, what listeners should do / what will happen next
- Each question has 4 options (A, B, C, D) with exactly 1 correct answer
- Questions should match real TOEIC patterns:
  • "What is the purpose of this announcement?"
  • "According to the speaker, what has changed?"
  • "What are listeners asked to do?"
  • "Where is this announcement most likely being made?"
  • "Who most likely is the speaker?"

Return ONLY valid JSON (no markdown fences):
{
  "passage": "Good morning, everyone. I'd like to take a moment to inform you about some upcoming changes to our office layout...",
  "questions": [
    { "question": "What is the purpose of this announcement?", "options": ["To introduce a new employee", "To announce office changes", "To describe a product", "To schedule a meeting"], "correctIndex": 1 }
  ]
}`,
};

function buildListeningPrompt(examMode: "toeic" | "ielts", toeicPart: ToeicListeningPart): string {
  if (examMode === "toeic" && toeicPart !== "any") {
    return TOEIC_PART_PROMPTS[toeicPart];
  }

  // Generic prompt (for "any" or IELTS)
  const ctx = getExamContext(examMode);
  return `You are an English listening comprehension exercise creator for ${ctx.label} preparation.
Generate a short English passage and multiple-choice comprehension questions.

RULES:
- Passage length: A1/A2 = 40-80 words, B1/B2 = 80-120 words, C1/C2 = 100-150 words
${ctx.listeningPromptSuffix}
- Generate exactly 4 questions testing listening comprehension
- Each question has 4 options with exactly 1 correct answer
- Questions should test: main idea, details, inference, vocabulary in context

Return ONLY valid JSON (no markdown fences):
{
  "passage": "The full passage text...",
  "questions": [
    { "question": "What is the main idea?", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}`;
}

/**
 * POST /api/listening/generate
 *
 * Generates a listening comprehension exercise:
 * 1. AI creates a passage + MCQ questions (TOEIC part-specific when specified)
 * 2. TTS converts passage to audio (Kokoro primary, Groq fallback)
 * 3. Exercise is saved to DB
 *
 * Returns the exercise object with audioUrl pointing to /api/listening/audio/[id]
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = GenerateInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { level, exerciseType, examMode: rawMode, toeicPart } = parsed.data;
    const userId = session.user.id;
    const examMode = parseExamMode(rawMode);

    // Step 1: Generate passage + questions via AI with TOEIC part-specific prompt
    const systemPrompt = buildListeningPrompt(examMode, toeicPart);

    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a ${level} level ${examMode.toUpperCase()} listening exercise.${toeicPart !== "any" ? ` Format: TOEIC ${toeicPart.replace("part", "Part ")}.` : ""} Exercise type: ${exerciseType}.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return Response.json({ error: "AI did not return content" }, { status: 502 });
    }

    let generated: { passage: string; questions: ListeningQuestion[]; sceneDescription?: string };
    try {
      generated = JSON.parse(rawContent);
    } catch {
      log.error({ rawContent }, "listening.generate.parse.failed");
      return Response.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    if (
      !generated.passage ||
      !Array.isArray(generated.questions) ||
      generated.questions.length === 0
    ) {
      return Response.json({ error: "AI response missing required fields" }, { status: 502 });
    }

    // Step 2: Save exercise to DB with pre-generated ID for audioUrl
    const id = randomUUID();
    const audioUrl = `/api/listening/audio/${id}`;

    const [exercise] = await db
      .insert(listeningExercise)
      .values({
        id,
        userId,
        level,
        exerciseType,
        passage: generated.passage,
        audioUrl,
        questions: generated.questions,
      })
      .returning();

    return Response.json({
      id: exercise.id,
      level,
      exerciseType,
      audioUrl,
      passage: generated.passage,
      sceneDescription: generated.sceneDescription, // Part 1 only
      questions: generated.questions.map((q) => ({
        question: q.question,
        options: q.options,
        // Don't expose correctIndex to client during exercise
      })),
      createdAt: exercise.createdAt,
    });
  } catch (err) {
    log.error({ err }, "listening.generate.error");
    return Response.json({ error: "Failed to generate exercise" }, { status: 500 });
  }
}
