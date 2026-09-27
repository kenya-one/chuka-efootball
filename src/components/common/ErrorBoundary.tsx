import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Unhandled runtime error in Chuka eFootball:', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080c09] text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full p-8 rounded-3xl border border-white/10 bg-[#111612] text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center mx-auto text-[#22c55e] text-2xl font-bold font-mono">
              ⚽
            </div>
            
            <div>
              <h1 className="text-xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                Chuka eFootball Hub
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                The application encountered an unexpected issue while loading.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-red-400 break-words text-left max-h-32 overflow-y-auto">
                {this.state.error.message || 'Unknown error occurred'}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-[#22c55e] text-black font-bold text-xs hover:bg-[#16a34a] transition-all cursor-pointer"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-xs hover:bg-white/10 transition-all cursor-pointer"
              >
                Clear Cache & Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
