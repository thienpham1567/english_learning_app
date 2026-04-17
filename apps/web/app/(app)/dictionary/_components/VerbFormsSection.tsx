"use client";

import { useRef, useState } from "react";
import { DownOutlined, LoadingOutlined, SoundOutlined } from "@ant-design/icons";

import type { VerbForm } from "@/lib/schemas/vocabulary";

type Props = {
  verbForms: VerbForm[];
};

const CARD_BASE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  borderRadius: "var(--radius)",
  padding: "14px 16px",
  transition: "box-shadow 0.2s",
  minHeight: 110,
};

const CARD_REGULAR: React.CSSProperties = {
  ...CARD_BASE,
  background: "var(--bg-deep)",
  border: "1px solid var(--border)",
};

const CARD_INFINITIVE: React.CSSProperties = {
  ...CARD_BASE,
  background: "var(--accent-muted)",
  border: "1px solid rgba(154,177,122,0.35)",
};

const CARD_IRREGULAR: React.CSSProperties = {
  ...CARD_BASE,
  background: "#fdf3e3",
  border: "1px solid #e8c0a0",
};

export function VerbFormsSection({ verbForms }: Props) {
  const [open, setOpen] = useState(false);
  const [speakingForm, setSpeakingForm] = useState<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function speak(form: string) {
    if (activeUtteranceRef.current) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    const utterance = new SpeechSynthesisUtterance(form);
    utterance.lang = "en-US";
    utterance.onstart = () => setSpeakingForm(form);
    utterance.onend = () => {
      setSpeakingForm(null);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingForm(null);
      activeUtteranceRef.current = null;
    };
    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="anim-fade-up" style={{ marginTop: 24 }}>
      {/* ── Expand toggle — prominent section header ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="verb-forms-grid"
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          padding: "10px 16px",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-hover)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent)",
            }}
          >
            Dạng động từ
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 999,
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            {verbForms.length} dạng
          </span>
        </div>
        <DownOutlined
          style={{
            fontSize: 12,
            color: "var(--accent)",
            transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }}
        />
      </button>

      {open && (
        <div
          id="verb-forms-grid"
          className="anim-fade-in verb-forms-grid"
          style={{
            display: "grid",
            gap: 10,
            paddingTop: 14,
          }}
        >
          {verbForms.map((vf, idx) => {
            const isInfinitive = idx === 0;
            const cardStyle = isInfinitive
              ? CARD_INFINITIVE
              : vf.isIrregular
                ? CARD_IRREGULAR
                : CARD_REGULAR;

            return (
              <div key={vf.label} style={cardStyle}>
                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: isInfinitive ? "var(--accent)" : "var(--text-muted)",
                    lineHeight: 1,
                  }}
                >
                  {vf.label}
                </span>

                {/* Form word */}
                <span
                  style={{
                    fontSize: isInfinitive ? 16 : 14,
                    fontWeight: isInfinitive ? 700 : 600,
                    color: "var(--ink)",
                    fontFamily: isInfinitive ? "var(--font-display)" : "inherit",
                    fontStyle: isInfinitive ? "italic" : "normal",
                    marginTop: 2,
                  }}
                >
                  {vf.form}
                </span>

                {/* Phonetics — compact single column, no repeated flag */}
                {(vf.phoneticsUs || vf.phoneticsUk) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                    {vf.phoneticsUs && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)", marginRight: 4, fontSize: 10, fontWeight: 600 }}>US</span>
                        {vf.phoneticsUs}
                      </span>
                    )}
                    {vf.phoneticsUk && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)", marginRight: 4, fontSize: 10, fontWeight: 600 }}>UK</span>
                        {vf.phoneticsUk}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: audio + irregular badge — pushed to bottom */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 4 }}>
                  <button
                    type="button"
                    aria-label={`Play pronunciation of ${vf.form}`}
                    onClick={() => speak(vf.form)}
                    style={{
                      display: "grid",
                      width: 24,
                      height: 24,
                      placeItems: "center",
                      borderRadius: 6,
                      color: "var(--text-muted)",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      padding: 0,
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    {speakingForm === vf.form ? (
                      <LoadingOutlined style={{ fontSize: 12 }} spin />
                    ) : (
                      <SoundOutlined style={{ fontSize: 12 }} />
                    )}
                  </button>
                  {vf.isIrregular && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "#fbe8ce",
                        color: "#9a4a1a",
                        border: "1px solid #e8b880",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Bất quy tắc
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
