import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-sm">
            <AlertOctagon className="w-5 h-5" />
            <span>Ein Anzeigefehler ist aufgetreten</span>
          </div>
          <p className="text-xs text-red-600 max-w-md mx-auto">
            {this.props.fallbackMessage ||
              'Die Ansicht konnte aufgrund eines unerwarteten Datenzustands nicht gerendert werden.'}
          </p>
          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ansicht wiederherstellen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
