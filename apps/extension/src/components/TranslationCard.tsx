import type { TranslationResult } from "@/lib/messaging";
import styles from "@/styles/tooltip.module.css";

type TranslationCardProps = {
  result: TranslationResult;
  originalText: string;
  onWordClick: (word: string) => void;
  onClose: () => void;
};

export function TranslationCard({
  result,
  originalText,
  onWordClick,
  onClose,
}: TranslationCardProps) {
  return (
    <>
      {/* Label */}
      <p className={styles.translationLabel}>Dịch ngữ cảnh</p>

      {/* Vietnamese translation */}
      <p className={styles.translationText}>{result.translation}</p>

      {/* Key vocabulary */}
      {result.keyVocabulary.length > 0 && (
        <>
          <div className={styles.divider} />
          <p className={styles.translationLabel}>Từ vựng chính</p>
          <ul className={styles.keyVocabList}>
            {result.keyVocabulary.map((item) => (
              <li
                key={item.word}
                className={styles.keyVocabItem}
                onClick={() => onWordClick(item.word)}
              >
                <span className={styles.keyVocabWord}>{item.word}</span>
                <span className={styles.keyVocabMeaning}>{item.meaning}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span />
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
