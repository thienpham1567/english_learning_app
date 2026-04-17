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
  padding: "12px 14px",
  transition: "box-shadow 0.2s",
};

const CARD_REGULAR: React.CSSProperties = {
  ...CARD_BASE,
  background: "var(--bg-deep)",
  border: "1px solid transparent",
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
    <div className="anim-fade-up" style={{ marginTop: 20 }}>
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
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "var(--accent)",
          }}
        >
          Dạng động từ
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{verbForms.length} dạng</span>
          <DownOutlined
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0)",
            }}
          />
        </div>
      </button>

      {open && (
        <div
          id="verb-forms-grid"
          className="anim-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 8,
            paddingTop: 12,
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
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isInfinitive ? "var(--accent)" : "var(--text-muted)",
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
                  }}
                >
                  {vf.form}
                </span>

                {/* Phonetics — compact single column, no repeated flag */}
                {(vf.phoneticsUs || vf.phoneticsUk) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {vf.phoneticsUs && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)", marginRight: 3 }}>US</span>
                        {vf.phoneticsUs}
                      </span>
                    )}
                    {vf.phoneticsUk && (
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)", marginRight: 3 }}>UK</span>
                        {vf.phoneticsUk}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: audio + irregular badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <button
                    type="button"
                    aria-label={`Play pronunciation of ${vf.form}`}
                    onClick={() => speak(vf.form)}
                    style={{
                      display: "grid",
                      width: 22,
                      height: 22,
                      placeItems: "center",
                      borderRadius: 4,
                      color: "var(--text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
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
                        padding: "1px 6px",
                        borderRadius: 4,
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
