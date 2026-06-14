'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Captured runtime error:', error, errorInfo);
    
    // Log error telemetry asynchronously to Supabase
    this.logErrorToSupabase(error, errorInfo);
  }

  private async logErrorToSupabase(error: Error, errorInfo: ErrorInfo) {
    try {
      const supabase = createClient();
      await supabase.from('audit_logs').insert({
        table_name: 'client_telemetry',
        action: 'ERROR_CRASH',
        record_id: '00000000-0000-0000-0000-000000000000',
        old_data: null,
        new_data: {
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (loggingError) {
      console.error('Failed to log error to telemetry database:', loggingError);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020C1B] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel-dark max-w-md w-full p-8 rounded-2xl border border-white/10 space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠
            </div>
            <h1 className="text-2xl font-bold text-white">Vyskytla sa chyba</h1>
            <p className="text-sm text-gray-300">
              Ospravedlňujeme sa, ale v aplikácii došlo k neočakávanej chybe. Chybové hlásenie bolo automaticky odoslané na technickú podporu.
            </p>
            {this.state.error && (
              <div className="bg-black/40 p-3 rounded-lg text-left text-xs font-mono overflow-auto max-h-32 text-red-400 border border-white/5">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors"
            >
              Obnoviť stránku
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
