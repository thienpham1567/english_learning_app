# Dictionary Result View Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dual US/UK IPA phonetics with audio playback buttons and a Part of Speech badge to the dictionary result card.

**Architecture:** Three-layer change — extend Zod schema with 3 new nullable fields, update the LLM prompt to populate them, then update the UI to display them. Old cached DB entries lack the new fields but return `undefined` at runtime (treated as falsy) so the UI falls back gracefully to the existing `phonetic` field. Audio playback uses the browser Web Speech API with a module-level utterance ref to prevent simultaneous playback.

**Tech Stack:** Zod, Next.js App Router, React, lucide-react, Web Speech API, Vitest + Testing Library

---

## Files

- Modify: `lib/schemas/vocabulary.ts`
- Modify: `lib/dictionary/prompt.ts`
- Modify: `lib/dictionary/__tests__/prompt.test.ts`
- Modify: `components/dictionary/DictionaryResultCard.tsx`
- Modify: `components/dictionary/__tests__/DictionaryResultCard.test.tsx`
- Modify: `app/api/dictionary/__tests__/route.test.ts` (mock response needs new fields)

---

### Task 1: Extend VocabularySchema with phoneticsUs, phoneticsUk, partOfSpeech

**Files:**
- Modify: `lib/schemas/vocabulary.ts`
- Modify: `app/api/dictionary/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `app/api/dictionary/__tests__/route.test.ts` — a new test that verifies the parsed response shape includes the new fields. Place it after the existing `"accepts a phrasal verb query"` test.

Also update the OpenAI mock `output_text` to include the new fields (the schema parse will fail without them since they are `.nullable()` — required but null-able):

```typescript
// In the vi.mock("@/lib/openai/client", ...) block, update output_text:
output_text: JSON.stringify({
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb",
  phonetic: null,
  phoneticsUs: "/teɪk ɒf/",
  phoneticsUk: "/teɪk ɒf/",
  partOfSpeech: "phrasal verb",
  level: null,
  register: null,
  overviewVi: "Một cụm động từ thông dụng.",
  overviewEn: "A common phrasal verb.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Cất cánh",
      definitionEn: "To leave the ground and begin flying.",
      usageNoteVi: null,
      examples: [],
      examplesVi: [
        "Máy bay cất cánh đúng giờ.",
        "Chuyến bay cất cánh lúc bình minh.",
        "Tôi nhìn qua cửa sổ khi máy bay cất cánh.",
      ],
      synonyms: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
}),
```

Also add the new fields to the `cachedData` object in the `"returns cached:true"` test:
```typescript
const cachedData = {
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb",
  phonetic: null,
  phoneticsUs: null,
  phoneticsUk: null,
  partOfSpeech: null,
  // ... rest unchanged
```

Add a new test at the end of the describe block:
```typescript
it("returns phoneticsUs, phoneticsUk, and partOfSpeech in the response data", async () => {
  const { POST } = await import("@/app/api/dictionary/route");
  const response = await POST(
    new Request("http://localhost/api/dictionary", {
      method: "POST",
      body: JSON.stringify({ word: "take off" }),
    }),
  );

  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.data).toHaveProperty("phoneticsUs", "/teɪk ɒf/");
  expect(body.data).toHaveProperty("phoneticsUk", "/teɪk ɒf/");
  expect(body.data).toHaveProperty("partOfSpeech", "phrasal verb");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run app/api/dictionary/__tests__/route.test.ts
```

Expected: failures because `phoneticsUs`, `phoneticsUk`, `partOfSpeech` are unknown fields in `VocabularySchema`.

- [ ] **Step 3: Add the three fields to VocabularySchema**

Replace the full content of `lib/schemas/vocabulary.ts`:

```typescript
import { z } from "zod";

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().nullable(),
  examplesVi: z.array(z.string()).default([]),
  examples: z
    .array(z.object({ en: z.string(), vi: z.string() }))
    .default([]),
  synonyms: z.array(z.string()).default([]),
  patterns: z.array(z.string()),
  relatedExpressions: z.array(z.string()),
  commonMistakesVi: z.array(z.string()),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: z.enum(["word", "collocation", "phrasal_verb", "idiom"]),
  phonetic: z.string().nullable(),
  phoneticsUs: z.string().nullable(),
  phoneticsUk: z.string().nullable(),
  partOfSpeech: z.string().nullable(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable(),
  register: z.string().nullable(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run app/api/dictionary/__tests__/route.test.ts
```

Expected: all 5 tests pass (4 existing + 1 new).

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/vocabulary.ts app/api/dictionary/__tests__/route.test.ts
git commit -m "feat: extend VocabularySchema with phoneticsUs, phoneticsUk, partOfSpeech"
```

---

### Task 2: Update LLM prompt to request IPA and POS

**Files:**
- Modify: `lib/dictionary/prompt.ts`
- Modify: `lib/dictionary/__tests__/prompt.test.ts`

- [ ] **Step 1: Write the failing tests**

Add two tests to `lib/dictionary/__tests__/prompt.test.ts`:

```typescript
it("instructs populating US and UK IPA phonetics", () => {
  const instructions = buildDictionaryInstructions("word");
  expect(instructions).toContain("phoneticsUs");
  expect(instructions).toContain("phoneticsUk");
});

it("instructs populating partOfSpeech", () => {
  const instructions = buildDictionaryInstructions("word");
  expect(instructions).toContain("partOfSpeech");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/dictionary/__tests__/prompt.test.ts
```

Expected: 2 new tests fail.

- [ ] **Step 3: Update buildDictionaryInstructions**

Replace the full content of `lib/dictionary/prompt.ts`:

```typescript
import type { DictionaryEntryType } from "@/lib/dictionary/classify-entry";

export function buildDictionaryInstructions(entryType: DictionaryEntryType) {
  return [
    "You are Từ điển cô Lành, a learner-focused English dictionary.",
    "Return valid JSON matching the provided schema.",
    "Provide Vietnamese and English explanations for every sense.",
    "For each sense, provide 3 to 5 examples. Each example must be a bilingual pair: an English sentence (en) and its Vietnamese translation (vi).",
    "For each sense, provide 3 to 5 semantically relevant English synonyms.",
    "Populate phoneticsUs with the American English IPA transcription (e.g. /teɪk ɒf/). Use null if unavailable.",
    "Populate phoneticsUk with the British English IPA transcription. Use null if unavailable.",
    "Populate partOfSpeech with the grammatical category (e.g. phrasal verb, noun, adjective). Use null if unclear.",
    `Entry type: ${entryType}`,
  ].join("\n");
}
```

- [ ] **Step 4: Run all prompt tests**

```bash
npx vitest run lib/dictionary/__tests__/prompt.test.ts
```

Expected: all 5 tests pass (3 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/dictionary/prompt.ts lib/dictionary/__tests__/prompt.test.ts
git commit -m "feat: instruct LLM to populate phoneticsUs, phoneticsUk, partOfSpeech"
```

---

### Task 3: UI — POS badge, dual phonetics, audio playback

**Files:**
- Modify: `components/dictionary/DictionaryResultCard.tsx`
- Modify: `components/dictionary/__tests__/DictionaryResultCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add the following tests to `components/dictionary/__tests__/DictionaryResultCard.test.tsx`.

First, add a helper fixture at the top of the file (after existing fixtures):

```typescript
const ipaEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: "/rʌn/",
  phoneticsUs: "/rʌn/",
  phoneticsUk: "/rɑːn/",
  partOfSpeech: "verb",
  level: "A1" as const,
  register: null,
  overviewVi: "Chạy.",
  overviewEn: "To move fast.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy",
      definitionEn: "Move fast on foot.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};
```

Also update ALL existing fixtures that don't already have the new fields — add `phoneticsUs: null, phoneticsUk: null, partOfSpeech: null` to `singleSenseEntry`, `multiSenseEntry`, `bilingualEntry`, and `synonymEntry`.

Then add these new tests inside the `describe("DictionaryResultCard", ...)` block:

```typescript
it("renders dual US and UK phonetics when phoneticsUs and phoneticsUk are set", () => {
  const { getByText } = renderUi(
    <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
  );
  expect(getByText("/rʌn/")).toBeInTheDocument();
  expect(getByText("/rɑːn/")).toBeInTheDocument();
});

it("renders POS badge when partOfSpeech is set", () => {
  const { getByText } = renderUi(
    <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
  );
  expect(getByText("verb")).toBeInTheDocument();
});

it("falls back to single phonetic when phoneticsUs and phoneticsUk are null", () => {
  const { getByText, queryByLabelText } = renderUi(
    <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
  );
  expect(getByText("/teɪk ˈɒf/")).toBeInTheDocument();
  expect(queryByLabelText("Play US pronunciation")).not.toBeInTheDocument();
});

it("audio buttons call speechSynthesis.speak with correct lang", () => {
  const mockSpeak = vi.fn();
  const mockCancel = vi.fn();
  Object.defineProperty(window, "speechSynthesis", {
    value: { speak: mockSpeak, cancel: mockCancel },
    writable: true,
    configurable: true,
  });
  const mockUtterance = { lang: "", onstart: null as (() => void) | null, onend: null as (() => void) | null, onerror: null as (() => void) | null };
  vi.stubGlobal("SpeechSynthesisUtterance", vi.fn(() => mockUtterance));

  const { getByLabelText } = renderUi(
    <DictionaryResultCard vocabulary={ipaEntry} hasSearched isLoading={false} onSynonymClick={vi.fn()} />,
  );

  fireEvent.click(getByLabelText("Play US pronunciation"));
  expect(mockSpeak).toHaveBeenCalledOnce();
  expect(mockUtterance.lang).toBe("en-US");

  fireEvent.click(getByLabelText("Play UK pronunciation"));
  expect(mockCancel).toHaveBeenCalled();
  expect(mockUtterance.lang).toBe("en-GB");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run components/dictionary/__tests__/DictionaryResultCard.test.tsx
```

Expected: 4 new tests fail (TypeScript errors on missing fields in fixtures + assertions not found).

- [ ] **Step 3: Implement the UI changes**

Replace the full content of `components/dictionary/DictionaryResultCard.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import { Bookmark, BookmarkCheck, BookOpen, Languages, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onSynonymClick: (word: string) => void;
};

const SENSE_ITEM_CLASS =
  "border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]";

const ENTRY_TYPE_LABELS: Record<Vocabulary["entryType"], string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

// Module-level: ensures only one utterance plays at a time across re-renders
let activeUtterance: SpeechSynthesisUtterance | null = null;

function SensePanel({
  sense,
  onSynonymClick,
}: {
  sense: DictionarySense;
  onSynonymClick: (word: string) => void;
}) {
  const examples = sense.examples ?? [];
  const examplesVi = sense.examplesVi ?? [];
  const synonyms = sense.synonyms ?? [];

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      {(examples.length > 0 || examplesVi.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ví dụ
          </h3>
          <ul className="space-y-2">
            {examples.length > 0
              ? examples.map((example, i) => (
                  <li key={i} className={SENSE_ITEM_CLASS}>
                    <span className="flex items-baseline gap-1.5">
                      <span>{example.en}</span>
                      {example.vi && (
                        <Tooltip placement="top" title={example.vi}>
                          <span
                            data-testid="translate-icon"
                            className="inline-flex shrink-0 cursor-default items-center text-[var(--text-muted)] transition hover:text-[var(--accent)]"
                          >
                            <Languages size={13} />
                          </span>
                        </Tooltip>
                      )}
                    </span>
                  </li>
                ))
              : examplesVi.map((example) => (
                  <li key={example} className={SENSE_ITEM_CLASS}>
                    {example}
                  </li>
                ))}
          </ul>
        </section>
      )}

      {synonyms.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Từ đồng nghĩa
          </h3>
          <div className="flex flex-wrap gap-2">
            {synonyms.map((synonym) => (
              <button
                key={synonym}
                type="button"
                onClick={() => onSynonymClick(synonym)}
                className="rounded-full border border-(--border) bg-transparent px-3 py-1 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {synonym}
              </button>
            ))}
          </div>
        </section>
      )}

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.patterns.map((pattern) => (
              <li key={pattern} className={SENSE_ITEM_CLASS}>
                {pattern}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className="space-y-2">
            {sense.relatedExpressions.map((expr) => (
              <li key={expr} className={SENSE_ITEM_CLASS}>
                {expr}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake} className={SENSE_ITEM_CLASS}>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}

function AudioButton({
  locale,
  speakingLocale,
  onSpeak,
}: {
  locale: "en-US" | "en-GB";
  speakingLocale: string | null;
  onSpeak: (locale: "en-US" | "en-GB") => void;
}) {
  return (
    <button
      type="button"
      aria-label={locale === "en-US" ? "Play US pronunciation" : "Play UK pronunciation"}
      onClick={() => onSpeak(locale)}
      className="grid size-6 place-items-center rounded text-[var(--text-muted)] transition hover:text-[var(--accent)]"
    >
      {speakingLocale === locale ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Volume2 size={13} />
      )}
    </button>
  );
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
  onSynonymClick,
}: DictionaryResultCardProps) {
  const firstSenseId = vocabulary?.senses[0]?.id ?? "";
  const [activeKey, setActiveKey] = useState(firstSenseId);
  const [speakingLocale, setSpeakingLocale] = useState<string | null>(null);

  useEffect(() => {
    setActiveKey(firstSenseId);
  }, [firstSenseId]);

  function speak(locale: "en-US" | "en-GB") {
    if (!vocabulary) return;
    if (activeUtterance) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    }
    const utterance = new SpeechSynthesisUtterance(vocabulary.headword);
    utterance.lang = locale;
    utterance.onstart = () => setSpeakingLocale(locale);
    utterance.onend = () => { setSpeakingLocale(null); activeUtterance = null; };
    utterance.onerror = () => { setSpeakingLocale(null); activeUtterance = null; };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        <div className="animate-pulse space-y-5">
          <div>
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-deep)]" />
            <div className="mt-3 h-8 w-44 rounded-lg bg-[var(--bg-deep)]" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-[var(--bg-deep)]" />
              <div className="h-6 w-9 rounded-full bg-[var(--bg-deep)]" />
            </div>
          </div>
          <div className="h-3.5 w-28 rounded bg-[var(--bg-deep)]" />
          <div className="space-y-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-3/5 rounded bg-[var(--border-strong)]" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-16 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-2/3 rounded bg-[var(--border-strong)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        {!hasSearched ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <BookOpen size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Nhập từ cần tra</p>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
              Chưa có kết quả để hiển thị
            </h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc.
            </p>
          </div>
        )}
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-4xl italic leading-tight [font-family:var(--font-display)] text-(--ink)">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="gold" variant="outlined">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag
                  color={LEVEL_COLORS[vocabulary.level] ?? "default"}
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1"
                >
                  {vocabulary.level}
                </Tag>
              )}
              {vocabulary.partOfSpeech && (
                <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
                  {vocabulary.partOfSpeech}
                </Tag>
              )}
              {saved != null && onToggleSaved && (
                <button
                  onClick={onToggleSaved}
                  className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                  aria-label={saved ? "Bỏ lưu từ này" : "Lưu từ này"}
                >
                  {saved ? (
                    <BookmarkCheck size={18} className="text-[var(--accent)]" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          {hasDualPhonetics ? (
            <motion.div
              className="mt-3 flex flex-col gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phoneticsUs && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇺🇸</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUs}
                  </span>
                  <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
              {vocabulary.phoneticsUk && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUk}
                  </span>
                  <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
            </motion.div>
          ) : vocabulary.phonetic ? (
            <motion.span
              className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.span>
          ) : null}

          <motion.div
            className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--accent-light)] text-[var(--accent)]">VI</span>
              <p>{vocabulary.overviewVi}</p>
            </div>
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--bg)] text-[var(--text-muted)]">EN</span>
              <p>{vocabulary.overviewEn}</p>
            </div>
          </motion.div>

          <div className="mt-6">
            <div className="flex gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
              {vocabulary.senses.map((sense) => (
                <button
                  key={sense.id}
                  type="button"
                  aria-selected={activeKey === sense.id}
                  onClick={() => setActiveKey(sense.id)}
                  className={[
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                    activeKey === sense.id
                      ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  {sense.label}
                </button>
              ))}
            </div>
            {activeSense && (
              <SensePanel sense={activeSense} onSynonymClick={onSynonymClick} />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run all DictionaryResultCard tests**

```bash
npx vitest run components/dictionary/__tests__/DictionaryResultCard.test.tsx
```

Expected: all tests pass (existing 9 + new 4 = 13 total).

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/dictionary/DictionaryResultCard.tsx components/dictionary/__tests__/DictionaryResultCard.test.tsx
git commit -m "feat: add dual IPA phonetics, audio playback, and POS badge to dictionary card"
```
