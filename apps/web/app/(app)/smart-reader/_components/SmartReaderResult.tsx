"use client";

import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  FileText,
  GitBranch,
  Lightbulb,
  Sparkles,
  Target,
  Timer,
  Volume2,
} from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import type { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { ClauseNode, GrammarSentence, SmartReaderResponse } from "../page";

type Props = {
  result: SmartReaderResponse;
  tts: ReturnType<typeof useTextToSpeech>;
  sourceText?: string | null;
};

const DIFFICULTY_CONFIG = {
  beginner: { label: "Beginner", color: "text-success bg-success/10 border-success/30" },
  intermediate: { label: "Intermediate", color: "text-warning bg-warning/10 border-warning/30" },
  advanced: { label: "Advanced", color: "text-error bg-error/10 border-error/30" },
};

/** Old (pre-2026-06-14) flat grammar shape, kept for viewing legacy history entries. */
type LegacyGrammar = {
  sentenceStructure?: string;
  tenses?: Array<{ tense: string; example: string; explanation: string }>;
  clauses?: Array<{ text: string; type: string; connector?: string }>;
  keyPatterns?: Array<{ pattern: string; inText: string; usage: string }>;
};

function clauseTypeColor(type: string): string {
  if (type === "main clause") return "text-success bg-success/10 border-success/30";
  if (type === "relative clause") return "text-accent bg-accent/10 border-accent/30";
  return "text-warning bg-warning/10 border-warning/30";
}

/** Split a sentence into segments highlighting subject / verb / object in reading order. */
function buildSkeletonSegments(
  sentence: string,
  skeleton: GrammarSentence["skeleton"],
): Array<{ text: string; kind: "s" | "v" | "o" | null }> {
  const targets = [
    { text: skeleton.subject, kind: "s" as const },
    { text: skeleton.verb, kind: "v" as const },
    { text: skeleton.object ?? "", kind: "o" as const },
  ].filter((t) => t.text?.trim());

  const segments: Array<{ text: string; kind: "s" | "v" | "o" | null }> = [];
  let cursor = 0;
  for (const t of targets) {
    const idx = sentence.indexOf(t.text, cursor);
    if (idx === -1) continue;
    if (idx > cursor) segments.push({ text: sentence.slice(cursor, idx), kind: null });
    segments.push({ text: t.text, kind: t.kind });
    cursor = idx + t.text.length;
  }
  if (cursor < sentence.length) segments.push({ text: sentence.slice(cursor), kind: null });
  return segments.length ? segments : [{ text: sentence, kind: null }];
}

const SKELETON_HL: Record<"s" | "v" | "o", string> = {
  s: "bg-accent/10 text-accent",
  v: "bg-warning/15 text-warning",
  o: "bg-success/10 text-success",
};

/** Recursive clause-tree node. */
function ClauseTreeNode({ node, depth }: { node: ClauseNode; depth: number }) {
  return (
    <div
      className={`py-1.5 ${depth > 0 ? "border-l-2 border-border/60 pl-3 ml-1.5 mt-1.5" : "border-l-2 border-accent/40 pl-3"}`}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${clauseTypeColor(node.type)}`}
        >
          {node.type}
        </span>
        {node.connector && (
          <span className="text-[9px] font-bold text-text-muted bg-surface px-1.5 py-0.5 rounded-md border border-border">
            <span className="text-accent">{node.connector}</span>
          </span>
        )}
      </div>
      <p className="text-xs text-ink leading-relaxed mt-1">&quot;{node.text}&quot;</p>
      {node.role && <p className="text-[11px] text-text-muted italic mt-0.5">{node.role}</p>}
      {node.children?.map((child, i) => (
        <ClauseTreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

/** One analyzed sentence card. */
function SentenceCard({
  s,
  index,
  total,
  tts,
}: {
  s: GrammarSentence;
  index: number;
  total: number;
  tts: ReturnType<typeof useTextToSpeech>;
}) {
  const segments = buildSkeletonSegments(s.sentence, s.skeleton);
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-bg-deep/20 p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono">
          Câu {index + 1} / {total}
        </span>
        <div className="flex items-center gap-1.5">
          {s.structureLabel && (
            <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
              {s.structureLabel}
            </span>
          )}
          <button
            onClick={() => tts.speak(s.sentence)}
            disabled={tts.isLoading}
            className="text-text-muted hover:text-accent transition-colors cursor-pointer"
            aria-label="Listen to sentence"
          >
            <Volume2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Sentence with S–V–O highlight */}
      <p className="text-sm leading-loose text-ink">
        {segments.map((seg, i) =>
          seg.kind ? (
            <span key={i} className={`rounded px-1 py-0.5 ${SKELETON_HL[seg.kind]}`}>
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </p>

      {/* S–V–O chips */}
      <div className="flex flex-wrap gap-1.5">
        {s.skeleton.subject && (
          <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-1 rounded-md">
            S · {s.skeleton.subject}
          </span>
        )}
        {s.skeleton.verb && (
          <span className="text-[10px] font-bold bg-warning/15 text-warning px-2 py-1 rounded-md">
            V · {s.skeleton.verb}
          </span>
        )}
        <span className="text-[10px] font-bold bg-surface-hover text-text-muted px-2 py-1 rounded-md">
          O · {s.skeleton.object ?? "— (bị động/nội động từ)"}
        </span>
      </div>

      {/* Clause tree */}
      {s.clauseTree.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Cây mệnh đề
            </span>
          </div>
          <div>
            {s.clauseTree.map((node, i) => (
              <ClauseTreeNode key={i} node={node} depth={0} />
            ))}
          </div>
        </div>
      )}

      {/* Tenses with contrast */}
      {s.tenses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Thì & lý do
            </span>
          </div>
          {s.tenses.map((t, i) => (
            <div key={i} className="rounded-lg bg-surface border border-border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-md">
                  {t.tense}
                </span>
                <span className="text-xs text-ink font-medium italic">&quot;{t.example}&quot;</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">{t.contrast}</p>
            </div>
          ))}
        </div>
      )}

      {/* Patterns with rule + extra example + study hint */}
      {s.patterns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Cấu trúc nổi bật
            </span>
          </div>
          {s.patterns.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-1.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-md">
                  {p.pattern}
                </span>
                {p.ruleName && (
                  <span className="text-[10px] text-text-muted font-mono">
                    quy tắc: {p.ruleName}
                  </span>
                )}
              </div>
              {p.inText && (
                <p className="text-xs text-ink font-medium italic border-l-2 border-accent/30 pl-2">
                  &quot;{p.inText}&quot;
                </p>
              )}
              {p.usage && (
                <p className="text-[11px] text-text-secondary leading-relaxed">{p.usage}</p>
              )}
              {p.extraExample && (
                <p className="text-[11px] text-text-muted italic border-l-2 border-border pl-2">
                  Ví dụ thêm: &quot;{p.extraExample}&quot;
                </p>
              )}
              {p.studyHint && (
                <p className="text-[11px] text-accent inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3 shrink-0" /> {p.studyHint}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Learner note */}
      {s.learnerNote && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-warning leading-relaxed">
            <span className="font-bold">Lỗi người Việt hay mắc: </span>
            {s.learnerNote}
          </p>
        </div>
      )}
    </m.div>
  );
}

/** Compact renderer for legacy (pre-upgrade) history entries. */
function LegacyGrammar({ g }: { g: LegacyGrammar }) {
  return (
    <div className="border-t border-border/50 px-5 py-4 space-y-4">
      {g.sentenceStructure && (
        <p className="text-xs text-text-secondary italic">{g.sentenceStructure}</p>
      )}
      {g.tenses?.map((t, i) => (
        <div key={i} className="rounded-lg bg-surface border border-border p-3">
          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-md">
            {t.tense}
          </span>
          <p className="text-xs text-ink italic mt-1">&quot;{t.example}&quot;</p>
          <p className="text-[11px] text-text-secondary mt-1">{t.explanation}</p>
        </div>
      ))}
      {g.clauses?.map((c, i) => (
        <div key={i} className="rounded-lg border border-border p-2.5">
          <p className="text-xs text-ink">&quot;{c.text}&quot;</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${clauseTypeColor(c.type)}`}
            >
              {c.type}
            </span>
            {c.connector && (
              <span className="text-[9px] text-text-muted">connector: {c.connector}</span>
            )}
          </div>
        </div>
      ))}
      {g.keyPatterns?.map((p, i) => (
        <div key={i} className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-md">
            {p.pattern}
          </span>
          <p className="text-xs text-ink italic mt-1">&quot;{p.inText}&quot;</p>
          <p className="text-[11px] text-text-secondary mt-1">{p.usage}</p>
        </div>
      ))}
    </div>
  );
}

