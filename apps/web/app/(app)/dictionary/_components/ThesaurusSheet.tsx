"use client";

import { Drawer } from "antd";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  vocabulary: Vocabulary | null;
  isOpen: boolean;
  onClose: () => void;
  onWordClick: (word: string) => void;
};

const SYNONYM_STYLE: React.CSSProperties = {
  borderRadius: 999,
  background: "var(--accent-light)",
  padding: "4px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#3d6a2a",
  border: "1px solid rgba(154,177,122,0.45)",
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s",
};

const ANTONYM_STYLE: React.CSSProperties = {
  borderRadius: 999,
  background: "var(--warm)",
  padding: "4px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#7a3f1a",
  border: "1px dashed #deb896",
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  margin: 0,
};

export function ThesaurusSheet({ vocabulary, isOpen, onClose, onWordClick }: Props) {
  const sensesWithData =
    vocabulary?.senses.filter(
      (s) => (s.synonyms?.length ?? 0) > 0 || (s.antonyms?.length ?? 0) > 0,
    ) ?? [];

  function handleWordClick(word: string) {
    onWordClick(word);
    onClose();
  }

  return (
    <Drawer
      title={
        <div>
          <p
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Từ đồng &amp; trái nghĩa
          </p>
          {vocabulary && (
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontStyle: "italic",
                fontFamily: "var(--font-display)",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              {vocabulary.headword}
            </p>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      size={384}
      styles={{ body: { padding: 20 } }}
    >
      {vocabulary && sensesWithData.length === 0 && (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Chưa có dữ liệu đồng/trái nghĩa.</p>
      )}

      {vocabulary && sensesWithData.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {sensesWithData.map((sense) => (
            <div key={sense.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Sense label */}
              <p
                style={{
                  fontSize: 13,
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                  color: "var(--accent)",
                  margin: 0,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {sense.label}
              </p>

              {/* Synonyms */}
              {(sense.synonyms?.length ?? 0) > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ ...SECTION_LABEL, color: "#3d6a2a" }}>Đồng nghĩa</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sense.synonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => handleWordClick(word)}
                        style={SYNONYM_STYLE}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Antonyms */}
              {(sense.antonyms?.length ?? 0) > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ ...SECTION_LABEL, color: "#7a3f1a" }}>Trái nghĩa</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sense.antonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => handleWordClick(word)}
                        style={ANTONYM_STYLE}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
