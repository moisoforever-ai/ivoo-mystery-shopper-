import { describe, it, expect } from 'vitest';
import { extractBrand, parseAudioFilename, normalizeEvaluation } from './evaluationHelpers';
import { StoreEvaluation } from '../types';

describe('extractBrand', () => {
  it('detecta IVOO como marca propia', () => {
    expect(extractBrand('IVOO Maracaibo')).toEqual({ brand: 'IVOO', brandCategory: 'IVOO' });
  });

  it('detecta DAKA como competencia', () => {
    expect(extractBrand('DAKA Circunvalación')).toEqual({ brand: 'DAKA', brandCategory: 'COMPETENCIA' });
  });

  it('cae en OTRA/COMPETENCIA cuando no reconoce ninguna marca', () => {
    expect(extractBrand('Tienda Desconocida')).toEqual({ brand: 'OTRA', brandCategory: 'COMPETENCIA' });
  });

  it('no revienta con un nombre vacío', () => {
    expect(extractBrand('')).toEqual({ brand: 'OTRA', brandCategory: 'COMPETENCIA' });
  });
});

describe('parseAudioFilename', () => {
  it('extrae marca, ciudad y fecha de un nombre típico con guiones bajos', () => {
    const result = parseAudioFilename('DAKA_Circunvalacion_1_Maracaibo_08-07.mp3');
    expect(result.brand).toBe('DAKA');
    expect(result.city).toBe('Maracaibo');
    expect(result.recordingDate).toBe('08 de Julio 2026');
  });

  it('extrae correctamente IVOO en Ciudad Ojeda', () => {
    const result = parseAudioFilename('IVOO C.OJEDA 08.07.mp3');
    expect(result.brand).toBe('IVOO');
    expect(result.brandCategory).toBe('IVOO');
    expect(result.city).toBe('Ciudad Ojeda');
  });

  it('usa la fecha por defecto cuando el nombre no trae ninguna fecha reconocible', () => {
    const result = parseAudioFilename('grabacion_sin_fecha.mp3');
    expect(result.recordingDate).toBe('Julio 2026');
  });
});

describe('normalizeEvaluation', () => {
  const base: StoreEvaluation = {
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

  it('rellena brand, brandCategory y monthPeriod cuando faltan', () => {
    const result = normalizeEvaluation(base);
    expect(result.brand).toBe('IVOO');
    expect(result.brandCategory).toBe('IVOO');
    expect(result.monthPeriod).toBe('2026-07');
  });

  it('respeta los valores existentes en vez de sobrescribirlos', () => {
    const result = normalizeEvaluation({ ...base, brand: 'DAKA', brandCategory: 'COMPETENCIA' });
    expect(result.brand).toBe('DAKA');
    expect(result.brandCategory).toBe('COMPETENCIA');
  });
});
