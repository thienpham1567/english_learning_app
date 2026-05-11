"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client-side error boundary for catching rendering crashes.
 * Prevents a single broken component from taking down the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            minHeight: 300,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--error-bg)",
              display: "grid",
              placeItems: "center",
              marginBottom: 16,
            }}
          >
            <WarningOutlined style={{ fontSize: 24, color: "var(--error)" }} />
          </div>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
            }}
          >
            {this.props.fallbackTitle ?? "Đã xảy ra lỗi"}
          </h3>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 13,
              color: "var(--text-muted)",
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            {this.state.error?.message ?? "Có lỗi không mong muốn. Hãy thử tải lại trang."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ReloadOutlined /> Tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
