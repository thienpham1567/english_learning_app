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
        <div className="flex flex-col items-center justify-center text-center h-[300px] py-12 px-6">
          <div className="w-14 h-14 rounded-full grid place-items-center mb-4 bg-[var(--error-bg)]">
            <AlertTriangle className="text-3xl text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-ink font-display">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h3>
          <p className="text-[13px] text-text-muted max-w-[400px] leading-relaxed mb-5">
            {this.state.error?.message ??
              "An unexpected error occurred. Please try reloading the page."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-xl border-none text-sm font-semibold cursor-pointer flex items-center gap-2 py-2.5 px-6 bg-accent text-[var(--text-on-accent)]"
          >
            <RefreshCw /> Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
