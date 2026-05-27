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
        background: "#FFB800", // Brand Accent gold
        borderRadius: 14,
        border: "3px solid #000000",
        boxShadow: "3px 3px 0px #000000",
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 3D cover slab under the pages */}
        <path
          d="M4 16 L4 18.5 L12 21.5 L20 18.5 L20 16 L12 19 Z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Left Page (White) */}
        <path
          d="M4 6 L12 9 L12 19 L4 16 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right Page (Gold Accent) */}
        <path
          d="M20 6 L12 9 L12 19 L20 16 Z"
          fill="#FFB800"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Left Page Text Lines */}
        <path
          d="M6.5 11 L9.5 12.125 M6.5 13.5 L9.5 14.625"
          stroke="#000000"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Right Page Text Lines */}
        <path
          d="M14.5 12.125 L17.5 11 M14.5 14.625 L17.5 13.5"
          stroke="#000000"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Center Spine Crease */}
        <path d="M12 9 V19" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" />
        {/* Floating Sparkle (AI Spark) */}
        <path
          d="M12 1.5 Q12 3.8 14.3 3.8 Q12 3.8 12 6.1 Q12 3.8 9.7 3.8 Q12 3.8 12 1.5 Z"
          fill="#000000"
        />
      </svg>
    </div>,
    { ...size },
  );
}
