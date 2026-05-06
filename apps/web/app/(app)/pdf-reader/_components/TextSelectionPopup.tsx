"use client";

import { useState, useCallback } from "react";
import {
  BookOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
  SwapOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

interface TextSelectionPopupProps {
  text: string;
  rect: DOMRect;
  onClose: () => void;
  onDictionaryResult?: (data: unknown) => void;
}

type ActionState = "idle" | "loading" | "done" | "error";

export function TextSelectionPopup({
  text,
  rect,
  onClose,
  onDictionaryResult,
}: TextSelectionPopupProps) {
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [actionResult, setActionResult] = useState<Record<string, unknown>>({});

  const setAction = useCallback(
    (key: string, state: ActionState, result?: unknown) => {
      setActionState((prev) => ({ ...prev, [key]: state }));
      if (result !== undefined) setActionResult((prev) => ({ ...prev, [key]: result }));
    },
    [],
  );

  // Dictionary lookup
  const lookupWord = useCallback(async () => {
    // Use first word if multi-word selected for dictionary, full text for grammar/paraphrase
    const word = text.split(/\s+/)[0] || text;
    setAction("dictionary", "loading");
    try {
      const data = await api.post("/dictionary", { word });
      setAction("dictionary", "done", data);
      onDictionaryResult?.(data);
    } catch {
      setAction("dictionary", "error");
    }
  }, [text, setAction, onDictionaryResult]);

  // Grammar check
  const grammarCheck = useCallback(async () => {
    setAction("grammar", "loading");
    try {
      const data = await api.post("/writing-tools/grammar-check", { text });
      setAction("grammar", "done", data);
    } catch {
      setAction("grammar", "error");
    }
  }, [text, setAction]);

  // Paraphrase
  const paraphrase = useCallback(async () => {
    setAction("paraphrase", "loading");
    try {
      const data = await api.post("/writing-tools/paraphrase", {
        text,
        mode: "standard",
        synonymLevel: 50,
      });
      setAction("paraphrase", "done", data);
    } catch {
      setAction("paraphrase", "error");
    }
  }, [text, setAction]);

  // Save vocabulary
  const saveVocabulary = useCallback(async () => {
    const word = text.split(/\s+/)[0] || text;
    setAction("save", "loading");
    try {
      // First lookup to ensure word is in cache
      await api.post("/dictionary", { word });
      await api.post("/vocabulary/save", { query: word.toLowerCase().trim() });
      setAction("save", "done");
    } catch {
      setAction("save", "error");
    }
  }, [text, setAction]);

  const actions = [
    {
      key: "dictionary",
      label: "Tra từ",
      icon: <SearchOutlined />,
      onClick: lookupWord,
    },
    {
      key: "grammar",
      label: "Kiểm tra",
      icon: <CheckCircleOutlined />,
      onClick: grammarCheck,
    },
    {
      key: "paraphrase",
      label: "Viết lại",
      icon: <SwapOutlined />,
      onClick: paraphrase,
    },
    {
      key: "save",
      label: "Lưu từ",
      icon: <StarOutlined />,
      onClick: saveVocabulary,
    },
  ];

  // Position popup above selection
  const popupStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.max(8, rect.left + rect.width / 2 - 140),
    top: Math.max(8, rect.top - 52),
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 8px",
    borderRadius: 12,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    animation: "fadeInUp 0.15s ease-out",
  };

  return (
    <>
      {/* Backdrop to close */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
        }}
      />

      <div style={popupStyle}>
        {actions.map((action) => {
          const state = actionState[action.key] || "idle";
          return (
            <button
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                if (state === "loading") return;
                action.onClick();
              }}
              disabled={state === "loading"}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background:
                  state === "done"
                    ? "color-mix(in srgb, var(--success) 10%, transparent)"
                    : "transparent",
                color:
                  state === "done"
                    ? "var(--success)"
                    : state === "loading"
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                fontSize: 11,
                cursor: state === "loading" ? "wait" : "pointer",
                transition: "all 0.2s",
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 16 }}>
                {state === "loading" ? <LoadingOutlined /> : action.icon}
              </span>
              <span style={{ fontWeight: 500 }}>{action.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
