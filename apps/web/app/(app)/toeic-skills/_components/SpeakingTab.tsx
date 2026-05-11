"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  AudioOutlined,
  PictureOutlined,
  PauseCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Waveform } from "@/components/speaking/Waveform";
import { api } from "@/lib/api-client";

const PICTURES = [
  { id: "photo-1497366216548-37526070297c", scene: "Office meeting room", tags: ["business","meeting"], keyElements: ["people sitting around a table","laptop computers","presentation screen"] },
  { id: "photo-1555396273-367ea4eb4db5", scene: "Restaurant dining", tags: ["food","restaurant"], keyElements: ["waitstaff serving food","dining tables","customers eating"] },
  { id: "photo-1517248135467-4c7edcad34c4", scene: "Restaurant interior", tags: ["dining","indoor"], keyElements: ["wooden tables","dim lighting","wine glasses"] },
  { id: "photo-1573497019940-1c28c88b4f3e", scene: "Construction site", tags: ["construction","outdoor"], keyElements: ["workers wearing helmets","building framework","construction equipment"] },
  { id: "photo-1436491865332-7a61a109db05", scene: "Airport terminal", tags: ["travel","airport"], keyElements: ["passengers with luggage","departure board","check-in counters"] },
  { id: "photo-1441986300917-64674bd600d8", scene: "Retail store", tags: ["shopping","indoor"], keyElements: ["shelves with products","customer browsing","store clerk"] },
  { id: "photo-1503676260728-1c00da094a0b", scene: "Classroom", tags: ["education","indoor"], keyElements: ["students at desks","teacher at whiteboard","books and notebooks"] },
  { id: "photo-1571019613454-1cb2f99b2d8b", scene: "Gym workout", tags: ["fitness","indoor"], keyElements: ["people exercising","gym equipment","weights and machines"] },
  { id: "photo-1506905925346-21bda4d32df4", scene: "Mountain landscape", tags: ["nature","outdoor"], keyElements: ["snow-capped mountains","hiking trail","clear blue sky"] },
  { id: "photo-1544620347-c4fd4a3d5957", scene: "City bus", tags: ["transport","urban"], keyElements: ["passengers sitting","driver at wheel","bus interior"] },
  { id: "photo-1559136555-9303baea8ebd", scene: "Farmers market", tags: ["outdoor","food"], keyElements: ["fresh produce on display","vendor and customers","colorful fruits and vegetables"] },
  { id: "photo-1521737711867-e3b97375f902", scene: "Team collaboration", tags: ["business","teamwork"], keyElements: ["coworkers discussing","sticky notes on board","standing around table"] },
];

type FeedbackResult = {
  pronunciation: number; intonation: number; grammar: number; vocabulary: number;
  overall: number; transcript: string; summary: string; improvements: string[];
};
type PageState = "gallery" | "viewing" | "recording" | "evaluating" | "result";
type SpeakingPart = "part3" | "part1" | "part5";

const SPEAKING_PARTS: { key: SpeakingPart; label: string; desc: string }[] = [
  { key: "part3", label: "Part 3 · Mô tả hình", desc: "Describe a Picture" },
  { key: "part1", label: "Part 1 · Đọc to", desc: "Read Aloud" },
  { key: "part5", label: "Part 5 · Ý kiến", desc: "Express an Opinion" },
];

