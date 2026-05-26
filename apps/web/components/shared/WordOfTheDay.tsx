"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  BookOpen,
  CheckCircle,
  Loader2,
  Star,
  Volume2,
} from "lucide-react";

type WordData = {
  query: string;
  headword: string;
  overviewVi: string;
  overviewEn: string;
  partOfSpeech: string | null;
  level: string | null;
  pronunciation: string | null;
  example: string | null;
  saved: boolean;
};

/**
 * WordOfTheDay card for the Home page (Story 14.3).
 * Fetches from /api/word-of-the-day, shows word details + quick-save.
 */
export function WordOfTheDay() {
  const [word, setWord] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.get<{ word?: WordData }>("/word-of-the-day")
      .then((data) => {
        if (data?.word) {
          setWord(data.word);
          setIsSaved(data.word.saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { speak: speakTts, isLoading: isTtsLoading } = useTextToSpeech();

  const playAudio = useCallback(() => {
    if (!word) return;
    speakTts(word.headword);
  }, [word, speakTts]);

  const saveWord = useCallback(async () => {
    if (!word || isSaved) return;
    setSaving(true);
    try {
      await api.post("/vocabulary/save", { query: word.query });
      setIsSaved(true);
    } catch {
      /* silently fail */
    }
    setSaving(false);
  }, [word, isSaved]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <m.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} className="p-6 border-2 border-border flex items-center justify-center h-[120px]" style={{borderRadius: "var(--radius-lg, 16px)", background: "var(--card-bg, var(--surface))"}} >
          <Loader2 className="animate-spin text-accent" size={20} />
        </m.div>
      ) : word ? (
        <m.div
          key="content"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }} className="p-6 border-2 border-border relative overflow-hidden" style={{borderRadius: "var(--radius-lg, 16px)", background: "linear-gradient(135deg, var(--card-bg, var(--surface)), var(--surface))"}} >
          {/* Decorative gradient accent */}
          <m.div
            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 6 }} className="absolute w-[140px] h-[140px]" style={{top: 0, right: 0, background: "radial-gradient(circle at top right, var(--accent), transparent 70%)", pointerEvents: "none"}} />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-[1]" >
            <m.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }} className="flex items-center gap-2" >
              <Star size={18} className="text-(--xp)" />
              <span className="text-[13px] font-bold uppercase tracking-wider text-text-muted" >Từ vựng hôm nay</span>
            </m.div>
            {word.level && (
              <m.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">{word.level}</Badge>
              </m.div>
            )}
          </div>

          {/* Word */}
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className="flex items-baseline gap-3 mb-2 relative z-[1]" >
            <span className="text-4xl font-extrabold text-ink tracking-tight" >
              {word.headword}
            </span>
            <m.button
              whileHover={{ scale: 1.1, color: "var(--accent)" }}
              whileTap={{ scale: 0.9 }}
              onClick={playAudio}
              
              aria-label="Phát âm" className="bg-none border-none cursor-pointer p-1 text-xl" style={{color: "var(--accent-muted, var(--text-muted))", transition: "color 0.2s"}} >
              {isTtsLoading ? <Loader2 className="animate-spin" size={18} /> : <Volume2 />}
            </m.button>
          </m.div>

          {/* Pronunciation + Part of Speech */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-4 flex-wrap relative z-[1]" >
            {word.pronunciation && (
              <span className="text-sm text-text-muted italic font-mono" >
                /{word.pronunciation}/
              </span>
            )}
            {word.partOfSpeech && (
              <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5">{word.partOfSpeech}</Badge>
            )}
          </m.div>

          {/* Vietnamese meaning */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }} className="text-base font-semibold text-ink mb-2 leading-normal relative z-[1]" >
            {word.overviewVi}
          </m.p>

          {/* English meaning */}
          {word.overviewEn && (
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }} className="text-sm text-text-muted mb-4 leading-normal relative z-[1]" >
              {word.overviewEn}
            </m.p>
          )}

          {/* Example */}
          {word.example && (
            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }} className="py-3 px-4 rounded-xl text-sm italic text-ink mb-5 relative z-[1]" style={{background: "var(--accent-muted, rgba(99,102,241,0.08))", borderLeft: "4px solid var(--accent)"}} >
              &ldquo;{word.example}&rdquo;
            </m.div>
          )}

          {/* Save button */}
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={!isSaved ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isSaved ? { scale: 0.98 } : {}}
            onClick={saveWord}
            disabled={isSaved || saving} className="flex items-center gap-2.5 py-3 px-5 text-sm font-bold w-full justify-center relative z-[1]" style={{borderRadius: 14, border: isSaved ? "1px solid color-mix(in srgb, var(--success) 30%, transparent)" : "1px solid var(--accent)", background: isSaved ? "color-mix(in srgb, var(--success) 10%, transparent)" : "var(--accent)", color: isSaved ? "var(--success)" : "#fff", cursor: isSaved ? "default" : "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: isSaved ? "none" : "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)"}} >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : isSaved ? (
              <CheckCircle />
            ) : (
              <BookOpen />
            )}
            {isSaved ? "Đã lưu vào kho từ vựng" : "Lưu vào kho từ vựng"}
          </m.button>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
