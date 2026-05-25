import { useState, useEffect } from "react";
import styles from "@/styles/sidepanel.module.css";

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

type Sense = {
  id: string;
  label: string;
  definitionEn: string;
  shortMeaningsVi: string[];
  usageNoteVi: string | null;
  examples: Array<{ en: string; vi: string }>;
  collocations: Array<{ en: string; vi: string }>;
  patterns: string[];
  relatedExpressions: string[];
  commonMistakesVi: string[];
};

type FullVocabulary = {
  headword: string;
  phoneticsUs: string | null;
  phoneticsUk: string | null;
  partOfSpeech: string | null;
  level: string | null;
  register: string | null;
  senses: Sense[];
  nearbyWords: string[];
};

type DictionaryViewProps = {
  initialWord?: string;
};

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

export function DictionaryView({ initialWord }: DictionaryViewProps) {
  const [query, setQuery] = useState(initialWord || "");
  const [result, setResult] = useState<FullVocabulary | null>(null);
  const [activeSenseId, setActiveSenseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for word changes from background
  useEffect(() => {
    async function checkSidePanelWord() {
      const data = await chrome.storage.session.get("sidePanelWord");
      if (data.sidePanelWord) {
        setQuery(data.sidePanelWord);
        doSearch(data.sidePanelWord);
        await chrome.storage.session.remove("sidePanelWord");
      }
    }
    checkSidePanelWord();

    // Listen for storage changes
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.sidePanelWord?.newValue) {
        setQuery(changes.sidePanelWord.newValue);
        doSearch(changes.sidePanelWord.newValue);
      }
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, []);

  // Search on initial word
  useEffect(() => {
    if (initialWord) {
      doSearch(initialWord);
    }
  }, [initialWord]);

  async function doSearch(word: string) {
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "LOOKUP_WORD_FULL",
        word: word.trim(),
      });

      if (response?.error) {
        setError(response.error);
      } else {
        setResult(response);
        setActiveSenseId(response.senses[0]?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  function handleWordClick(word: string) {
    setQuery(word);
    doSearch(word);
  }

  const activeSense = result?.senses.find((s) => s.id === activeSenseId) || result?.senses[0];
  const posLabel = result?.partOfSpeech
    ? POS_LABELS[result.partOfSpeech] || result.partOfSpeech
    : null;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>📖</span>
        <div>
          <h1 className={styles.headerTitle}>English Companion</h1>
          <p className={styles.headerSubtitle}>Tra cứu từ điển</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Nhập từ cần tra (e.g. take off)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={80}
          autoComplete="off"
        />
      </form>

      {/* Loading */}
      {isLoading && (
        <div className={styles.loading}>
          {[70, 100, 85, 60, 90].map((w, i) => (
            <div
              key={i}
              className={styles.skeletonLine}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Empty state */}
      {!isLoading && !error && !result && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📚</span>
          <p>Chọn từ trên trang web hoặc nhập từ ở trên để tra cứu</p>
        </div>
      )}

      {/* Result */}
      {result && activeSense && (
        <div className={styles.resultCard}>
          {/* Word header */}
          <div className={styles.wordTitle}>
            <h2 className={styles.wordHeadword}>{result.headword}</h2>
            {posLabel && <span className={styles.posBadge}>{posLabel}</span>}
            {result.level && (
              <span className={styles.levelBadge}>{result.level}</span>
            )}
          </div>

          {/* Phonetics */}
          {(result.phoneticsUs || result.phoneticsUk) && (
            <div className={styles.phonetics}>
              {result.phoneticsUs && <span>🇺🇸 {result.phoneticsUs}</span>}
              {result.phoneticsUk && <span>🇬🇧 {result.phoneticsUk}</span>}
            </div>
          )}

          {/* Sense tabs */}
          {result.senses.length > 1 && (
            <div className={styles.senseTabs}>
              {result.senses.map((sense) => (
                <button
                  key={sense.id}
                  type="button"
                  className={
                    activeSenseId === sense.id
                      ? styles.senseTabActive
                      : styles.senseTab
                  }
                  onClick={() => setActiveSenseId(sense.id)}
                >
                  {sense.label}
                </button>
              ))}
            </div>
          )}

          {/* Vietnamese meanings */}
          {activeSense.shortMeaningsVi.length > 0 && (
            <>
              <p className={styles.meaningPrimary}>
                {activeSense.shortMeaningsVi[0]}
              </p>
              {activeSense.shortMeaningsVi.length > 1 && (
                <p className={styles.meaningSecondary}>
                  {activeSense.shortMeaningsVi.slice(1).join(" · ")}
                </p>
              )}
            </>
          )}

          {/* Definition */}
          <div>
            <p className={styles.sectionLabel}>
              <span className={styles.sectionIcon}>📖</span>
              Definition
            </p>
            <div className={styles.definitionBlock}>
              <p className={styles.definitionText}>
                {stripBold(activeSense.definitionEn)}
              </p>
            </div>
          </div>

          {/* Examples */}
          {activeSense.examples.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>✏️</span>
                Ví dụ
              </p>
              <ul className={styles.exampleList}>
                {activeSense.examples.map((ex, i) => (
                  <li key={i} className={styles.exampleItem}>
                    <p className={styles.exampleEn}>{stripBold(ex.en)}</p>
                    <p className={styles.exampleVi}>{ex.vi}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collocations */}
          {activeSense.collocations.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>⚡</span>
                Collocations
              </p>
              <ul className={styles.collocationList}>
                {activeSense.collocations.map((col, i) => (
                  <li key={i} className={styles.collocationItem}>
                    <span className={styles.collocationEn}>
                      {stripBold(col.en)}
                    </span>
                    <span className={styles.collocationDash}>—</span>
                    <span className={styles.collocationVi}>{col.vi}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Patterns */}
          {activeSense.patterns.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>🔗</span>
                Mẫu câu
              </p>
              <div className={styles.tagList}>
                {activeSense.patterns.map((p) => (
                  <span key={p} className={styles.tag}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related expressions */}
          {activeSense.relatedExpressions.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>🔗</span>
                Biểu đạt liên quan
              </p>
              <div className={styles.tagList}>
                {activeSense.relatedExpressions.map((expr) => (
                  <span
                    key={expr}
                    className={styles.relatedTag}
                    onClick={() => handleWordClick(expr)}
                  >
                    {expr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage note */}
          {activeSense.usageNoteVi && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>💡</span>
                Ghi chú sử dụng
              </p>
              <div className={styles.usageNote}>
                <p className={styles.usageNoteText}>
                  {activeSense.usageNoteVi}
                </p>
              </div>
            </div>
          )}

          {/* Common mistakes */}
          {activeSense.commonMistakesVi.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>⚠️</span>
                Lỗi thường gặp
              </p>
              <div className={styles.mistakeBlock}>
                <ul className={styles.mistakeList}>
                  {activeSense.commonMistakesVi.map((m, i) => (
                    <li key={i} className={styles.mistakeItem}>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Nearby words */}
          {result.nearbyWords.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionIcon}>📚</span>
                Từ gần giống
              </p>
              <div className={styles.tagList}>
                {result.nearbyWords.map((word) => (
                  <span
                    key={word}
                    className={styles.relatedTag}
                    onClick={() => handleWordClick(word)}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
