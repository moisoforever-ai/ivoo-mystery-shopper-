import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvaluacionesIndividualesView } from './EvaluacionesIndividualesView';
import { StoreEvaluation } from '../types';

function makeEvaluation(): StoreEvaluation {
  return {
    id: '1',
    identifier: 'EVAL-1',
    storeName: 'IVOO Maracaibo',
    city: 'Maracaibo',
    seller: 'Vendedor de Prueba',
    recordingDate: '08 de Julio 2026',
    duration: '10:00',
    score: 80,
    level: 'SMART',
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

describe('EvaluacionesIndividualesView con cero evaluaciones', () => {
  it('muestra un estado vacío claro en vez de crashear', () => {
    render(
      <EvaluacionesIndividualesView
        evaluations={[]}
        selectedStoreId=""
        onSelectStore={vi.fn()}
        onUpdateEvaluation={vi.fn()}
      />
    );

    expect(screen.getByText('Todavía no hay evaluaciones')).toBeInTheDocument();
  });

  it('el botón "Ir a Audios" llama a onGoToAudios sin argumentos', () => {
    const onGoToAudios = vi.fn();
    render(
      <EvaluacionesIndividualesView
        evaluations={[]}
        selectedStoreId=""
        onSelectStore={vi.fn()}
        onUpdateEvaluation={vi.fn()}
        onGoToAudios={onGoToAudios}
      />
    );

    screen.getByText('Ir a Audios').click();
    expect(onGoToAudios).toHaveBeenCalledTimes(1);
  });
});

describe('EvaluacionesIndividualesView — observaciones del Freelance', () => {
  it('muestra el cuadro de observaciones y guarda el cambio al salir del campo (blur)', () => {
    const evalItem = makeEvaluation();
    const onUpdateEvaluation = vi.fn();
    render(
      <EvaluacionesIndividualesView
        evaluations={[evalItem]}
        selectedStoreId="1"
        onSelectStore={vi.fn()}
        onUpdateEvaluation={onUpdateEvaluation}
      />
    );

    const textarea = screen.getByPlaceholderText(/La tienda estaba muy concurrida/i);
    fireEvent.change(textarea, { target: { value: 'Todo tranquilo, sin filas.' } });
    fireEvent.blur(textarea);

    expect(onUpdateEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ freelancerObservations: 'Todo tranquilo, sin filas.' })
    );
  });

  it('ya no muestra el badge fijo de "VENTA NO CERRADA"', () => {
    render(
      <EvaluacionesIndividualesView
        evaluations={[makeEvaluation()]}
        selectedStoreId="1"
        onSelectStore={vi.fn()}
        onUpdateEvaluation={vi.fn()}
      />
    );

    expect(screen.queryByText('VENTA NO CERRADA')).not.toBeInTheDocument();
  });
});
