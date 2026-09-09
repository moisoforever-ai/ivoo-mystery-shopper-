import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumenComparativoView } from './ResumenComparativoView';
import { StoreEvaluation } from '../types';

function makeEvaluation(id: string, storeName: string): StoreEvaluation {
  return {
    id,
    identifier: `EVAL-${id}`,
    storeName,
    city: 'Maracaibo',
    seller: 'Vendedor de Prueba',
    recordingDate: '08 de Julio 2026',
    duration: '10:00',
    score: 80,
    level: 'Bueno',
    saleClosed: false,
    contactCaptured: true,
    productEvaluated: 'Smart TV',
    narrativeSummary: 'Resumen de prueba',
    criteriaBreakdown: [],
    strengths: [],
    criticalAreas: [],
    recommendations: [],
    transcript: [],
  };
}

describe('ResumenComparativoView con cero evaluaciones', () => {
  it('muestra un estado vacío claro en vez de "undefined" o crashear', () => {
    render(<ResumenComparativoView evaluations={[]} onSelectStore={vi.fn()} />);

    expect(screen.getByText('Todavía no hay nada que comparar')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
  });
});

describe('ResumenComparativoView — venta y cierre ya no se muestran (nunca se cierra la venta)', () => {
  it('no muestra el cuadro de "Tasa de Cierre" ni la columna "Venta" del ranking', () => {
    const evaluations = [makeEvaluation('1', 'IVOO Maracaibo'), makeEvaluation('2', 'IVOO Ciudad Ojeda')];
    render(<ResumenComparativoView evaluations={evaluations} onSelectStore={vi.fn()} />);

    expect(screen.queryByText('Tasa de Cierre')).not.toBeInTheDocument();
    expect(screen.queryByText('Venta')).not.toBeInTheDocument();
    expect(screen.queryByText('Cerrada')).not.toBeInTheDocument();
    expect(screen.queryByText('No cerrada')).not.toBeInTheDocument();
  });
});
