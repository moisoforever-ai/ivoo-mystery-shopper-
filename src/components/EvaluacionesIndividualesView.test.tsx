import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvaluacionesIndividualesView } from './EvaluacionesIndividualesView';

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
