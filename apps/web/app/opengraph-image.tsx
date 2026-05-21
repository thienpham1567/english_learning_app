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
        background: "linear-gradient(145deg, #FAF8F5 0%, #F3ECE0 100%)",
        position: "relative",
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "35%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(195, 74, 54, 0.08) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Logo icon — open book + spark */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: "linear-gradient(145deg, #C34A36, #E07157)",
          boxShadow: "0 12px 40px rgba(195, 74, 54, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 8C12.5 6.5 8.5 6 4 7v17c4.5-1 8.5-0.5 12 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M16 8c3.5-1.5 7.5-2 12-1v17c-4.5-1-8.5-0.5-12 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M16 8v17"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <circle cx="16" cy="4" r="1.8" fill="white" opacity="0.9" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 36,
          fontSize: 64,
          fontWeight: 900,
          color: "#221815",
          letterSpacing: "-0.03em",
          fontFamily: "Georgia, serif",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        TOEIC
        <span style={{ color: "#C34A36" }}>Master</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 12,
          fontSize: 24,
          color: "#9E8E85",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        AI Study Hub
      </div>
    </div>,
    { ...size },
  );
}
