import { CriterionDefinition, CriterionStatus, CriterionScore, EvaluationLevel, FlagCode } from '../types';

// Guía IDM — Versión Operativa Completa. 8 dimensiones (D1–D8), 100 pts totales.
export const IVOO_CRITERIA: CriterionDefinition[] = [
  {
    id: 'actitud',
    name: 'Actitud e Intención Comercial',
    shortName: 'Actitud',
    maxScore: 15,
    description: 'Energía, disposición, interés genuino, iniciativa, actitud de servicio y comportamiento proactivo durante toda la interacción.',
  },
  {
    id: 'necesidades',
    name: 'Detección de Necesidades',
    shortName: 'Necesidades',
    maxScore: 15,
    description: 'Qué necesita, para qué, presupuesto, preferencias, restricciones y contexto de uso — y si usa esa información para orientar.',
  },
  {
    id: 'conocimiento',
    name: 'Conocimiento y Credibilidad',
    shortName: 'Conocimiento',
    maxScore: 15,
    description: 'Conocimiento de producto, diferencias entre productos, garantías, condiciones comerciales, financiamiento y exactitud de la información.',
  },
  {
    id: 'propuesta',
    name: 'Construcción de Propuesta y Alternativas',
    shortName: 'Propuesta',
    maxScore: 15,
    description: 'Traduce la necesidad detectada en una recomendación justificada, compara opciones y presenta alternativas.',
  },
  {
    id: 'objeciones',
    name: 'Manejo de Objeciones y Competencia',
    shortName: 'Objeciones',
    maxScore: 15,
    description: 'Precio, competencia, falta de stock, marca, presupuesto, dudas, financiamiento e intención de abandonar.',
  },
  {
    id: 'cierre',
    name: 'Cierre y Recuperación de la Oportunidad',
    shortName: 'Cierre',
    maxScore: 15,
    description: 'Preguntas de cierre, propuesta concreta, reserva, búsqueda de inventario y recuperación activa cuando el cliente intenta retirarse.',
  },
  {
    id: 'cross_up',
    name: 'Cross-Selling / Up-Selling',
    shortName: 'Cross/Up',
    maxScore: 5,
    description: 'Identifica una oportunidad razonable de complementar, ampliar, mejorar, proteger o facilitar el uso, vinculada a la necesidad real.',
  },
  {
    id: 'experiencia',
    name: 'Experiencia, Comunicación y Seguimiento',
    shortName: 'Experiencia',
    maxScore: 5,
    description: 'Bienvenida, claridad, respeto, empatía, comunicación fluida, despedida y seguimiento cuando corresponde.',
  },
];

export const TOTAL_MAX_SCORE = 100;

export function getCriterionStatus(score: number, maxScore: number): CriterionStatus {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 75) return 'good'; // Sobresaliente
  if (percentage >= 50) return 'acceptable'; // Aceptable
  return 'deficient'; // Insuficiente / Nulo
}

/**
 * Clasificación final según la Guía IDM: tabla de puntaje + requisitos mínimos de Asesor Smart
 * + reglas de tope por bandera. Determinista: mismos insumos siempre producen el mismo resultado.
 */
export function getOverallLevel(
  score: number,
  criteriaBreakdown: CriterionScore[] = [],
  flags: FlagCode[] = []
): EvaluationLevel {
  let level: EvaluationLevel;
  if (score >= 90) level = 'SMART';
  else if (score >= 80) level = 'SOLIDO';
  else if (score >= 65) level = 'EN_DESARROLLO';
  else if (score >= 50) level = 'INSUFICIENTE';
  else level = 'CRITICO';

  // Requisitos mínimos para Asesor Smart: ninguna dimensión de 15 pts por debajo de 10, ninguna
  // de 5 pts en 0, y cero banderas. Si el puntaje calificaría para SMART pero no cumple estos
  // mínimos, baja a SÓLIDO (la clasificación inmediata inferior).
  const has15PtBelow10 = criteriaBreakdown.some((c) => c.maxScore === 15 && c.score < 10);
  const has5PtAtZero = criteriaBreakdown.some((c) => c.maxScore === 5 && c.score === 0);
  const hasAnyFlag = flags.length > 0;
  if (level === 'SMART' && (has15PtBelow10 || has5PtAtZero || hasAnyFlag)) {
    level = 'SOLIDO';
  }

  // Regla de tope por flag: F1, F2 o F3 limitan la clasificación a EN DESARROLLO como máximo,
  // sin importar qué tan alto sea el puntaje.
  const tierOrder: EvaluationLevel[] = ['CRITICO', 'INSUFICIENTE', 'EN_DESARROLLO', 'SOLIDO', 'SMART'];
  const hasCapFlag = flags.some((f) => f === 'F1' || f === 'F2' || f === 'F3');
  if (hasCapFlag && tierOrder.indexOf(level) > tierOrder.indexOf('EN_DESARROLLO')) {
    level = 'EN_DESARROLLO';
  }

  // F4 baja un nivel de clasificación adicional (presión indebida / desacreditar al competidor).
  if (flags.includes('F4')) {
    const idx = tierOrder.indexOf(level);
    if (idx > 0) level = tierOrder[idx - 1];
  }

  return level;
}

export function getStatusColorClasses(status: CriterionStatus): {
  bg: string;
  text: string;
  badge: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'good':
      return {
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        border: 'border-emerald-500',
        dot: 'bg-emerald-500',
      };
    case 'acceptable':
      return {
        bg: 'bg-amber-50 text-amber-900',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        border: 'border-amber-500',
        dot: 'bg-amber-600',
      };
    case 'deficient':
      return {
        bg: 'bg-rose-50 text-rose-900',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        border: 'border-rose-500',
        dot: 'bg-rose-500',
      };
  }
}

export function getLevelBadgeClasses(level: EvaluationLevel): string {
  switch (level) {
    case 'SMART':
      return 'bg-lime-500 text-slate-950 shadow-xs';
    case 'SOLIDO':
      return 'bg-emerald-600 text-white shadow-xs';
    case 'EN_DESARROLLO':
      return 'bg-amber-600 text-white shadow-xs';
    case 'INSUFICIENTE':
      return 'bg-orange-600 text-white shadow-xs';
    case 'CRITICO':
      return 'bg-rose-600 text-white shadow-xs';
  }
}

export function getLevelDisplayName(level: EvaluationLevel): string {
  switch (level) {
    case 'SMART':
      return 'Asesor Smart';
    case 'SOLIDO':
      return 'Sólido';
    case 'EN_DESARROLLO':
      return 'En Desarrollo';
    case 'INSUFICIENTE':
      return 'Insuficiente';
    case 'CRITICO':
      return 'Crítico';
  }
}
