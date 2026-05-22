"use client";

import { useState } from "react";
import { SoundOutlined } from "@ant-design/icons";

const READ_ALOUD_PASSAGES = [
  { id: "ra1", text: "The quarterly financial report indicates that revenue has increased by twelve percent compared to the same period last year, primarily driven by strong performance in the Asia-Pacific region.", topic: "Business Report" },
  { id: "ra2", text: "All employees are required to complete the mandatory safety training program by the end of this month. Please register through the company intranet portal.", topic: "Office Announcement" },
  { id: "ra3", text: "Thank you for calling GreenTech Solutions. Our office hours are Monday through Friday, nine a.m. to six p.m. For technical support, please press one.", topic: "Phone Message" },
  { id: "ra4", text: "The conference room on the third floor has been reserved for the marketing team's presentation on Thursday. Light refreshments will be provided during the break.", topic: "Meeting Notice" },
  { id: "ra5", text: "Due to scheduled maintenance, the building's elevator service will be temporarily suspended this Saturday from eight a.m. to two p.m. We apologize for any inconvenience.", topic: "Building Notice" },
  { id: "ra6", text: "The new employee orientation session will cover company policies, benefits information, and an overview of departmental responsibilities. Please bring a valid photo identification.", topic: "HR Notice" },
];

export function ReadAloud() {
  const [selected, setSelected] = useState<string | null>(null);
  const passage = READ_ALOUD_PASSAGES.find(p => p.id === selected);

  return (
    <div style={{ padding: "0 14px" }} className="anim-fade-up">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--secondary) 12%, var(--surface))", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
          <SoundOutlined style={{ fontSize: 20, color: "var(--secondary)" }} />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Read Aloud · Part 1</h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", maxWidth: 400, marginInline: "auto" }}>
          Đọc to đoạn văn hiển thị. Bạn có 45 giây để chuẩn bị và 45 giây để đọc.
        </p>
      </div>

      {!passage ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {READ_ALOUD_PASSAGES.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setSelected(p.id)}
              className={`anim-fade-up anim-delay-${Math.min(i + 1, 5)}`}
              style={{
                padding: "14px 18px", borderRadius: 14, border: "1px solid var(--border)",
                background: "var(--surface)", cursor: "pointer", textAlign: "left", width: "100%",
                transition: "all 0.15s",
              }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{p.topic}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                {p.text.slice(0, 80)}...
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{
            padding: "24px 20px", borderRadius: 16, border: "1px solid var(--border)",
            background: "var(--surface)", width: "100%", maxWidth: 600,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 10 }}>
              {passage.topic}
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.8, color: "var(--ink)", margin: 0, fontFamily: "var(--font-body)" }}>
              {passage.text}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Đọc to đoạn văn trên. Chú ý phát âm rõ ràng, ngữ điệu tự nhiên.
          </p>
          <button type="button" onClick={() => setSelected(null)} style={{
            padding: "10px 24px", borderRadius: 12, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontSize: 13,
          }}>
            ← Chọn đoạn khác
          </button>
        </div>
      )}
    </div>
  );
}
