import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('Fallo simulado de prueba');
}

describe('ErrorBoundary', () => {
  it('muestra la pantalla de recuperación (no una pantalla en blanco) cuando un hijo falla', () => {
    // React logs the caught error to console.error too; silence it for this deliberate test.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Fallo simulado de prueba')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renderiza a los hijos con normalidad cuando no hay ningún error', () => {
    render(
      <ErrorBoundary>
        <div>Contenido normal de la app</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido normal de la app')).toBeInTheDocument();
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });
});
