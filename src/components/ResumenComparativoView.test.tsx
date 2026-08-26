import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumenComparativoView } from './ResumenComparativoView';

describe('ResumenComparativoView con cero evaluaciones', () => {
  it('muestra un estado vacío claro en vez de "undefined" o crashear', () => {
    render(<ResumenComparativoView evaluations={[]} onSelectStore={vi.fn()} />);

    expect(screen.getByText('Todavía no hay nada que comparar')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
  });
});
