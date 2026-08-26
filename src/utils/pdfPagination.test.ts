import { describe, it, expect } from 'vitest';
import { computeBlockPageSlices, Range } from './pdfPagination';

describe('computeBlockPageSlices', () => {
  it('devuelve una sola página cuando todo el bloque cabe de sobra', () => {
    const atoms: Range[] = [{ top: 0, bottom: 50 }, { top: 50, bottom: 120 }];
    expect(computeBlockPageSlices(atoms, 300)).toEqual([{ top: 0, bottom: 120 }]);
  });

  it('nunca corta un átomo por la mitad cuando cabe completo en la siguiente página', () => {
    // El tercer átomo (180-300) no cabe junto a los dos primeros en una página de 250,
    // así que debe empezar página nueva completo, no cortarse.
    const atoms: Range[] = [
      { top: 0, bottom: 100 },
      { top: 100, bottom: 180 },
      { top: 180, bottom: 300 },
    ];
    const result = computeBlockPageSlices(atoms, 250);
    expect(result).toEqual([
      { top: 0, bottom: 180 },
      { top: 180, bottom: 300 },
    ]);
    // Ninguna página corta dentro de un átomo: cada "bottom" de página coincide con un
    // "bottom" real de algún átomo.
    const atomBottoms = atoms.map((a) => a.bottom);
    result.forEach((page) => {
      expect(atomBottoms).toContain(page.bottom);
    });
  });

  it('empaqueta la mayor cantidad de átomos posible por página (sin dejar huecos evitables)', () => {
    const atoms: Range[] = [
      { top: 0, bottom: 40 },
      { top: 40, bottom: 90 },
      { top: 90, bottom: 95 },
      { top: 95, bottom: 200 },
    ];
    // Página de 100: caben los primeros 3 átomos (hasta 95), el 4to no cabe (llegaría a 200).
    const result = computeBlockPageSlices(atoms, 100);
    expect(result[0]).toEqual({ top: 0, bottom: 95 });
  });

  it('solo corta a la mitad de un átomo cuando ese átomo por sí solo es más alto que una página', () => {
    const atoms: Range[] = [
      { top: 0, bottom: 50 },
      { top: 50, bottom: 400 }, // mucho más alto que pageHeight=200
    ];
    const result = computeBlockPageSlices(atoms, 200);
    expect(result).toEqual([
      { top: 0, bottom: 50 },
      { top: 50, bottom: 250 },
      { top: 250, bottom: 400 },
    ]);
    // Cubre exactamente todo el rango, sin huecos ni superposiciones.
    expect(result[0].top).toBe(0);
    expect(result[result.length - 1].bottom).toBe(400);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].top).toBe(result[i - 1].bottom);
    }
  });

  it('devuelve una lista vacía cuando no hay átomos', () => {
    expect(computeBlockPageSlices([], 200)).toEqual([]);
  });

  it('maneja un solo átomo que ocupa exactamente una página', () => {
    const atoms: Range[] = [{ top: 0, bottom: 200 }];
    expect(computeBlockPageSlices(atoms, 200)).toEqual([{ top: 0, bottom: 200 }]);
  });

  it('lanza un error claro si pageHeight es inválido, en vez de entrar en un ciclo infinito', () => {
    expect(() => computeBlockPageSlices([{ top: 0, bottom: 10 }], 0)).toThrow();
  });
});
