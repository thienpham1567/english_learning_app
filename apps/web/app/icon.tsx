import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        borderRadius: 14,
      }}
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" stroke="#74C4C9" strokeWidth="1.5" fill="none" />
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
        <circle cx="32" cy="44" r="2.8" fill="#74C4C9" />
      </svg>
    </div>,
    { ...size },
  );
}
