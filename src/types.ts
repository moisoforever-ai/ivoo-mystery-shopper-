export type EvaluationLevel = 'Bueno' | 'Regular' | 'Deficiente';
export type CriterionStatus = 'good' | 'acceptable' | 'deficient';
export type VerificationStatus = 'verified' | 'ai_transcribed' | 'preliminary';

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
  audioUrl?: string;
  audioDriveId?: string;
  verificationStatus?: VerificationStatus;
  verificationDate?: string;
  verifiedBy?: string;
  verificationNotes?: string;
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
}

