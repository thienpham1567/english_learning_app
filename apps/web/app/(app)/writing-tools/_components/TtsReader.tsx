"use client";

import { Info, Loader2, PlayCircle, Volume2, XCircle } from "lucide-react";

import * as m from "motion/react-client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Accent = "us" | "uk" | "au";
type Gender = "male" | "female";

const ACCENTS: { key: Accent; label: string; code: string }[] = [
  { key: "us", label: "United States (US)", code: "US" },
  { key: "uk", label: "United Kingdom (UK)", code: "UK" },
  { key: "au", label: "Australia (AU)", code: "AU" },
];

const GENDERS: { key: Gender; label: string }[] = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
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
        throw new Error(errData.error || "Unable to synthesize speech.");
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
        setError("Error playing audio file.");
        setPlaying(false);
      });

      await audio.play();
    } catch (err: any) {
      setError(err.message || "Connection error occurred.");
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
          <span className="text-[13px] font-bold text-text-secondary">
            Enter text to speak (Max 200 characters)
          </span>
          <span
            className={`text-[11.5px] font-bold transition-colors duration-200 ${isOverLimit ? "text-error" : "text-text-muted"}`}
          >
            {text.length}/200 characters ({wordCount} words)
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
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {/* Accent selector */}
        <Card shadowSize="sm" size="sm">
          <span className="font-black uppercase text-text-muted block mb-2.5 text-[11.5px] tracking-wider">
            Accent
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
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg font-extrabold text-[13px] cursor-pointer text-left border-2 transition-all duration-100 ${
                    isActive
                      ? "bg-accent text-text-on-accent border-border shadow-sm"
                      : "bg-surface-alt text-text-secondary border-transparent hover:border-border hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold leading-none ${
                      isActive ? "bg-white/20 text-text-on-accent" : "bg-border text-text-secondary"
                    }`}
                  >
                    {acc.code}
                  </span>
                  <span>{acc.label}</span>
                </m.button>
              );
            })}
          </div>
        </Card>

        {/* Gender selector */}
        <Card shadowSize="sm" size="sm">
          <span className="font-black uppercase text-text-muted block mb-2.5 text-[11.5px] tracking-wider">
            Voice Gender
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
                  className={`py-2 px-3 rounded-lg font-extrabold text-[13px] cursor-pointer text-center border-2 transition-all duration-100 ${
                    isActive
                      ? "bg-accent text-text-on-accent border-border shadow-sm"
                      : "bg-surface-alt text-text-secondary border-transparent hover:border-border hover:shadow-sm"
                  }`}
                >
                  {g.label}
                </m.button>
              );
            })}
          </div>
        </Card>

        {/* Speed selector */}
        <Card shadowSize="sm" size="sm">
          <span className="font-black uppercase text-text-muted block mb-2.5 text-[11.5px] tracking-wider">
            Playback Speed
          </span>
          <div className="grid gap-1.5 grid-cols-2">
            {SPEEDS.map((s) => {
              const isActive = speed === s;
              return (
                <m.button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  whileTap={{ scale: 0.98 }}
                  className={`py-2 px-1 rounded-lg font-extrabold cursor-pointer text-center text-[12.5px] border-2 transition-all duration-100 ${
                    isActive
                      ? "bg-accent text-text-on-accent border-border shadow-sm"
                      : "bg-surface-alt text-text-secondary border-transparent hover:border-border hover:shadow-sm"
                  }`}
                >
                  {s.toFixed(2)}x
                </m.button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Info / Notice Panel */}
      <Card
        shadowSize="none"
        size="sm"
        accentColor="info"
        accentPosition="left"
        className="text-info text-[12.5px] leading-normal flex flex-row items-start gap-2.5 bg-info-bg border-info/20"
      >
        <Info className="mt-0.5 shrink-0" size={16} />
        <div>
          <strong>Groq Orpheus Speech Technology:</strong> Converts text into natural,
          studio-quality speech. Maximum limit of 200 characters per request.
        </div>
      </Card>

      {/* Action Control Button */}
      <div className="flex items-center gap-3">
        <Button
          size="lg"
          variant={playing ? "destructive" : "default"}
          onClick={playing ? handleStop : handlePlay}
          disabled={!text.trim() || isOverLimit || loading}
          className="px-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Preparing voice...</span>
            </>
          ) : playing ? (
            <>
              <XCircle />
              <span>Stop playback</span>
            </>
          ) : (
            <>
              <PlayCircle />
              <span>Speak Text (TTS)</span>
            </>
          )}
        </Button>

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
            <span>Playing speech...</span>
          </m.div>
        )}
      </div>

      {/* Error messages */}
      {error && (
        <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            shadowSize="none"
            size="sm"
            className="bg-error-bg border-error/20 text-destructive text-[13px] font-bold"
          >
            {error}
          </Card>
        </m.div>
      )}
    </div>
  );
}
