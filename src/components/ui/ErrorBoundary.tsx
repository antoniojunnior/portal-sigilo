"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`rounded-2xl border border-[var(--color-danger-surface)] bg-[var(--color-danger-surface)]/30 p-6 text-center ${this.props.className}`}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-surface)] text-[var(--color-danger)]">
            <AlertCircle size={24} />
          </div>
          <h3 className="mb-2 text-base font-bold text-[var(--color-text-primary)]">
            Algo deu errado nesta seção
          </h3>
          <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
            Não foi possível carregar os dados. Tente atualizar a página.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-danger)] px-4 py-2 text-xs font-bold text-white transition hover:brightness-95"
          >
            <RefreshCcw size={14} />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
