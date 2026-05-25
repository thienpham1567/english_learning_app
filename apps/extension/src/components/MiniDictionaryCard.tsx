import type { WordResult } from "@/lib/messaging";
import styles from "@/styles/tooltip.module.css";

type MiniDictionaryCardProps = {
  result: WordResult;
  onSeeMore: () => void;
  onClose: () => void;
};

const POS_LABELS: Record<string, string> = {
  noun: "danh từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  "phrasal verb": "cụm động từ",
  idiom: "thành ngữ",
  preposition: "giới từ",
  conjunction: "liên từ",
  determiner: "từ hạn định",
  pronoun: "đại từ",
  interjection: "thán từ",
  "auxiliary verb": "trợ động từ",
  "modal verb": "động từ khiếm khuyết",
  article: "mạo từ",
};

/**
 * Strips **bold** markers from text for clean display.
 */
function stripBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function MiniDictionaryCard({
  result,
  onSeeMore,
  onClose,
}: MiniDictionaryCardProps) {
  const posLabel = result.partOfSpeech
    ? POS_LABELS[result.partOfSpeech] || result.partOfSpeech
    : null;

  return (
    <>
      {/* Header: headword + badges */}
      <div className={styles.wordHeader}>
        <h3 className={styles.headword}>{result.headword}</h3>
        {posLabel && <span className={styles.posBadge}>{posLabel}</span>}
        {result.level && <span className={styles.levelBadge}>{result.level}</span>}
      </div>

      {/* Phonetics */}
      {result.phoneticsUs && (
        <p className={styles.phonetic}>
          🇺🇸 {result.phoneticsUs}
          {result.phoneticsUk && <> · 🇬🇧 {result.phoneticsUk}</>}
        </p>
      )}

      {/* Vietnamese meanings */}
      {result.shortMeaningsVi.length > 0 && (
        <>
          <p className={styles.meaningPrimary}>{result.shortMeaningsVi[0]}</p>
          {result.shortMeaningsVi.length > 1 && (
            <p className={styles.meaningSecondary}>
              {result.shortMeaningsVi.slice(1).join(" · ")}
            </p>
          )}
        </>
      )}

      {/* English definition */}
      <p className={styles.definitionEn}>{stripBold(result.definitionEn)}</p>

      {/* First example */}
      {result.example && (
        <div className={styles.example}>
          <p className={styles.exampleEn}>{stripBold(result.example.en)}</p>
          <p className={styles.exampleVi}>{result.example.vi}</p>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.seeMoreBtn}
          onClick={onSeeMore}
        >
          See more →
          {result.senseCount > 1 && (
            <span className={styles.senseCount}>
              ({result.senseCount} senses)
            </span>
          )}
        </button>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </>
  );
}
