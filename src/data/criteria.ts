import { CriterionDefinition, CriterionStatus, EvaluationLevel } from '../types';

export const IVOO_CRITERIA: CriterionDefinition[] = [
  {
    id: 'saludo',
    name: 'Saludo y bienvenida',
    shortName: 'Saludo',
    maxScore: 10,
    description: 'Saludo proactivo, contacto visual, presentación con nombre, disposición de servicio.',
  },
  {
    id: 'necesidades',
    name: 'Detección de necesidades',
    shortName: 'Sondeo',
    maxScore: 10,
    description: 'Preguntas sobre uso previsto, dimensiones/espacio, presupuesto y preferencias del cliente.',
  },
  {
    id: 'conocimiento',
    name: 'Conocimiento de producto',
    shortName: 'Conocimiento',
    maxScore: 15,
    description: 'Dominio técnico (specs, tecnología, garantías, diferenciadores), demostración en vivo.',
  },
  {
    id: 'opciones',
    name: 'Presentación de opciones',
    shortName: 'Opciones',
    maxScore: 15,
    description: 'Muestra 3+ alternativas ordenadas por precio o necesidad con recomendación justificada.',
  },
  {
    id: 'cierre',
    name: 'Técnica de venta y cierre',
    shortName: 'Cierre',
    maxScore: 15,
    description: 'Intento de cierre directo ante señales de compra, manejo de objeciones, propuesta de reserva.',
  },
  {
    id: 'financiamiento',
    name: 'Manejo de financiamiento',
    shortName: 'Finanzas',
    maxScore: 10,
    description: 'Explicación detallada de Cashea, divisas en efectivo y bolívares con cálculo de cuotas e iniciales.',
  },
  {
    id: 'actitud',
    name: 'Actitud y amabilidad',
    shortName: 'Actitud',
    maxScore: 10,
    description: 'Trato empático, tono cordial, paciencia didáctica, contacto visual y lenguaje corporal profesional.',
  },
  {
    id: 'despedida',
    name: 'Despedida y seguimiento',
    shortName: 'Despedida',
    maxScore: 10,
    description: 'Despedida formal, entrega de nombre y captura del contacto (WhatsApp/móvil) para cotización.',
  },
  {
    id: 'proactividad',
    name: 'Proactividad comercial',
    shortName: 'Proactividad',
    maxScore: 5,
    description: 'Venta cruzada (cross-selling), combos, promociones vigentes, accesorios complementarios.',
  },
];

export const TOTAL_MAX_SCORE = 100;

export function getCriterionStatus(score: number, maxScore: number): CriterionStatus {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 75) return 'good'; // Verde (≥ 75%)
  if (percentage >= 50) return 'acceptable'; // Marrón (50 - 74%)
  return 'deficient'; // Rojo (< 50%)
}

export function getOverallLevel(score: number): EvaluationLevel {
  if (score >= 75) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Deficiente';
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
    case 'Bueno':
      return 'bg-emerald-600 text-white shadow-xs';
    case 'Regular':
      return 'bg-amber-600 text-white shadow-xs';
    case 'Deficiente':
      return 'bg-rose-600 text-white shadow-xs';
  }
}
