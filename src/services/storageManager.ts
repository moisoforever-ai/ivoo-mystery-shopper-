/**
 * Storage & Memory Management Service for IVOO & Competencia Mystery Shopper
 * Provides multi-period persistence, quota calculation, and automatic silent purge (auto-depuración sin intervención).
 */

import { StoreEvaluation } from '../types';
import { EVALUATIONS_DATA } from '../data/evaluationsData';
import { normalizeEvaluationsList } from '../utils/evaluationHelpers';

const EVALS_STORAGE_KEY = 'ivoo_mystery_shopper_evaluations_v4_pdf';
const HISTORY_STORAGE_KEY = 'ivoo_mystery_shopper_history_v4_pdf';
const MAX_LOCAL_STORAGE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB safe limit
const MAX_HISTORY_SNAPSHOTS = 4; // Keep only last 4 lightweight snapshots

export interface StorageStats {
  usedBytes: number;
  usedFormatted: string;
  maxBytes: number;
  maxFormatted: string;
  percentage: number;
  snapshotCount: number;
  lastPurgeDate: string | null;
  autoPurgeEnabled: boolean;
}

export interface EvaluationSnapshot {
  id: string;
  timestamp: number;
  dateFormatted: string;
  reason: string;
  data: StoreEvaluation[];
}

/**
 * Get current storage usage in bytes
 */
export function getStorageUsage(): { bytes: number; count: number } {
  let totalBytes = 0;
  let keyCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ivoo_') || key.startsWith('ms_'))) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16 characters = 2 bytes approx
        keyCount++;
      }
    }
  } catch (e) {
    console.warn('Error reading localStorage usage', e);
  }
  return { bytes: totalBytes, count: keyCount };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Sanitizes evaluations before persisting to eliminate heavy audio blobs/data-uris
 */
export function sanitizeEvaluationsForStorage(evaluations: StoreEvaluation[]): StoreEvaluation[] {
  return evaluations.map((item) => {
    let cleanAudioUrl = item.audioUrl;
    // Strip inline base64 audio data URI to prevent storage quota exhaustion
    if (cleanAudioUrl && cleanAudioUrl.startsWith('data:audio')) {
      cleanAudioUrl = undefined;
    }
    return {
      ...item,
      audioUrl: cleanAudioUrl,
    };
  });
}

/**
 * Get complete storage statistics and health
 */
export function getStorageStats(): StorageStats {
  const { bytes } = getStorageUsage();
  const history = getHistorySnapshots();
  let lastPurge = null;
  try {
    lastPurge = localStorage.getItem('ivoo_last_purge_timestamp');
  } catch {}

  const percentage = Math.min(100, Math.round((bytes / MAX_LOCAL_STORAGE_BYTES) * 100));

  return {
    usedBytes: bytes,
    usedFormatted: formatBytes(bytes),
    maxBytes: MAX_LOCAL_STORAGE_BYTES,
    maxFormatted: formatBytes(MAX_LOCAL_STORAGE_BYTES),
    percentage,
    snapshotCount: history.length,
    lastPurgeDate: lastPurge ? new Date(parseInt(lastPurge, 10)).toLocaleString() : null,
    autoPurgeEnabled: true,
  };
}

/**
 * Auto-purge older history snapshots, temporary audio blobs, and orphaned keys automatically
 */
export function autoPurgeStorage(force: boolean = false): { purgedCount: number; freedBytes: number } {
  const beforeUsage = getStorageUsage().bytes;
  let purgedCount = 0;

  try {
    // 1. Purge older history snapshots (keep only newest MAX_HISTORY_SNAPSHOTS)
    const history = getHistorySnapshots();
    if (history.length > MAX_HISTORY_SNAPSHOTS || force) {
      const keepCount = force ? 1 : MAX_HISTORY_SNAPSHOTS;
      const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
      const kept = sorted.slice(0, keepCount);
      purgedCount += sorted.length - kept.length;
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(kept));
    }

    // 2. Remove temporary object URLs or oversized legacy keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ivoo_temp_') || key.startsWith('blob_') || key.startsWith('chunk_'))) {
        localStorage.removeItem(key);
        purgedCount++;
      }
    }

    localStorage.setItem('ivoo_last_purge_timestamp', Date.now().toString());
  } catch (e) {
    console.warn('Error during autoPurgeStorage', e);
  }

  const afterUsage = getStorageUsage().bytes;
  const freedBytes = Math.max(0, beforeUsage - afterUsage);

  return { purgedCount, freedBytes };
}

