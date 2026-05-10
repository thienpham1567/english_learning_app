/**
 * TOEIC Speaking grader.
 *
 * Pipeline:
 *   1. Groq Whisper transcribes user's audio recording.
 *   2. Gemini grades transcript per question type using TOEIC rubric.
 *
 * Returns rubric scores + raw score (0..maxScore) + Vietnamese feedback.
 */
import Groq from "groq-sdk";
import fs from "node:fs";
import { openAiClient } from "@/lib/openai/client";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";

let groqClient: Groq | null = null;
function getGroq(): Groq {
	if (!groqClient) {
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) throw new Error("Missing GROQ_API_KEY");
		groqClient = new Groq({ apiKey });
	}
	return groqClient;
}

export type SpeakingType =
	| "q1_2_read_aloud"
	| "q3_4_describe_picture"
	| "q5_7_respond_question"
	| "q8_10_respond_info"
	| "q11_opinion";

export type GradeSpeakingInput = {
	type: SpeakingType;
	maxScore: number;
	transcript: string;
	durationMs: number;
	context: {
		textToRead?: string;
		imageUrl?: string;
		questionText?: string;
		contextText?: string;
		topic?: string;
	};
	/** Optional pronunciation metrics — when present, included in the LLM prompt. */
	metrics?: import("./pronunciation-analysis").PronunciationMetrics;
};

export type GradeSpeakingResult = {
	rawScore: number;
	rubricScores: Record<string, number>;
	feedbackVi: string;
};

/** Transcribe audio with Groq Whisper, returning text + word-level data. */
export async function transcribeAudio(
	audioPath: string,
	mimeType = "audio/webm",
): Promise<{ text: string; words: import("./pronunciation-analysis").WhisperWord[] }> {
	const groq = getGroq();
	const file = await fs.promises.readFile(audioPath);
	const t0 = Date.now();
	const result = await groq.audio.transcriptions.create({
		file: new File([new Uint8Array(file)], "audio.webm", { type: mimeType }),
		model: "whisper-large-v3-turbo",
		language: "en",
		response_format: "verbose_json",
		timestamp_granularities: ["word"],
	} as never);
	const text = (result as { text?: string }).text ?? "";
	const words: import("./pronunciation-analysis").WhisperWord[] = [];
	const segments = (result as {
		segments?: Array<{ words?: Array<{ word: string; start: number; end: number; probability?: number }> }>;
	}).segments;
	if (segments) {
		for (const seg of segments) {
			for (const w of seg.words ?? []) {
				words.push({
					word: w.word,
					start: w.start,
					end: w.end,
					probability: w.probability ?? 1,
				});
			}
		}
	}
	const topWords = (result as {
		words?: Array<{ word: string; start: number; end: number; probability?: number }>;
	}).words;
	if (words.length === 0 && topWords) {
		for (const w of topWords) {
			words.push({
				word: w.word,
				start: w.start,
				end: w.end,
				probability: w.probability ?? 1,
			});
		}
	}
	const sizeKB = file.byteLength / 1024;
	const approxSec = sizeKB / 30;
	console.log(
		`[cost] toeic.whisper duration=${Date.now() - t0}ms approxSec=${approxSec.toFixed(1)} bytes=${file.byteLength} words=${words.length}`,
	);
	return { text, words };
}

function formatMetricsBlock(
	metrics: import("./pronunciation-analysis").PronunciationMetrics | undefined,
): string {
	if (!metrics) return "";
	const lines = [
		`Pronunciation metrics (computed from Whisper word timing):`,
		`- Pace: ${metrics.wpm} WPM (target for native-like fluency: 130–160)`,
		`- Filler words: ${metrics.fillerCount}${metrics.fillerCount > 0 ? ` (≈${metrics.fillerRate}/min)` : ""}`,
		`- Long pauses: ${metrics.longPauseCount} (gaps over 2 seconds between words)`,
		`- Avg confidence: ${metrics.avgConfidence.toFixed(2)}`,
	];
	if (metrics.lowConfidenceWords.length > 0) {
		lines.push(
			`- Unclear words (low Whisper confidence): ${metrics.lowConfidenceWords.map((w) => `"${w}"`).join(", ")}`,
		);
	}
	if (metrics.alignment) {
		lines.push("");
		lines.push(
			`Read accuracy: ${metrics.alignment.matchedWords}/${metrics.alignment.expectedWords} words matched (${Math.round(metrics.alignment.accuracy * 100)}%).`,
		);
		if (metrics.alignment.missingWords.length > 0) {
			lines.push(
				`Words skipped (not spoken): ${metrics.alignment.missingWords.slice(0, 8).map((w) => `"${w}"`).join(", ")}`,
			);
		}
		if (metrics.alignment.addedWords.length > 0) {
			lines.push(
				`Words added (likely fillers/substitutions): ${metrics.alignment.addedWords.slice(0, 8).map((w) => `"${w}"`).join(", ")}`,
			);
		}
	}
	return lines.join("\n");
}

