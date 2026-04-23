"use client";

import { useRef, useState } from "react";
import { DownOutlined, LoadingOutlined, SoundOutlined } from "@ant-design/icons";
import { api } from "@/lib/api-client";

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
  border: "1px solid var(--accent)",
  borderLeftWidth: 3,
};

const CARD_IRREGULAR: React.CSSProperties = {
  ...CARD_BASE,
  background: "var(--warning-bg)",
  border: "1px solid var(--warning)",
};

let activeAudioEl: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;

export function VerbFormsSection({ verbForms }: Props) {
  const [open, setOpen] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  async function speak(form: string, locale: "en-US" | "en-GB") {
    const key = `${form}-${locale}`;

    // Stop any active audio
    activeAudioEl?.pause();
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    }
    if (activeUtteranceRef.current) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    setSpeakingKey(key);
    const accent = locale === "en-GB" ? "uk" : "us";

    try {
      const response = await api.post<Response>(
        "/voice/synthesize",
        { text: form, accent },
        { raw: true },
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      activeAudioUrl = url;
      const audio = new Audio(url);
      activeAudioEl = audio;
      audio.onended = () => {
        setSpeakingKey((curr) => (curr === key ? null : curr));
        URL.revokeObjectURL(url);
        if (activeAudioUrl === url) activeAudioUrl = null;
      };
      audio.onerror = () => {
        setSpeakingKey((curr) => (curr === key ? null : curr));
        URL.revokeObjectURL(url);
        if (activeAudioUrl === url) activeAudioUrl = null;
      };
      await audio.play();
    } catch {
      // Fallback to browser speechSynthesis
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(form);
        utterance.lang = locale;
        utterance.rate = 0.9;
        utterance.onend = () => {
          setSpeakingKey((curr) => (curr === key ? null : curr));
          activeUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setSpeakingKey((curr) => (curr === key ? null : curr));
          activeUtteranceRef.current = null;
        };
        activeUtteranceRef.current = utterance;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return;
      }
      setSpeakingKey((curr) => (curr === key ? null : curr));
    }
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

                {/* Phonetics with inline audio buttons */}
                {(vf.phoneticsUs || vf.phoneticsUk) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                    {vf.phoneticsUs && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            minWidth: 16,
                          }}
                        >
                          US
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {vf.phoneticsUs}
                        </span>
                        <MiniAudioBtn
                          isPlaying={speakingKey === `${vf.form}-en-US`}
                          onClick={() => speak(vf.form, "en-US")}
                          label={`US pronunciation of ${vf.form}`}
                        />
                      </div>
                    )}
                    {vf.phoneticsUk && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            minWidth: 16,
                          }}
                        >
                          UK
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {vf.phoneticsUk}
                        </span>
                        <MiniAudioBtn
                          isPlaying={speakingKey === `${vf.form}-en-GB`}
                          onClick={() => speak(vf.form, "en-GB")}
                          label={`UK pronunciation of ${vf.form}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: irregular badge — pushed to bottom */}
                {vf.isIrregular && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "var(--warning-bg)",
                        color: "var(--warning)",
                        border: "1px solid var(--warning)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Bất quy tắc
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Tiny audio play button inline with phonetics */
function MiniAudioBtn({
  isPlaying,
  onClick,
  label,
}: {
  isPlaying: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        display: "inline-grid",
        width: 18,
        height: 18,
        placeItems: "center",
        borderRadius: 4,
        color: isPlaying ? "var(--accent)" : "var(--text-muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        transition: "color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isPlaying) e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        if (!isPlaying) e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      {isPlaying ? (
        <LoadingOutlined style={{ fontSize: 11 }} spin />
      ) : (
        <SoundOutlined style={{ fontSize: 11 }} />
      )}
    </button>
  );
}
