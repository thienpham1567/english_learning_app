"use client";

import { useState } from "react";
import { AudioOutlined } from "@ant-design/icons";

const OPINION_PROMPTS = [
  { id: "op1", question: "Do you agree or disagree that companies should allow employees to work from home?", topic: "Remote Work" },
  { id: "op2", question: "Some people prefer to work for a large company. Others prefer to work for a small company. Which do you prefer and why?", topic: "Company Size" },
  { id: "op3", question: "Do you think technology has made our lives easier or more complicated? Explain your opinion.", topic: "Technology" },
  { id: "op4", question: "Is it better to have a job you love with low pay, or a job you dislike with high pay?", topic: "Career Choices" },
  { id: "op5", question: "Should companies invest more in training their employees? Why or why not?", topic: "Employee Training" },
];

export function ExpressOpinion() {
  const [selected, setSelected] = useState<string | null>(null);
  const prompt = OPINION_PROMPTS.find(p => p.id === selected);

  return (
    <div style={{ padding: "0 14px" }} className="anim-fade-up">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--info) 12%, var(--surface))", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
          <AudioOutlined style={{ fontSize: 20, color: "var(--info)" }} />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Express an Opinion · Part 5</h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", maxWidth: 420, marginInline: "auto" }}>
          Trình bày ý kiến của bạn về một chủ đề. Bạn có 30 giây chuẩn bị và 60 giây để nói.
        </p>
      </div>

      {!prompt ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OPINION_PROMPTS.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setSelected(p.id)}
              className={`anim-fade-up anim-delay-${Math.min(i + 1, 5)}`}
              style={{
                padding: "14px 18px", borderRadius: 14, border: "1px solid var(--border)",
                background: "var(--surface)", cursor: "pointer", textAlign: "left", width: "100%",
              }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--info)", marginBottom: 4 }}>{p.topic}</div>
              <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>{p.question}</div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{
            padding: "28px 24px", borderRadius: 16, border: "2px solid color-mix(in srgb, var(--info) 30%, transparent)",
            background: "color-mix(in srgb, var(--info) 4%, var(--surface))",
            width: "100%", maxWidth: 600, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--info)", marginBottom: 12 }}>
              {prompt.topic}
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink)", margin: 0, fontWeight: 500 }}>
              {prompt.question}
            </p>
          </div>
          <div style={{
            padding: "12px 18px", borderRadius: 12, background: "var(--bg-deep)",
            fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 500, textAlign: "center",
          }}>
            💡 <strong>Gợi ý cấu trúc:</strong> Nêu quan điểm → Đưa lý do 1 + ví dụ → Lý do 2 → Kết luận
          </div>
          <button type="button" onClick={() => setSelected(null)} style={{
            padding: "10px 24px", borderRadius: 12, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontSize: 13,
          }}>
            ← Chọn chủ đề khác
          </button>
        </div>
      )}
    </div>
  );
}
