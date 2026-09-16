import { describe, it, expect } from 'vitest';
import { getOverallLevel, getCriterionStatus, IVOO_CRITERIA, TOTAL_MAX_SCORE } from './criteria';
import { CriterionScore, FlagCode } from '../types';

function makeBreakdown(scores: Partial<Record<string, number>>): CriterionScore[] {
  return IVOO_CRITERIA.map((c) => {
    const score = scores[c.id] ?? c.maxScore; // por defecto, puntaje perfecto
    return {
      criterionId: c.id,
      criterionName: c.name,
      score,
      maxScore: c.maxScore,
      observation: 'obs',
      status: getCriterionStatus(score, c.maxScore),
    };
  });
}

describe('IVOO_CRITERIA — Guía IDM', () => {
  it('las 8 dimensiones suman exactamente 100 puntos', () => {
    const total = IVOO_CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);
    expect(total).toBe(100);
    expect(total).toBe(TOTAL_MAX_SCORE);
  });

  it('tiene exactamente los 8 identificadores esperados (D1-D8)', () => {
    const ids = IVOO_CRITERIA.map((c) => c.id);
    expect(ids).toEqual([
      'actitud',
      'necesidades',
      'conocimiento',
      'propuesta',
      'objeciones',
      'cierre',
      'cross_up',
      'experiencia',
    ]);
  });
});

describe('getOverallLevel — tabla de clasificación básica por puntaje', () => {
  it('90-100 sin problemas → SMART', () => {
    const breakdown = makeBreakdown({});
    expect(getOverallLevel(95, breakdown, [])).toBe('SMART');
  });

  it('80-89 → SOLIDO', () => {
    expect(getOverallLevel(85, [], [])).toBe('SOLIDO');
  });

  it('65-79 → EN_DESARROLLO', () => {
    expect(getOverallLevel(70, [], [])).toBe('EN_DESARROLLO');
  });

  it('50-64 → INSUFICIENTE', () => {
    expect(getOverallLevel(55, [], [])).toBe('INSUFICIENTE');
  });

  it('0-49 → CRITICO', () => {
    expect(getOverallLevel(30, [], [])).toBe('CRITICO');
  });
});

describe('getOverallLevel — requisitos mínimos para Asesor Smart', () => {
  it('puntaje >=90 pero con una dimensión de 15 pts por debajo de 10 → baja a SOLIDO', () => {
    const breakdown = makeBreakdown({ objeciones: 9 }); // 15pt dimension below 10
    // Score total sigue siendo >=90 en este ejemplo (100 - 15 + 9 = 94)
    expect(getOverallLevel(94, breakdown, [])).toBe('SOLIDO');
  });

  it('puntaje >=90 pero con una dimensión de 5 pts en 0 → baja a SOLIDO', () => {
    const breakdown = makeBreakdown({ cross_up: 0 });
    expect(getOverallLevel(95, breakdown, [])).toBe('SOLIDO');
  });

  it('puntaje >=90 pero con cualquier bandera presente → baja a SOLIDO', () => {
    const breakdown = makeBreakdown({});
    expect(getOverallLevel(92, breakdown, ['F4'])).not.toBe('SMART');
  });

  it('puntaje >=90, todas las dimensiones en nivel aceptable o mejor, cero banderas → SMART', () => {
    const breakdown = makeBreakdown({});
    expect(getOverallLevel(100, breakdown, [])).toBe('SMART');
  });
});

describe('getOverallLevel — regla de tope por bandera (F1, F2, F3)', () => {
  const capFlags: FlagCode[] = ['F1', 'F2', 'F3'];

  it.each(capFlags)('con bandera %s, aunque el puntaje sea 100, la clasificación no pasa de EN_DESARROLLO', (flag) => {
    const breakdown = makeBreakdown({});
    expect(getOverallLevel(100, breakdown, [flag])).toBe('EN_DESARROLLO');
  });

  it('con bandera F1 y puntaje ya bajo (INSUFICIENTE), no lo sube — el tope solo limita hacia abajo', () => {
    expect(getOverallLevel(55, [], ['F1'])).toBe('INSUFICIENTE');
  });

  it('con bandera F1 y puntaje CRITICO, se mantiene CRITICO (el tope no sube el nivel)', () => {
    expect(getOverallLevel(30, [], ['F1'])).toBe('CRITICO');
  });
});

describe('getOverallLevel — bandera F4 baja un nivel adicional', () => {
  it('SOLIDO + F4 → EN_DESARROLLO', () => {
    expect(getOverallLevel(85, [], ['F4'])).toBe('EN_DESARROLLO');
  });

  it('CRITICO + F4 no puede bajar más (ya es el piso)', () => {
    expect(getOverallLevel(20, [], ['F4'])).toBe('CRITICO');
  });
});

describe('getOverallLevel — determinismo', () => {
  it('los mismos insumos siempre producen el mismo resultado', () => {
    const breakdown = makeBreakdown({ cierre: 5 });
    const flags: FlagCode[] = ['F2'];
    const first = getOverallLevel(72, breakdown, flags);
    const second = getOverallLevel(72, breakdown, flags);
    expect(first).toBe(second);
  });
});
