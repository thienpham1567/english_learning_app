import { ImageResponse } from "next/og";

export const alt = "Trợ lý học tập tiếng Anh";
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
        background: "linear-gradient(135deg, #fffbf7 0%, #fdf3eb 100%)",
      }}
    >
      {/* Logo mark */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" stroke="#9B8EC7" strokeWidth="1.5" fill="none" />
        <line
          x1="17"
          y1="22"
          x2="47"
          y2="22"
          stroke="#1c1917"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="22"
          x2="32"
          y2="44"
          stroke="#1c1917"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="44" r="2.8" fill="#9B8EC7" />
      </svg>

      {/* Title */}
      <div
        style={{
          marginTop: 32,
          fontSize: 48,
          fontWeight: 700,
          color: "#1c1917",
          letterSpacing: "0.04em",
          fontFamily: "Georgia, serif",
        }}
      >
        THIEN
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#9B8EC7",
          letterSpacing: "0.04em",
          fontFamily: "Georgia, serif",
        }}
      >
        GLISH
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 16,
          fontSize: 22,
          color: "#a8a29e",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          letterSpacing: "0.12em",
        }}
      >
        english learning
      </div>
    </div>,
    { ...size },
  );
}
