import { describe, it, expect, beforeEach } from 'vitest';
import { loadEvaluations, saveEvaluationsSafely } from './storageManager';
import { StoreEvaluation } from '../types';

const sample: StoreEvaluation = {
  id: '1',
  identifier: 'EVAL-1',
  storeName: 'IVOO Maracaibo',
  city: 'Maracaibo',
  seller: 'Vendedor de Prueba',
  recordingDate: '08 de Julio 2026',
  duration: '10:00',
  score: 80,
  level: 'Bueno',
  saleClosed: true,
  contactCaptured: true,
  productEvaluated: 'Smart TV',
  narrativeSummary: 'Resumen de prueba',
  criteriaBreakdown: [],
  strengths: [],
  criticalAreas: [],
  recommendations: [],
  transcript: [],
};

describe('loadEvaluations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('empieza vacío en un navegador nuevo, nunca con datos de muestra', () => {
    expect(loadEvaluations()).toEqual([]);
  });

  it('respeta una lista explícitamente vacía guardada (no la rellena con datos de muestra)', () => {
    saveEvaluationsSafely([], 'Prueba: lista vacía a propósito');
    expect(loadEvaluations()).toEqual([]);
  });

  it('devuelve las evaluaciones reales guardadas cuando sí existen', () => {
    saveEvaluationsSafely([sample], 'Prueba: guardar una evaluación real');
    const result = loadEvaluations();
    expect(result).toHaveLength(1);
    expect(result[0].storeName).toBe('IVOO Maracaibo');
  });
});
