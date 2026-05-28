"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean };

export default class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    void import("@/lib/monitoring").then(({ reportClientError }) => {
      reportClientError(error, { source: "dashboard_boundary" });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[40px] bg-[#0b0f1a] p-8 text-center ring-1 ring-white/10">
          <p className="text-lg font-bold text-white">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Refresh the page to restore your session. Your draft may still be
            saved locally.
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="mt-6 rounded-xl bg-[#f7c600] px-6 py-3 text-sm font-bold text-black"
          >
            Reload dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
