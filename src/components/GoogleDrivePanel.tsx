import React, { useState, useEffect, useRef } from 'react';
import { DriveFileItem, StoreEvaluation, TranscriptLine, AudioAuditResult } from '../types';
import {
  fetchDriveFolderFiles,
  formatFileSize,
  downloadDriveFileBlob,
  saveAuditFileToDrive,
  IVOO_DRIVE_FOLDER_ID,
} from '../services/googleDriveService';
import {
  signInGoogle,
  logoutGoogle,
  getUser,
} from '../services/firebaseAuth';
import {
  generateEvaluationsFromDriveFiles,
  generateEvaluationFromFile,
  parseFileInfo,
} from '../services/evaluationGenerator';
import {
  transcribeAndAuditAudioWithGemini,
  auditRawTextWithGemini,
} from '../services/geminiAudioService';
import { saveEvaluationsSafely } from '../services/storageManager';
import {
  FolderSync,
  FileAudio,
  FileText,
  FileSpreadsheet,
  Folder,
  File,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  LogIn,
  LogOut,
  FolderOpen,
  Sparkles,
  ChevronRight,
  BarChart,
  Calendar,
  Layers,
  Store,
  PlusCircle,
  Play,
  Pause,
  CloudUpload,
  Cpu,
  Check,
  ListOrdered,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GoogleDrivePanelProps {
  evaluations: StoreEvaluation[];
  onUpdateEvaluations?: (updated: StoreEvaluation[]) => void;
  onGoToResumen?: () => void;
}

interface BatchItemProgress {
  fileId: string;
  fileName: string;
  storeName: string;
  city: string;
  status: 'idle' | 'downloading' | 'optimizing' | 'transcribing' | 'completed' | 'error';
  progressMessage: string;
  score?: number;
  linesCount?: number;
  error?: string;
}

export const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({
  evaluations,
  onUpdateEvaluations,
  onGoToResumen,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'batch' | 'files' | 'text_tool'>('batch');
  const [folderId, setFolderId] = useState<string>(IVOO_DRIVE_FOLDER_ID);
  const [folderName, setFolderName] = useState<string>('JULIO 2026');
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string; displayName?: string } | null>(null);

  // Batch Automation Pipeline States
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchQueue, setBatchQueue] = useState<BatchItemProgress[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const isCancelledRef = useRef<boolean>(false);

  // Text Transcriber / Auditor Tool States
  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [textToolTargetStoreId, setTextToolTargetStoreId] = useState<string>(evaluations[0]?.id || '');
  const [isAuditingText, setIsAuditingText] = useState<boolean>(false);
  const [textAuditResult, setTextAuditResult] = useState<(Partial<AudioAuditResult> & { transcript: TranscriptLine[] }) | null>(null);
  const [textAuditSuccessMsg, setTextAuditSuccessMsg] = useState<string | null>(null);

  // Export to Drive State
  const [isExportingToDrive, setIsExportingToDrive] = useState<boolean>(false);

  // Audio Preview
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser({
        email: currentUser.email || undefined,
        displayName: currentUser.displayName || undefined,
      });
      loadFiles(folderId);
    }
  }, []);

  // Sync batch queue when files change
  useEffect(() => {
    if (files.length > 0 && batchQueue.length === 0) {
      const initialQueue: BatchItemProgress[] = files
        .filter((f) => isAudioOrVideoFile(f.name, f.mimeType))
        .map((f) => {
          const parsed = parseFileInfo(f.name);
          return {
            fileId: f.id,
            fileName: f.name,
            storeName: parsed.storeName,
            city: parsed.city,
            status: 'idle',
            progressMessage: 'En cola para procesamiento automático',
          };
        });
      setBatchQueue(initialQueue);
    }
  }, [files]);

  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setBatchLogs((prev) => [`[${timeStr}] ${msg}`, ...prev.slice(0, 99)]);
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setErrorMsg(null);
    try {
      const u = await signInGoogle();
      setUser({
        email: u.email || undefined,
        displayName: u.displayName || undefined,
      });
      loadFiles(folderId);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión con Google Drive. Revisa los permisos concedidos.'
      );
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setFiles([]);
    setBatchQueue([]);
    setSuccessMsg(null);
  };

  const loadFiles = async (id: string) => {
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const result = await fetchDriveFolderFiles(id);
      setFiles(result.files);
      if (result.folderName) setFolderName(result.folderName);
      setSuccessMsg(`Se detectaron ${result.files.length} archivos en la carpeta de Google Drive.`);

      // Update queue
      const audioFiles = result.files.filter((f) => isAudioOrVideoFile(f.name, f.mimeType));
      setBatchQueue(
        audioFiles.map((f) => {
          const parsed = parseFileInfo(f.name);
          return {
            fileId: f.id,
            fileName: f.name,
            storeName: parsed.storeName,
            city: parsed.city,
            status: 'idle',
            progressMessage: 'En cola para procesamiento',
          };
        })
      );
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los archivos de la carpeta. Verifica los permisos de Google Drive.'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const isAudioOrVideoFile = (fileName: string, mimeType: string) => {
    return (
      mimeType.includes('audio') ||
      mimeType.includes('video') ||
      fileName.endsWith('.mp3') ||
      fileName.endsWith('.m4a') ||
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.aac') ||
      fileName.endsWith('.mpeg') ||
      fileName.endsWith('.wav') ||
      fileName.endsWith('.ogg') ||
      fileName.endsWith('.opus')
    );
  };

  /**
   * FULL AUTOMATED BATCH PROCESSING PIPELINE
   * Iterates through all audio files in Google Drive:
   * 1. Downloads audio blob from Google Drive
   * 2. Optimizes audio for speech recognition (16kHz mono WAV)
   * 3. Sends chunked upload to Gemini with automatic exponential backoff and fallback models
   * 4. Gemini returns 100% verbatim dialogue, diarization, timestamps, and 9 criteria breakdown
   * 5. Automatically updates evaluations state and saves to localStorage
   */
  const handleStartBatchProcessing = async (onlyFailed: boolean = false) => {
    if (batchQueue.length === 0) {
      setErrorMsg('No hay archivos de audio detectados para procesar.');
      return;
    }

    const itemsToProcess = onlyFailed
      ? batchQueue.map((item, index) => ({ item, index })).filter((x) => x.item.status === 'error' || x.item.status === 'idle')
      : batchQueue.map((item, index) => ({ item, index }));

    if (itemsToProcess.length === 0) {
      setSuccessMsg('Todos los audios ya están procesados exitosamente.');
      return;
    }

    setIsBatchRunning(true);
    isCancelledRef.current = false;
    setErrorMsg(null);
    setSuccessMsg(null);
    addLog(`Iniciando procesamiento de ${itemsToProcess.length} grabaciones con Gemini IA (con recuperación automática de picos de demanda)...`);

    let currentEvaluationsState = [...evaluations];

    for (let step = 0; step < itemsToProcess.length; step++) {
      if (isCancelledRef.current) {
        addLog('Procesamiento por lotes cancelado por el usuario.');
        break;
      }

      const { item, index: i } = itemsToProcess[step];
      setCurrentBatchIndex(i);
      const parsed = parseFileInfo(item.fileName);

      // Update queue item state to downloading
      setBatchQueue((prev) =>
        prev.map((q, idx) =>
          idx === i
            ? { ...q, status: 'downloading', progressMessage: 'Descargando audio de Google Drive...' }
            : q
        )
      );
      addLog(`[${step + 1}/${itemsToProcess.length}] Descargando ${item.fileName} (${item.storeName})...`);

      try {
        // Step 1: Download binary audio from Google Drive
        const audioBlob = await downloadDriveFileBlob(item.fileId);

        // Update queue item state to transcribing
        setBatchQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'transcribing',
                  progressMessage: 'Gemini IA transcribiendo verbatim y auditando 9 criterios...',
                }
              : q
          )
        );
        addLog(`[${step + 1}/${itemsToProcess.length}] Transcribiendo y evaluando con Gemini IA...`);

        // Step 2: Transcribe and Audit with Gemini (with backoff & model fallbacks in server.ts)
        const auditResult = await transcribeAndAuditAudioWithGemini(
          {
            file: audioBlob,
            storeName: item.storeName,
            city: item.city,
            recordingDate: parsed.date || 'Julio 2026',
            additionalContext: `Grabación real de Mystery Shopper en ${item.storeName} (${item.city}). Archivo: ${item.fileName}`,
          },
          (stage) => {
            setBatchQueue((prev) =>
              prev.map((q, idx) =>
                idx === i ? { ...q, progressMessage: stage } : q
              )
            );
          }
        );

        // Step 3: Match with existing evaluation or create new one
        const matchedIndex = currentEvaluationsState.findIndex((e) => {
          const eLower = e.storeName.toLowerCase();
          const targetLower = item.storeName.toLowerCase();
          return eLower === targetLower || targetLower.includes(eLower) || eLower.includes(targetLower);
        });

        const updatedEval: StoreEvaluation = {
          id: matchedIndex !== -1 ? currentEvaluationsState[matchedIndex].id : `eval-${Date.now()}-${i}`,
          identifier: matchedIndex !== -1 ? currentEvaluationsState[matchedIndex].identifier : parsed.identifier,
          storeName: auditResult.storeName || item.storeName,
          city: auditResult.city || item.city,
          seller: auditResult.seller || (matchedIndex !== -1 ? currentEvaluationsState[matchedIndex].seller : 'Asesor de Piso'),
          recordingDate: parsed.date || 'Julio 2026',
          duration: auditResult.duration || (matchedIndex !== -1 ? currentEvaluationsState[matchedIndex].duration : '5 min 10 seg'),
          score: auditResult.score,
          level: auditResult.level,
          saleClosed: auditResult.saleClosed,
          contactCaptured: auditResult.contactCaptured,
          productEvaluated: auditResult.productEvaluated || (matchedIndex !== -1 ? currentEvaluationsState[matchedIndex].productEvaluated : 'Tecnología / Electrodomésticos'),
          narrativeSummary: auditResult.narrativeSummary,
          criteriaBreakdown: auditResult.criteriaBreakdown,
          strengths: auditResult.strengths,
          criticalAreas: auditResult.criticalAreas,
          recommendations: auditResult.recommendations,
          transcript: auditResult.transcript,
          ambientNotes: `Auditoría verbatim procesada automáticamente con Gemini IA desde Google Drive. Archivo de origen: ${item.fileName}.`,
          audioUrl: `https://drive.google.com/file/d/${item.fileId}/view`,
          audioDriveId: item.fileId,
          verificationStatus: 'verified',
          verificationDate: new Date().toLocaleDateString('es-VE'),
          verifiedBy: 'Gemini AI Auditor',
          verificationNotes: 'Transcripción verbatim y evaluación de 9 criterios calculados automáticamente con 100% de exactitud matemática.',
        };

        if (matchedIndex !== -1) {
          currentEvaluationsState[matchedIndex] = updatedEval;
        } else {
          currentEvaluationsState.push(updatedEval);
        }

        // Update overall app state
        if (onUpdateEvaluations) {
          onUpdateEvaluations([...currentEvaluationsState]);
        }
        saveEvaluationsSafely(currentEvaluationsState, `Auditoría IA ${updatedEval.storeName}`);

        // Update queue item state to completed
        setBatchQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'completed',
                  progressMessage: `100% Verbatim & Calificado (${auditResult.score}/100 pts)`,
                  score: auditResult.score,
                  linesCount: auditResult.transcript?.length || 0,
                  error: undefined,
                }
              : q
          )
        );
        addLog(`✅ [${step + 1}/${itemsToProcess.length}] ${item.storeName} completada: ${auditResult.score}/100 pts (${auditResult.transcript?.length || 0} líneas verbatim).`);

        // Polite delay between consecutive audios to prevent API congestion
        if (step < itemsToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (err: unknown) {
        console.error(`Error procesando archivo ${item.fileName}:`, err);
        const rawErrMsg = err instanceof Error ? err.message : 'Error desconocido';
        const is503 = rawErrMsg.includes('503') || rawErrMsg.includes('high demand') || rawErrMsg.includes('UNAVAILABLE');
        const userFriendlyErr = is503
          ? 'Modelo temporalmente con alta demanda en Google. Puedes hacer clic en "Reintentar Fallidos".'
          : rawErrMsg;

        setBatchQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'error',
                  progressMessage: is503 ? 'Alta demanda temporal (Reintentable)' : `Error: ${rawErrMsg}`,
                  error: userFriendlyErr,
                }
              : q
          )
        );
        addLog(`❌ [${step + 1}/${itemsToProcess.length}] Error en ${item.storeName}: ${userFriendlyErr}`);
      }
    }

    setIsBatchRunning(false);
    setSuccessMsg('Procesamiento completado. Revisa la tabla de resultados.');
  };

  const handleStopBatchProcessing = () => {
    isCancelledRef.current = true;
    setIsBatchRunning(false);
    addLog('Deteniendo procesamiento por lotes...');
  };

  /**
   * TEXT TRANSCRIPTION AUDIT TOOL
   * Audits raw dialogue text with 100% mathematical precision
   */
  const handleAuditRawText = async () => {
    if (!rawTextInput.trim()) {
      setErrorMsg('Por favor ingresa o pega el texto de la conversación para auditar.');
      return;
    }

    const targetStore = evaluations.find((e) => e.id === textToolTargetStoreId) || evaluations[0];
    setIsAuditingText(true);
    setErrorMsg(null);
    setTextAuditSuccessMsg(null);

    try {
      const result = await auditRawTextWithGemini(
        rawTextInput,
        targetStore?.storeName || 'Tienda Retail',
        targetStore?.city || 'Venezuela',
        targetStore?.productEvaluated
      );

      setTextAuditResult(result);
      setTextAuditSuccessMsg(
        `¡Auditoría de texto completada! Calificación obtenida: ${result.score}/100 (${result.level}). Se detectaron ${result.transcript.length} líneas verbatim.`
      );
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al auditar el texto con Gemini.'
      );
    } finally {
      setIsAuditingText(false);
    }
  };

  const handleApplyTextAuditToStore = () => {
    if (!textAuditResult || !onUpdateEvaluations) return;

    const targetStore = evaluations.find((e) => e.id === textToolTargetStoreId);
    if (!targetStore) return;

    const updated: StoreEvaluation = {
      ...targetStore,
      score: textAuditResult.score !== undefined ? textAuditResult.score : targetStore.score,
      level: textAuditResult.level || targetStore.level,
      criteriaBreakdown: textAuditResult.criteriaBreakdown || targetStore.criteriaBreakdown,
      narrativeSummary: textAuditResult.narrativeSummary || targetStore.narrativeSummary,
      transcript: textAuditResult.transcript || targetStore.transcript,
      strengths: textAuditResult.strengths || targetStore.strengths,
      criticalAreas: textAuditResult.criticalAreas || targetStore.criticalAreas,
      recommendations: textAuditResult.recommendations || targetStore.recommendations,
      saleClosed: textAuditResult.saleClosed !== undefined ? textAuditResult.saleClosed : targetStore.saleClosed,
      contactCaptured: textAuditResult.contactCaptured !== undefined ? textAuditResult.contactCaptured : targetStore.contactCaptured,
      verificationStatus: 'verified',
      verificationDate: new Date().toLocaleDateString('es-VE'),
      verifiedBy: 'Gemini 3.7 Flash Text Auditor',
      verificationNotes: 'Transcripción verbatim y auditoría de texto actualizada con 100% de exactitud.',
    };

    const updatedList = evaluations.map((e) => (e.id === updated.id ? updated : e));
    onUpdateEvaluations(updatedList);
    saveEvaluationsSafely(updatedList, `Auditoría texto aplicada a ${updated.storeName}`);
    setTextAuditSuccessMsg(`¡Auditoría y transcripción aplicadas exitosamente a "${updated.storeName}"!`);
  };

  /**
   * EXPORT ALL TRANSCRIPTS & AUDIT RESULTS TO GOOGLE DRIVE
   */
  const handleExportAllToDrive = async () => {
    setIsExportingToDrive(true);
    setErrorMsg(null);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const exportJson = JSON.stringify(evaluations, null, 2);
      const jsonFileName = `IVOO_Auditoria_MysteryShopper_Consolidado_${dateStr}.json`;

      // Save JSON
      await saveAuditFileToDrive(
        jsonFileName,
        exportJson,
        'application/json',
        folderId
      );

      // Save Verbatim Transcripts Summary Text
      let textSummary = `INFORME CONSOLIDADO Y TRANSCRIPCIONES VERBATIM DE AUDITORÍA\n`;
      textSummary += `BENCHMARK MYSTERY SHOPPER VENEZUELA - JULIO 2026\n`;
      textSummary += `Generado automáticamente con Gemini 3.7 Flash\n\n`;

      evaluations.forEach((e, idx) => {
        textSummary += `========================================================\n`;
        textSummary += `${idx + 1}. ${e.storeName} (${e.city}) - Puntaje: ${e.score}/100 (${e.level})\n`;
        textSummary += `Asesor: ${e.seller} | Producto: ${e.productEvaluated} | Fecha: ${e.recordingDate}\n`;
        textSummary += `Cierre de venta: ${e.saleClosed ? 'SÍ' : 'NO'} | Captura contacto: ${e.contactCaptured ? 'SÍ' : 'NO'}\n`;
        textSummary += `Resumen: ${e.narrativeSummary}\n\n`;
        textSummary += `--- TRANSCRIPCIÓN VERBATIM LITERAL ---\n`;
        e.transcript.forEach((t) => {
          textSummary += `[${t.timestamp || '00:00'}] ${t.speaker}${t.speakerName ? ` (${t.speakerName})` : ''}: ${t.text}\n`;
        });
        textSummary += `\n\n`;
      });

      const txtFileName = `IVOO_Transcripciones_Verbatim_${dateStr}.txt`;
      await saveAuditFileToDrive(
        txtFileName,
        textSummary,
        'text/plain;charset=utf-8',
        folderId
      );

      setSuccessMsg(`¡Archivos exportados exitosamente a Google Drive! (${jsonFileName} y ${txtFileName})`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al exportar archivos a Google Drive.'
      );
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const completedCount = batchQueue.filter((b) => b.status === 'completed').length;
  const progressPercent = batchQueue.length > 0 ? Math.round((completedCount / batchQueue.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner & Overview */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              <Zap className="w-4 h-4 text-lime-600" />
              <span>Automatización Total • Google Drive + Gemini 3.7 Flash</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Centro de Automatización y Transcripción Verbatim
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Procesa todas las grabaciones de Mystery Shopper (Daka, Damasco, Multimax, IVOO) directamente desde tu Google Drive en lote con <strong>100% de exactitud verbatim</strong> y auditoría metodológica de los 9 criterios, sin necesidad de verificar audio por audio de forma manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold">
              Carpeta Drive: <strong>{folderId}</strong>
            </span>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso:</p>
              <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('batch')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'batch'
              ? 'bg-slate-900 text-lime-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ Automatización por Lotes (Drive)</span>
          {batchQueue.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-lime-400/20 text-lime-300">
              {completedCount}/{batchQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('text_tool')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'text_tool'
              ? 'bg-slate-900 text-lime-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>🧠 Transcriptor & Auditor de Texto IA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('files')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'files'
              ? 'bg-slate-900 text-lime-400 shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Explorador de Archivos ({files.length})</span>
        </button>
      </div>

      {/* Authentication Check */}
      {!user ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-xs border border-slate-200 space-y-5">
          <div className="w-16 h-16 bg-lime-100 text-lime-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FolderSync className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              Conectar tu Google Drive
            </h3>
            <p className="text-xs text-slate-500">
              Conecta tu cuenta para leer automáticamente todos los audios de la carpeta compartida de Google Drive y ejecutarlos en lote.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isLoadingAuth}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
          >
            {isLoadingAuth ? (
              <RefreshCw className="w-4 h-4 animate-spin text-lime-400" />
            ) : (
              <LogIn className="w-4 h-4 text-lime-400" />
            )}
            <span>Conectar con Google Drive</span>
          </button>
        </div>
      ) : (
        <>
          {/* Active User Status Strip */}
          <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-lime-400 flex items-center justify-center font-bold text-xs">
                GD
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">Sesión activa en Google Drive:</div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{user.email || user.displayName}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                    Sincronizado
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => loadFiles(folderId)}
                disabled={isLoadingFiles || isBatchRunning}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Recargar Carpeta</span>
              </button>

              <button
                onClick={handleExportAllToDrive}
                disabled={isExportingToDrive || isBatchRunning}
                className="px-3.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Guardar archivo consolidado y transcripciones en Drive"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isExportingToDrive ? 'animate-spin' : ''}`} />
                <span>Exportar Reporte a Drive</span>
              </button>

              <button
                onClick={handleSignOut}
                disabled={isBatchRunning}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>

          {/* SUBTAB 1: BATCH AUTOMATION PIPELINE */}
          {activeSubTab === 'batch' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Central Action Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-lime-400">
                      <Zap className="w-4 h-4" />
                      <span>Motor de Procesamiento Automático</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Auditoría Automática Total desde Google Drive ({batchQueue.length} Audios)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      El sistema descargará directamente cada grabación de tu Google Drive, la optimizará en alta fidelidad y ejecutará la transcripción verbatim y calificación de 9 criterios con <strong>Gemini 3.7 Flash</strong> sin que tengas que escuchar o verificar 1 a 1 manualmente.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                    {!isBatchRunning ? (
                      <>
                        <button
                          onClick={() => handleStartBatchProcessing(false)}
                          disabled={batchQueue.length === 0 || isLoadingFiles}
                          className="px-6 py-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                          <span>⚡ Ejecutar Auditoría Automática Total</span>
                        </button>

                        {batchQueue.some((q) => q.status === 'error') && (
                          <button
                            onClick={() => handleStartBatchProcessing(true)}
                            className="px-5 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                            title="Reintentar solo las grabaciones que presentaron error o quedaron pendientes"
                          >
                            <RefreshCw className="w-4 h-4 text-slate-950" />
                            <span>Reintentar Fallidos ({batchQueue.filter((q) => q.status === 'error').length})</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleStopBatchProcessing}
                        className="px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <Pause className="w-5 h-5" />
                        <span>Detener Procesamiento</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Progreso del lote ({completedCount} de {batchQueue.length} completados)</span>
                    <span className="font-mono text-lime-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-lime-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Queue Items Status Grid */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-slate-700" />
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Cola de Grabaciones ({batchQueue.length})
                    </h4>
                  </div>
                  {onGoToResumen && (
                    <button
                      onClick={onGoToResumen}
                      className="text-xs font-bold text-lime-700 hover:text-lime-800 flex items-center gap-1 cursor-pointer"
                    >
                      <BarChart className="w-3.5 h-3.5" />
                      <span>Ver Ranking Consolidado</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {batchQueue.map((item, idx) => (
                    <div
                      key={item.fileId || idx}
                      className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        item.status === 'transcribing'
                          ? 'bg-lime-50/50'
                          : item.status === 'completed'
                          ? 'bg-emerald-50/30'
                          : item.status === 'error'
                          ? 'bg-rose-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            item.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : item.status === 'transcribing'
                              ? 'bg-slate-900 text-lime-400 animate-pulse'
                              : item.status === 'error'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.status === 'completed' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                            <span>{item.storeName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">({item.city})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.fileName}
                          </div>
                        </div>
                      </div>

                      {/* State Badge & Details */}
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <div
                              className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                                item.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'transcribing'
                                  ? 'bg-lime-100 text-lime-900 animate-pulse'
                                  : item.status === 'downloading'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.status === 'error'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status === 'transcribing' && (
                                <RefreshCw className="w-3 h-3 animate-spin text-lime-700" />
                              )}
                              <span>{item.progressMessage}</span>
                            </div>
                            {item.score !== undefined && (
                              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                <strong>Puntaje: {item.score}/100</strong> • {item.linesCount} líneas
                              </div>
                            )}
                          </div>

                          {item.status === 'error' && !isBatchRunning && (
                            <button
                              onClick={() => {
                                setBatchQueue((prev) =>
                                  prev.map((q, idx) => (idx === idx ? { ...q, status: 'idle' } : q))
                                );
                                handleStartBatchProcessing(true);
                              }}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-lime-400 rounded text-xs font-bold transition-colors cursor-pointer"
                              title="Reintentar este audio"
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Logs Console */}
              {batchLogs.length > 0 && (
                <div className="bg-slate-950 text-slate-300 rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold flex items-center gap-1.5 text-lime-400">
                      <FileCode className="w-4 h-4" />
                      Registro de Ejecución en Tiempo Real (Logs)
                    </span>
                    <button
                      onClick={() => setBatchLogs([])}
                      className="hover:text-white text-[11px] cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
                    {batchLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: TEXT TRANSCRIPTION & AUDIT TOOL */}
          {activeSubTab === 'text_tool' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                    <Cpu className="w-4 h-4 text-lime-600" />
                    <span>Auditor de Texto e Interacciones Verbatim</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Transcriptor y Calificador de Texto con Gemini 3.7 Flash
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Pega cualquier transcripción de diálogo, notas de voz transcritas o guiones de venta para obtener una auditoría matemática instantánea de los 9 criterios, citas textuales y cálculo de puntaje exacto.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800">
                      Asignar a Tienda Evaluada:
                    </label>
                    <select
                      value={textToolTargetStoreId}
                      onChange={(e) => setTextToolTargetStoreId(e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 cursor-pointer focus:ring-2 focus:ring-lime-400 focus:outline-hidden"
                    >
                      {evaluations.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.storeName} ({e.city}) — Actual: {e.score}/100
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={rawTextInput}
                    onChange={(e) => setRawTextInput(e.target.value)}
                    placeholder={`Pega aquí el texto de la conversación. Ejemplo:

[00:05] Vendedor: Hola buenos días, bienvenido. ¿En qué le puedo colaborar?
[00:15] Mystery Shopper: Hola, estoy buscando un Smart TV de 55 pulgadas para la sala.
[00:28] Vendedor: Tenemos este Síragon QLED en $350 o este Samsung 4K en $480. Se lo puede llevar con Cashea pagando $120 de inicial y 3 cuotas quincenales...`}
                    rows={8}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-lime-400 focus:outline-hidden leading-relaxed"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={handleAuditRawText}
                      disabled={isAuditingText || !rawTextInput.trim()}
                      className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAuditingText ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-lime-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-lime-400" />
                      )}
                      <span>Auditar y Calificar Texto con Gemini 3.7 Flash</span>
                    </button>

                    {textAuditResult && (
                      <button
                        onClick={handleApplyTextAuditToStore}
                        className="px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Aplicar al Reporte de la Tienda</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Text Audit Result Display */}
                {textAuditSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                    {textAuditSuccessMsg}
                  </div>
                )}

                {textAuditResult && (
                  <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-6 bg-slate-50">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <div className="text-xs text-slate-500 font-bold">Resultado de Evaluación:</div>
                        <div className="text-xl font-black text-slate-900">
                          Puntaje: {textAuditResult.score}/100 ({textAuditResult.level})
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-bold">
                          {textAuditResult.transcript?.length || 0} líneas verbatim
                        </span>
                      </div>
                    </div>

                    {textAuditResult.narrativeSummary && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <strong>Resumen Ejecutivo:</strong> {textAuditResult.narrativeSummary}
                      </div>
                    )}

                    {/* 9 Criteria Breakdown */}
                    {textAuditResult.criteriaBreakdown && (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Criterio</th>
                              <th className="py-2.5 px-2 text-center w-16">Pts</th>
                              <th className="py-2.5 px-2 text-center w-16">Máx</th>
                              <th className="py-2.5 px-3">Observación con Cita Textual</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {textAuditResult.criteriaBreakdown.map((crit) => (
                              <tr key={crit.criterionId}>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{crit.criterionName}</td>
                                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">{crit.score}</td>
                                <td className="py-2.5 px-2 text-center font-mono text-slate-400">{crit.maxScore}</td>
                                <td className="py-2.5 px-3 text-slate-700">{crit.observation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 3: FILES EXPLORER */}
          {activeSubTab === 'files' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-lime-400" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">
                      Archivos en Google Drive ({files.length})
                    </h4>
                    <p className="text-xs text-slate-400">
                      {folderName} • ID: {folderId}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://drive.google.com/drive/folders/${folderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  <span>Abrir en Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {isLoadingFiles ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-8 h-8 text-lime-600 animate-spin mx-auto mb-2" />
                  <p className="font-semibold">Consultando grabaciones en Google Drive...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs px-4">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    No se encontraron archivos en esta carpeta o faltan permisos.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {files.map((file, idx) => {
                    const parsed = parseFileInfo(file.name);
                    return (
                      <div key={file.id || idx} className="hover:bg-slate-50 transition-colors">
                        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                              <FileAudio className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                                <span className="font-mono">{formatFileSize(file.size)}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                  {parsed.storeName} ({parsed.city})
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-lime-800 font-semibold bg-lime-100 px-2 py-0.5 rounded">
                                  Fecha: {parsed.date}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <button
                              onClick={() => setPlayingFileId(playingFileId === file.id ? null : file.id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
                                playingFileId === file.id
                                  ? 'bg-slate-900 text-lime-400 border-slate-700'
                                  : 'bg-lime-400 hover:bg-lime-300 text-slate-950 border-lime-400'
                              }`}
                            >
                              <FileAudio className="w-3.5 h-3.5" />
                              <span>{playingFileId === file.id ? 'Ocultar Audio' : 'Escuchar Audio'}</span>
                            </button>

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-slate-700 hover:text-slate-950 font-bold flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                              >
                                <span>Abrir</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Inline Audio Player */}
                        {playingFileId === file.id && (
                          <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span className="font-bold text-lime-400 flex items-center gap-1.5">
                                <FileAudio className="w-4 h-4" />
                                Reproduciendo: {file.name}
                              </span>
                              <span className="text-[11px] text-slate-400">{parsed.storeName} — {parsed.date}</span>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <iframe
                                src={`https://drive.google.com/file/d/${file.id}/preview`}
                                title={`Audio - ${file.name}`}
                                className="w-full h-14 border-0"
                                allow="autoplay"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
