export type EvaluationLevel = 'SMART' | 'SOLIDO' | 'EN_DESARROLLO' | 'INSUFICIENTE' | 'CRITICO';
export type CriterionStatus = 'good' | 'acceptable' | 'deficient';
export type VerificationStatus = 'verified' | 'ai_transcribed' | 'preliminary';
export type BrandCategory = 'IVOO' | 'COMPETENCIA';
export type BrandType = 'IVOO' | 'DAKA' | 'DAMASCO' | 'MULTIMAX' | 'OTRA';

// --- Guía IDM: clasificación previa, banderas de fallo y detector de momentos críticos ---
export type InteractionType = 'A' | 'B' | 'C' | 'D' | 'NO_EVALUABLE';
export type SaleStatus = 'CERRADA' | 'NO_CERRADA' | 'ABANDONADA';
export type FlagCode = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
export type EventImpact = 'POSITIVO' | 'NEUTRO' | 'GRAVE' | 'CRITICO';
export type RecoveryAttempt = 'SI' | 'PARCIAL' | 'NO';

export const FLAG_LABELS: Record<FlagCode, string> = {
  F1: 'Oportunidad entregada a la competencia',
  F2: 'Venta abandonada por el asesor',
  F3: 'Información inventada presentada como cierta',
  F4: 'Presión indebida o desacreditación falsa del competidor',
  F5: 'Falta ética o legal',
};

export interface CriticalEvent {
  evento: string;
  queDijoCliente: string;
  queHizoAsesor: string;
  quePodiaHacer: string;
  intentoRecuperar: RecoveryAttempt;
  impacto: EventImpact;
  ajuste: number;
}

export interface CriterionDefinition {
  id: string;
  name: string;
  shortName: string;
  maxScore: number;
  description: string;
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  observation: string;
  status: CriterionStatus;
}

export interface TranscriptLine {
  speaker: 'Mystery Shopper' | 'Vendedor' | 'Seguridad' | 'Cajero' | 'Ambiente';
  speakerName?: string;
  text: string;
  timestamp?: string;
}

export interface StoreEvaluation {
  id: string;
  identifier: string;
  storeName: string;
  brand?: BrandType | string;
  brandCategory?: BrandCategory;
  monthPeriod?: string; // e.g. "2026-07" or "Julio 2026"
  city: string;
  seller: string;
  recordingDate: string;
  duration: string;
  score: number;
  level: EvaluationLevel;
  saleClosed: boolean;
  contactCaptured: boolean;
  productEvaluated: string;
  narrativeSummary: string;
  criteriaBreakdown: CriterionScore[];
  strengths: string[];
  criticalAreas: string[];
  recommendations: string[];
  transcript: TranscriptLine[];
  ambientNotes?: string;
  freelancerObservations?: string;
  audioUrl?: string;
  audioDriveId?: string;
  verificationStatus?: VerificationStatus;
  verificationDate?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  // --- Guía IDM ---
  interactionType?: InteractionType;
  notEvaluableReason?: string;
  saleStatus?: SaleStatus;
  dimensionsSum?: number;
  detectorAdjustment?: number;
  flags?: FlagCode[];
  criticalEvents?: CriticalEvent[];
  competitorMentioned?: string;
  noPurchaseReason?: string;
  mainObjectionType?: string;
  coachingAction?: string;
  requiresHumanReview?: boolean;
}

export interface MonthConsolidatedSummary {
  monthPeriod: string; // e.g. "2026-07"
  monthName: string;   // e.g. "Julio 2026"
  totalVisits: number;
  ivooVisits: number;
  competenciaVisits: number;
  avgScoreTotal: number;
  avgScoreIvoo: number;
  avgScoreCompetencia: number;
  deltaScore: number; // IVOO - Competencia
  closedRateIvoo: number;
  closedRateCompetencia: number;
  contactRateIvoo: number;
  contactRateCompetencia: number;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface AudioAuditResult {
  storeName?: string;
  seller?: string;
  city?: string;
  productEvaluated?: string;
  duration?: string;
  transcript: TranscriptLine[];
  narrativeSummary: string;
  criteriaBreakdown: CriterionScore[];
  score: number;
  level: EvaluationLevel;
  saleClosed: boolean;
  contactCaptured: boolean;
  strengths: string[];
  criticalAreas: string[];
  recommendations: string[];
  keyQuotes?: { topic: string; quote: string; timestamp?: string }[];
  // --- Guía IDM ---
  interactionType?: InteractionType;
  notEvaluableReason?: string;
  saleStatus?: SaleStatus;
  dimensionsSum?: number;
  detectorAdjustment?: number;
  flags?: FlagCode[];
  criticalEvents?: CriticalEvent[];
  competitorMentioned?: string;
  noPurchaseReason?: string;
  mainObjectionType?: string;
  coachingAction?: string;
  requiresHumanReview?: boolean;
}

