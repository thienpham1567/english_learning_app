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
        background: "#F4F3EF", // Solid retro cream background
        border: "16px solid #1A2332", // Thick frame border
        position: "relative",
      }}
    >
      {/* Decorative Neo-Brutalist Grid pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(#1A2332 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          opacity: 0.08,
        }}
      />

      {/* Logo container box */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 16,
          background: "#FFB800", // Accent gold
          border: "4px solid #1A2332", // Thick black-ish border
          boxShadow: "8px 8px 0px #1A2332", // Flat hard offset shadow
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="76"
          height="76"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cover slab */}
          <path
            d="M4 16 L4 18.5 L12 21.5 L20 18.5 L20 16 L12 19 Z"
            fill="#1A2332"
            stroke="#1A2332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left page */}
          <path
            d="M4 6 L12 9 L12 19 L4 16 Z"
            fill="#FFFFFF"
            stroke="#1A2332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right page */}
          <path
            d="M20 6 L12 9 L12 19 L20 16 Z"
            fill="#FFB800"
            stroke="#1A2332"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left Page Text Lines */}
          <path
            d="M6.5 11 L9.5 12.125 M6.5 13.5 L9.5 14.625"
            stroke="#1A2332"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Right Page Text Lines */}
          <path
            d="M14.5 12.125 L17.5 11 M14.5 14.625 L17.5 13.5"
            stroke="#1A2332"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Center Spine Crease */}
          <path d="M12 9 V19" stroke="#1A2332" strokeWidth="1.2" strokeLinecap="round" />
          {/* Floating Sparkle (AI Spark) */}
          <path
            d="M12 1.5 Q12 3.8 14.3 3.8 Q12 3.8 12 6.1 Q12 3.8 9.7 3.8 Q12 3.8 12 1.5 Z"
            fill="#1A2332"
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 40,
          fontSize: 76,
          fontWeight: 900,
          color: "#1A2332",
          letterSpacing: "-0.04em",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          textTransform: "uppercase",
        }}
      >
        TOEIC
        <span style={{ color: "#FFB800" }}>Master</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 12,
          fontSize: 22,
          color: "#1A2332",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 800,
          opacity: 0.7,
        }}
      >
        AI Study Hub
      </div>
    </div>,
    { ...size },
  );
}
