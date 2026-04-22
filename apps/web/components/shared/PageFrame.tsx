"use client";

import type { CSSProperties, ReactNode } from "react";

type PageFrameProps = {
  children: ReactNode;
  maxWidth?: number | string;
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
};

export function PageFrame({
  children,
  maxWidth,
  padded = true,
  className,
  style,
  innerStyle,
}: PageFrameProps) {
  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  return (
    <div
      data-testid="page-frame"
      className={className}
      style={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        padding: padded ? "var(--space-6)" : 0,
        ...style,
      }}
    >
      <div
        data-testid="page-frame-inner"
        style={{
          width: "100%",
          maxWidth: resolvedMaxWidth,
          margin: resolvedMaxWidth ? "0 auto" : undefined,
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
