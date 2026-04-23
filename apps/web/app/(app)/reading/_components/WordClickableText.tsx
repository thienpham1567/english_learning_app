"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Popover, Spin, Button, message } from "antd";
import {
  SoundOutlined,
  SaveOutlined,
  CheckOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

// ── Types ──
type DictEntry = {
  headword: string;
  ipa?: string;
  definition?: string;
  example?: string;
  partOfSpeech?: string;
};

type WordPopoverData = {
  word: string;
  loading: boolean;
  entry: DictEntry | null;
  error: string | null;
  saved: boolean;
  alreadySaved: boolean;
};

// ── Tokenizer: splits text into clickable words + non-clickable separators ──
type Token = { type: "word"; value: string } | { type: "sep"; value: string };

function tokenizeText(text: string): Token[] {
  const tokens: Token[] = [];
  // Split on word boundaries, keeping separators
  const parts = text.split(/(\b[a-zA-Z'-]+\b)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^[a-zA-Z'-]+$/.test(part) && part.length >= 2) {
      tokens.push({ type: "word", value: part });
    } else {
      tokens.push({ type: "sep", value: part });
    }
  }
  return tokens;
}

// ── Props ──
interface WordClickableTextProps {
  /** The passage body text */
  text: string;
  /** Font style for the reading body */
  style?: React.CSSProperties;
}

/**
 * WordClickableText (Story 19.4.2, AC1+AC2+AC3+AC4)
 *
 * Renders passage text with each word clickable. Clicking a word opens an
 * Ant Design Popover with definition, IPA, example, TTS, and save-to-vocab.
 * Text selection for phrases is also supported (AC5).
 */
export function WordClickableText({ text, style }: WordClickableTextProps) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [popoverData, setPopoverData] = useState<WordPopoverData | null>(null);
  const [msgApi, contextHolder] = message.useMessage();
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Lookup word via dictionary API (AC3) ──
  const lookupWord = useCallback(async (word: string) => {
    const normalized = word.toLowerCase().replace(/[^a-z'-]/g, "");
    if (!normalized || normalized.length < 2) return;

    setActiveWord(normalized);
    setPopoverData({
      word: normalized,
      loading: true,
      entry: null,
      error: null,
      saved: false,
      alreadySaved: false,
    });

    try {
      // Try surface form first, then lemma fallback
      const data = await api.get<{
        vocabulary?: {
          headword?: string;
          pronunciation?: { ipa?: string };
          core_meaning?: string;
          meanings?: Array<{ part_of_speech?: string; definitions?: Array<{ definition?: string; example?: string }> }>;
        };
        isSaved?: boolean;
      }>(`/dictionary?q=${encodeURIComponent(normalized)}`);

      const vocab = data.vocabulary;
      if (!vocab) {
        setPopoverData((prev) =>
          prev ? { ...prev, loading: false, error: "Không tìm thấy từ này." } : null,
        );
        return;
      }

      const firstMeaning = vocab.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];

      setPopoverData((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              entry: {
                headword: vocab.headword ?? normalized,
                ipa: vocab.pronunciation?.ipa,
                definition: firstDef?.definition ?? vocab.core_meaning ?? "",
                example: firstDef?.example,
                partOfSpeech: firstMeaning?.part_of_speech,
              },
              alreadySaved: !!data.isSaved,
            }
          : null,
      );
    } catch {
      setPopoverData((prev) =>
        prev ? { ...prev, loading: false, error: "Lỗi khi tra từ." } : null,
      );
    }
  }, []);

  // ── TTS (AC2) ──
  const playTts = useCallback((word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, []);

  // ── Save to vocab (AC4) ──
  const saveWord = useCallback(async () => {
    if (!popoverData?.entry) return;
    try {
      await api.post("/vocabulary/save", { query: popoverData.entry.headword });
      setPopoverData((prev) => (prev ? { ...prev, saved: true } : null));
      msgApi.success("Đã lưu vào từ vựng!");
    } catch {
      msgApi.error("Không thể lưu từ.");
    }
  }, [popoverData, msgApi]);

  // ── Phrase selection (AC5) ──
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const selectedText = selection.toString().trim();
    if (selectedText.split(/\s+/).length >= 2 && selectedText.length <= 100) {
      lookupWord(selectedText);
    }
  }, [lookupWord]);

  // ── Popover content ──
  const renderPopoverContent = (): ReactNode => {
    if (!popoverData) return null;

    if (popoverData.loading) {
      return (
        <div style={{ padding: 8, textAlign: "center", minWidth: 180 }}>
          <Spin size="small" />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Đang tra từ...</p>
        </div>
      );
    }

    if (popoverData.error) {
      return (
        <div style={{ padding: 8, minWidth: 180 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{popoverData.error}</p>
        </div>
      );
    }

    const { entry, saved, alreadySaved } = popoverData;
    if (!entry) return null;

    return (
      <div style={{ minWidth: 220, maxWidth: 320, padding: 4 }}>
        {/* Header: headword + IPA + TTS */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {entry.headword}
          </span>
          {entry.partOfSpeech && (
            <span style={{ fontSize: 11, color: "var(--accent)", fontStyle: "italic" }}>
              {entry.partOfSpeech}
            </span>
          )}
          <button
            onClick={() => playTts(entry.headword)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: "var(--accent)", fontSize: 16, padding: 2,
            }}
            title="Nghe phát âm"
          >
            <SoundOutlined />
          </button>
        </div>

        {/* IPA */}
        {entry.ipa && (
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            /{entry.ipa}/
          </p>
        )}

        {/* Definition */}
        {entry.definition && (
          <p style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.5 }}>
            {entry.definition}
          </p>
        )}

        {/* Example */}
        {entry.example && (
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
            &ldquo;{entry.example}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {saved || alreadySaved ? (
            <Button size="small" type="text" icon={<CheckOutlined />} style={{ color: "var(--success)" }}>
              {alreadySaved ? "Đã lưu" : "Đã lưu!"}
            </Button>
          ) : (
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={saveWord}>
              Lưu vào từ vựng
            </Button>
          )}
          {(saved || alreadySaved) && (
            <Button size="small" type="link" icon={<BookOutlined />} href="/dictionary" target="_blank">
              Xem sổ tay
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──
  const paragraphs = text.split("\n");

  return (
    <div style={style} onMouseUp={handleMouseUp}>
      {contextHolder}
      {paragraphs.map((para, pi) => (
        <p key={pi} style={{ margin: pi === 0 ? 0 : "16px 0 0" }}>
          {tokenizeText(para).map((token, ti) => {
            if (token.type === "sep") {
              return <span key={ti}>{token.value}</span>;
            }

            const isActive = activeWord === token.value.toLowerCase();
            return (
              <Popover
                key={ti}
                open={isActive && !!popoverData}
                onOpenChange={(open) => {
                  if (!open) {
                    setActiveWord(null);
                    setPopoverData(null);
                  }
                }}
                content={renderPopoverContent()}
                trigger="click"
                destroyOnHidden
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    lookupWord(token.value);
                  }}
                  style={{
                    cursor: "pointer",
                    borderBottom: isActive ? "2px solid var(--accent)" : "1px dashed transparent",
                    transition: "border-color 0.15s",
                    borderRadius: 2,
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.borderBottomColor = "var(--border)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.borderBottomColor = "transparent";
                    }
                  }}
                >
                  {token.value}
                </span>
              </Popover>
            );
          })}
        </p>
      ))}
    </div>
  );
}
