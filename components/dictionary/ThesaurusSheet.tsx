"use client";

import { useEffect, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Drawer } from "antd";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  vocabulary: Vocabulary | null;
  isOpen: boolean;
  onClose: () => void;
  onWordClick: (word: string) => void;
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
            Từ đồng & trái nghĩa
          </p>
          {vocabulary && (
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
              {vocabulary.headword}
            </p>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={384}
      styles={{ body: { padding: 20 } }}
    >
      {vocabulary && sensesWithData.length === 0 && (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Chưa có dữ liệu đồng/trái nghĩa.</p>
      )}

      {vocabulary && sensesWithData.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {sensesWithData.map((sense) => (
            <div key={sense.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p
                style={{
                  fontSize: 14,
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                  color: "var(--accent)",
                  margin: 0,
                }}
              >
                {sense.label}
              </p>

              {(sense.synonyms?.length ?? 0) > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Đồng nghĩa
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sense.synonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => handleWordClick(word)}
                        style={{
                          borderRadius: 999,
                          background: "#ecfdf5",
                          padding: "4px 12px",
                          fontSize: 14,
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(sense.antonyms?.length ?? 0) > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Trái nghĩa
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sense.antonyms.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => handleWordClick(word)}
                        style={{
                          borderRadius: 999,
                          background: "#fff1f2",
                          padding: "4px 12px",
                          fontSize: 14,
                          color: "#be123c",
                          border: "1px solid #fecdd3",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
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
