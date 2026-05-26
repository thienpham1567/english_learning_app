"use client";

import { Info, Loader2, PlayCircle, Volume2, XCircle } from "lucide-react";

import * as m from "motion/react-client";
import { useEffect, useRef, useState } from "react";

type Accent = "us" | "uk" | "au";
type Gender = "male" | "female";

const ACCENTS: { key: Accent; label: string; flag: string }[] = [
  { key: "us", label: "Mỹ (US)", flag: "🇺🇸" },
  { key: "uk", label: "Anh (UK)", flag: "🇬🇧" },
  { key: "au", label: "Úc (AU)", flag: "🇦🇺" },
];

const GENDERS: { key: Gender; label: string }[] = [
  { key: "male", label: "Nam (Male)" },
  { key: "female", label: "Nữ (Female)" },
];

const SPEEDS = [0.75, 1.0, 1.25, 1.5];

export function TtsReader() {
  const [text, setText] = useState("");
  const [accent, setAccent] = useState<Accent>("us");
  const [gender, setGender] = useState<Gender>("female");
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!text.trim() || loading) return;
    setError(null);
    setLoading(true);
    setPlaying(false);

    try {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          accent,
          gender,
          speed,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể phát âm văn bản.");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("playing", () => setPlaying(true));
      audio.addEventListener("ended", () => setPlaying(false));
      audio.addEventListener("pause", () => setPlaying(false));
      audio.addEventListener("error", () => {
        setError("Lỗi khi phát tệp âm thanh.");
        setPlaying(false);
      });

      await audio.play();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi kết nối.");
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = text.length > 200;

  return (
    <div className="anim-fade-up flex flex-col gap-5">
      {/* Text Area Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-extrabold text-text-secondary">
            Nhập văn bản cần đọc thành tiếng (Tối đa 200 ký tự)
          </span>
          <span
            className="font-extrabold"
            style={{
              fontSize: 11.5,
              color: isOverLimit ? "var(--error)" : "var(--text-muted)",
              transition: "color 0.2s",
            }}
          >
            {text.length}/200 ký tự ({wordCount} từ)
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Type any English phrase, sentence or paragraph here to hear it spoken..."
          maxLength={250}
          className={`app-textarea ${isOverLimit ? "border-error" : ""} w-full h-[120px] p-4 text-[15px]`}
          style={{ lineHeight: 1.7, resize: "none", fontFamily: "inherit" }}
        />
      </div>

      {/* Configurations Cards Grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {/* Accent selector */}
        <div
          className="bg-(--surface) rounded-(--radius-xl)"
          style={{ border: "1.5px solid var(--border)", padding: "14px 16px" }}
        >
          <span
            className="font-black uppercase text-text-muted block mb-2.5"
            style={{ fontSize: 11.5, letterSpacing: "0.06em" }}
          >
            Giọng quốc gia
          </span>
          <div className="flex flex-col gap-1.5">
            {ACCENTS.map((acc) => {
              const isActive = accent === acc.key;
              return (
                <m.button
                  key={acc.key}
                  type="button"
                  onClick={() => setAccent(acc.key)}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 py-2 px-3 rounded-(--radius-lg) border-none font-extrabold text-[13px] cursor-pointer text-left"
                  style={{
                    background: isActive ? "var(--accent)" : "var(--surface-alt)",
                    color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  <span>{acc.flag}</span>
                  <span>{acc.label}</span>
                </m.button>
              );
            })}
          </div>
        </div>

        {/* Gender selector */}
        <div
          className="bg-(--surface) rounded-(--radius-xl)"
          style={{ border: "1.5px solid var(--border)", padding: "14px 16px" }}
        >
          <span
            className="font-black uppercase text-text-muted block mb-2.5"
            style={{ fontSize: 11.5, letterSpacing: "0.06em" }}
          >
            Giới tính giọng
          </span>
          <div className="flex flex-col gap-1.5">
            {GENDERS.map((g) => {
              const isActive = gender === g.key;
              return (
                <m.button
                  key={g.key}
                  type="button"
                  onClick={() => setGender(g.key)}
                  whileTap={{ scale: 0.98 }}
                  className="py-2 px-3 rounded-(--radius-lg) border-none font-extrabold text-[13px] cursor-pointer text-center"
                  style={{
                    background: isActive ? "var(--accent)" : "var(--surface-alt)",
                    color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {g.label}
                </m.button>
              );
            })}
          </div>
        </div>

        {/* Speed selector */}
        <div
          className="bg-(--surface) rounded-(--radius-xl)"
          style={{ border: "1.5px solid var(--border)", padding: "14px 16px" }}
        >
          <span
            className="font-black uppercase text-text-muted block mb-2.5"
            style={{ fontSize: 11.5, letterSpacing: "0.06em" }}
          >
            Tốc độ phát
          </span>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {SPEEDS.map((s) => {
              const isActive = speed === s;
              return (
                <m.button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-(--radius-lg) border-none font-extrabold cursor-pointer text-center"
                  style={{
                    padding: "8px 4px",
                    background: isActive ? "var(--accent)" : "var(--surface-alt)",
                    color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    fontSize: 12.5,
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {s.toFixed(2)}x
                </m.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info / Notice Panel */}
      <div
        className="rounded-(--radius-lg) leading-normal flex items-start gap-2"
        style={{
          padding: "12px 14px",
          background: "rgba(59, 130, 246, 0.05)",
          border: "1.5px solid rgba(59, 130, 246, 0.15)",
          color: "var(--info)",
          fontSize: 12.5,
        }}
      >
        <Info style={{ marginTop: 2 }} />
        <div>
          <strong>Công nghệ giọng nói Groq Orpheus:</strong> Chuyển văn bản thành giọng đọc tự
          nhiên, chất lượng phòng thu chuẩn quốc tế. Giới hạn tối đa 200 ký tự mỗi lần phát âm.
        </div>
      </div>

      {/* Action Control Button */}
      <div className="flex items-center gap-3">
        <m.button
          type="button"
          onClick={playing ? handleStop : handlePlay}
          disabled={!text.trim() || isOverLimit || loading}
          whileHover={!text.trim() || isOverLimit || loading ? {} : { scale: 1.02 }}
          whileTap={!text.trim() || isOverLimit || loading ? {} : { scale: 0.98 }}
          className="rounded-(--radius-xl) border-none text-sm font-black flex items-center gap-2"
          style={{
            padding: "12px 24px",
            background:
              !text.trim() || isOverLimit || loading
                ? "var(--border)"
                : playing
                  ? "var(--error)"
                  : "var(--accent)",
            color: "var(--text-on-accent)",
            cursor: !text.trim() || isOverLimit || loading ? "not-allowed" : "pointer",
            boxShadow:
              !text.trim() || isOverLimit || loading
                ? "none"
                : `0 4px 14px ${playing ? "var(--error)" : "var(--accent-muted)"}`,
            transition: "background 0.2s",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Đang chuẩn bị giọng nói...</span>
            </>
          ) : playing ? (
            <>
              <XCircle />
              <span>Dừng phát âm</span>
            </>
          ) : (
            <>
              <PlayCircle />
              <span>Đọc văn bản (TTS)</span>
            </>
          )}
        </m.button>

        {playing && (
          <m.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
            }}
            className="flex items-center gap-1 text-emerald-500 text-[13px] font-extrabold"
          >
            <Volume2 />
            <span>Đang phát giọng đọc...</span>
          </m.div>
        )}
      </div>

      {/* Error messages */}
      {error && (
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-(--radius-lg) text-destructive text-[13px] font-bold"
          style={{
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1.5px solid rgba(239, 68, 68, 0.15)",
          }}
        >
          {error}
        </m.div>
      )}
    </div>
  );
}
