"use client";

import { useRef, useState } from "react";
import { Tag } from "antd";
import { DownOutlined, LoadingOutlined, SoundOutlined } from "@ant-design/icons";

import type { VerbForm } from "@/lib/schemas/vocabulary";

type Props = {
  verbForms: VerbForm[];
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
          DẠNG ĐỘNG TỪ
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
          {verbForms.map((vf) => (
            <div
              key={vf.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-deep)",
                padding: "12px 14px",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                }}
              >
                {vf.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{vf.form}</span>
              {(vf.phoneticsUs || vf.phoneticsUk) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {vf.phoneticsUs && (
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent)",
                      }}
                    >
                      🇺🇸 {vf.phoneticsUs}
                    </span>
                  )}
                  {vf.phoneticsUk && (
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent)",
                      }}
                    >
                      🇬🇧 {vf.phoneticsUk}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  aria-label={`Play pronunciation of ${vf.form}`}
                  onClick={() => speak(vf.form)}
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
                  }}
                >
                  {speakingForm === vf.form ? (
                    <LoadingOutlined style={{ fontSize: 13 }} spin />
                  ) : (
                    <SoundOutlined style={{ fontSize: 13 }} />
                  )}
                </button>
                {vf.isIrregular && (
                  <Tag
                    color="orange"
                    style={{ margin: 0, fontSize: 10, padding: "0 6px", lineHeight: "16px" }}
                  >
                    Bất quy tắc
                  </Tag>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