function buildPrompt(input: GradeSpeakingInput): string {
	const { type, transcript, durationMs, maxScore, context } = input;
	const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
	const seconds = Math.round(durationMs / 1000);
	const metricsBlock = formatMetricsBlock(input.metrics);

	if (type === "q1_2_read_aloud") {
		return `Grading TOEIC Speaking Q1-2 (read aloud).

Original text:
"""
${context.textToRead}
"""
User's transcribed reading:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 3 = highly intelligible, accurate pronunciation, appropriate pace
- 2 = generally intelligible with minor issues
- 1 = limited intelligibility OR many missing words
- 0 = blank or unintelligible

If pronunciation metrics are present above, the feedbackVi MUST cite at least one concrete number (WPM, filler count, accuracy %, or a specific unclear/missing word).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"pronunciation": <0-3>, "fluency": <0-3>, "accuracy": <0-3>},
  "feedbackVi": "<2-3 câu góp ý tiếng Việt>"
}`;
	}
	if (type === "q3_4_describe_picture") {
		return `Grading TOEIC Speaking Q3-4 (describe a picture).

(Picture not shown — judge by description coherence and detail.)
User's transcribed answer:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 3 = relevant, organized, accurate language, sufficient detail
- 2 = mostly relevant with minor issues
- 1 = limited content OR many errors
- 0 = blank or off-topic

If pronunciation metrics are present above, the feedbackVi MUST cite at least one concrete number (WPM, filler count, accuracy %, or a specific unclear/missing word).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"content": <0-3>, "organization": <0-3>, "language": <0-3>},
  "feedbackVi": "<2-3 câu>"
}`;
	}
	if (type === "q5_7_respond_question") {
		return `Grading TOEIC Speaking Q5-7 (respond to question).

Question: ${context.questionText}
User's transcribed answer:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 3 = directly answers, appropriate vocab/grammar
- 2 = answers partially or with some errors
- 1 = barely addresses or hard to follow
- 0 = blank or off-topic

If pronunciation metrics are present above, the feedbackVi MUST cite at least one concrete number (WPM, filler count, accuracy %, or a specific unclear/missing word).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"relevance": <0-3>, "language": <0-3>},
  "feedbackVi": "<1-2 câu>"
}`;
	}
	if (type === "q8_10_respond_info") {
		return `Grading TOEIC Speaking Q8-10 (respond using info).

Context shown to user:
"""
${context.contextText}
"""
Question: ${context.questionText}
User's transcribed answer:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 3 = answers based on context, accurate info, organized
- 2 = mostly correct with minor issues
- 1 = misuses context or many errors
- 0 = blank or fabricated

If pronunciation metrics are present above, the feedbackVi MUST cite at least one concrete number (WPM, filler count, accuracy %, or a specific unclear/missing word).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"accuracy": <0-3>, "language": <0-3>, "organization": <0-3>},
  "feedbackVi": "<2-3 câu>"
}`;
	}
	// q11_opinion
	return `Grading TOEIC Speaking Q11 (express opinion).

Topic: ${context.topic}
User's transcribed essay (spoken):
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words (target ≥80 words for 60s spoken).

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 5 = clear opinion + 2-3 supports + sentence variety + accurate language
- 4 = good response with minor weaknesses
- 3 = reasonable, noticeable issues
- 2 = limited
- 1 = barely on topic
- 0 = blank

If pronunciation metrics are present above, the feedbackVi MUST cite at least one concrete number (WPM, filler count, accuracy %, or a specific unclear/missing word).

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"opinion": <0-5>, "support": <0-5>, "language": <0-5>, "fluency": <0-5>},
  "feedbackVi": "<3-4 câu>"
}`;
}

export async function gradeSpeaking(input: GradeSpeakingInput): Promise<GradeSpeakingResult> {
	const t0 = Date.now();
	const res = await openAiClient.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: buildPrompt(input) }],
		response_format: { type: "json_object" },
		temperature: 0.1,
	});
	console.log(
		`[cost] toeic.grade_speaking type=${input.type} duration=${Date.now() - t0}ms tokens=${res.usage?.total_tokens ?? "?"}`,
	);
	const raw = res.choices[0]?.message.content ?? "{}";
	const parsed = JSON.parse(raw);
	const rawScore = Math.min(input.maxScore, Math.max(0, Number(parsed.rawScore) || 0));
	return {
		rawScore,
		rubricScores: parsed.rubricScores ?? {},
		feedbackVi: parsed.feedbackVi ?? "",
	};
}

/**
 * Sum raw scores across 11 questions. Q1-10 max 3 each (30), Q11 max 5.
 * Total max raw = 35. Scaled to 0-200.
 */
export function rawToScaledSpeaking(rawSum: number): number {
	const MAX_RAW = 35;
	return Math.round((rawSum / MAX_RAW) * 200);
}
