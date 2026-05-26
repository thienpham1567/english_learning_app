"use client";

import { useState, useCallback, useMemo } from "react";

import { api } from "@/lib/api-client";
import type { GrammarCheckResponse, GrammarError } from "@/lib/writing-tools/schema";
import {
  AlertTriangle,
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  Copy,
  Lightbulb,
  Loader2,
  Zap,
} from "lucide-react";

const MAX_WORDS = 500;

const TYPE_META: Record<string, { label: string; labelVi: string; color: string; icon: React.ReactNode }> = {
  grammar: { label: "Grammar", labelVi: "Ngữ pháp", color: "var(--error)", icon: <Bug /> },
  spelling: { label: "Spelling", labelVi: "Chính tả", color: "var(--warning, #e8a838)", icon: <AlertTriangle /> },
  style: { label: "Style", labelVi: "Phong cách", color: "var(--info, #5b8def)", icon: <Lightbulb /> },
};

/* ── Example prompts for instant demo ──────────────────── */

const EXAMPLE_PROMPTS = [
  { label: "Subject-verb agreement", text: "She don't know the answer because she didn't studied for the exam.", color: "var(--error)" },
  { label: "Uncountable nouns", text: "The informations is very important for us. We need more evidences.", color: "var(--warning, #e8a838)" },
  { label: "Tense errors", text: "I have been to Japan since 3 years. Yesterday I go to the store and buyed some milk.", color: "var(--error)" },
  { label: "Article & preposition", text: "She is interested on learning the English. He arrived to the office in Monday morning.", color: "var(--info, #5b8def)" },
];

/* ── Score gauge component ─────────────────────────────── */

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 90 ? "var(--success)" :
    score >= 70 ? "var(--accent)" :
    score >= 50 ? "var(--warning, #e8a838)" :
    "var(--error)";

  return (
    <div className="flex flex-col items-center gap-1" >
      <svg width={96} height={96} viewBox="0 0 96 96">
        {/* Background ring */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="var(--surface)" strokeWidth="6"
        />
        {/* Score arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
        />
        {/* Score number */}
        <text
          x="48" y="44"
          textAnchor="middle" dominantBaseline="central" className="font-display font-bold" style={{fontSize: 26, fill: color}} >
          {score}
        </text>
        <text
          x="48" y="62"
          textAnchor="middle" dominantBaseline="central" className="text-[9px] font-medium" style={{fill: "var(--text-muted)"}} >
          / 100
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{color}} >{label}</span>
    </div>
  );
}

/* ── Copy button ───────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      
      title="Sao chép" className="border-none bg-transparent cursor-pointer text-[13px] py-1 px-2 rounded-md" style={{color: copied ? "var(--success)" : "var(--text-secondary)"}} >
      {copied ? <Check /> : <Copy />}
    </button>
  );
}

/* ── Error card ────────────────────────────────────────── */

