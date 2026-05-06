"use client";

import { useState, useCallback } from "react";
import {
  CloseOutlined,
  SoundOutlined,
  StarOutlined,
  StarFilled,
  LoadingOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

export type DictResult = {
  data?: {
    headword: string;
    phonetics?: { ipa?: string; audio?: string }[];
    senses?: Array<{
      partOfSpeech: string;
      definition: string;
      definitionVi?: string;
      shortMeaningsVi?: string[];
      examples?: string[];
    }>;
  };
  saved?: boolean;
};

interface DictionaryModalProps {
  data: DictResult;
  onClose: () => void;
}

export function DictionaryModal({ data, onClose }: DictionaryModalProps) {
  const [saved, setSaved] = useState(data.saved || false);
  const [saving, setSaving] = useState(false);

  const entry = data.data;
  if (!entry) return null;

  const ipa = entry.phonetics?.[0]?.ipa;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/vocabulary/save", {
        query: entry.headword.toLowerCase().trim(),
      });
      setSaved(true);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.15s ease-out",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          width: "min(480px, 90vw)",
          maxHeight: "70vh",
          borderRadius: 16,
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "fadeInScale 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "color-mix(in srgb, var(--accent) 5%, var(--card-bg))",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              {entry.headword}
            </h3>
            {ipa && (
              <span style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "serif" }}>
                /{ipa}/
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saved || saving}
              style={{
                border: "none",
                background: saved
                  ? "color-mix(in srgb, var(--warning, #e8a838) 10%, transparent)"
                  : "var(--surface)",
                color: saved ? "var(--warning, #e8a838)" : "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 13,
                cursor: saved ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {saving ? (
                <LoadingOutlined />
              ) : saved ? (
                <StarFilled />
              ) : (
                <StarOutlined />
              )}
              {saved ? "Đã lưu" : "Lưu từ"}
            </button>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                width: 32,
                height: 32,
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "16px 20px",
            overflow: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {entry.senses?.map((sense, i) => (
            <div key={i}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {sense.partOfSpeech}
              </span>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                }}
              >
                {sense.definition}
              </p>

              {sense.shortMeaningsVi && sense.shortMeaningsVi.length > 0 && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                  }}
                >
                  🇻🇳 {sense.shortMeaningsVi.join(", ")}
                </p>
              )}

              {sense.definitionVi && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {sense.definitionVi}
                </p>
              )}

              {sense.examples && sense.examples.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {sense.examples.slice(0, 2).map((ex, j) => (
                    <p
                      key={j}
                      style={{
                        margin: "2px 0",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                        paddingLeft: 12,
                        borderLeft: "2px solid var(--border)",
                      }}
                    >
                      {ex}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