export function SpeakingTab() {
  const [activePart, setActivePart] = useState<SpeakingPart>("part3");
  const [state, setState] = useState<PageState>("gallery");
  const [selectedPic, setSelectedPic] = useState<typeof PICTURES[0] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isEvaluatingRef = useRef(false);
  const voice = useVoiceInput({ autoTranscribe: false });

  useEffect(() => () => { isMountedRef.current = false; if (timerRef.current) clearInterval(timerRef.current); }, []);

  const imgUrl = (id: string) => `https://images.unsplash.com/${id}?w=600&h=400&fit=crop&auto=format&q=80`;

  const selectPicture = (pic: typeof PICTURES[0]) => { setSelectedPic(pic); setFeedback(null); setError(null); setState("viewing"); };

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      await voice.start(); setState("recording"); setTimeLeft(45);
      timerRef.current = setInterval(() => { setTimeLeft((p) => { if (p <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return p - 1; }); }, 1000);
    } catch { setError("Không thể truy cập microphone."); }
  }, [voice]);

  const stopRecording = useCallback(() => {
    if (state !== "recording") return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    voice.stop();
  }, [voice, state]);

  useEffect(() => { if (state === "recording" && timeLeft === 0 && timerRef.current === null) stopRecording(); }, [state, timeLeft, stopRecording]);

  useEffect(() => {
    if (state !== "recording" || !voice.blob || isEvaluatingRef.current || !selectedPic) return;
    isEvaluatingRef.current = true; setState("evaluating");
    const fd = new FormData();
    fd.append("audio", voice.blob, "recording.webm");
    fd.append("scene", selectedPic.scene);
    fd.append("keyElements", JSON.stringify(selectedPic.keyElements));
    fd.append("durationMs", String(Math.round(voice.durationMs)));
    api.post<FeedbackResult>("/toeic-speaking/describe-picture", fd)
      .then((r) => { if (isMountedRef.current) { setFeedback(r); setState("result"); } })
      .catch(() => { if (isMountedRef.current) { setError("Có lỗi khi đánh giá."); setState("viewing"); } })
      .finally(() => { isEvaluatingRef.current = false; });
  }, [state, voice.blob, voice.durationMs, selectedPic]);

  const retry = () => { setFeedback(null); setState("viewing"); };
  const backToGallery = () => { setSelectedPic(null); setFeedback(null); setState("gallery"); };
  const scoreColor = (s: number) => s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--error)";
  const formatTime = (s: number) => `0:${String(s).padStart(2, "0")}`;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
      {/* Part selector */}
      <div style={{ display: "flex", gap: 8, padding: "8px 14px", flexWrap: "wrap", marginBottom: 8 }}>
        {SPEAKING_PARTS.map(p => (
          <button key={p.key} type="button" onClick={() => { setActivePart(p.key); setState("gallery"); setFeedback(null); setSelectedPic(null); }}
            style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${activePart === p.key ? "var(--accent)" : "var(--border)"}`,
              background: activePart === p.key ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
              color: activePart === p.key ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: "10px 16px", borderRadius: 10, background: "var(--error-bg)", color: "var(--error)", marginBottom: 16, fontSize: 13, margin: "0 14px 16px" }}>{error}</div>}

      {/* Part 1: Read Aloud */}
      {activePart === "part1" && <ReadAloudSection />}

      {/* Part 5: Express an Opinion */}
      {activePart === "part5" && <OpinionSection />}

      {/* Part 3: Describe a Picture (existing functionality) */}
      {activePart === "part3" && (
        <>
      {/* GALLERY */}
      {state === "gallery" && (
        <div className="anim-fade-up">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 12%, var(--surface))", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
              <PictureOutlined style={{ fontSize: 24, color: "var(--accent)" }} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>Chọn hình ảnh để mô tả</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", maxWidth: 440, marginInline: "auto", lineHeight: 1.5 }}>
              Bạn sẽ có 45 giây để mô tả bức hình bằng tiếng Anh. AI sẽ đánh giá phát âm, ngữ pháp và nội dung.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {PICTURES.map((pic, i) => (
              <button key={pic.id} className={`anim-fade-up anim-delay-${Math.min(i + 1, 8)}`} onClick={() => selectPicture(pic)}
                style={{ padding: 0, border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg)", overflow: "hidden", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl(pic.id)} alt={pic.scene} style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} loading="lazy" />
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{pic.scene}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>{pic.tags.map((t) => <Tag key={t} style={{ margin: 0, borderRadius: 6, fontSize: 10 }}>{t}</Tag>)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEWING / RECORDING / EVALUATING */}
      {selectedPic && (state === "viewing" || state === "recording" || state === "evaluating") && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", border: state === "recording" ? "2px solid var(--error)" : "1px solid var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(selectedPic.id)} alt={selectedPic.scene} style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }} />
          </div>
          {state === "recording" && (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: timeLeft <= 10 ? "var(--error)" : "var(--text-primary)", fontFamily: "var(--font-display)" }}>{formatTime(timeLeft)}</div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>Thời gian còn lại</p>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}><Waveform getStream={voice.getStream} active={true} /></div>
            </>
          )}
          {state === "viewing" && (
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "color-mix(in srgb, var(--info) 6%, var(--surface))", border: "1px solid color-mix(in srgb, var(--info) 20%, transparent)", fontSize: 12, color: "var(--text-secondary)" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--info)" }}><InfoCircleOutlined /> Mẹo mô tả hình:</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                <li>Bắt đầu: &ldquo;In this picture, I can see...&rdquo;</li>
                <li>Mô tả từ tổng quan đến chi tiết</li>
                <li>Dùng thì hiện tại tiếp diễn cho hành động</li>
              </ul>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            {state === "viewing" && (
              <><button onClick={startRecording} style={{ width: 72, height: 72, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 70%, white))", color: "var(--text-on-accent)", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 16px color-mix(in srgb, var(--error) 30%, transparent)" }}><AudioOutlined /></button>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Nhấn để bắt đầu mô tả (45s)</p>
              <button onClick={backToGallery} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>← Chọn hình khác</button></>
            )}
            {state === "recording" && (
              <><button onClick={stopRecording} style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid var(--error)", background: "var(--surface)", color: "var(--error)", fontSize: 22, cursor: "pointer", animation: "pulse 1s ease-in-out infinite" }}><PauseCircleOutlined /></button>
              <p style={{ fontSize: 12, color: "var(--error)", marginTop: 8, fontWeight: 600 }}>Đang ghi âm...</p></>
            )}
            {state === "evaluating" && <div><LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} /><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>Đang đánh giá...</p></div>}
          </div>
        </div>
      )}

      {/* RESULT */}
      {state === "result" && feedback && selectedPic && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", maxHeight: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(selectedPic.id)} alt={selectedPic.scene} style={{ width: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ padding: 24, borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
            <Progress type="circle" percent={feedback.overall} size={100} strokeColor={scoreColor(feedback.overall)} format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}</span>} />
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
              {[{ label: "Phát âm", score: feedback.pronunciation }, { label: "Ngữ điệu", score: feedback.intonation }, { label: "Ngữ pháp", score: feedback.grammar }, { label: "Từ vựng", score: feedback.vocabulary }].map((s) => (
                <div key={s.label}><p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.label}</p><p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: scoreColor(s.score), fontFamily: "var(--font-display)" }}>{s.score}</p></div>
              ))}
            </div>
          </div>
          {feedback.summary && <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}><p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{feedback.summary}</p></div>}
          {feedback.improvements?.length > 0 && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", margin: "0 0 8px" }}><SoundOutlined style={{ marginRight: 4 }} /> Cải thiện</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)" }}>{feedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}</ul>
            </div>
          )}
          {feedback.transcript && (
            <div style={{ padding: "14px 18px", borderRadius: 14, background: "var(--bg-deep)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 6px" }}>Bạn đã nói:</p>
              <p style={{ fontSize: 13, margin: 0, fontStyle: "italic", lineHeight: 1.6, color: "var(--text-secondary)" }}>&ldquo;{feedback.transcript}&rdquo;</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={retry} style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontSize: 13 }}><ReloadOutlined /> Thử lại</button>
            <button onClick={backToGallery} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--text-on-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Hình khác <CheckCircleOutlined /></button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ── Part 1: Read Aloud ──────────────────────────────────────────
const READ_ALOUD_PASSAGES = [
  { id: "ra1", text: "The quarterly financial report indicates that revenue has increased by twelve percent compared to the same period last year, primarily driven by strong performance in the Asia-Pacific region.", topic: "Business Report" },
  { id: "ra2", text: "All employees are required to complete the mandatory safety training program by the end of this month. Please register through the company intranet portal.", topic: "Office Announcement" },
  { id: "ra3", text: "Thank you for calling GreenTech Solutions. Our office hours are Monday through Friday, nine a.m. to six p.m. For technical support, please press one.", topic: "Phone Message" },
  { id: "ra4", text: "The conference room on the third floor has been reserved for the marketing team's presentation on Thursday. Light refreshments will be provided during the break.", topic: "Meeting Notice" },
  { id: "ra5", text: "Due to scheduled maintenance, the building's elevator service will be temporarily suspended this Saturday from eight a.m. to two p.m. We apologize for any inconvenience.", topic: "Building Notice" },
  { id: "ra6", text: "The new employee orientation session will cover company policies, benefits information, and an overview of departmental responsibilities. Please bring a valid photo identification.", topic: "HR Notice" },
];

function ReadAloudSection() {
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

// ── Part 5: Express an Opinion ──────────────────────────────────
const OPINION_PROMPTS = [
  { id: "op1", question: "Do you agree or disagree that companies should allow employees to work from home?", topic: "Remote Work" },
  { id: "op2", question: "Some people prefer to work for a large company. Others prefer to work for a small company. Which do you prefer and why?", topic: "Company Size" },
  { id: "op3", question: "Do you think technology has made our lives easier or more complicated? Explain your opinion.", topic: "Technology" },
  { id: "op4", question: "Is it better to have a job you love with low pay, or a job you dislike with high pay?", topic: "Career Choices" },
  { id: "op5", question: "Should companies invest more in training their employees? Why or why not?", topic: "Employee Training" },
];

function OpinionSection() {
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