export function SmartReaderResult({ result, tts, sourceText }: Props) {
  const [expandedGrammar, setExpandedGrammar] = useState(true);
  const [copied, setCopied] = useState(false);

  const diffConfig = DIFFICULTY_CONFIG[result.difficultyLevel] ?? DIFFICULTY_CONFIG.intermediate;

  // grammarAnalysis may be the new sentence-centric shape, the legacy flat shape, or null.
  const ga = result.grammarAnalysis as
    | { focusSummary?: string; sentences?: GrammarSentence[] }
    | LegacyGrammar
    | null
    | undefined;
  const sentences = (ga as { sentences?: GrammarSentence[] })?.sentences;
  const isNewGrammar = Array.isArray(sentences) && sentences.length > 0;
  const legacy = ga as LegacyGrammar | null | undefined;
  const isLegacyGrammar =
    !isNewGrammar &&
    !!legacy &&
    (!!legacy.sentenceStructure ||
      (legacy.tenses?.length ?? 0) > 0 ||
      (legacy.clauses?.length ?? 0) > 0 ||
      (legacy.keyPatterns?.length ?? 0) > 0);
  const focusSummary = (ga as { focusSummary?: string })?.focusSummary;

  // Copy full analysis as text
  const copyAnalysis = useCallback(() => {
    const lines: string[] = [];
    if (sourceText) lines.push("📝 Original:", sourceText, "");
    lines.push("🇻🇳 Bản dịch tự nhiên:", result.naturalTranslation, "");

    if (isNewGrammar && sentences) {
      if (focusSummary) lines.push("🎯 Trọng tâm:", focusSummary, "");
      lines.push("🧠 Phân tích ngữ pháp:");
      sentences.forEach((s, i) => {
        lines.push(`  ${i + 1}. "${s.sentence}"`);
        lines.push(
          `     S–V–O: ${s.skeleton.subject} | ${s.skeleton.verb} | ${s.skeleton.object ?? "—"}`,
        );
        s.tenses.forEach((t) => lines.push(`     ⏱ ${t.tense}: ${t.contrast}`));
        s.patterns.forEach((p) => lines.push(`     ✦ ${p.pattern} (${p.ruleName}): ${p.usage}`));
        if (s.learnerNote) lines.push(`     ⚠ ${s.learnerNote}`);
      });
      lines.push("");
    }

    if (result.readingTips) lines.push("💡 Mẹo đọc hiểu:", result.readingTips);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result, sourceText, isNewGrammar, sentences, focusSummary]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-4"
    >
      {/* ── Source Text Card ── */}
      {sourceText && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Original Text
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => tts.speak(sourceText)}
                disabled={tts.isLoading || tts.isSpeaking}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
              >
                <Volume2 className="h-3 w-3" />
                <span>{tts.isSpeaking ? "Playing..." : "Listen"}</span>
              </button>
              <button
                onClick={copyAnalysis}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-success" />
                    <span className="text-success">Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3 w-3" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary italic">{sourceText}</p>
        </div>
      )}

      {/* ── Natural Translation ── */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🇻🇳</span>
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
              Bản dịch tự nhiên
            </span>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${diffConfig.color}`}
          >
            {diffConfig.label}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-ink font-medium">{result.naturalTranslation}</p>
      </div>

      {/* ── Grammar Analysis ── */}
      {(isNewGrammar || isLegacyGrammar) && (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedGrammar(!expandedGrammar)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Phân tích Grammar
              </span>
              {isNewGrammar && sentences && (
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
                  {sentences.length} câu
                </span>
              )}
            </div>
            {expandedGrammar ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {expandedGrammar &&
            (isNewGrammar && sentences ? (
              <div className="border-t border-border/50 px-5 py-4 space-y-4">
                {focusSummary && (
                  <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 flex gap-2.5">
                    <Target className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
                        Trọng tâm
                      </span>
                      <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                        {focusSummary}
                      </p>
                    </div>
                  </div>
                )}
                {sentences.map((s, i) => (
                  <SentenceCard key={i} s={s} index={i} total={sentences.length} tts={tts} />
                ))}
              </div>
            ) : (
              isLegacyGrammar && <LegacyGrammar g={legacy as LegacyGrammar} />
            ))}
        </div>
      )}

      {/* ── Reading Tips ── */}
      {result.readingTips && (
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex gap-3"
        >
          <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
              Mẹo đọc hiểu
            </span>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">{result.readingTips}</p>
          </div>
        </m.div>
      )}
    </m.div>
  );
}
