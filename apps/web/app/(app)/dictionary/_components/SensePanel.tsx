"use client";

import { useState } from "react";
import {
  BookOutlined,
  BulbOutlined,
  CodeOutlined,
  EditOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import type { DictionarySense } from "@/lib/schemas/vocabulary";
import { parseBold } from "@/lib/utils/parse-bold";

type SensePanelProps = {
  sense: DictionarySense;
  headword: string;
  onSearch?: (word: string) => void;
};

const SENSE_ITEM_STYLE: React.CSSProperties = {
  borderLeft: "2px solid var(--accent-muted)",
  paddingLeft: 16,
  fontSize: 14,
  fontStyle: "italic",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

export const SENSE_HEADER_STYLE: React.CSSProperties = {
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

/** Highlight occurrences of `headword` within `text` using accent color */
function HighlightWord({ text, headword }: { text: string; headword: string }) {
  if (!headword) return <BoldText text={text} />;

  const boldSegments = parseBold(text);
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headwordRegex = new RegExp(`(${escaped})`, "gi");

  return (
    <>
      {boldSegments.map((seg, si) => {
        const subParts = seg.text.split(headwordRegex);
        if (subParts.length <= 1) {
          return seg.bold ? (
            <strong key={si} style={{ fontWeight: 600, fontStyle: "normal" }}>
              {seg.text}
            </strong>
          ) : (
            <span key={si}>{seg.text}</span>
          );
        }
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

export function SensePanel({ sense, headword, onSearch }: SensePanelProps) {
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
                      <span>
                        <HighlightWord text={example.en} headword={headword} />
                      </span>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sense.patterns.map((pattern) => (
              <span
                key={pattern}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "3px 10px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {pattern}
              </span>
            ))}
          </div>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={SENSE_HEADER_STYLE}>
            <LinkOutlined style={{ fontSize: 12 }} />
            Biểu đạt liên quan
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sense.relatedExpressions.map((expr) => (
              <button
                key={expr}
                type="button"
                onClick={() => onSearch?.(expr)}
                style={{
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  padding: "4px 14px",
                  fontSize: 13,
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                  color: "var(--accent)",
                  cursor: onSearch ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
              >
                {expr}
              </button>
            ))}
          </div>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRadius: "var(--radius)",
            background: "var(--warning-bg)",
            border: "1px solid var(--warning)",
            padding: "14px 16px",
          }}
        >
          <h3 style={{ ...SENSE_HEADER_STYLE, color: "var(--warning)" }}>
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
              <li
                key={mistake}
                style={{
                  borderLeft: "2px solid var(--warning)",
                  paddingLeft: 12,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                }}
              >
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
                <span style={{ color: "var(--text-secondary)" }}><BoldText text={collocation.vi} /></span>
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
                border: "1px solid var(--border)",
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
