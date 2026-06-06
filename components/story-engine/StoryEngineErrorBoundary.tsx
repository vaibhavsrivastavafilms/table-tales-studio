"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export default class StoryEngineErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            Story engine panel failed to render. Reload the editor or reset the project.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
