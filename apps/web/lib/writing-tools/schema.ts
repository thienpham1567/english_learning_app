import { z } from "zod";

/* ── Grammar Check ────────────────────────────────────── */

export const GrammarCheckRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .refine(
      (t) => t.trim().split(/\s+/).filter(Boolean).length <= 500,
      "Maximum 500 words allowed",
    ),
});

export const GrammarErrorSchema = z.object({
  offset: z.number(),
  length: z.number(),
  type: z.enum(["grammar", "spelling", "style"]),
  original: z.string(),
  correction: z.string(),
  explanationVi: z.string(),
  explanationEn: z.string(),
  rule: z.string(),
});

export const GrammarCheckResponseSchema = z.object({
  errors: z.array(GrammarErrorSchema),
  correctedText: z.string(),
  stats: z.object({
    grammar: z.number(),
    spelling: z.number(),
    style: z.number(),
  }),
  /** Set (in Vietnamese) when the input is not valid English to check. */
  notice: z.string().optional(),
});

export type GrammarCheckRequest = z.infer<typeof GrammarCheckRequestSchema>;
export type GrammarError = z.infer<typeof GrammarErrorSchema>;
export type GrammarCheckResponse = z.infer<typeof GrammarCheckResponseSchema>;

/* ── Paraphrase ───────────────────────────────────────── */

export const PARAPHRASE_MODES = [
  "standard",
  "fluency",
  "formal",
  "simple",
  "creative",
  "expand",
  "shorten",
] as const;

export type ParaphraseMode = (typeof PARAPHRASE_MODES)[number];

export const ParaphraseRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .refine(
      (t) => t.trim().split(/\s+/).filter(Boolean).length <= 500,
      "Maximum 500 words allowed",
    ),
  mode: z.enum(PARAPHRASE_MODES),
  synonymLevel: z.number().min(0).max(100).default(50),
});

export const ParaphraseChangeSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  reason: z.string(),
  definitionVi: z.string().optional(),
});

export const ParaphraseResponseSchema = z.object({
  result: z.string(),
  changes: z.array(ParaphraseChangeSchema),
  /** Set (in Vietnamese) when the input is not valid English to paraphrase. */
  notice: z.string().optional(),
});

export type ParaphraseRequest = z.infer<typeof ParaphraseRequestSchema>;
export type ParaphraseChange = z.infer<typeof ParaphraseChangeSchema>;
export type ParaphraseResponse = z.infer<typeof ParaphraseResponseSchema>;
