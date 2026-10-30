import React from "react";

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-black p-6 text-white">
          <h1 className="text-2xl font-bold text-red-400">
            Something went wrong
          </h1>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-red-200">
            {this.state.error.stack || this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}