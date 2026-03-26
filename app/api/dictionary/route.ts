import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { VocabularySchema } from "@/lib/schemas/vocabulary";

const DICTIONARY_SYSTEM_PROMPT =
  "You are Cô Minh, a lively Vietnamese-English dictionary. Return concise, helpful vocabulary data strictly matching the provided schema. Write the meaning in Vietnamese with a playful tone and include a natural example sentence.";

function isUsableVocabularyWord(word: string) {
  return /^[A-Za-z][A-Za-z'-]{0,47}$/.test(word);
}

function isUsableVocabularyResult(result: {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  grammar_notes: string[];
}) {
  return (
    result.word.trim().length > 0 &&
    result.phonetic.trim().length > 0 &&
    result.meaning.trim().length > 0 &&
    result.example.trim().length > 0 &&
    result.grammar_notes.length > 0 &&
    result.grammar_notes.every((note) => note.trim().length > 0)
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { word?: unknown }
      | null;

    const word = typeof body?.word === "string" ? body.word.trim() : "";

    if (!word || !isUsableVocabularyWord(word)) {
      return NextResponse.json(
        { error: "Word must be a single English word." },
        { status: 400 },
      );
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: DICTIONARY_SYSTEM_PROMPT,
      prompt: `Define the English word ${JSON.stringify(word)} and return the result strictly in the required JSON format.`,
      schema: VocabularySchema,
    });

    if (!isUsableVocabularyResult(result.object)) {
      return NextResponse.json(
        { error: "Dictionary result was empty or incomplete." },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: result.object });
  } catch (error) {
    console.error("Dictionary API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
