import type { DialogueTurn, ListeningQuestion } from "@repo/database";
import { db, listeningExercise } from "@repo/database";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getExamContext, parseExamMode } from "@/lib/exam-mode/context";
import { GenerateDialogueInputSchema } from "@/lib/listening/types";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VOICE_BY_ROLE, type VoiceRole } from "@/lib/tts/groq";

/**
 * POST /api/listening/generate-dialogue
 *
 * Story 19.3.1 — Multi-speaker dialogues.
 * Generates a 2–3 speaker dialogue + MCQ questions, assigns Groq voices to
 * roles, stores `dialogueTurnsJson` alongside a concatenated `passage` for
 * backward compat, and returns an exercise payload whose `audioUrl` points
 * at `/api/listening/audio/[id]` (which handles the dialogue path).
 */

/** Speaker → voice-role mapping for a given number of speakers. */
const SPEAKER_ROLES: Record<2 | 3, Record<"A" | "B" | "C", VoiceRole | undefined>> = {
  2: { A: "us-f", B: "uk-m", C: undefined },
  3: { A: "us-f", B: "uk-m", C: "au-f" },
};

type SpeakerId = "A" | "B" | "C";

function buildDialogueSystemPrompt(args: {
  examMode: "toeic" | "ielts";
  speakers: 2 | 3;
  turns: 6 | 8 | 10;
}): string {
  const ctx = getExamContext(args.examMode);
  const speakerIds = args.speakers === 2 ? "A and B" : "A, B, and C";
  return `You are an English listening exercise writer for ${ctx.label} preparation.
Write a realistic spoken dialogue between ${speakerIds}.

RULES:
- Exactly ${args.turns} turns total, alternating speakers (${args.speakers} speakers rotating).
- Each turn is one short utterance (10–35 words).
- Keep the topic natural and learner-appropriate.
- Vocabulary and grammar should match the requested CEFR level.
${ctx.listeningPromptSuffix}
- After the dialogue, generate exactly 4 comprehension MCQs with 4 options each and exactly 1 correct answer.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "turns": [{ "speaker": "A" | "B" | "C", "text": "..." }],
  "questions": [
    { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }
  ]
}`;
}

export async function POST(request: Request) {
  const log = routeLogger("listening/generate-dialogue");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = GenerateDialogueInputSchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ details: parsed.error.flatten() }, "input.invalid");
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { topic, level, turns, speakers, examMode: rawMode } = parsed.data;
    const userId = session.user.id;
    const examMode = parseExamMode(rawMode);
    const reqLog = log.child({ userId, topic, level, speakers, turns, examMode });

    const model = openAiConfig.listeningModel;
    reqLog.info({ model }, "llm.request");
    const t0 = Date.now();

    const completion = await openAiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildDialogueSystemPrompt({ examMode, speakers, turns }) },
        {
          role: "user",
          content: `Topic: ${topic}\nLevel: ${level}\nSpeakers: ${speakers}\nTurns: ${turns}`,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });
    const llmMs = Date.now() - t0;

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      reqLog.error({ llmMs, model }, "llm.empty_response");
      return Response.json({ error: "AI did not return content" }, { status: 502 });
    }

    reqLog.info(
      {
        llmMs,
        model,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
      },
      "llm.response",
    );

    let generated: {
      turns: { speaker: SpeakerId; text: string }[];
      questions: ListeningQuestion[];
    };
    try {
      generated = JSON.parse(rawContent);
    } catch {
      reqLog.error({ rawContent, llmMs, model }, "llm.invalid_json");
      return Response.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    if (
      !Array.isArray(generated.turns) ||
      generated.turns.length === 0 ||
      !Array.isArray(generated.questions) ||
      generated.questions.length === 0
    ) {
      reqLog.error({ generated, model }, "llm.missing_fields");
      return Response.json({ error: "AI response missing required fields" }, { status: 502 });
    }

    const roleMap = SPEAKER_ROLES[speakers];
    const dialogueTurns: DialogueTurn[] = generated.turns.map((t) => {
      const speaker: SpeakerId =
        t.speaker === "A" || t.speaker === "B" || t.speaker === "C" ? t.speaker : "A";
      const role = roleMap[speaker] ?? roleMap.A ?? "us-f";
      const [accent] = role.split("-") as ["us" | "uk" | "au", string];
      return {
        speaker,
        accent,
        voiceName: VOICE_BY_ROLE[role as VoiceRole],
        text: (t.text ?? "").trim(),
      };
    });

    const passage = dialogueTurns.map((t) => `${t.speaker}: ${t.text}`).join("\n");

    const id = randomUUID();
    const audioUrl = `/api/listening/audio/${id}`;

    const [exercise] = await db
      .insert(listeningExercise)
      .values({
        id,
        userId,
        level,
        exerciseType: "comprehension",
        passage,
        audioUrl,
        questions: generated.questions,
        dialogueTurnsJson: dialogueTurns,
      })
      .returning();

    log.info(
      {
        exerciseId: exercise.id,
        turns: dialogueTurns.length,
        questions: generated.questions.length,
      },
      "dialogue.created",
    );

    return Response.json({
      id: exercise.id,
      level,
      exerciseType: "comprehension",
      audioUrl,
      passage,
      turns: dialogueTurns,
      questions: generated.questions.map((q) => ({
        question: q.question,
        options: q.options,
      })),
      createdAt: exercise.createdAt,
    });
  } catch (err) {
    log.error({ err }, "dialogue.failed");
    return Response.json({ error: "Failed to generate dialogue" }, { status: 500 });
  }
}
