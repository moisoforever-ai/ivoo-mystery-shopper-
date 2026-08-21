import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level safety net: if any component throws while rendering, React would otherwise
 * unmount the whole tree and leave a blank white screen with no explanation. This catches
 * that, logs it for diagnostics, and shows the user a clear recovery screen instead.
 *
 * IMPORTANT: this component itself must stay dependency-free and simple (no app services,
 * no complex child components) — if the app is already broken, the recovery screen can't
 * risk being broken too.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Never swallow this silently — log it clearly so it's visible in dev tools / server logs.
    console.error('[ErrorBoundary] La aplicación encontró un error inesperado:', error, errorInfo.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalData = () => {
    const confirmed = window.confirm(
      'Esto va a borrar los datos guardados en este navegador y regresar la app a la información de fábrica. ' +
        'Las evaluaciones que no hayas exportado se van a perder. ¿Continuar?'
    );
    if (!confirmed) return;
    try {
      localStorage.clear();
    } catch {
      // If localStorage isn't accessible, there's nothing more to clear — proceed to reload anyway.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>

          <h1 className="text-xl font-black text-slate-900 mb-2">Algo salió mal</h1>
          <p className="text-sm text-slate-600 mb-1">
            La aplicación encontró un error inesperado y no pudo continuar mostrando esta pantalla.
          </p>
          <p className="text-sm text-slate-600 mb-6">
            Tus datos guardados no se perdieron por esto. Prueba una de estas opciones:
          </p>

          {this.state.error?.message && (
            <div className="mb-6 text-left bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Detalle técnico
              </p>
              <p className="text-xs font-mono text-slate-600 break-words">{this.state.error.message}</p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-lime-400" />
              Reintentar
            </button>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-bold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar la página
            </button>

            <button
              onClick={this.handleResetLocalData}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 mt-2 transition-colors"
            >
              Último recurso: borrar datos locales y reiniciar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
