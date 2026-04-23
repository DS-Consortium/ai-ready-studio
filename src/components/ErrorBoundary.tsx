import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/error-reporting";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      source: "react-error-boundary",
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
          <div className="max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
            <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We captured the error and grouped it for debugging. Refresh or come back later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
