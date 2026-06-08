import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { buildAnalyzePrompt } from "@/lib/morphology/prompt";
import { MorphemeAnalysisSchema, MorphemeAnalyzeRequestSchema } from "@/lib/morphology/schema";
import { completeJson, LlmJsonError } from "@/lib/openai/complete-json";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("morphology/analyze");

/**
 * POST /api/morphology/analyze
 *
 * Splits an arbitrary word into its morphemes and returns its word family.
 * Reference/explorer mode — no caching, no XP. Body: { word }.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = MorphemeAnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const word = parsed.data.word.trim();

  try {
    const analysis = await completeJson({
      model: openAiConfig.chatModel,
      system: buildAnalyzePrompt(word),
      user: `Analyze "${word}". Return JSON only.`,
      schema: MorphemeAnalysisSchema,
      temperature: 0.3,
      maxTokens: 2500,
    });
    return Response.json(analysis);
  } catch (err) {
    const kind = err instanceof LlmJsonError ? err.kind : "unknown";
    log.error({ err, kind, word }, "morphology.analyze.failed");
    return Response.json({ error: "Could not analyze that word" }, { status: 502 });
  }
}
