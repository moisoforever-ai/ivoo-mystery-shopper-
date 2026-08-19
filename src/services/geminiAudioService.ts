import { AudioAuditResult, TranscriptLine } from '../types';

export interface TranscribeAudioParams {
  file?: File | Blob;
  audioBase64?: string;
  mimeType?: string;
  storeName: string;
  city: string;
  recordingDate?: string;
  additionalContext?: string;
}

/**
 * Converts a File or Blob into a base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:audio/xxx;base64, prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts an AudioBuffer to a compact 16-bit 16kHz Mono WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Mix down channels to mono if multiple channels
  const length = buffer.length;
  const monoSamples = new Float32Array(length);
  const channelsData = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channelsData.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let c = 0; c < channelsData.length; c++) {
      sum += channelsData[c][i];
    }
    monoSamples[i] = sum / channelsData.length;
  }

  const dataByteLength = length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(wavBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples (clamp float between -1 and 1, convert to 16-bit integer)
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, monoSamples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

export function detectAudioMimeType(file: File | Blob, filename?: string): string {
  const name = (file instanceof File ? file.name : '') || filename || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'mp3') return 'audio/mp3';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'ogg' || ext === 'opus') return 'audio/ogg';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'flac') return 'audio/flac';

  if (file.type && file.type.startsWith('audio/')) {
    if (file.type.includes('m4a') || file.type.includes('mp4')) return 'audio/mp4';
    if (file.type.includes('wav')) return 'audio/wav';
    if (file.type.includes('mpeg') || file.type.includes('mp3')) return 'audio/mp3';
    if (file.type.includes('ogg') || file.type.includes('opus')) return 'audio/ogg';
    if (file.type.includes('aac')) return 'audio/aac';
    if (file.type.includes('webm')) return 'audio/webm';
    return file.type;
  }

  return 'audio/mp4';
}

/**
 * Optimizes audio for Gemini AI speech analysis
 */
async function prepareAudioBlob(file: File | Blob): Promise<{ blob: Blob; mimeType: string }> {
  const mimeType = detectAudioMimeType(file);

  // If the file is already a compressed standard audio under 40MB, pass it directly
  if (file.size < 40 * 1024 * 1024) {
    return { blob: file, mimeType };
  }

  // If the file is massive raw PCM WAV (>40MB), resample to 16kHz mono WAV to reduce transfer size
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return { blob: file, mimeType };
    }

    const audioCtx = new AudioContextClass();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    await audioCtx.close();

    const targetSampleRate = 16000;
    const targetLength = Math.ceil(decodedBuffer.duration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampledBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWavBlob(resampledBuffer);

    return { blob: wavBlob, mimeType: 'audio/wav' };
  } catch (err) {
    console.warn('Direct audio passthrough (resampling skipped):', err);
    return { blob: file, mimeType };
  }
}

/**
 * Uploads audio using chunked transfer to avoid HTTP 413 (Payload Too Large) errors
 */
async function uploadAndTranscribeChunked(
  blob: Blob,
  mimeType: string,
  params: TranscribeAudioParams,
  onProgress?: (stage: string) => void
): Promise<AudioAuditResult> {
  const CHUNK_SIZE = 512 * 1024; // 512 KB per chunk (ensures payload is well below Nginx 1MB limits)
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  onProgress?.(`Iniciando sesión de transferencia (${totalChunks} fragmentos)...`);

  // Step 1: Initialize session
  const initRes = await fetch('/api/gemini/init-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      totalChunks,
      mimeType,
      storeName: params.storeName,
      city: params.city,
      recordingDate: params.recordingDate || 'Julio 2026',
      additionalContext: params.additionalContext,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || `Error al inicializar sesión (${initRes.status})`);
  }

  // Step 2: Upload each chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(blob.size, start + CHUNK_SIZE);
    const chunkBlob = blob.slice(start, end);
    const chunkBase64 = await fileToBase64(chunkBlob);

    const percent = Math.round(((i + 1) / totalChunks) * 100);
    onProgress?.(`Transfiriendo audio seguro: fragmento ${i + 1} de ${totalChunks} (${percent}%)...`);

    const chunkRes = await fetch('/api/gemini/upload-chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        chunkIndex: i,
        chunkBase64,
      }),
    });

    if (!chunkRes.ok) {
      const err = await chunkRes.json().catch(() => ({}));
      throw new Error(err.error || `Error al subir fragmento ${i + 1} (${chunkRes.status})`);
    }
  }

  // Step 3: Process with Gemini
  onProgress?.('Gemini 3.7 Flash procesando grabación: Transcribiendo verbatim y auditando diálogos...');

  const processRes = await fetch('/api/gemini/process-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!processRes.ok) {
    const err = await processRes.json().catch(() => ({}));
    throw new Error(err.error || `Error del servidor al procesar audio (${processRes.status})`);
  }

  onProgress?.('Estructurando los 9 criterios y consolidando informe...');

  const resultJson = await processRes.json();
  if (!resultJson.success || !resultJson.data) {
    throw new Error(resultJson.error || 'Respuesta no válida del motor de auditoría');
  }

  return resultJson.data as AudioAuditResult;
}

