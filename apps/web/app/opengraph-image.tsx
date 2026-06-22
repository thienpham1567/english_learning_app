import { ImageResponse } from "next/og";

export const alt = "TOEIC Master — AI Study Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 30%, #C7D2FE 60%, #DDD6FE 100%)",
        position: "relative",
      }}
    >
      {/* Subtle soft gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -40,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Logo container — soft elevated card */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 28,
          background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
          boxShadow: "0 20px 40px -8px rgba(99, 102, 241, 0.35), 0 8px 16px -4px rgba(99, 102, 241, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cover slab */}
          <path
            d="M4 16 L4 18.5 L12 21.5 L20 18.5 L20 16 L12 19 Z"
            fill="rgba(255,255,255,0.3)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left page */}
          <path
            d="M4 6 L12 9 L12 19 L4 16 Z"
            fill="rgba(255,255,255,0.9)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right page */}
          <path
            d="M20 6 L12 9 L12 19 L20 16 Z"
            fill="rgba(255,255,255,0.5)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left Page Text Lines */}
          <path
            d="M6.5 11 L9.5 12.125 M6.5 13.5 L9.5 14.625"
            stroke="rgba(99,102,241,0.6)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Right Page Text Lines */}
          <path
            d="M14.5 12.125 L17.5 11 M14.5 14.625 L17.5 13.5"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Center Spine */}
          <path d="M12 9 V19" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          {/* Floating Sparkle (AI) */}
          <path
            d="M12 1.5 Q12 3.8 14.3 3.8 Q12 3.8 12 6.1 Q12 3.8 9.7 3.8 Q12 3.8 12 1.5 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 40,
          fontSize: 72,
          fontWeight: 800,
          color: "#1E1B4B",
          letterSpacing: "-0.03em",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
        }}
      >
        TOEIC
        <span style={{ color: "#6366F1" }}>Master</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 14,
          fontSize: 20,
          color: "#6366F1",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 600,
          opacity: 0.75,
        }}
      >
        AI Study Hub
      </div>
    </div>,
    { ...size },
  );
}