// Background auto-purge worker (Runs silently every 60 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { bytes } = getStorageUsage();
    if (bytes > MAX_LOCAL_STORAGE_BYTES * 0.6) {
      autoPurgeStorage(false);
    }
  }, 60 * 1000);
}

/**
 * Save evaluations safely with automatic quota protection and auto-purge
 */
export function saveEvaluationsSafely(evaluations: StoreEvaluation[], reason: string = 'Modificación de reporte'): boolean {
  try {
    const sanitized = sanitizeEvaluationsForStorage(normalizeEvaluationsList(evaluations));

    // Pre-check usage; if near 65% capacity, trigger auto-purge before saving
    const current = getStorageUsage().bytes;
    if (current > MAX_LOCAL_STORAGE_BYTES * 0.65) {
      autoPurgeStorage(false);
    }

    // Save current evaluations
    const serialized = JSON.stringify(sanitized);
    localStorage.setItem(EVALS_STORAGE_KEY, serialized);

    // Record a lightweight snapshot for history
    recordSnapshot(sanitized, reason);
    return true;
  } catch (err: unknown) {
    console.warn('Quota warning, executing emergency auto-purge...', err);
    // Emergency purge on QuotaExceededError
    autoPurgeStorage(true);
    try {
      const sanitized = sanitizeEvaluationsForStorage(normalizeEvaluationsList(evaluations));
      localStorage.setItem(EVALS_STORAGE_KEY, JSON.stringify(sanitized));
      return true;
    } catch (retryErr) {
      console.error('Fatal storage write failure after purge', retryErr);
      return false;
    }
  }
}

/**
 * Load evaluations from storage with fallback
 */
export function loadEvaluations(): StoreEvaluation[] {
  try {
    const saved = localStorage.getItem(EVALS_STORAGE_KEY) || localStorage.getItem('ivoo_mystery_shopper_evaluations_july2026_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeEvaluationsList(parsed);
      }
    }
  } catch (e) {
    console.warn('Error loading evaluations from storage', e);
  }
  return normalizeEvaluationsList(EVALUATIONS_DATA);
}

/**
 * Reset evaluations to original factory initial state
 */
export function resetToFactoryData(): StoreEvaluation[] {
  const normalized = normalizeEvaluationsList(EVALUATIONS_DATA);
  try {
    localStorage.setItem(EVALS_STORAGE_KEY, JSON.stringify(normalized));
    recordSnapshot(normalized, 'Restablecimiento a valores de fábrica');
  } catch (e) {
    console.warn('Error resetting to factory data', e);
  }
  return normalized;
}

function getHistorySnapshots(): EvaluationSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function recordSnapshot(data: StoreEvaluation[], reason: string) {
  try {
    const history = getHistorySnapshots();
    const newSnapshot: EvaluationSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString(),
      reason,
      data,
    };
    const updated = [newSnapshot, ...history].slice(0, MAX_HISTORY_SNAPSHOTS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not record snapshot', e);
  }
}

/**
 * Export complete reports data as downloadable JSON
 */
export function exportBackupJSON(evaluations: StoreEvaluation[]): void {
  const normalized = normalizeEvaluationsList(evaluations);
  const exportObject = {
    app: 'Mystery Shopper Consolidated Reporting — IVOO & Competencia',
    exportDate: new Date().toISOString(),
    version: '3.0.0',
    evaluationsCount: normalized.length,
    evaluations: normalized,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Mystery_Shopper_Consolidado_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
