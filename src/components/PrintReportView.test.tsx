import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PrintReportView } from './PrintReportView';
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
    saleClosed: true,
    contactCaptured: true,
    productEvaluated: 'Smart TV',
    narrativeSummary: 'Resumen de prueba',
    criteriaBreakdown: [
      { criterionId: 'saludo', criterionName: 'Saludo', score: 8, maxScore: 10, observation: 'Bien', status: 'good' },
      { criterionId: 'cierre', criterionName: 'Cierre', score: 10, maxScore: 15, observation: 'Ok', status: 'good' },
    ],
    strengths: ['Buena actitud'],
    criticalAreas: ['Falta cierre'],
    recommendations: ['Mejorar cierre'],
    transcript: [
      { speaker: 'Mystery Shopper', text: 'Hola, buenas tardes.' },
      { speaker: 'Vendedor', text: 'Buenas tardes, bienvenido.' },
    ],
  };
}

describe('PrintReportView — estructura de paginación en el DOM', () => {
  it('marca exactamente un bloque page-break-after por: portada + resumen + cada evaluación', () => {
    const evaluations = [makeEvaluation('1', 'IVOO Maracaibo'), makeEvaluation('2', 'IVOO Ciudad Ojeda')];
    const { container } = render(
      <PrintReportView evaluations={evaluations} onClose={() => {}} />
    );

    const topBlocks = container.querySelectorAll('.page-break-after');
    // 1 portada + 1 resumen + 2 evaluaciones = 4
    expect(topBlocks.length).toBe(1 + 1 + evaluations.length);
  });

  it('cada tarjeta de evaluación tiene sus átomos indivisibles marcados (header, tabla, criterios, etc.)', () => {
    const evaluations = [makeEvaluation('1', 'IVOO Maracaibo')];
    const { container } = render(
      <PrintReportView evaluations={evaluations} onClose={() => {}} />
    );

    const atoms = container.querySelectorAll('[data-pdf-atom]');
    // Al menos: header, tabla de datos, score/summary, desglose, fortalezas/críticas,
    // etiqueta de transcripción + 2 líneas de transcripción = 8 mínimo para 1 evaluación,
    // más los átomos del bloque de resumen comparativo (intro, ranking, matriz, hallazgos,
    // recomendaciones = 5).
    expect(atoms.length).toBeGreaterThanOrEqual(8 + 5);
  });

  it('cada línea de la transcripción es su propio átomo (para poder cortar entre turnos, no en medio de uno)', () => {
    const evalItem = makeEvaluation('1', 'IVOO Maracaibo');
    const { container } = render(
      <PrintReportView evaluations={[evalItem]} onClose={() => {}} />
    );

    // Busca los átomos cuyo texto coincide con cada línea real de la transcripción.
    const atomTexts = Array.from(container.querySelectorAll('[data-pdf-atom]')).map((el) => el.textContent || '');
    evalItem.transcript.forEach((line) => {
      expect(atomTexts.some((t) => t.includes(line.text))).toBe(true);
    });
  });
});