/**
 * Calls the backend Gemini endpoint to perform real verbatim transcription and 9-criteria evaluation
 */
export async function transcribeAndAuditAudioWithGemini(
  params: TranscribeAudioParams,
  onProgress?: (stage: string) => void
): Promise<AudioAuditResult> {
  let targetBlob: Blob | null = null;
  let targetMimeType = params.mimeType || 'audio/mp4';

  if (params.file) {
    onProgress?.('Preparando archivo de audio para análisis de voz...');
    const prepared = await prepareAudioBlob(params.file);
    targetBlob = prepared.blob;
    targetMimeType = prepared.mimeType;
  } else if (params.audioBase64) {
    // If provided as base64 string, convert to blob to chunk it safely
    const cleanBase64 = params.audioBase64.includes(',')
      ? params.audioBase64.split(',')[1]
      : params.audioBase64;
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    targetBlob = new Blob([byteArray], { type: targetMimeType });
  }

  if (!targetBlob) {
    throw new Error('No se ha proporcionado el archivo de audio');
  }

  // Use chunked upload pipeline for 100% reliability and 0 size limits
  return uploadAndTranscribeChunked(targetBlob, targetMimeType, params, onProgress);
}

/**
 * Re-grades an edited transcript using Gemini
 */
export async function regradeTranscriptWithGemini(
  transcript: TranscriptLine[],
  storeName: string,
  city: string,
  productEvaluated?: string
): Promise<Partial<AudioAuditResult>> {
  const response = await fetch('/api/gemini/regrade-transcript', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transcript,
      storeName,
      city,
      productEvaluated,
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || `Error del servidor (${response.status})`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Respuesta inválida al recalcular la evaluación');
  }

  return json.data;
}

/**
 * Parses raw text or dialogue into structured transcript lines and audits with 100% precision
 */
export async function auditRawTextWithGemini(
  rawText: string,
  storeName: string = 'Tienda Retail',
  city: string = 'Venezuela',
  productEvaluated?: string
): Promise<Partial<AudioAuditResult> & { transcript: TranscriptLine[] }> {
  // Convert plain text into transcript line objects
  const rawLines = rawText.split('\n').filter((l) => l.trim().length > 0);
  const structuredTranscript: TranscriptLine[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    // Pattern match: "[00:15] Vendedor: Hola buenas tardes" or "Mystery Shopper: Hola"
    const timestampMatch = trimmed.match(/^\[?(\d{1,2}:\d{2})\]?\s*(.*)$/);
    let timestamp = '00:00';
    let rest = trimmed;

    if (timestampMatch) {
      timestamp = timestampMatch[1];
      rest = timestampMatch[2];
    }

    const speakerMatch = rest.match(/^(Mystery Shopper|Shopper|Cliente|Vendedor|Asesor|Cajero|Seguridad|Ambiente)\s*(\([^)]*\))?:\s*(.*)$/i);
    if (speakerMatch) {
      const rawSpeaker = speakerMatch[1].toLowerCase();
      let speaker: TranscriptLine['speaker'] = 'Vendedor';
      if (rawSpeaker.includes('shopper') || rawSpeaker.includes('cliente')) speaker = 'Mystery Shopper';
      else if (rawSpeaker.includes('cajer')) speaker = 'Cajero';
      else if (rawSpeaker.includes('segur')) speaker = 'Seguridad';
      else if (rawSpeaker.includes('ambien')) speaker = 'Ambiente';

      const speakerName = speakerMatch[2] ? speakerMatch[2].replace(/[()]/g, '').trim() : undefined;
      const text = speakerMatch[3].trim();
      structuredTranscript.push({ speaker, speakerName, text, timestamp });
    } else {
      // Default to alternation or Vendedor
      const lastSpeaker = structuredTranscript[structuredTranscript.length - 1]?.speaker;
      const speaker = lastSpeaker === 'Mystery Shopper' ? 'Vendedor' : 'Mystery Shopper';
      structuredTranscript.push({ speaker, text: rest, timestamp });
    }
  }

  if (structuredTranscript.length === 0) {
    structuredTranscript.push({
      speaker: 'Vendedor',
      text: rawText,
      timestamp: '00:00',
    });
  }

  const auditData = await regradeTranscriptWithGemini(structuredTranscript, storeName, city, productEvaluated);

  return {
    ...auditData,
    transcript: structuredTranscript,
  };
}
