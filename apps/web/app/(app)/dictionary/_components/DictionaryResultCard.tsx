"use client";

import { useState } from "react";
import { Tag, Tooltip } from "antd";
import {
  LoadingOutlined,
  ReadOutlined,
  SoundOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";

import type { FrequencyBand, VocabularyWithNearby } from "@/lib/schemas/vocabulary";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { NearbyWordsBar } from "@/app/(app)/dictionary/_components/NearbyWordsBar";
import { SensePanel } from "@/app/(app)/dictionary/_components/SensePanel";
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
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
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

const LEVEL_STYLES: Record<string, React.CSSProperties> = {
  A1: { background: "var(--success-bg)", color: "var(--success)", borderColor: "var(--success)" },
  A2: { background: "var(--success-bg)", color: "var(--success)", borderColor: "var(--success)" },
  B1: { background: "var(--warning-bg)", color: "var(--warning)", borderColor: "var(--warning)" },
  B2: { background: "var(--warning-bg)", color: "var(--warning)", borderColor: "var(--warning)" },
  C1: { background: "var(--error-bg)", color: "var(--error)", borderColor: "var(--error)" },
  C2: { background: "var(--error-bg)", color: "var(--error)", borderColor: "var(--error)" },
};

// Maps the prompt's allowed partOfSpeech values to learner-friendly Vietnamese.
const POS_LABELS_VI: Record<string, string> = {
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

// Maps the prompt's allowed register values to Vietnamese with tooltip context.
const REGISTER_INFO: Record<string, { vi: string; tooltipVi: string }> = {
  formal:      { vi: "trang trọng",  tooltipVi: "Dùng trong văn viết học thuật, pháp lý hoặc chuyên môn." },
  informal:    { vi: "thân mật",     tooltipVi: "Dùng trong giao tiếp hàng ngày." },
  slang:       { vi: "tiếng lóng",   tooltipVi: "Cách nói rất thân mật trong nhóm/cộng đồng nhất định." },
  technical:   { vi: "chuyên ngành", tooltipVi: "Thuật ngữ trong một lĩnh vực cụ thể." },
  literary:    { vi: "văn chương",   tooltipVi: "Hay gặp trong tác phẩm văn học." },
  archaic:     { vi: "cổ",           tooltipVi: "Không còn được dùng phổ biến hiện nay." },
  colloquial:  { vi: "khẩu ngữ",     tooltipVi: "Phong cách hội thoại, thoải mái." },
  vulgar:      { vi: "thô tục",      tooltipVi: "Từ kiêng kỵ, nên tránh dùng." },
  offensive:   { vi: "xúc phạm",     tooltipVi: "Có thể gây xúc phạm hoặc tổn thương người nghe." },
};


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

function getNumberLabel(numberInfo: NonNullable<VocabularyWithNearby["numberInfo"]>): string {
  if (numberInfo.isUncountable) return "không đếm được";
  if (numberInfo.isPluralOnly) return "chỉ số nhiều";
  if (numberInfo.isSingularOnly) return "chỉ số ít";
  if (numberInfo.plural) return `số nhiều: ${numberInfo.plural}`;
  return "";
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
  const { speakingLocale, speak: speakAudio } = useAudioPlayer();

  function speak(locale: "en-US" | "en-GB") {
    if (!vocabulary) return;
    speakAudio(vocabulary.headword, locale);
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
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <h2
              className="dictionary-result-heading"
              style={{
                fontStyle: "italic",
                lineHeight: 1.2,
                fontFamily: "var(--font-display)",
                color: "var(--ink)",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {vocabulary.headword}
            </h2>
            {(() => {
              const posKey =
                vocabulary.entryType === "idiom"
                  ? "idiom"
                  : vocabulary.entryType === "phrasal_verb"
                    ? "phrasal verb"
                    : (vocabulary.partOfSpeech ?? null);
              const posVi = posKey ? POS_LABELS_VI[posKey] : null;
              const display = posVi ?? posKey ?? "từ";
              const tooltip = posKey && posVi ? posKey : null;
              const chip = (
                <span
                  style={{
                    borderRadius: 999,
                    padding: "3px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    fontStyle: "italic",
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}
                >
                  {display}
                </span>
              );
              return tooltip ? <Tooltip title={tooltip}>{chip}</Tooltip> : chip;
            })()}
            {numberLabel && (
              <span
                style={{
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}
              >
                {numberLabel}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {vocabulary.level && (
            <span
              style={{
                borderRadius: 999,
                padding: "2px 12px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                border: `1px solid ${LEVEL_STYLES[vocabulary.level]?.borderColor ?? "var(--border)"}`,
                background: LEVEL_STYLES[vocabulary.level]?.background ?? "var(--bg-deep)",
                color: LEVEL_STYLES[vocabulary.level]?.color ?? "var(--text-secondary)",
              }}
            >
              {vocabulary.level}
            </span>
          )}
          {vocabulary.register && (() => {
            const info = REGISTER_INFO[vocabulary.register];
            const display = info?.vi ?? vocabulary.register;
            const tooltip = info ? `${vocabulary.register} — ${info.tooltipVi}` : vocabulary.register;
            return (
              <Tooltip title={tooltip} placement="top">
                <Tag
                  variant="outlined"
                  style={{
                    borderRadius: 999,
                    padding: "2px 12px",
                    borderColor: "var(--border-strong)",
                    color: "var(--text-secondary)",
                    background: "var(--accent-light)",
                  }}
                >
                  {display}
                </Tag>
              </Tooltip>
            );
          })()}
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
                background: "var(--accent-light)",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--accent)",
                border: "1px solid var(--border-strong)",
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

      {/* ── Meta info strip: Frequency + Word Family ── */}
      {(vocabulary.frequencyBand || (vocabulary.wordFamily && vocabulary.wordFamily.length > 0)) && (
        <div
          className="anim-fade-up"
          style={{
            marginTop: 20,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 20,
            background: "var(--bg-deep)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 18px",
          }}
        >
          {vocabulary.frequencyBand && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                }}
              >
                Độ phổ biến
              </span>
              <FrequencyBar band={vocabulary.frequencyBand} />
            </div>
          )}

          {vocabulary.frequencyBand && vocabulary.wordFamily && vocabulary.wordFamily.length > 0 && (
            <div
              style={{
                width: 1,
                alignSelf: "stretch",
                background: "var(--border)",
              }}
            />
          )}

          {vocabulary.wordFamily && vocabulary.wordFamily.length > 0 && onSearch && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
              <WordFamilySection wordFamily={vocabulary.wordFamily} onSearch={onSearch} />
            </div>
          )}
        </div>
      )}

      {vocabulary.verbForms && vocabulary.verbForms.length > 0 && (
        <VerbFormsSection verbForms={vocabulary.verbForms} />
      )}

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
                background: activeKey === sense.id ? "var(--accent-muted)" : "transparent",
                color: activeKey === sense.id ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {sense.label}
            </button>
          ))}
        </div>
        {activeSense && <SensePanel key={activeSense.id} sense={activeSense} headword={vocabulary.headword} onSearch={onSearch} />}
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
