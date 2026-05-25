import { useState, useEffect } from "react";
import type { WordResult, TranslationResult } from "@/lib/messaging";
import { lookupWord, translateSentence, openSidePanel } from "@/lib/api";
import { MiniDictionaryCard } from "./MiniDictionaryCard";
import { TranslationCard } from "./TranslationCard";
import styles from "@/styles/tooltip.module.css";

type TooltipProps = {
  text: string;
  type: "word" | "sentence";
  context: string;
  position: { top: number; left: number };
  onClose: () => void;
};

export function Tooltip({
  text,
  type,
  context,
  position,
  onClose,
}: TooltipProps) {
  const [wordResult, setWordResult] = useState<WordResult | null>(null);
  const [translationResult, setTranslationResult] =
    useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        if (type === "word") {
          const result = await lookupWord(text);
          if (!cancelled) {
            setWordResult(result);
            setIsLoading(false);
          }
        } else {
          const result = await translateSentence(text, context);
          if (!cancelled) {
            setTranslationResult(result);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
          setIsLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [text, type, context]);

  // Handle clicking a key vocabulary word (switch to word lookup)
  function handleWordClick(word: string) {
    setIsLoading(true);
    setTranslationResult(null);
    setWordResult(null);
    setError(null);

    lookupWord(word)
      .then(setWordResult)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setIsLoading(false));
  }

  function handleSeeMore() {
    const word = wordResult?.headword || text;
    openSidePanel(word);
    onClose();
  }

  // Compute tooltip position: below selection by default, above if too close to bottom
  const viewportHeight = window.innerHeight;
  const tooltipAbove = position.top + 200 > viewportHeight;
  const style: React.CSSProperties = {
    left: Math.min(position.left, window.innerWidth - 400),
    ...(tooltipAbove
      ? { bottom: viewportHeight - position.top + 8 }
      : { top: position.top + 8 }),
  };

  return (
    <div className={styles.tooltip} style={style}>
      {isLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} style={{ width: "70%" }} />
          <div className={styles.skeletonLine} style={{ width: "100%" }} />
          <div className={styles.skeletonLine} style={{ width: "85%" }} />
          <div className={styles.skeletonLine} style={{ width: "60%" }} />
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {wordResult && (
        <MiniDictionaryCard
          result={wordResult}
          onSeeMore={handleSeeMore}
          onClose={onClose}
        />
      )}

      {translationResult && (
        <TranslationCard
          result={translationResult}
          originalText={text}
          onWordClick={handleWordClick}
          onClose={onClose}
        />
      )}
    </div>
  );
}
