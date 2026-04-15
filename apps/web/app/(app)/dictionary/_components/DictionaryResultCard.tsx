"use client";

import { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import {
  BookOutlined,
  BulbOutlined,
  CodeOutlined,
  EditOutlined,
  LinkOutlined,
  LoadingOutlined,
  ReadOutlined,
  SoundOutlined,
  StarFilled,
  StarOutlined,
  ThunderboltOutlined,
  TranslationOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import type { DictionarySense, FrequencyBand, VocabularyWithNearby } from "@/lib/schemas/vocabulary";
import { parseBold } from "@/lib/utils/parse-bold";
import { NearbyWordsBar } from "@/app/(app)/dictionary/_components/NearbyWordsBar";
import { VerbFormsSection } from "@/app/(app)/dictionary/_components/VerbFormsSection";
import { WordFamilySection } from "@/app/(app)/dictionary/_components/WordFamilySection";

type DictionaryResultCardProps = {
  vocabulary: VocabularyWithNearby | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onOpenThesaurus?: () => void;
  onSearch?: (word: string) => void;
};

const SENSE_ITEM_STYLE: React.CSSProperties = {
  borderLeft: "2px solid rgba(154,177,122,0.3)",
  paddingLeft: 16,
  fontSize: 14,
  fontStyle: "italic",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

const SENSE_HEADER_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  color: "var(--accent)",
  margin: 0,
};

const FREQUENCY_CONFIG: Record<FrequencyBand, { filled: number; labelVi: string; tooltipEn: string }> = {
  top1k:  { filled: 5, labelVi: "Rất phổ biến", tooltipEn: "Top 1,000 most common words" },
  top3k:  { filled: 4, labelVi: "Phổ biến",     tooltipEn: "Top 3,000 most common words" },
  top5k:  { filled: 3, labelVi: "Khá phổ biến", tooltipEn: "Top 5,000 most common words" },
  top10k: { filled: 2, labelVi: "Ít phổ biến",  tooltipEn: "Top 10,000 most common words" },
  rare:   { filled: 1, labelVi: "Hiếm gặp",     tooltipEn: "Uncommon word" },
};

function FrequencyBar({ band }: { band: FrequencyBand }) {
  const { filled, labelVi, tooltipEn } = FREQUENCY_CONFIG[band];
  return (
    <Tooltip title={tooltipEn} placement="top">
      <div
        className="anim-fade-in"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12 }}
      >
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              data-frequency-segment={i < filled ? "filled" : "empty"}
              style={{
                width: 20,
                height: 5,
                borderRadius: 999,
                background: i < filled ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{labelVi}</span>
      </div>
    </Tooltip>
  );
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

function getNumberLabel(numberInfo: NonNullable<VocabularyWithNearby["numberInfo"]>): string {
  if (numberInfo.isUncountable) return "uncountable";
  if (numberInfo.isPluralOnly) return "plural only";
  if (numberInfo.isSingularOnly) return "singular only";
  if (numberInfo.plural) return `pl: ${numberInfo.plural}`;
  return "";
}

function BoldText({ text }: { text: string }) {
  const segments = parseBold(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} style={{ fontWeight: 600, fontStyle: "normal" }}>
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/** Highlight occurrences of `headword` within `text` using accent color (AC #3) */
function HighlightWord({ text, headword }: { text: string; headword: string }) {
  if (!headword) return <BoldText text={text} />;

  // Step 1: Parse **bold** markers first so we don't break them
  const boldSegments = parseBold(text);

  // Step 2: Within each segment, highlight the headword
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headwordRegex = new RegExp(`(${escaped})`, "gi");

  return (
    <>
      {boldSegments.map((seg, si) => {
        const subParts = seg.text.split(headwordRegex);
        if (subParts.length <= 1) {
          // No headword match in this segment — render as-is
          return seg.bold ? (
            <strong key={si} style={{ fontWeight: 600, fontStyle: "normal" }}>
              {seg.text}
            </strong>
          ) : (
            <span key={si}>{seg.text}</span>
          );
        }
        // Headword found — render with accent highlight
        return subParts.map((sub, pi) => {
          const key = `${si}-${pi}`;
          if (sub.toLowerCase() === headword.toLowerCase()) {
            return (
              <span key={key} style={{ color: "var(--accent)", fontWeight: 600, fontStyle: "normal" }}>
                {sub}
              </span>
            );
          }
          return seg.bold ? (
            <strong key={key} style={{ fontWeight: 600, fontStyle: "normal" }}>
              {sub}
            </strong>
          ) : (
            <span key={key}>{sub}</span>
          );
        });
      })}
    </>
  );
}

function SensePanel({ sense, headword }: { sense: DictionarySense; headword: string }) {
  const [isCollocationsOpen, setIsCollocationsOpen] = useState(false);
  const examples = sense.examples ?? [];
  const examplesVi = sense.examplesVi ?? [];
  const collocations = sense.collocations ?? [];

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderRadius: "var(--radius)",
    borderLeft: "3px solid var(--accent)",
    background: "var(--bg-deep)",
    padding: "16px 20px",
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <section style={sectionStyle}>
        <h3 style={SENSE_HEADER_STYLE}>
          <TranslationOutlined style={{ fontSize: 12 }} />
          Nghĩa tiếng Việt
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
          <BoldText text={sense.definitionVi} />
        </p>
      </section>

      <section style={sectionStyle}>
        <h3 style={SENSE_HEADER_STYLE}>
          <BookOutlined style={{ fontSize: 12 }} />
          Definition in English
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
          <BoldText text={sense.definitionEn} />
        </p>
      </section>

      {(examples.length > 0 || examplesVi.length > 0) && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <EditOutlined style={{ fontSize: 12 }} />
            Ví dụ
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {examples.length > 0
              ? examples.map((example, i) => (
                  <li key={`${example.en}-${example.vi ?? i}`} style={SENSE_ITEM_STYLE}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <HighlightWord text={example.en} headword={headword} />
                      {example.vi && (
                        <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "normal" }}>
                          <BoldText text={example.vi} />
                        </span>
                      )}
                    </div>
                  </li>
                ))
              : examplesVi.map((example) => (
                  <li key={example} style={SENSE_ITEM_STYLE}>
                    <BoldText text={example} />
                  </li>
                ))}
          </ul>
        </section>
      )}

      {sense.usageNoteVi && (
        <section style={{ ...sectionStyle, borderLeft: "none" }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <BulbOutlined style={{ fontSize: 12 }} />
            Ghi chú sử dụng
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
            <BoldText text={sense.usageNoteVi} />
          </p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <CodeOutlined style={{ fontSize: 12 }} />
            Mẫu câu thường gặp
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {sense.patterns.map((pattern) => (
              <li key={pattern} style={SENSE_ITEM_STYLE}>
                <BoldText text={pattern} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <LinkOutlined style={{ fontSize: 12 }} />
            Biểu đạt liên quan
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {sense.relatedExpressions.map((expr) => (
              <li key={expr} style={SENSE_ITEM_STYLE}>
                <BoldText text={expr} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <WarningOutlined style={{ fontSize: 12 }} />
            Lỗi thường gặp
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake} style={SENSE_ITEM_STYLE}>
                <BoldText text={mistake} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {collocations.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <ThunderboltOutlined style={{ fontSize: 12 }} />
            Collocations
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {(isCollocationsOpen ? collocations : collocations.slice(0, 3)).map((collocation) => (
              <li
                key={`${collocation.en}-${collocation.vi}`}
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  <BoldText text={collocation.en} />
                </span>
                <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>&mdash;</span>
                <span style={{ color: "var(--text-secondary)" }}>{collocation.vi}</span>
              </li>
            ))}
          </ul>
          {collocations.length > 3 && (
            <button
              type="button"
              aria-expanded={isCollocationsOpen}
              onClick={() => setIsCollocationsOpen((open) => !open)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                border: "1px solid rgba(154,177,122,0.18)",
                background: "var(--surface)",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--accent)",
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              {isCollocationsOpen ? "Thu gọn" : `Xem thêm (${collocations.length - 3})`}
            </button>
          )}
        </section>
      )}
    </div>
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
      style={{
        display: "grid",
        width: 24,
        height: 24,
        placeItems: "center",
        borderRadius: 4,
        color: "var(--text-muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
    >
      {speakingLocale === locale ? (
        <LoadingOutlined style={{ fontSize: 13 }} spin />
      ) : (
        <SoundOutlined style={{ fontSize: 13 }} />
      )}
    </button>
  );
}

function OverviewToggle({ overviewVi, overviewEn }: { overviewVi: string; overviewEn: string }) {
  const [lang, setLang] = useState<"vi" | "en">("vi");

  return (
    <div
      className="anim-fade-up dictionary-overview-block"
      style={{
        marginTop: 20,
        borderRadius: "var(--radius)",
        background: "var(--bg-deep)",
        padding: "24px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderRadius: 999,
          background: "var(--border)",
          padding: 2,
          width: "fit-content",
          opacity: 0.6,
        }}
      >
        {(["vi", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              position: "relative",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s, background 0.2s",
              color: lang === l ? "var(--accent)" : "var(--text-muted)",
              background: lang === l ? "var(--accent-light)" : "transparent",
            }}
          >
            {l === "vi" ? "VN" : "EN"}
          </button>
        ))}
      </div>

      <p
        key={lang}
        className="anim-fade-in"
        style={{
          marginTop: 12,
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          fontFamily: lang === "vi" ? "var(--font-display)" : "inherit",
          fontStyle: lang === "vi" ? "italic" : "normal",
        }}
      >
        <BoldText text={lang === "vi" ? overviewVi : overviewEn} />
      </p>
    </div>
  );
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
  onOpenThesaurus,
  onSearch,
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
    utterance.onend = () => {
      setSpeakingLocale(null);
      activeUtterance = null;
    };
    utterance.onerror = () => {
      setSpeakingLocale(null);
      activeUtterance = null;
    };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-lg)",
    background: "var(--surface)",
    boxShadow: "var(--shadow-lg)",
    minHeight: 400,
  };

  if (isLoading) {
    return (
      <div className="dictionary-result-card" style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 16,
                width: `${70 - i * 10}%`,
                borderRadius: 8,
                background: "var(--bg-deep)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="dictionary-result-card" style={cardStyle}>
        <div
          style={{
            display: "flex",
            minHeight: 360,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <ReadOutlined style={{ fontSize: 32, color: "var(--text-muted)" }} />
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {!hasSearched ? "Nhập từ cần tra" : "Chưa có kết quả để hiển thị"}
          </p>
        </div>
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;
  const numberLabel = vocabulary.numberInfo ? getNumberLabel(vocabulary.numberInfo) : "";

  return (
    <div key={vocabulary.headword} className="anim-fade-up dictionary-result-card" style={cardStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--accent)",
              margin: 0,
            }}
          >
            Kết quả tra cứu
          </p>
          <h2
            className="dictionary-result-heading"
            style={{
              marginTop: 8,
              fontStyle: "italic",
              lineHeight: 1.2,
              fontFamily: "var(--font-display)",
              color: "var(--ink)",
              wordBreak: "break-word",
            }}
          >
            {vocabulary.headword}
          </h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {vocabulary.level && (
            <Tag
              color={LEVEL_COLORS[vocabulary.level] ?? "default"}
              variant="outlined"
              style={{ borderRadius: 999, padding: "2px 12px" }}
            >
              {vocabulary.level}
            </Tag>
          )}
          <Tag variant="solid" style={{ borderRadius: 999, padding: "2px 12px" }}>
            {vocabulary.entryType === "idiom"
              ? "idiom"
              : vocabulary.entryType === "phrasal_verb"
                ? "phrasal verb"
                : (vocabulary.partOfSpeech ?? "word")}
          </Tag>
          {vocabulary.register && (
            <Tag
              variant="outlined"
              style={{
                borderRadius: 999,
                padding: "2px 12px",
                borderColor: "#fcd34d",
                color: "#5a7a64",
                background: "#fffbeb",
              }}
            >
              {vocabulary.register}
            </Tag>
          )}
          {numberLabel && (
            <Tag variant="outlined" style={{ borderRadius: 999, padding: "2px 12px" }}>
              {numberLabel}
            </Tag>
          )}
          {onOpenThesaurus && (
            <button
              type="button"
              onClick={onOpenThesaurus}
              aria-label="Thesaurus"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                background: "linear-gradient(to right, #fffbeb, #fff7ed)",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#5a7a64",
                border: "1px solid rgba(217,119,6,0.3)",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <ReadOutlined style={{ fontSize: 12 }} />
              Thesaurus
            </button>
          )}
          {saved != null && onToggleSaved && (
            <button
              onClick={onToggleSaved}
              style={{
                display: "grid",
                width: 32,
                height: 32,
                placeItems: "center",
                borderRadius: "50%",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              aria-label={saved ? "Bỏ lưu từ này" : "Lưu từ này"}
            >
              {saved ? (
                <StarFilled style={{ fontSize: 18, color: "var(--accent)" }} />
              ) : (
                <StarOutlined style={{ fontSize: 18 }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pronunciation */}
      {hasDualPhonetics ? (
        <div
          className="anim-fade-in"
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          {vocabulary.phoneticsUs && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🇺🇸</span>
              <span
                style={{
                  borderRadius: 4,
                  background: "var(--bg-deep)",
                  padding: "2px 8px",
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                }}
              >
                {vocabulary.phoneticsUs}
              </span>
              <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
          {vocabulary.phoneticsUs && vocabulary.phoneticsUk && (
            <span style={{ color: "var(--text-muted)" }}>·</span>
          )}
          {vocabulary.phoneticsUk && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🇬🇧</span>
              <span
                style={{
                  borderRadius: 4,
                  background: "var(--bg-deep)",
                  padding: "2px 8px",
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                }}
              >
                {vocabulary.phoneticsUk}
              </span>
              <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
            </div>
          )}
        </div>
      ) : vocabulary.phonetic ? (
        <span
          className="anim-fade-in"
          style={{
            marginTop: 12,
            display: "inline-block",
            borderRadius: 4,
            background: "var(--bg-deep)",
            padding: "2px 8px",
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
          }}
        >
          {vocabulary.phonetic}
        </span>
      ) : null}

      {vocabulary.frequencyBand && <FrequencyBar band={vocabulary.frequencyBand} />}

      {vocabulary.verbForms && vocabulary.verbForms.length > 0 && (
        <VerbFormsSection verbForms={vocabulary.verbForms} />
      )}

      {vocabulary.wordFamily && vocabulary.wordFamily.length > 0 && onSearch && (
        <WordFamilySection wordFamily={vocabulary.wordFamily} onSearch={onSearch} />
      )}

      <OverviewToggle overviewVi={vocabulary.overviewVi} overviewEn={vocabulary.overviewEn} />

      {/* Sense tabs */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 12,
            marginBottom: 20,
            overflowX: "auto",
          }}
        >
          {vocabulary.senses.map((sense) => (
            <button
              key={sense.id}
              type="button"
              aria-selected={activeKey === sense.id}
              onClick={() => setActiveKey(sense.id)}
              style={{
                flexShrink: 0,
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
                background: activeKey === sense.id ? "rgba(154,177,122,0.12)" : "transparent",
                color: activeKey === sense.id ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {sense.label}
            </button>
          ))}
        </div>
        {activeSense && <SensePanel key={activeSense.id} sense={activeSense} headword={vocabulary.headword} />}
      </div>

      {/* Nearby words bar */}
      {vocabulary.nearbyWords.length > 0 && onSearch && (
        <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <NearbyWordsBar
            words={vocabulary.nearbyWords}
            headword={vocabulary.headword}
            onSearch={onSearch}
          />
        </div>
      )}
    </div>
  );
}
