import { StoreEvaluation, BrandCategory, BrandType, MonthConsolidatedSummary } from '../types';
import { IVOO_CRITERIA } from '../data/criteria';

/**
 * Extracts and normalizes brand from store name or filename
 */
export function extractBrand(name: string): { brand: BrandType; brandCategory: BrandCategory } {
  const upper = (name || '').toUpperCase();
  if (upper.includes('IVOO')) {
    return { brand: 'IVOO', brandCategory: 'IVOO' };
  }
  if (upper.includes('DAKA')) {
    return { brand: 'DAKA', brandCategory: 'COMPETENCIA' };
  }
  if (upper.includes('DAMASCO')) {
    return { brand: 'DAMASCO', brandCategory: 'COMPETENCIA' };
  }
  if (upper.includes('MULTIMAX') || upper.includes('MULTI-MAX')) {
    return { brand: 'MULTIMAX', brandCategory: 'COMPETENCIA' };
  }
  return { brand: 'OTRA', brandCategory: 'COMPETENCIA' };
}

/**
 * Extracts normalized month period (e.g. "2026-07" and "Julio 2026") from date strings
 */
export function extractMonthPeriod(dateStr: string): { key: string; label: string } {
  const str = (dateStr || '').toLowerCase();
  
  if (str.includes('enero') || str.includes('.01') || str.includes('/01') || str.includes('-01')) return { key: '2026-01', label: 'Enero 2026' };
  if (str.includes('febrero') || str.includes('.02') || str.includes('/02') || str.includes('-02')) return { key: '2026-02', label: 'Febrero 2026' };
  if (str.includes('marzo') || str.includes('.03') || str.includes('/03') || str.includes('-03')) return { key: '2026-03', label: 'Marzo 2026' };
  if (str.includes('abril') || str.includes('.04') || str.includes('/04') || str.includes('-04')) return { key: '2026-04', label: 'Abril 2026' };
  if (str.includes('mayo') || str.includes('.05') || str.includes('/05') || str.includes('-05')) return { key: '2026-05', label: 'Mayo 2026' };
  if (str.includes('junio') || str.includes('.06') || str.includes('/06') || str.includes('-06')) return { key: '2026-06', label: 'Junio 2026' };
  if (str.includes('julio') || str.includes('.07') || str.includes('/07') || str.includes('-07')) return { key: '2026-07', label: 'Julio 2026' };
  if (str.includes('agosto') || str.includes('.08') || str.includes('/08') || str.includes('-08')) return { key: '2026-08', label: 'Agosto 2026' };
  if (str.includes('septiembre') || str.includes('setiembre') || str.includes('.09') || str.includes('/09') || str.includes('-09')) return { key: '2026-09', label: 'Septiembre 2026' };
  if (str.includes('octubre') || str.includes('.10') || str.includes('/10') || str.includes('-10')) return { key: '2026-10', label: 'Octubre 2026' };
  if (str.includes('noviembre') || str.includes('.11') || str.includes('/11') || str.includes('-11')) return { key: '2026-11', label: 'Noviembre 2026' };
  if (str.includes('diciembre') || str.includes('.12') || str.includes('/12') || str.includes('-12')) return { key: '2026-12', label: 'Diciembre 2026' };

  return { key: '2026-07', label: 'Julio 2026' };
}

/**
 * Normalizes an evaluation by filling missing brand, brandCategory and monthPeriod
 */
export function normalizeEvaluation(evalItem: StoreEvaluation): StoreEvaluation {
  const { brand, brandCategory } = extractBrand(evalItem.storeName);
  const { key: monthPeriod } = extractMonthPeriod(evalItem.recordingDate);

  return {
    ...evalItem,
    brand: evalItem.brand || brand,
    brandCategory: evalItem.brandCategory || brandCategory,
    monthPeriod: evalItem.monthPeriod || monthPeriod,
  };
}

/**
 * Normalizes a list of evaluations
 */
export function normalizeEvaluationsList(list: StoreEvaluation[]): StoreEvaluation[] {
  return (list || []).map(normalizeEvaluation);
}

/**
 * Groups evaluations by month period and calculates multi-brand statistical consolidation
 */
