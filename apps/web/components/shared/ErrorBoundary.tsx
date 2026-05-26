"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

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
          className="flex flex-col items-center justify-center text-center h-[300px]"
          style={{ padding: "48px 24px" }}
        >
          <div
            className="w-[56px] h-[56px] rounded-full grid mb-4"
            style={{ background: "var(--error-bg)", placeItems: "center" }}
          >
            <AlertTriangle className="text-3xl text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-ink font-display">
            {this.props.fallbackTitle ?? "Đã xảy ra lỗi"}
          </h3>
          <p
            className="text-[13px] text-text-muted w-[400px] leading-relaxed"
            style={{ margin: "0 0 20px" }}
          >
            {this.state.error?.message ?? "Có lỗi không mong muốn. Hãy thử tải lại trang."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-xl border-none text-sm font-semibold cursor-pointer flex items-center gap-2"
            style={{
              padding: "10px 24px",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            <RefreshCw /> Tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
