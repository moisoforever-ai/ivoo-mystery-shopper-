import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StoreEvaluation,
  TranscriptLine,
  CriterionScore,
  AudioAuditResult,
  VerificationStatus,
  DriveFileItem,
  BrandType,
} from '../types';
import { IVOO_CRITERIA, getCriterionStatus, getStatusColorClasses, getLevelBadgeClasses } from '../data/criteria';
import { transcribeAndAuditAudioWithGemini, regradeTranscriptWithGemini } from '../services/geminiAudioService';
import { parseAudioFilename, normalizeEvaluation } from '../utils/evaluationHelpers';
import { IVOO_DRIVE_FOLDER_ID, DEFAULT_DRIVE_FILES } from '../services/googleDriveService';
import { resetToFactoryData } from '../services/storageManager';
import { ConfirmModal } from './ConfirmModal';
import {
  Play,
  Pause,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Store,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Check,
  Save,
  Mic,
  Search,
  Filter,
  ShieldCheck,
  Volume2,
  FileText,
  Radio,
  FileAudio,
  Download,
  Flame,
  ArrowRight,
  ListOrdered,
  RefreshCw,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

interface AudioAuditorHubProps {
  evaluations: StoreEvaluation[];
  selectedStoreId?: string;
  onSelectStore: (storeId: string) => void;
  onUpdateEvaluation: (updated: StoreEvaluation) => void;
  onUpdateEvaluationsList?: (updatedList: StoreEvaluation[]) => void;
  onGoToConsolidated?: () => void;
  onGoToFicha?: (storeId: string) => void;
}

interface LoadedAudioItem {
  id: string;
  name: string;
  storeName: string;
  brand: BrandType;
  city: string;
  recordingDate: string;
  file?: File;
  objectUrl?: string;
  driveLink?: string;
  status: 'ready' | 'processing' | 'audited' | 'error';
  progressStage?: string;
  duration?: string;
  score?: number;
  auditResult?: AudioAuditResult;
  error?: string;
}

export const AudioAuditorHub: React.FC<AudioAuditorHubProps> = ({
  evaluations,
  selectedStoreId,
  onSelectStore,
  onUpdateEvaluation,
  onUpdateEvaluationsList,
  onGoToConsolidated,
  onGoToFicha,
}) => {
  // Brand filter
  const [brandFilter, setBrandFilter] = useState<'ALL' | 'IVOO' | 'DAKA' | 'DAMASCO' | 'MULTIMAX'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoAuditOnDrop, setAutoAuditOnDrop] = useState(true);

  // In-memory queue of loaded audio items
  const [loadedAudios, setLoadedAudios] = useState<LoadedAudioItem[]>(() => {
    // Start empty — DEFAULT_DRIVE_FILES was decorative sample data with no real audio behind
    // it. A user's own uploaded/attached files are the only legitimate way this list fills up.
    return [];
  });

  // Active audio item being played/audited
  const [activeAudioId, setActiveAudioId] = useState<string>(() => {
    return loadedAudios[0]?.id || '';
  });

  // In-app confirmation dialog (sandbox-safe, replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    icon?: 'trash' | 'warning' | 'restore';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const activeItem = useMemo(() => {
    return loadedAudios.find((a) => a.id === activeAudioId) || loadedAudios[0];
  }, [loadedAudios, activeAudioId]);

  // Current matched evaluation in store
  const currentEvaluation = useMemo(() => {
    if (!activeItem) return evaluations[0];
    const match = evaluations.find(
      (e) =>
        e.id === activeItem.id ||
        e.audioDriveId === activeItem.id ||
        e.storeName === activeItem.storeName
    );
    return match || evaluations.find((e) => e.id === selectedStoreId) || evaluations[0];
  }, [evaluations, activeItem, selectedStoreId]);

  // Audio player states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const singleItemFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetAudioIdForAttach, setTargetAudioIdForAttach] = useState<string | null>(null);

  // Active view tab inside audit studio
  const [activeStudioTab, setActiveStudioTab] = useState<'transcripcion' | 'criterios' | 'diagnostico'>('transcripcion');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<'ALL' | 'Mystery Shopper' | 'Vendedor'>('ALL');

  // Editing state for active scorecard
  const [localScores, setLocalScores] = useState<CriterionScore[]>(
    currentEvaluation?.criteriaBreakdown || []
  );
  const [localTranscript, setLocalTranscript] = useState<TranscriptLine[]>(
    currentEvaluation?.transcript || []
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [batchWarningMsg, setBatchWarningMsg] = useState<string | null>(null);
  const [isAuditingActive, setIsAuditingActive] = useState(false);
  const [auditProgressStage, setAuditProgressStage] = useState('');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Synchronize when active evaluation changes
  useEffect(() => {
    if (currentEvaluation) {
      setLocalScores(currentEvaluation.criteriaBreakdown || []);
      setLocalTranscript(currentEvaluation.transcript || []);
    }
  }, [currentEvaluation?.id]);

  // Reset playback when switching active audio
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (activeItem?.objectUrl) {
        audioRef.current.src = activeItem.objectUrl;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [activeItem?.id, activeItem?.objectUrl]);

  // Handle files dropped or uploaded
  const handleFilesAdded = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: LoadedAudioItem[] = [];

    for (const file of fileArray) {
      const parsed = parseAudioFilename(file.name);
      let objectUrl: string | undefined = undefined;
      try {
        objectUrl = URL.createObjectURL(file);
      } catch (err) {
        console.warn('Could not create Object URL for file:', file.name, err);
      }

      const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const item: LoadedAudioItem = {
        id,
        name: file.name,
        storeName: parsed.storeName,
        brand: parsed.brand,
        city: parsed.city,
        recordingDate: parsed.recordingDate,
        file,
        objectUrl,
        status: 'ready',
        duration: '12:30',
      };
      newItems.push(item);
    }

    setLoadedAudios((prev) => [...newItems, ...prev]);

    // Select the first uploaded file immediately
    if (newItems.length > 0) {
      const first = newItems[0];
      setActiveAudioId(first.id);
      setBrandFilter('ALL'); // Reset filter so the newly added file is immediately visible

      // If auto-audit is active, run Gemini audit on the first file immediately
      if (autoAuditOnDrop && first.file) {
        auditSingleItem(first);
      }
    }
  };

  // Trigger file attachment for a specific item in the queue
  const handleTriggerAttachToItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetAudioIdForAttach(id);
    if (singleItemFileInputRef.current) {
      singleItemFileInputRef.current.value = '';
      singleItemFileInputRef.current.click();
    }
  };

  // Handle single file selected for a specific item
  const handleSingleItemFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAudioIdForAttach) return;

    let objectUrl: string | undefined = undefined;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (err) {
      console.warn('Could not create Object URL for single file:', file.name, err);
    }

    setLoadedAudios((prev) =>
      prev.map((item) =>
        item.id === targetAudioIdForAttach
          ? {
              ...item,
              file,
              objectUrl,
              name: file.name,
              status: 'ready',
            }
          : item
      )
    );

    setActiveAudioId(targetAudioIdForAttach);
    setSaveSuccessMsg(`Nota de voz "${file.name}" vinculada. Lista para auditar con Gemini.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    e.target.value = '';
  };

  // Remove an audio from the loaded list and sync with evaluations
  const handleRemoveAudio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToRemove = loadedAudios.find((a) => a.id === id);
    if (!itemToRemove) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Grabación',
      message: `¿Deseas eliminar "${itemToRemove.storeName}" de la lista y del reporte comparativo?`,
      confirmText: 'Sí, Eliminar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setLoadedAudios((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          if (activeAudioId === id && filtered.length > 0) {
            setActiveAudioId(filtered[0].id);
          } else if (filtered.length === 0) {
            setActiveAudioId('');
          }
          return filtered;
        });

        // Also remove matching evaluation if present
        if (onUpdateEvaluationsList) {
          const updatedEvals = evaluations.filter(
            (evalItem) =>
              evalItem.id !== id &&
              evalItem.audioDriveId !== id &&
              evalItem.storeName !== itemToRemove.storeName
          );
          onUpdateEvaluationsList(updatedEvals);
        }
      },
    });
  };

  // Start fresh blank batch / clear previous evaluations
  const handleStartFreshBatch = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Iniciar Nuevo Reporte en Blanco',
      message:
        '¿Deseas vaciar las grabaciones y evaluaciones anteriores? La página quedará limpia para que el nuevo informe solo contenga los audios que subas a continuación.',
      confirmText: 'Sí, Vaciar Todo',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setLoadedAudios([]);
        setActiveAudioId('');
        if (onUpdateEvaluationsList) {
          onUpdateEvaluationsList([]);
        }
        setSaveSuccessMsg('Reporte en blanco iniciado. Arrastra o selecciona tus nuevas notas de voz para comenzar.');
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      },
    });
  };

  // Restore official evaluations from factory data
  const handleRestoreOfficialEvals = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restablecer Fichas Oficiales',
      message:
        '¿Deseas recargar las 7 evaluaciones y audios oficiales del estudio de campo de IVOO?',
      confirmText: 'Restablecer',
      variant: 'primary',
      icon: 'restore',
      onConfirm: () => {
        const factory = resetToFactoryData();
        if (onUpdateEvaluationsList) {
          onUpdateEvaluationsList(factory);
        }
        const reloadedItems: LoadedAudioItem[] = DEFAULT_DRIVE_FILES.map((df) => {
          const parsed = parseAudioFilename(df.name);
          const existingEval = factory.find(
            (e) =>
              e.audioDriveId === df.id ||
              (e.storeName.toLowerCase().includes(parsed.city.toLowerCase()) &&
                e.storeName.toLowerCase().includes(parsed.brand.toLowerCase()))
          );
          return {
            id: df.id,
            name: df.name,
            storeName: existingEval ? existingEval.storeName : parsed.storeName,
            brand: parsed.brand,
            city: parsed.city,
            recordingDate: existingEval ? existingEval.recordingDate : parsed.recordingDate,
            driveLink: df.webViewLink || `https://drive.google.com/drive/folders/${IVOO_DRIVE_FOLDER_ID}`,
            status: existingEval ? 'audited' : 'ready',
            score: existingEval?.score,
            duration: existingEval?.duration || '12:40',
          };
        });
        setLoadedAudios(reloadedItems);
        if (reloadedItems.length > 0) setActiveAudioId(reloadedItems[0].id);
        setSaveSuccessMsg('Se restauraron las evaluaciones oficiales del estudio.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      },
    });
  };

  // Run Gemini Audit on a single audio item. Returns whether it succeeded, so batch runs can
  // react to specific failure types (e.g. stop early on quota exhaustion) instead of blindly
  // continuing through the rest of the queue.
  const auditSingleItem = async (item: LoadedAudioItem): Promise<{ success: boolean; error?: string }> => {
    // Never fabricate an evaluation: without a real attached audio file there is nothing to
    // transcribe or audit. Mark it as needing attention instead of inventing a result.
    if (!item.file) {
      const error = 'Falta adjuntar el archivo de audio real. Usa "📎 Adjuntar archivo" y vuelve a auditar.';
      setLoadedAudios((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: 'error', error } : a))
      );
      return { success: false, error };
    }

    setIsAuditingActive(true);
    setAuditProgressStage('Iniciando transcripción y auditoría con IA...');

    setLoadedAudios((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: 'processing', progressStage: 'Procesando...' } : a))
    );

    try {
      const result: AudioAuditResult = await transcribeAndAuditAudioWithGemini(
        {
          file: item.file,
          storeName: item.storeName,
          city: item.city,
          recordingDate: item.recordingDate,
        },
        (stage) => {
          setAuditProgressStage(stage);
          setLoadedAudios((prev) =>
            prev.map((a) => (a.id === item.id ? { ...a, progressStage: stage } : a))
          );
        }
      );

      // Update loaded audios list
      setLoadedAudios((prev) =>
        prev.map((a) =>
          a.id === item.id
            ? {
                ...a,
                status: 'audited',
                score: result.score,
                duration: result.duration || a.duration,
                auditResult: result,
              }
            : a
        )
      );

      // Create or update store evaluation. IMPORTANT: look up the existing evaluation for THIS
      // specific item, not the outer `currentEvaluation` (which only reflects whichever item is
      // selected on screen). During a batch run, every item shares that same stale reference —
      // using it here would silently merge unrelated stores' results under the wrong ID.
      const existingEvalForItem = evaluations.find(
        (e) => e.id === item.id || e.audioDriveId === item.id || e.storeName === item.storeName
      );

      const updatedEval: StoreEvaluation = {
        id: item.id.startsWith('local_') ? item.id : (existingEvalForItem?.id || item.id),
        identifier: (existingEvalForItem?.identifier || item.brand.substring(0, 3) + '-' + item.city.substring(0, 3)).toUpperCase(),
        storeName: result.storeName || item.storeName,
        brand: item.brand,
        city: result.city || item.city,
        seller: result.seller || 'Asesor Comercial',
        recordingDate: item.recordingDate,
        duration: result.duration || '12:30',
        score: result.score,
        level: result.level,
        saleClosed: result.saleClosed,
        contactCaptured: result.contactCaptured,
        productEvaluated: result.productEvaluated || 'Electrónica / Línea Blanca',
        narrativeSummary: result.narrativeSummary,
        criteriaBreakdown: result.criteriaBreakdown,
        strengths: result.strengths || [],
        criticalAreas: result.criticalAreas || [],
        recommendations: result.recommendations || [],
        transcript: result.transcript || [],
        verificationStatus: 'ai_transcribed',
        verificationDate: new Date().toLocaleDateString('es-ES'),
        verifiedBy: 'Gemini 3.7 Flash Audio AI',
        audioDriveId: item.id,
      };

      setLocalScores(updatedEval.criteriaBreakdown);
      setLocalTranscript(updatedEval.transcript);
      onUpdateEvaluation(updatedEval);

      setSaveSuccessMsg(`¡Auditoría completada para ${item.storeName}! Calificación: ${result.score}/100`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      return { success: true };
    } catch (err: any) {
      console.error('Audit failed:', err);
      const errorMsg = err.message || 'Error al auditar';
      setLoadedAudios((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: 'error', error: errorMsg } : a))
      );
      return { success: false, error: errorMsg };
    } finally {
      setIsAuditingActive(false);
      setAuditProgressStage('');
    }
  };

  // Run batch audit on all ready files
  const handleBatchAuditAll = async () => {
    const pendingItems = loadedAudios.filter((a) => a.status === 'ready');
    if (pendingItems.length === 0) return;

    setBatchWarningMsg(null);

    // Only items with a real attached audio file can be sent to Gemini. Items without one are
    // never silently audited with fabricated data — they're flagged so the user can attach audio.
    const withFile = pendingItems.filter((a) => a.file);
    const withoutFile = pendingItems.filter((a) => !a.file);

    if (withoutFile.length > 0) {
      setLoadedAudios((prev) =>
        prev.map((a) =>
          withoutFile.some((w) => w.id === a.id)
            ? {
                ...a,
                status: 'error',
                error: 'Falta adjuntar el archivo de audio real. Usa "📎 Adjuntar archivo" y vuelve a auditar.',
              }
            : a
        )
      );
    }

    if (withFile.length > 0) {
      setBatchProgress({ current: 0, total: withFile.length });

      let stoppedEarlyForQuota = false;
      let processedCount = 0;
      const PACING_DELAY_MS = 2500; // Small gap between items to stay further under Gemini's per-minute rate limit

      for (let i = 0; i < withFile.length; i++) {
        const item = withFile[i];
        setBatchProgress({ current: i + 1, total: withFile.length });
        setActiveAudioId(item.id);
        const result = await auditSingleItem(item);
        processedCount++;

        // If Gemini's quota is exhausted, every remaining item will fail the same way. Stop
        // cleanly here instead of burning through the rest of the queue with more failures.
        const isQuotaError =
          !result.success &&
          result.error &&
          (result.error.toLowerCase().includes('cuota') || result.error.toLowerCase().includes('saturado'));

        if (isQuotaError) {
          stoppedEarlyForQuota = true;
          break;
        }

        // Give Gemini's per-minute rate limit some breathing room between items.
        if (i < withFile.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, PACING_DELAY_MS));
        }
      }

      setBatchProgress(null);

      if (stoppedEarlyForQuota) {
        const remaining = withFile.length - processedCount;
        setBatchWarningMsg(
          `Se detuvo la auditoría automática: se agotó la cuota disponible de Gemini. ` +
            `Se procesaron ${processedCount} de ${withFile.length} audios${remaining > 0 ? ` — quedan ${remaining} pendientes` : ''}. ` +
            `Espera unos minutos (o revisa tu plan de la API) y vuelve a intentar con "Auditar Todo".`
        );
        setTimeout(() => setBatchWarningMsg(null), 12000);
      }
    }

    if (withoutFile.length > 0) {
      setBatchWarningMsg(
        `${withoutFile.length} nota(s) de voz omitida(s): no tienen audio adjunto, así que no se generó ninguna calificación para ${withoutFile.length === 1 ? 'ella' : 'ellas'}. Adjunta el archivo real y vuelve a intentar.`
      );
      setTimeout(() => setBatchWarningMsg(null), 8000);
    }
  };

  // Audio Playback Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const jumpToTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered audio list
  const filteredAudios = useMemo(() => {
    return loadedAudios.filter((a) => {
      const matchesBrand = brandFilter === 'ALL' || a.brand === brandFilter;
      const matchesSearch =
        a.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [loadedAudios, brandFilter, searchTerm]);

  // Filtered transcript lines for search & speaker
  const filteredTranscript = useMemo(() => {
    return localTranscript.filter((line) => {
      const matchesSpeaker = speakerFilter === 'ALL' || line.speaker === speakerFilter;
      const matchesSearch =
        transcriptSearch === '' ||
        line.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        (line.speakerName && line.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase()));
      return matchesSpeaker && matchesSearch;
    });
  }, [localTranscript, speakerFilter, transcriptSearch]);

  // Calculate current dynamic score
  const dynamicTotalScore = useMemo(() => {
    return localScores.reduce((sum, c) => sum + (Number(c.score) || 0), 0);
  }, [localScores]);

  // Copy transcript to clipboard
  const handleCopyTranscript = () => {
    const text = localTranscript
      .map((t) => `[${t.timestamp || '00:00'}] ${t.speaker}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const pendingCount = loadedAudios.filter((a) => a.status === 'ready').length;
  const auditedCount = loadedAudios.filter((a) => a.status === 'audited').length;
  const erroredCount = loadedAudios.filter((a) => a.status === 'error').length;

  // Requeue every failed item (e.g. ones that hit Gemini's quota) back to "ready" so the next
  // "Auditar Todo" click picks them up automatically — no need to retry one by one.
  const handleRetryFailed = () => {
    setLoadedAudios((prev) =>
      prev.map((a) => (a.status === 'error' ? { ...a, status: 'ready', error: undefined } : a))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Hidden file input for multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,video/*,.opus,.ogg,.m4a,.mp3,.wav,.aac,.3gp,.amr,.flac,.wma,.mp4,.webm,*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
        }}
      />

      {/* Hidden file input for entire folder upload */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        // @ts-ignore
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
        }}
      />

      {/* 1. VISUAL STEP-BY-STEP EXPLANATION BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lime-400 text-slate-950 rounded-2xl font-black shadow-md">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Auditoría de Notas de Voz & Mystery Shopping
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 bg-lime-400/20 text-lime-400 font-mono font-bold rounded-full border border-lime-400/30">
                  IA Gemini 3.7
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Adjunta todas tus notas de voz (WhatsApp, grabaciones de celular o audios de Drive). El sistema las transcribe verbatim y evalúa los 9 criterios comerciales.
              </p>
            </div>
          </div>

          {/* Direct Drive Folder Button */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://drive.google.com/drive/folders/${IVOO_DRIVE_FOLDER_ID}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Ver Audios en Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-lime-400 text-slate-950 flex items-center justify-center font-mono font-black text-xs shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-black text-white">Adjuntar Notas de Voz</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Arrastra o selecciona tus notas de voz de WhatsApp (.opus, .ogg) o grabaciones (.m4a, .mp3, .wav).
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-400 text-slate-950 flex items-center justify-center font-mono font-black text-xs shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-black text-white">Transcripción & 9 Criterios</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                La IA transcribe cada diálogo verbatim y califica saludo, indagación, demostración, WhatsApp y cierre.
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-black text-xs shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-black text-white">Consolidado & Ranking</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Revisa la ficha interactiva de cada tienda y el resumen comparativo de IVOO vs Daka, Damasco y Multimax.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTACHMENT DROPZONE WITH CLEAR BUTTONS */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center gap-4 ${
          isDragOver
            ? 'border-lime-500 bg-lime-50/50 scale-[1.01] shadow-lg ring-4 ring-lime-400/20'
            : 'border-slate-300 hover:border-lime-500 bg-white shadow-xs'
        }`}
      >
        <div className="p-4 bg-lime-100 text-lime-700 rounded-2xl">
          <Upload className="w-8 h-8" />
        </div>

        <div className="space-y-1 max-w-lg">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Arrastra y suelta aquí todas tus notas de voz o audios a auditar
          </h2>
          <p className="text-xs text-slate-500">
            Puedes seleccionar varios archivos al mismo tiempo. Compatible con notas de voz de WhatsApp, grabadoras de audio y llamadas.
          </p>
        </div>

        {/* Action Buttons to Attach Files */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
          >
            <Mic className="w-4 h-4 text-lime-400" />
            <span>Seleccionar Múltiples Notas de Voz</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-all"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Subir Carpeta Completa</span>
          </button>

          <label className="flex items-center gap-2 px-3.5 py-2.5 bg-lime-50 rounded-xl border border-lime-200 text-xs font-bold text-lime-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAuditOnDrop}
              onChange={(e) => setAutoAuditOnDrop(e.target.checked)}
              className="w-4 h-4 accent-lime-600 rounded cursor-pointer"
            />
            <span>Auto-auditar con IA al subir</span>
          </label>
        </div>

        {/* Supported Formats Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono pt-1">
          <span className="text-slate-500 font-sans font-semibold">Formatos reconocidos:</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">WhatsApp (.opus, .ogg)</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Celular (.m4a, .3gp)</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Audio (.mp3, .wav, .aac)</span>
        </div>
      </div>

      {/* BATCH PROGRESS BAR BANNER */}
      {batchProgress && (
        <div className="p-4 bg-slate-900 border border-lime-500/50 rounded-2xl text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2 text-lime-400">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Auditando por lote con Gemini 3.7 Flash...</span>
            </span>
            <span className="font-mono">
              {batchProgress.current} de {batchProgress.total} audios procesados
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-lime-400 transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* BATCH WARNING: items skipped because they have no real audio attached */}
      {batchWarningMsg && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{batchWarningMsg}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {onGoToConsolidated && (
            <button
              onClick={onGoToConsolidated}
              className="text-xs underline font-bold text-emerald-900 hover:text-emerald-700 cursor-pointer"
            >
              Ver Resumen Comparativo General →
            </button>
          )}
        </div>
      )}

      {/* 3. MAIN WORKSPACE: LEFT LIST & RIGHT DETAILED AUDIT STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (4 cols): Queue of Voice Notes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-lime-600" />
                  <span>Bandeja de Notas de Voz ({filteredAudios.length})</span>
                </h2>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {auditedCount} auditadas • {pendingCount} pendientes
                  {erroredCount > 0 && <span className="text-rose-600"> • {erroredCount} con error</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {pendingCount > 0 && (
                  <button
                    onClick={handleBatchAuditAll}
                    disabled={isAuditingActive}
                    className="flex items-center gap-1 px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-lg text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auditar ({pendingCount})</span>
                  </button>
                )}

                {erroredCount > 0 && (
                  <button
                    onClick={handleRetryFailed}
                    disabled={isAuditingActive}
                    title="Vuelve a poner en la fila los audios que fallaron (ej. por cuota agotada) para intentarlos de nuevo"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs border border-amber-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reintentar ({erroredCount})</span>
                  </button>
                )}

                <button
                  onClick={handleStartFreshBatch}
                  title="Vaciar la lista para empezar un nuevo reporte limpio"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-lg text-xs border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Nuevo Lote</span>
                </button>
              </div>
            </div>

            {/* Quick Batch Management Toolbar */}
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
              <span className="font-semibold text-slate-600">Gestión de Lote:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartFreshBatch}
                  className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                >
                  Vaciar Todo (Reporte Limpio)
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleRestoreOfficialEvals}
                  className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Restaurar Oficiales
                </button>
              </div>
            </div>

            {/* Brand Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'IVOO', 'DAKA', 'DAMASCO', 'MULTIMAX'] as const).map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    brandFilter === brand
                      ? 'bg-slate-900 text-lime-400 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {brand === 'ALL' ? 'Todas' : brand}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar nota de voz, tienda o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-500"
              />
            </div>

            {/* Audio Item List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredAudios.map((item) => {
                const isActive = item.id === activeAudioId;
                const isItemAudited = item.status === 'audited';
                const isItemProcessing = item.status === 'processing';
                const isItemError = item.status === 'error';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveAudioId(item.id);
                      onSelectStore(item.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isActive
                        ? 'border-lime-500 bg-lime-50/60 shadow-sm ring-2 ring-lime-400/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                              item.brand === 'IVOO'
                                ? 'bg-lime-400 text-slate-950'
                                : item.brand === 'DAKA'
                                ? 'bg-amber-400 text-slate-950'
                                : item.brand === 'DAMASCO'
                                ? 'bg-rose-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {item.brand}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.storeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <p className="text-[10px] text-slate-500 truncate font-mono">
                            {item.name}
                          </p>
                          {item.file ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                              Audio listo ({item.file.size > 1024 * 1024 ? `${(item.file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(item.file.size / 1024)} KB`})
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleTriggerAttachToItem(item.id, e)}
                              className="text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-0.5 cursor-pointer"
                              title="Adjuntar el archivo de voz .m4a o .mp3 para transcribir con Gemini"
                            >
                              📎 Adjuntar archivo
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status / Score Badge */}
                      <div className="text-right shrink-0">
                        {isItemAudited ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {item.score ?? 80}/100
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold mt-0.5">Auditado</span>
                          </div>
                        ) : isItemProcessing ? (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded animate-pulse">
                            Auditando...
                          </span>
                        ) : isItemError ? (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            Error
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visible error message — so the reason is right there on screen, not
                        just a count, and not something you'd need dev tools to find. */}
                    {isItemError && item.error && (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 leading-snug">
                        {item.error}
                      </div>
                    )}

                    {/* Quick Item Actions Bar */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration || '12:40'}</span>
                        </span>
                        <span>•</span>
                        <span>{item.city}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleTriggerAttachToItem(item.id, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-all"
                          title="Adjuntar o cambiar archivo de audio"
                        >
                          <Upload className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAudioId(item.id);
                            if (!item.file) {
                              handleTriggerAttachToItem(item.id);
                            } else {
                              auditSingleItem(item);
                            }
                          }}
                          disabled={isItemProcessing}
                          className="text-xs font-bold text-lime-700 hover:text-lime-900 bg-lime-100 hover:bg-lime-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isItemAudited ? 'Re-auditar' : 'Auditar'}</span>
                        </button>

                        <button
                          onClick={(e) => handleRemoveAudio(item.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-all"
                          title="Eliminar del reporte y de la lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAudios.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay notas de voz cargadas con este filtro. Arrastra archivos arriba para comenzar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Interactive Player, Verbatim Transcript & Mystery Shopper Scorecard */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. AUDIO PLAYER CARD */}
          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                      activeItem?.brand === 'IVOO'
                        ? 'bg-lime-400 text-slate-950'
                        : 'bg-slate-800 text-lime-400 border border-slate-700'
                    }`}
                  >
                    {activeItem?.brand || 'TIENDA'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {activeItem?.storeName || 'Grabación Seleccionada'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Archivo: {activeItem?.name} • {activeItem?.city} • {activeItem?.recordingDate}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => activeItem && auditSingleItem(activeItem)}
                  disabled={isAuditingActive}
                  className="flex items-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAuditingActive ? 'Auditando...' : 'Auditar con IA'}</span>
                </button>
              </div>
            </div>

            {/* In-progress progress banner */}
            {isAuditingActive && (
              <div className="p-3.5 bg-slate-900 border border-lime-500/40 rounded-xl text-xs flex items-center gap-3 animate-pulse">
                <Sparkles className="w-5 h-5 text-lime-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-lime-400">Motor de Inteligencia Artificial Gemini 3.7</div>
                  <div className="text-slate-300 text-xs">{auditProgressStage || 'Procesando archivo de voz...'}</div>
                </div>
              </div>
            )}

            {/* Timeline scrubber */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-lime-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration || 760)}</span>
              </div>
            </div>

            {/* Player Buttons & Speed */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-lime-400 hover:bg-lime-300 text-slate-950 rounded-full font-black shadow-md transition-all cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-slate-950" />}
                </button>

                <div className="text-xs text-slate-400 font-mono hidden sm:block">
                  {isPlaying ? 'Reproduciendo audio de la visita...' : 'Pausado'}
                </div>
              </div>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (audioRef.current) audioRef.current.playbackRate = rate;
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-lime-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. TABBED AUDIT WORKSPACE (Transcripción | 9 Criterios | Diagnóstico Comercial) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Tab Header Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStudioTab('transcripcion')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
                    activeStudioTab === 'transcripcion'
                      ? 'bg-white text-slate-900 border-t-2 border-lime-500 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-lime-600" />
                  <span>Transcripción Verbatim ({localTranscript.length})</span>
                </button>

                <button
                  onClick={() => setActiveStudioTab('criterios')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
                    activeStudioTab === 'criterios'
                      ? 'bg-white text-slate-900 border-t-2 border-lime-500 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 text-lime-600" />
                  <span>Scorecard 9 Criterios ({dynamicTotalScore}/100)</span>
                </button>

                <button
                  onClick={() => setActiveStudioTab('diagnostico')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
                    activeStudioTab === 'diagnostico'
                      ? 'bg-white text-slate-900 border-t-2 border-lime-500 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-lime-600" />
                  <span>Diagnóstico & Cierre</span>
                </button>
              </div>

              {/* Score pill */}
              <div className="hidden sm:flex items-center gap-2 pb-2">
                <span className="text-xs font-mono font-black text-slate-900 bg-lime-100 px-2 py-0.5 rounded">
                  {dynamicTotalScore}/100
                </span>
              </div>
            </div>

            {/* TAB 1: TRANSCRIPCIÓN VERBATIM */}
            {activeStudioTab === 'transcripcion' && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Diálogo Verbatim Fidedigno de la Visita
                    </h4>
                    <p className="text-xs text-slate-500">
                      Haz clic en cualquier marca de tiempo [mm:ss] para reproducir ese momento exacto del audio.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyTranscript}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTranscript ? 'Copiado' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar for Transcript */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar palabras o marcas en la transcripción..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-500"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {(['ALL', 'Mystery Shopper', 'Vendedor'] as const).map((spk) => (
                      <button
                        key={spk}
                        onClick={() => setSpeakerFilter(spk)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          speakerFilter === spk
                            ? 'bg-slate-900 text-lime-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {spk === 'ALL' ? 'Todos' : spk === 'Mystery Shopper' ? 'Shopper' : 'Vendedor'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transcript Dialogues */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                  {filteredTranscript.length > 0 ? (
                    filteredTranscript.map((line, idx) => {
                      const isShopper = line.speaker === 'Mystery Shopper';
                      const isSeller = line.speaker === 'Vendedor';

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl text-xs flex items-start gap-3 transition-all ${
                            isShopper
                              ? 'bg-sky-50/80 border border-sky-100 hover:border-sky-200'
                              : isSeller
                              ? 'bg-lime-50/80 border border-lime-100 hover:border-lime-200'
                              : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {/* Timestamp button */}
                          <button
                            onClick={() => {
                              const parts = (line.timestamp || '0:00').split(':');
                              const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
                              jumpToTime(secs);
                            }}
                            className="text-[10px] font-mono font-bold text-slate-600 bg-white hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                            title="Reproducir audio desde este segundo"
                          >
                            {line.timestamp || '0:00'} ▶
                          </button>

                          {/* Speaker & text */}
                          <div className="space-y-1">
                            <span
                              className={`font-black text-[11px] ${
                                isShopper ? 'text-sky-900' : isSeller ? 'text-lime-950' : 'text-slate-700'
                              }`}
                            >
                              {line.speaker}
                              {line.speakerName ? ` (${line.speakerName})` : ''}:
                            </span>
                            <p className="text-slate-800 leading-relaxed">{line.text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay transcripción disponible. Haz clic en "Auditar con IA" para transcribir este audio.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SCORECARD 9 CRITERIOS */}
            {activeStudioTab === 'criterios' && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Evaluación de los 9 Criterios Comerciales
                    </h4>
                    <p className="text-xs text-slate-500">
                      Escala estándar de 100 puntos con observaciones justificadas.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-slate-900">
                      {dynamicTotalScore}/100
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dynamicTotalScore >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : dynamicTotalScore >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {dynamicTotalScore >= 80 ? 'Bueno' : dynamicTotalScore >= 60 ? 'Regular' : 'Deficiente'}
                    </span>
                  </div>
                </div>

                {/* Criteria List */}
                <div className="space-y-3">
                  {IVOO_CRITERIA.map((crit, idx) => {
                    const currentScoreObj = localScores.find((c) => c.criterionId === crit.id);
                    const scoreVal = currentScoreObj ? currentScoreObj.score : Math.round(crit.maxScore * 0.8);
                    const observation = currentScoreObj?.observation || crit.description;

                    return (
                      <div
                        key={crit.id}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-slate-400">
                              0{idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">{crit.name}</h4>
                          </div>

                          {/* Score Selector / Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={crit.maxScore}
                              step={1}
                              value={scoreVal}
                              onChange={(e) => {
                                const newScore = parseFloat(e.target.value);
                                setLocalScores((prev) => {
                                  const existingIndex = prev.findIndex((c) => c.criterionId === crit.id);
                                  const updatedObj: CriterionScore = {
                                    criterionId: crit.id,
                                    criterionName: crit.name,
                                    maxScore: crit.maxScore,
                                    score: newScore,
                                    observation,
                                    status: getCriterionStatus(newScore, crit.maxScore),
                                  };
                                  if (existingIndex >= 0) {
                                    const copy = [...prev];
                                    copy[existingIndex] = updatedObj;
                                    return copy;
                                  }
                                  return [...prev, updatedObj];
                                });
                              }}
                              className="w-24 sm:w-32 accent-lime-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-slate-900 min-w-[45px] text-right">
                              {scoreVal}/{crit.maxScore}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                          {observation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (currentEvaluation) {
                        const updated: StoreEvaluation = {
                          ...currentEvaluation,
                          score: dynamicTotalScore,
                          level: dynamicTotalScore >= 80 ? 'Bueno' : dynamicTotalScore >= 60 ? 'Regular' : 'Deficiente',
                          criteriaBreakdown: localScores,
                          transcript: localTranscript,
                        };
                        onUpdateEvaluation(updated);
                        setSaveSuccessMsg('¡Scorecard guardado y sincronizado correctamente!');
                        setTimeout(() => setSaveSuccessMsg(null), 3000);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-lime-400" />
                    <span>Guardar Puntuaciones de Criterios</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DIAGNÓSTICO COMERCIAL & CIERRE */}
            {activeStudioTab === 'diagnostico' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cierre de venta */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-slate-500">¿Hubo Intento de Cierre de Venta?</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                          currentEvaluation?.saleClosed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {currentEvaluation?.saleClosed ? 'SÍ, SE INTENTÓ EL CIERRE' : 'NO, CIERRE PASIVO'}
                      </span>
                    </div>
                  </div>

                  {/* Captura de WhatsApp */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-slate-500">¿Se Capturó el WhatsApp / Teléfono?</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                          currentEvaluation?.contactCaptured
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {currentEvaluation?.contactCaptured ? 'SÍ, CONTACTO CAPTURADO' : 'NO, CONTACTO OMITIDO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Resumen Ejecutivo de la Visita:</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentEvaluation?.narrativeSummary ||
                      `Visita de Mystery Shopper realizada en ${activeItem?.storeName}. Se evaluaron los protocolos de atención, explicación técnica y técnicas de cierre.`}
                  </p>
                </div>

                {/* Strengths and Critical Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Fortalezas Detectadas:</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-emerald-800 list-disc list-inside">
                      {(currentEvaluation?.strengths || ['Atención cordial y bienvenida', 'Dominio de precios']).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Áreas Críticas de Mejora:</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-amber-800 list-disc list-inside">
                      {(currentEvaluation?.criticalAreas || ['Solicitar WhatsApp para seguimiento', 'Impulsar el cierre en caja']).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* View Full Store Scorecard Button */}
                {onGoToFicha && (
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => onGoToFicha(currentEvaluation?.id || activeAudioId)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <span>Ver Ficha Completa de Tienda</span>
                      <ArrowRight className="w-4 h-4 text-lime-400" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* In-app Confirmation Modal (Sandbox safe) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