function ErrorCard({
  error,
  onApply,
}: {
  error: GrammarError;
  onApply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[error.type] ?? TYPE_META.grammar;

  return (
    <div className="rounded-xl border border-(--border) overflow-hidden" style={{background: "var(--card-bg)", transition: "box-shadow 0.2s"}} >
      {/* Header */}
      <div
        
        onClick={() => setExpanded((p) => !p)} className="flex items-center justify-between cursor-pointer" style={{padding: "10px 14px", borderLeft: `4px solid ${meta.color}`}} >
        <div className="flex items-center gap-2" >
          <span className="text-[13px]" style={{color: meta.color}} >{meta.icon}</span>
          <span className="text-[11px] font-semibold" style={{color: meta.color, padding: "2px 8px", borderRadius: 10, background: `color-mix(in srgb, ${meta.color} 10%, transparent)`}} >
            {meta.labelVi}
          </span>
          <span className="text-[13px] text-text-muted" style={{textDecoration: "line-through"}} >
            {error.original}
          </span>
          <span className="text-text-primary text-[13px]" >→</span>
          <span className="text-[13px] text-emerald-500 font-medium" >
            {error.correction}
          </span>
        </div>
        <div className="flex items-center gap-1.5" >
          <span className="text-text-muted text-[10px]" >
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="flex flex-col gap-2" style={{padding: "0 14px 12px 22px"}} >
          {/* Rule tag */}
          <span className="text-[11px] text-text-secondary italic" >
            Rule: {error.rule}
          </span>

          {/* Vietnamese explanation */}
          <div className="py-2 px-3 rounded-lg bg-(--surface) text-[13px] leading-relaxed" >
            <span className="font-semibold text-text-secondary text-[11px]" >
              🇻🇳 Giải thích:
            </span>
            <p className="text-text-primary" style={{margin: "4px 0 0"}} >
              {error.explanationVi}
            </p>
          </div>

          {/* English explanation */}
          <div className="py-2 px-3 rounded-lg bg-(--surface) text-[13px] leading-relaxed" >
            <span className="font-semibold text-text-secondary text-[11px]" >
              🇬🇧 Explanation:
            </span>
            <p className="text-text-primary" style={{margin: "4px 0 0"}} >
              {error.explanationEn}
            </p>
          </div>

          {/* Apply button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }} className="py-1.5 px-3.5 rounded-lg border-none text-xs font-semibold cursor-pointer flex items-center gap-1" style={{alignSelf: "flex-start", background: "var(--accent)", color: "var(--text-on-accent)"}} >
            <CircleCheckBig /> Áp dụng sửa lỗi
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main GrammarChecker component ─────────────────────── */

export function GrammarChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;

  const check = useCallback(async () => {
    if (!text.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<GrammarCheckResponse>("/writing-tools/grammar-check", {
        text: text.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(msg.includes("Rate limit") || msg.includes("429")
        ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút."
        : msg);
    } finally {
      setLoading(false);
    }
  }, [text, overLimit]);

  const applyFix = useCallback(
    (err: GrammarError) => {
      const before = text.slice(0, err.offset);
      const after = text.slice(err.offset + err.length);
      const newText = before + err.correction + after;
      setText(newText);

      // Recalculate remaining errors with adjusted offsets
      if (result) {
        const lengthDiff = err.correction.length - err.original.length;
        const updatedErrors = result.errors
          .filter((e) => e !== err)
          .map((e) => ({
            ...e,
            offset: e.offset > err.offset ? e.offset + lengthDiff : e.offset,
          }));
        setResult({
          ...result,
          errors: updatedErrors,
          stats: {
            grammar: updatedErrors.filter((e) => e.type === "grammar").length,
            spelling: updatedErrors.filter((e) => e.type === "spelling").length,
            style: updatedErrors.filter((e) => e.type === "style").length,
          },
        });
      }
    },
    [text, result],
  );

  const applyAll = useCallback(() => {
    if (!result) return;
    setText(result.correctedText);
    setResult({ ...result, errors: [], stats: { grammar: 0, spelling: 0, style: 0 } });
  }, [result]);

  const totalErrors = result ? result.errors.length : 0;

  // Writing score — computed from error density
  const writingScore = useMemo(() => {
    if (!result || wordCount === 0) return null;
    const raw = Math.max(0, 100 - (totalErrors / wordCount) * 200);
    return Math.round(Math.min(100, raw));
  }, [result, totalErrors, wordCount]);

  const scoreLabel = useMemo(() => {
    if (writingScore === null) return "";
    if (writingScore >= 90) return "Tuyệt vời!";
    if (writingScore >= 70) return "Khá tốt";
    if (writingScore >= 50) return "Cần cải thiện";
    return "Nhiều lỗi";
  }, [writingScore]);

  // Keyboard handler — Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        check();
      }
    },
    [check],
  );

  return (
    <div className="flex flex-col gap-4" >
      {/* Input area */}
      <div>
        <div className="flex justify-between items-center mb-2" >
          <span className="text-[13px] font-medium text-text-secondary" >
            Nhập hoặc dán văn bản cần kiểm tra
          </span>
          <span className="text-xs" style={{color: overLimit ? "var(--error)" : "var(--text-muted)", fontWeight: overLimit ? 600 : 400}} >
            {wordCount}/{MAX_WORDS} từ
          </span>
        </div>

        <textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }} onKeyDown={handleKeyDown} placeholder="Type or paste your English text here..." className={`app-textarea ${overLimit ? "border-error" : ""} w-full h-[180px] p-4 text-[15px]`} style={{lineHeight: 1.7, resize: "vertical", fontFamily: "inherit"}} />
      </div>

      {/* Example prompts — only show when textarea is empty */}
      {!text.trim() && !result && (
        <div>
          <span className="text-[11px] font-bold uppercase text-text-muted flex items-center gap-1.5 mb-2" style={{letterSpacing: "0.12em"}} >
            <Zap size={10} />
            Thử ngay
          </span>
          <div className="grid gap-2" style={{gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))"}} >
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex.text)}
                
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.borderLeftColor = ex.color;
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }} className="text-left border border-(--border) cursor-pointer flex flex-col gap-1" style={{padding: "10px 14px", borderRadius: 10, borderLeft: `3px solid ${ex.color}`, background: "var(--card-bg)", transition: "all 0.15s"}} >
                <span className="text-[11px] font-semibold" style={{color: ex.color}} >
                  {ex.label}
                </span>
                <span className="text-[13px] text-text-secondary leading-normal italic overflow-hidden" style={{textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"}} >
                  {ex.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2.5 flex-wrap" >
        <button
          onClick={check}
          disabled={!text.trim() || overLimit || loading} className="border-none text-sm font-semibold flex items-center gap-1.5" style={{padding: "10px 24px", borderRadius: 10, background: !text.trim() || overLimit || loading ? "var(--border)" : "var(--accent)", color: "var(--text-on-accent)", cursor: !text.trim() || overLimit || loading ? "not-allowed" : "pointer", transition: "background 0.2s"}} >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Đang kiểm tra...
            </>
          ) : (
            <>
              <CircleCheckBig /> Kiểm tra ngữ pháp
            </>
          )}
        </button>

        {result && totalErrors > 0 && (
          <button
            onClick={applyAll} className="bg-transparent text-emerald-500 text-[13px] font-semibold cursor-pointer flex items-center gap-1.5" style={{padding: "10px 20px", borderRadius: 10, border: "1px solid var(--success)"}} >
            <CircleCheckBig /> Sửa tất cả ({totalErrors})
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span className="text-[11px] text-text-muted italic" >
            ⌘/Ctrl + Enter
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="py-2.5 px-4 text-destructive text-[13px]" style={{borderRadius: 10, background: "var(--error-bg)"}} >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3" >
          {/* Score + Stats dashboard */}
          <div className="anim-fade-up flex rounded-2xl overflow-hidden" style={{gap: 1, background: "var(--border)", border: totalErrors === 0 ? "1px solid var(--success)" : "1px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
            {/* Writing score gauge */}
            {writingScore !== null && (
              <div className="flex items-center justify-center py-4 px-5 w-[130px]" style={{background: totalErrors === 0
                    ? "color-mix(in srgb, var(--success) 6%, var(--surface))"
                    : "var(--surface)"}} >
                <ScoreGauge score={writingScore} label={scoreLabel} />
              </div>
            )}

            {/* Stats cells */}
            {totalErrors === 0 ? (
              <div className="flex-1 flex items-center gap-2.5" style={{padding: "18px 22px", background: "color-mix(in srgb, var(--success) 6%, var(--surface))"}} >
                <CircleCheckBig className="text-emerald-500 text-xl" />
                <div>
                  <div className="text-base font-bold text-emerald-500 font-display" >
                    Tuyệt vời!
                  </div>
                  <div className="text-xs text-text-muted" style={{marginTop: 2}} >
                    Không phát hiện lỗi nào
                  </div>
                </div>
              </div>
            ) : (
              <>
                {[
                  { label: "Ngữ pháp", value: result.stats.grammar, color: "var(--error)", icon: "✗" },
                  { label: "Chính tả", value: result.stats.spelling, color: "var(--warning, #e8a838)", icon: "!" },
                  { label: "Phong cách", value: result.stats.style, color: "var(--info, #5b8def)", icon: "~" },
                ].map((s) => (
                  <div
                    key={s.label} className="flex-1 flex items-center gap-3 bg-(--surface)" style={{padding: "18px 18px"}} >
                    <span className="text-[11px] font-black leading-none" style={{color: s.value > 0 ? s.color : "var(--text-muted)", opacity: 0.6, fontFamily: "monospace"}} >
                      {s.icon}
                    </span>
                    <div>
                      <div className="text-3xl font-extrabold leading-none font-display" style={{color: s.value > 0 ? s.color : "var(--text-muted)"}} >
                        {s.value}
                      </div>
                      <div className="text-[10px] text-text-muted font-medium uppercase" style={{marginTop: 2, letterSpacing: "0.1em"}} >
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Error cards */}
          {result.errors.map((err, i) => (
            <ErrorCard key={`${err.offset}-${i}`} error={err} onApply={() => applyFix(err)} />
          ))}

          {/* Corrected text */}
          {totalErrors > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5" >
                <span className="text-xs font-semibold text-text-secondary" >
                  Văn bản đã sửa
                </span>
                <CopyButton text={result.correctedText} />
              </div>
              <div className="p-4 rounded-xl text-sm text-text-primary" style={{background: "color-mix(in srgb, var(--success) 5%, var(--card-bg))", border: "1px solid color-mix(in srgb, var(--success) 20%, var(--border))", lineHeight: 1.7, whiteSpace: "pre-wrap"}} >
                {result.correctedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