export function getMonthlyConsolidatedSummaries(evaluations: StoreEvaluation[]): MonthConsolidatedSummary[] {
  const normalized = normalizeEvaluationsList(evaluations);
  const monthMap = new Map<string, StoreEvaluation[]>();

  for (const item of normalized) {
    const key = item.monthPeriod || '2026-07';
    if (!monthMap.has(key)) {
      monthMap.set(key, []);
    }
    monthMap.get(key)!.push(item);
  }

  const summaries: MonthConsolidatedSummary[] = [];

  for (const [key, items] of monthMap.entries()) {
    const { label: monthName } = extractMonthPeriod(items[0]?.recordingDate || key);
    const totalVisits = items.length;
    const ivooItems = items.filter((i) => i.brandCategory === 'IVOO' || i.brand === 'IVOO');
    const compItems = items.filter((i) => i.brandCategory === 'COMPETENCIA' || i.brand !== 'IVOO');

    const avgScoreTotal = items.reduce((acc, i) => acc + (Number(i.score) || 0), 0) / (totalVisits || 1);
    const avgScoreIvoo = ivooItems.length > 0
      ? ivooItems.reduce((acc, i) => acc + (Number(i.score) || 0), 0) / ivooItems.length
      : 0;
    const avgScoreCompetencia = compItems.length > 0
      ? compItems.reduce((acc, i) => acc + (Number(i.score) || 0), 0) / compItems.length
      : 0;

    const closedIvoo = ivooItems.filter((i) => i.saleClosed).length;
    const closedComp = compItems.filter((i) => i.saleClosed).length;
    const closedRateIvoo = ivooItems.length > 0 ? (closedIvoo / ivooItems.length) * 100 : 0;
    const closedRateCompetencia = compItems.length > 0 ? (closedComp / compItems.length) * 100 : 0;

    const contactIvoo = ivooItems.filter((i) => i.contactCaptured).length;
    const contactComp = compItems.filter((i) => i.contactCaptured).length;
    const contactRateIvoo = ivooItems.length > 0 ? (contactIvoo / ivooItems.length) * 100 : 0;
    const contactRateCompetencia = compItems.length > 0 ? (contactComp / compItems.length) * 100 : 0;

    summaries.push({
      monthPeriod: key,
      monthName,
      totalVisits,
      ivooVisits: ivooItems.length,
      competenciaVisits: compItems.length,
      avgScoreTotal: Number(avgScoreTotal.toFixed(1)),
      avgScoreIvoo: Number(avgScoreIvoo.toFixed(1)),
      avgScoreCompetencia: Number(avgScoreCompetencia.toFixed(1)),
      deltaScore: Number((avgScoreIvoo - avgScoreCompetencia).toFixed(1)),
      closedRateIvoo: Number(closedRateIvoo.toFixed(1)),
      closedRateCompetencia: Number(closedRateCompetencia.toFixed(1)),
      contactRateIvoo: Number(contactRateIvoo.toFixed(1)),
      contactRateCompetencia: Number(contactRateCompetencia.toFixed(1)),
    });
  }

  // Sort chronologically descending
  return summaries.sort((a, b) => b.monthPeriod.localeCompare(a.monthPeriod));
}

/**
 * Calculates criteria breakdown comparison: IVOO vs Competencia
 */
export function getComparativeCriteriaMatrix(evaluations: StoreEvaluation[]) {
  const normalized = normalizeEvaluationsList(evaluations);
  const ivooItems = normalized.filter((i) => i.brandCategory === 'IVOO');
  const compItems = normalized.filter((i) => i.brandCategory === 'COMPETENCIA');

  return IVOO_CRITERIA.map((criterion) => {
    const calcAvg = (items: StoreEvaluation[]) => {
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, item) => {
        const found = item.criteriaBreakdown?.find((c) => c.criterionId === criterion.id);
        return acc + (found ? Number(found.score) || 0 : 0);
      }, 0);
      return sum / items.length;
    };

    const avgIvoo = calcAvg(ivooItems);
    const avgComp = calcAvg(compItems);
    const avgTotal = calcAvg(normalized);
    const delta = avgIvoo - avgComp;
    const percentIvoo = (avgIvoo / criterion.maxScore) * 100;
    const percentComp = (avgComp / criterion.maxScore) * 100;

    return {
      criterionId: criterion.id,
      name: criterion.name,
      shortName: criterion.shortName,
      maxScore: criterion.maxScore,
      avgTotal: Number(avgTotal.toFixed(1)),
      avgIvoo: Number(avgIvoo.toFixed(1)),
      avgComp: Number(avgComp.toFixed(1)),
      percentIvoo: Number(percentIvoo.toFixed(1)),
      percentComp: Number(percentComp.toFixed(1)),
      delta: Number(delta.toFixed(1)),
      winner: delta > 0 ? 'IVOO' : delta < 0 ? 'COMPETENCIA' : 'EMPATE',
    };
  });
}

