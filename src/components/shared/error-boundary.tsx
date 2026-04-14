"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
