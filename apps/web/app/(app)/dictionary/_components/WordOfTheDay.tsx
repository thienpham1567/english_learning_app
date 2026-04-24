"use client";

import { useMemo } from "react";
import { CalendarOutlined, SoundOutlined } from "@ant-design/icons";

type Props = {
  onSelect: (word: string) => void;
};

type DailyWord = {
  word: string;
  phonetic: string;
  pos: string;
  definitionVi: string;
  example: string;
};

/**
 * A curated pool of interesting English words rotated by day.
 * The pool is large enough (~60) to avoid repetition for 2 months.
 */
const WORD_POOL: DailyWord[] = [
  { word: "serendipity", phonetic: "/ˌser.ənˈdɪp.ə.ti/", pos: "noun", definitionVi: "Sự may mắn tình cờ", example: "Finding that book was pure serendipity." },
  { word: "eloquent", phonetic: "/ˈel.ə.kwənt/", pos: "adj", definitionVi: "Hùng biện, lưu loát", example: "She gave an eloquent speech at the conference." },
  { word: "resilient", phonetic: "/rɪˈzɪl.i.ənt/", pos: "adj", definitionVi: "Kiên cường, dẻo dai", example: "Children are remarkably resilient to change." },
  { word: "ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", pos: "adj", definitionVi: "Có mặt ở khắp nơi", example: "Smartphones have become ubiquitous in modern life." },
  { word: "ephemeral", phonetic: "/ɪˈfem.ər.əl/", pos: "adj", definitionVi: "Phù du, ngắn ngủi", example: "Fame in social media is often ephemeral." },
  { word: "pragmatic", phonetic: "/præɡˈmæt.ɪk/", pos: "adj", definitionVi: "Thực dụng, thực tế", example: "We need a pragmatic approach to this problem." },
  { word: "meticulous", phonetic: "/məˈtɪk.jə.ləs/", pos: "adj", definitionVi: "Tỉ mỉ, cẩn thận", example: "She is meticulous about her research methods." },
  { word: "ambiguous", phonetic: "/æmˈbɪɡ.ju.əs/", pos: "adj", definitionVi: "Mơ hồ, nước đôi", example: "The contract language was deliberately ambiguous." },
  { word: "leverage", phonetic: "/ˈlev.ər.ɪdʒ/", pos: "verb", definitionVi: "Tận dụng, khai thác", example: "We can leverage technology to improve efficiency." },
  { word: "paradigm", phonetic: "/ˈpær.ə.daɪm/", pos: "noun", definitionVi: "Mô hình, khuôn mẫu", example: "The internet created a new paradigm for communication." },
  { word: "scrutinize", phonetic: "/ˈskruː.tə.naɪz/", pos: "verb", definitionVi: "Xem xét kỹ lưỡng", example: "The committee will scrutinize every proposal." },
  { word: "versatile", phonetic: "/ˈvɜː.sə.taɪl/", pos: "adj", definitionVi: "Đa năng, linh hoạt", example: "Python is a versatile programming language." },
  { word: "profound", phonetic: "/prəˈfaʊnd/", pos: "adj", definitionVi: "Sâu sắc, uyên thâm", example: "The discovery had a profound impact on science." },
  { word: "deteriorate", phonetic: "/dɪˈtɪə.ri.ə.reɪt/", pos: "verb", definitionVi: "Xấu đi, xuống cấp", example: "Air quality continues to deteriorate in urban areas." },
  { word: "innovate", phonetic: "/ˈɪn.ə.veɪt/", pos: "verb", definitionVi: "Đổi mới, sáng tạo", example: "Companies must innovate to stay competitive." },
  { word: "concise", phonetic: "/kənˈsaɪs/", pos: "adj", definitionVi: "Ngắn gọn, súc tích", example: "Please keep your summary concise and clear." },
  { word: "collaborate", phonetic: "/kəˈlæb.ə.reɪt/", pos: "verb", definitionVi: "Hợp tác, cộng tác", example: "The two teams will collaborate on this project." },
  { word: "phenomenon", phonetic: "/fɪˈnɒm.ɪ.nən/", pos: "noun", definitionVi: "Hiện tượng", example: "Global warming is a well-documented phenomenon." },
  { word: "contemplate", phonetic: "/ˈkɒn.tem.pleɪt/", pos: "verb", definitionVi: "Suy ngẫm, chiêm nghiệm", example: "She sat by the window, contemplating her future." },
  { word: "advocate", phonetic: "/ˈæd.və.keɪt/", pos: "verb", definitionVi: "Ủng hộ, vận động", example: "He advocates for equal access to education." },
  { word: "diligent", phonetic: "/ˈdɪl.ɪ.dʒənt/", pos: "adj", definitionVi: "Siêng năng, cần cù", example: "Diligent students tend to achieve their goals." },
  { word: "sustainable", phonetic: "/səˈsteɪ.nə.bəl/", pos: "adj", definitionVi: "Bền vững", example: "We need sustainable solutions for energy production." },
  { word: "inherent", phonetic: "/ɪnˈhɪə.rənt/", pos: "adj", definitionVi: "Vốn có, cố hữu", example: "There are inherent risks in any investment." },
  { word: "mitigate", phonetic: "/ˈmɪt.ɪ.ɡeɪt/", pos: "verb", definitionVi: "Giảm nhẹ, xoa dịu", example: "We must mitigate the effects of climate change." },
  { word: "persevere", phonetic: "/ˌpɜː.sɪˈvɪər/", pos: "verb", definitionVi: "Kiên trì, bền bỉ", example: "You must persevere despite the challenges." },
  { word: "nuance", phonetic: "/ˈnjuː.ɑːns/", pos: "noun", definitionVi: "Sắc thái, tinh tế", example: "She understands the nuances of the language." },
  { word: "consensus", phonetic: "/kənˈsen.səs/", pos: "noun", definitionVi: "Sự đồng thuận", example: "The committee reached a consensus on the issue." },
  { word: "comprehensive", phonetic: "/ˌkɒm.prɪˈhen.sɪv/", pos: "adj", definitionVi: "Toàn diện, đầy đủ", example: "The report provides a comprehensive analysis." },
  { word: "procrastinate", phonetic: "/prəˈkræs.tɪ.neɪt/", pos: "verb", definitionVi: "Trì hoãn, chần chừ", example: "Stop procrastinating and start working on your essay." },
  { word: "empathy", phonetic: "/ˈem.pə.θi/", pos: "noun", definitionVi: "Sự đồng cảm", example: "A good leader shows empathy toward their team." },
];

function getDayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % WORD_POOL.length;
}

export function WordOfTheDay({ onSelect }: Props) {
  const daily = useMemo(() => WORD_POOL[getDayIndex()], []);

  return (
    <div
      className="anim-fade-in"
      style={{
        borderRadius: "var(--radius)",
        background: "linear-gradient(135deg, var(--accent-muted), var(--accent-light))",
        border: "1px solid var(--accent)",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onClick={() => onSelect(daily.word)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "var(--accent)",
          }}
        >
          <CalendarOutlined style={{ fontSize: 12 }} />
          Từ vựng hôm nay
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--accent)",
            color: "var(--text-on-accent)",
          }}
        >
          {daily.pos}
        </span>
      </div>

      {/* Word */}
      <div style={{ marginTop: 8 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            lineHeight: 1.2,
          }}
        >
          {daily.word}
        </span>
      </div>

      {/* Phonetic */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        <SoundOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
          }}
        >
          {daily.phonetic}
        </span>
      </div>

      {/* Definition */}
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "8px 0 0",
        }}
      >
        {daily.definitionVi}
      </p>

      {/* Example */}
      <p
        style={{
          marginTop: 6,
          fontSize: 12,
          fontStyle: "italic",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          margin: "6px 0 0",
        }}
      >
        &ldquo;{daily.example}&rdquo;
      </p>

      {/* CTA */}
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--accent)",
          textAlign: "right",
        }}
      >
        Tra cứu chi tiết →
      </div>
    </div>
  );
}