/**
 * Parses any audio filename to extract store name, brand, city and date
 * Handles formats like:
 * - "IVOO C.OJEDA 08.07" -> IVOO Ciudad Ojeda, Ciudad Ojeda, 08 de Julio 2026
 * - "DAKA 5 DE JULIO MARACAIBO 8.07" -> DAKA 5 de Julio (Maracaibo), Maracaibo, 08 de Julio 2026
 * - "DAKA_Circunvalacion_1_Maracaibo_08-07.mp3" -> DAKA Circunvalación 1 (Maracaibo), Maracaibo, 08 de Julio 2026
 */
export function parseAudioFilename(filename: string): {
  storeName: string;
  brand: BrandType;
  brandCategory: BrandCategory;
  city: string;
  recordingDate: string;
} {
  // Strip known extensions if any (.mp3, .m4a, .wav, .aac, .ogg, .opus, .3gp, .amr, etc.)
  const clean = filename
    .replace(/\.(mp3|m4a|wav|aac|ogg|opus|3gp|amr|flac|wma|mp4|webm|m4p)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  const upper = clean.toUpperCase();

  // 1. Detect Brand
  let brand: BrandType = 'OTRA';
  let brandCategory: BrandCategory = 'COMPETENCIA';
  if (upper.includes('IVOO')) {
    brand = 'IVOO';
    brandCategory = 'IVOO';
  } else if (upper.includes('DAKA')) {
    brand = 'DAKA';
  } else if (upper.includes('DAMASCO')) {
    brand = 'DAMASCO';
  } else if (upper.includes('MULTIMAX') || upper.includes('MULTI MAX') || upper.includes('MULTI-MAX')) {
    brand = 'MULTIMAX';
  }

  // 2. Detect City / Locality
  let city = 'Venezuela';
  let branchName = '';

  if (upper.includes('C.OJEDA') || upper.includes('C. OJEDA') || upper.includes('COJEDA') || upper.includes('CIUDAD OJEDA') || upper.includes('OJEDA')) {
    city = 'Ciudad Ojeda';
    branchName = 'Ciudad Ojeda';
  } else if (upper.includes('5 DE JULIO') || upper.includes('5JUL') || upper.includes('5 DE JUL')) {
    city = 'Maracaibo';
    branchName = '5 de Julio';
  } else if (upper.includes('CIRCUNVALACION') || upper.includes('CIRCUNVALACIÓN') || upper.includes('C1') || upper.includes('C 1') || upper.includes('C-1')) {
    city = 'Maracaibo';
    branchName = 'Circunvalación 1';
  } else if (upper.includes('LA LIMPIA') || upper.includes('LIMP') || upper.includes('LIMPIA')) {
    city = 'Maracaibo';
    branchName = 'La Limpia';
  } else if (upper.includes('MARACAIBO') || upper.includes('MCBO') || upper.includes('DELICIAS NORTE')) {
    city = 'Maracaibo';
  } else if (upper.includes('CABIMAS')) {
    city = 'Cabimas';
  } else if (upper.includes('MATURIN') || upper.includes('MATURÍN')) {
    city = 'Maturín';
  } else if (upper.includes('LECHERIA') || upper.includes('LECHERÍA') || upper.includes('PLAZA MAYOR')) {
    city = 'Lechería';
  } else if (upper.includes('PUERTO LA CRUZ') || upper.includes('PLC') || upper.includes('PTO LA CRUZ') || upper.includes('CENTRO PLC')) {
    city = 'Puerto La Cruz';
    if (upper.includes('CENTRO')) branchName = 'Centro';
  } else if (upper.includes('SAMBIL MARACAIBO')) {
    city = 'Maracaibo';
    branchName = 'Sambil';
  } else if (upper.includes('SAMBIL CHACAO') || upper.includes('SAMBIL CCS') || upper.includes('SAMBIL LA CANDELARIA') || upper.includes('CCCT') || upper.includes('LOS RUICES') || upper.includes('LA CASTELLANA') || upper.includes('BELLO MONTE') || upper.includes('EL RECREO') || upper.includes('LIDER') || upper.includes('CARACAS') || upper.includes('CCS')) {
    city = 'Caracas';
    if (upper.includes('SAMBIL')) branchName = 'Sambil';
    else if (upper.includes('CCCT')) branchName = 'CCCT';
    else if (upper.includes('LOS RUICES')) branchName = 'Los Ruices';
    else if (upper.includes('LA CASTELLANA')) branchName = 'La Castellana';
  } else if (upper.includes('VALENCIA') || upper.includes('GUAPARO') || upper.includes('VIÑEDO') || upper.includes('NAGUANAGUA') || upper.includes('ARC')) {
    city = 'Valencia';
    if (upper.includes('GUAPARO')) branchName = 'Guaparo';
    else if (upper.includes('NAGUANAGUA')) branchName = 'Naguanagua';
  } else if (upper.includes('BARQUISIMETO') || upper.includes('BQTO') || upper.includes('LARA')) {
    city = 'Barquisimeto';
  } else if (upper.includes('MARACAY') || upper.includes('LAS DELICIAS') || upper.includes('AVIADORES')) {
    city = 'Maracay';
  } else if (upper.includes('SAN CRISTOBAL') || upper.includes('SAN CRISTÓBAL') || upper.includes('TACHIRA')) {
    city = 'San Cristóbal';
  } else if (upper.includes('PUERTO ORDAZ') || upper.includes('POZ') || upper.includes('GUAYANA') || upper.includes('ALTA VISTA')) {
    city = 'Puerto Ordaz';
  } else if (upper.includes('CIUDAD BOLIVAR') || upper.includes('CIUDAD BOLÍVAR')) {
    city = 'Ciudad Bolívar';
  } else if (upper.includes('PORLAMAR') || upper.includes('MARGARITA') || upper.includes('PAMPATAR')) {
    city = 'Margarita';
  } else if (upper.includes('MERIDA') || upper.includes('MÉRIDA')) {
    city = 'Mérida';
  } else if (upper.includes('VALERA')) {
    city = 'Valera';
  } else if (upper.includes('PUNTO FIJO') || upper.includes('CORO') || upper.includes('PARAGUANA')) {
    city = 'Punto Fijo';
  } else if (upper.includes('BARINAS')) {
    city = 'Barinas';
  } else if (upper.includes('ACARIGUA') || upper.includes('ARAURE')) {
    city = 'Acarigua';
  }

  // 3. Format Store Display Name
  let storeName = clean;
  if (brand !== 'OTRA') {
    if (branchName) {
      storeName = `${brand} ${branchName} (${city})`;
    } else if (city !== 'Venezuela') {
      storeName = `${brand} ${city}`;
    } else {
      storeName = `${brand} Venezuela`;
    }
  } else {
    // If brand wasn't explicitly found, keep title-cased filename
    storeName = clean;
  }

  // 4. Extract Date (Handles "8.07", "08.07", "18.07", "8-07", "08-07", "08 07", "18 07", etc.)
  let recordingDate = 'Julio 2026';
  const datePattern = /(\b\d{1,2})[\.\/\-\s](\d{1,2})\b/;
  const match = clean.match(datePattern);

  if (match) {
    const rawDay = parseInt(match[1], 10);
    const rawMonth = parseInt(match[2], 10);

    const day = rawDay.toString().padStart(2, '0');
    const monthNames: Record<number, string> = {
      1: 'Enero',
      2: 'Febrero',
      3: 'Marzo',
      4: 'Abril',
      5: 'Mayo',
      6: 'Junio',
      7: 'Julio',
      8: 'Agosto',
      9: 'Septiembre',
      10: 'Octubre',
      11: 'Noviembre',
      12: 'Diciembre',
    };

    const monthName = monthNames[rawMonth] || 'Julio';
    recordingDate = `${day} de ${monthName} 2026`;
  }

  return {
    storeName,
    brand,
    brandCategory,
    city,
    recordingDate,
  };
}

