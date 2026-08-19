import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StoreEvaluation,
  TranscriptLine,
  CriterionScore,
  AudioAuditResult,
  VerificationStatus,
} from '../types';
import { IVOO_CRITERIA, getCriterionStatus, getStatusColorClasses, getLevelBadgeClasses } from '../data/criteria';
import { transcribeAndAuditAudioWithGemini, regradeTranscriptWithGemini } from '../services/geminiAudioService';
import {
  FileAudio,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Store,
  Upload,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Check,
  Save,
  Mic,
  MicOff,
  Search,
  Filter,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Volume2,
  Tag,
  FileText,
  Sliders,
  HelpCircle,
} from 'lucide-react';

interface AudioVerificationStudioProps {
  evaluations: StoreEvaluation[];
  selectedStoreId?: string;
  onSelectStore: (storeId: string) => void;
  onUpdateEvaluation: (updated: StoreEvaluation) => void;
  onGoToConsolidated?: () => void;
}

export const AudioVerificationStudio: React.FC<AudioVerificationStudioProps> = ({
  evaluations,
  selectedStoreId,
  onSelectStore,
  onUpdateEvaluation,
  onGoToConsolidated,
}) => {
  // Current evaluation selection
  const currentStore = evaluations.find((e) => e.id === selectedStoreId) || evaluations[0];

  // Local editable state for current store
  const [transcript, setTranscript] = useState<TranscriptLine[]>(currentStore?.transcript || []);
  const [criteriaBreakdown, setCriteriaBreakdown] = useState<CriterionScore[]>(
    currentStore?.criteriaBreakdown || []
  );
  const [narrativeSummary, setNarrativeSummary] = useState(currentStore?.narrativeSummary || '');
  const [strengths, setStrengths] = useState<string[]>(currentStore?.strengths || []);
  const [criticalAreas, setCriticalAreas] = useState<string[]>(currentStore?.criticalAreas || []);
  const [recommendations, setRecommendations] = useState<string[]>(currentStore?.recommendations || []);
  const [saleClosed, setSaleClosed] = useState<boolean>(currentStore?.saleClosed || false);
  const [contactCaptured, setContactCaptured] = useState<boolean>(currentStore?.contactCaptured || false);
  const [productEvaluated, setProductEvaluated] = useState(currentStore?.productEvaluated || '');
  const [seller, setSeller] = useState(currentStore?.seller || '');
  const [duration, setDuration] = useState(currentStore?.duration || '');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    currentStore?.verificationStatus || 'preliminary'
  );
  const [verifiedBy, setVerifiedBy] = useState(currentStore?.verifiedBy || 'Auditor Líder');
  const [verificationNotes, setVerificationNotes] = useState(currentStore?.verificationNotes || '');

  // Audio Player State
  const [localAudioFile, setLocalAudioFile] = useState<File | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Analysis & Loading states
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState<boolean>(false);
  const [geminiProgressStage, setGeminiProgressStage] = useState<string>('');
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [aiAuditResult, setAiAuditResult] = useState<AudioAuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Speech Recognition (Dictation) State
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictationTranscript, setDictationTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Search filter inside transcript
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [activeRightTab, setActiveRightTab] = useState<'transcript' | 'criteria' | 'narrative'>('transcript');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reset local state when switching current store
  useEffect(() => {
    if (currentStore) {
      setTranscript(currentStore.transcript || []);
      setCriteriaBreakdown(currentStore.criteriaBreakdown || []);
      setNarrativeSummary(currentStore.narrativeSummary || '');
      setStrengths(currentStore.strengths || []);
      setCriticalAreas(currentStore.criticalAreas || []);
      setRecommendations(currentStore.recommendations || []);
      setSaleClosed(currentStore.saleClosed || false);
      setContactCaptured(currentStore.contactCaptured || false);
      setProductEvaluated(currentStore.productEvaluated || '');
      setSeller(currentStore.seller || '');
      setDuration(currentStore.duration || '');
      setVerificationStatus(currentStore.verificationStatus || 'preliminary');
      setVerifiedBy(currentStore.verifiedBy || 'Auditor Líder');
      setVerificationNotes(currentStore.verificationNotes || '');
      setAiAuditResult(null);
      setErrorMessage(null);
      setSaveSuccessMessage(null);
    }
  }, [currentStore?.id]);

  // Cleanup local ObjectURL on unmount or URL change
  useEffect(() => {
    return () => {
      if (localAudioUrl && localAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localAudioUrl);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [localAudioUrl]);

  // Audio time update handler
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + seconds));
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Local audio file selection with memory cleanup
  const handleLocalAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (localAudioUrl && localAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localAudioUrl);
      }
      setLocalAudioFile(file);
      const url = URL.createObjectURL(file);
      setLocalAudioUrl(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Drag and drop audio file with memory cleanup
  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (localAudioUrl && localAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localAudioUrl);
      }
      setLocalAudioFile(file);
      const url = URL.createObjectURL(file);
      setLocalAudioUrl(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Run Gemini Transcription & Audit on real audio file
  const handleTranscribeWithGemini = async () => {
    if (!localAudioFile) {
      setErrorMessage('Por favor selecciona o arrastra el archivo de audio real (.mp4, .mp3, .m4a, .wav) de esta tienda para que Gemini lo transcriba y audite.');
      return;
    }

    setIsTranscribingWithGemini(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setGeminiProgressStage('Iniciando ingesta del audio en Gemini 3.7 Flash...');

    try {
      const result = await transcribeAndAuditAudioWithGemini(
        {
          file: localAudioFile,
          storeName: currentStore.storeName,
          city: currentStore.city,
          recordingDate: currentStore.recordingDate,
          additionalContext: `Asesor previo: ${seller}. Producto previo: ${productEvaluated}`,
        },
        (stage) => setGeminiProgressStage(stage)
      );

      setAiAuditResult(result);
      setGeminiProgressStage('¡Auditoría con Gemini completada exitosamente!');
    } catch (err: any) {
      console.error('Error transcribing with Gemini:', err);
      setErrorMessage(err.message || 'Error al comunicarse con el modelo Gemini para auditar el audio.');
    } finally {
      setIsTranscribingWithGemini(false);
    }
  };

  // Apply AI Result to current store state
  const handleApplyAiResult = () => {
    if (!aiAuditResult) return;

    if (aiAuditResult.transcript && aiAuditResult.transcript.length > 0) {
      setTranscript(aiAuditResult.transcript);
    }
    if (aiAuditResult.criteriaBreakdown && aiAuditResult.criteriaBreakdown.length > 0) {
      setCriteriaBreakdown(aiAuditResult.criteriaBreakdown);
    }
    if (aiAuditResult.narrativeSummary) {
      setNarrativeSummary(aiAuditResult.narrativeSummary);
    }
    if (aiAuditResult.strengths) {
      setStrengths(aiAuditResult.strengths);
    }
    if (aiAuditResult.criticalAreas) {
      setCriticalAreas(aiAuditResult.criticalAreas);
    }
    if (aiAuditResult.recommendations) {
      setRecommendations(aiAuditResult.recommendations);
    }
    if (typeof aiAuditResult.saleClosed === 'boolean') {
      setSaleClosed(aiAuditResult.saleClosed);
    }
    if (typeof aiAuditResult.contactCaptured === 'boolean') {
      setContactCaptured(aiAuditResult.contactCaptured);
    }
    if (aiAuditResult.seller) {
      setSeller(aiAuditResult.seller);
    }
    if (aiAuditResult.productEvaluated) {
      setProductEvaluated(aiAuditResult.productEvaluated);
    }
    if (aiAuditResult.duration) {
      setDuration(aiAuditResult.duration);
    }

    setVerificationStatus('ai_transcribed');
    setVerificationNotes(`Auditado y transcrito fielmente con Gemini 3.7 Flash el ${new Date().toLocaleDateString()}`);
    setAiAuditResult(null);
    setSaveSuccessMessage('¡Transcripción y evaluación de IA aplicadas a los campos editables! Recuerda hacer clic en "Guardar Verificación en el Consolidado".');
  };

  // Re-grade transcript with Gemini
  const handleRegradeWithGemini = async () => {
    if (transcript.length === 0) {
      setErrorMessage('No hay transcripción para recalcular.');
      return;
    }

    setIsRegrading(true);
    setErrorMessage(null);
    try {
      const regraded = await regradeTranscriptWithGemini(
        transcript,
        currentStore.storeName,
        currentStore.city,
        productEvaluated
      );

      if (regraded.criteriaBreakdown) {
        setCriteriaBreakdown(regraded.criteriaBreakdown);
      }
      if (regraded.narrativeSummary) {
        setNarrativeSummary(regraded.narrativeSummary);
      }
      if (regraded.strengths) {
        setStrengths(regraded.strengths);
      }
      if (regraded.criticalAreas) {
        setCriticalAreas(regraded.criticalAreas);
      }
      if (regraded.recommendations) {
        setRecommendations(regraded.recommendations);
      }
      if (typeof regraded.saleClosed === 'boolean') {
        setSaleClosed(regraded.saleClosed);
      }
      if (typeof regraded.contactCaptured === 'boolean') {
        setContactCaptured(regraded.contactCaptured);
      }

      setSaveSuccessMessage('¡Puntajes recalculados con IA según el texto verbatim de la transcripción!');
    } catch (err: any) {
      console.error('Error regrading transcript:', err);
      setErrorMessage(err.message || 'Error al recalcular la evaluación.');
    } finally {
      setIsRegrading(false);
    }
  };

  // Live Speech Dictation (Web Speech API)
  const toggleDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta Web Speech API para dictado por voz. Recomendamos usar Google Chrome o Edge.');
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-VE';

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setDictationTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleAddDictationLine = (speaker: 'Mystery Shopper' | 'Vendedor' | 'Cajero') => {
    if (!dictationTranscript.trim()) return;
    const timeFormatted = formatSeconds(currentTime);
    setTranscript((prev) => [
      ...prev,
      {
        speaker,
        text: dictationTranscript.trim(),
        timestamp: timeFormatted,
      },
    ]);
    setDictationTranscript('');
  };

  // Transcript Line Edits
  const handleUpdateTranscriptLine = (index: number, field: keyof TranscriptLine, value: any) => {
    setTranscript((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleAddTranscriptLine = (index?: number) => {
    const timeFormatted = formatSeconds(currentTime);
    const newLine: TranscriptLine = {
      speaker: 'Mystery Shopper',
      text: '',
      timestamp: timeFormatted,
    };
    if (typeof index === 'number') {
      setTranscript((prev) => [
        ...prev.slice(0, index + 1),
        newLine,
        ...prev.slice(index + 1),
      ]);
    } else {
      setTranscript((prev) => [...prev, newLine]);
    }
  };

  const handleDeleteTranscriptLine = (index: number) => {
    setTranscript((prev) => prev.filter((_, i) => i !== index));
  };

  // Criteria Score Edits
  const handleScoreChange = (criterionId: string, score: number) => {
    setCriteriaBreakdown((prev) =>
      prev.map((c) => {
        if (c.criterionId === criterionId) {
          const clamped = Math.max(0, Math.min(c.maxScore, score));
          return {
            ...c,
            score: clamped,
            status: getCriterionStatus(clamped, c.maxScore),
          };
        }
        return c;
      })
    );
  };

  const handleObservationChange = (criterionId: string, observation: string) => {
    setCriteriaBreakdown((prev) =>
      prev.map((c) => (c.criterionId === criterionId ? { ...c, observation } : c))
    );
  };

  // Total Live Score
  const totalScore = criteriaBreakdown.reduce((sum, c) => sum + (Number(c.score) || 0), 0);
  const computedLevel =
    totalScore >= 75 ? 'Bueno' : totalScore >= 50 ? 'Regular' : 'Deficiente';

  // Save changes to evaluation
  const handleSaveEvaluation = () => {
    const updated: StoreEvaluation = {
      ...currentStore,
      storeName: currentStore.storeName,
      city: currentStore.city,
      recordingDate: currentStore.recordingDate,
      duration: duration || currentStore.duration,
      seller: seller || currentStore.seller,
      productEvaluated: productEvaluated || currentStore.productEvaluated,
      score: totalScore,
      level: computedLevel,
      saleClosed,
      contactCaptured,
      narrativeSummary,
      criteriaBreakdown,
      strengths,
      criticalAreas,
      recommendations,
      transcript,
      audioUrl: localAudioUrl || currentStore.audioUrl,
      verificationStatus,
      verifiedBy,
      verificationDate: new Date().toLocaleDateString(),
      verificationNotes,
    };

    onUpdateEvaluation(updated);
    setSaveSuccessMessage(`¡Evaluación de ${currentStore.storeName} guardada y actualizada en el reporte consolidado!`);
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = () => {
    const text = transcript
      .map((t) => `[${t.timestamp || '00:00'}] ${t.speaker}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Store brand tag helper
  const getBrandBadge = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('DAKA')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (n.includes('DAMASCO')) return 'bg-rose-100 text-rose-900 border-rose-300';
    if (n.includes('MULTIMAX')) return 'bg-blue-100 text-blue-900 border-blue-300';
    if (n.includes('IVOO')) return 'bg-lime-100 text-lime-950 border-lime-400 font-bold';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  // Filtered stores list for sidebar selector (Memoized)
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((e) => {
      if (brandFilter !== 'all') {
        if (!e.storeName.toUpperCase().includes(brandFilter.toUpperCase())) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'verified' && e.verificationStatus !== 'verified') return false;
        if (statusFilter === 'ai_transcribed' && e.verificationStatus !== 'ai_transcribed') return false;
        if (statusFilter === 'preliminary' && e.verificationStatus && e.verificationStatus !== 'preliminary') return false;
      }
      return true;
    });
  }, [evaluations, brandFilter, statusFilter]);

  // Verification statistics (Memoized)
  const { verifiedCount, aiCount, pendingCount } = useMemo(() => {
    const verified = evaluations.filter((e) => e.verificationStatus === 'verified').length;
    const ai = evaluations.filter((e) => e.verificationStatus === 'ai_transcribed').length;
    const pending = evaluations.length - verified - ai;
    return { verifiedCount: verified, aiCount: ai, pendingCount: pending };
  }, [evaluations]);

  // Filtered transcript lines (Memoized)
  const filteredTranscript = useMemo(() => {
    const searchLower = transcriptSearch.trim().toLowerCase();
    if (!searchLower) return transcript;
    return transcript.filter(
      (line) =>
        line.text.toLowerCase().includes(searchLower) ||
        line.speaker.toLowerCase().includes(searchLower)
    );
  }, [transcript, transcriptSearch]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Verification Audit Mission */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-lime-400/10 text-lime-400 text-xs font-mono font-semibold border border-lime-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Estudio de Verificación y Auditoría de Audios Reales</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Verificación de Audios y Transcripciones Verbatim
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Escucha directamente cada grabación real, transcribe con <strong>Inteligencia Artificial Gemini 3.7 Flash</strong> o audita línea por línea para asegurar que el informe consolidado refleje con exactitud matemática lo sucedido en tienda.
          </p>
        </div>

        {/* Global Verification Status Metrics */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0">
          <div className="text-center px-3 border-r border-slate-800">
            <div className="text-xs text-slate-400 font-semibold">Total Audios</div>
            <div className="text-xl font-black text-white">{evaluations.length}</div>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Auditados
            </div>
            <div className="text-xl font-black text-emerald-400">{verifiedCount}</div>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              IA Gemini
            </div>
            <div className="text-xl font-black text-blue-400">{aiCount}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              Pendientes
            </div>
            <div className="text-xl font-black text-amber-400">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left Sidebar Selector + Center Audio/Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (4 cols): Store Selector & Filter */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-lime-600" />
                <span>Auditorías ({filteredEvaluations.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Selecciona para auditar</span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cadena</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todas las cadenas</option>
                  <option value="DAKA">Daka</option>
                  <option value="DAMASCO">Damasco</option>
                  <option value="MULTIMAX">Multimax</option>
                  <option value="IVOO">IVOO</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todos los estados</option>
                  <option value="verified">🟢 Verificado Real</option>
                  <option value="ai_transcribed">🔵 Procesado IA</option>
                  <option value="preliminary">🟡 Preliminar</option>
                </select>
              </div>
            </div>

            {/* List of stores */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredEvaluations.map((evalItem) => {
                const isSelected = evalItem.id === currentStore.id;
                const status = evalItem.verificationStatus || 'preliminary';
                return (
                  <div
                    key={evalItem.id}
                    onClick={() => onSelectStore(evalItem.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-lime-400'
                        : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs sm:text-sm truncate">
                        {evalItem.storeName}
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isSelected ? 'bg-slate-800 text-lime-400 border-slate-700' : getBrandBadge(evalItem.storeName)
                      }`}>
                        {evalItem.score} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                      <span>{evalItem.city}</span>
                      <span>•</span>
                      <span className="truncate">{evalItem.recordingDate}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'ai_transcribed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {status === 'ai_transcribed' && <Sparkles className="w-3 h-3" />}
                        {status === 'preliminary' && <AlertCircle className="w-3 h-3" />}
                        <span>
                          {status === 'verified'
                            ? 'Verificado con Audio Real'
                            : status === 'ai_transcribed'
                            ? 'Transcrito con IA'
                            : 'Preliminar'}
                        </span>
                      </span>

                      {evalItem.transcript && (
                        <span className="text-[10px] text-slate-400">
                          {evalItem.transcript.length} líneas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE (8 cols): Real Audio Player + AI Transcriber + Verbatim Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card of Current Store */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getBrandBadge(currentStore.storeName)}`}>
                    {currentStore.storeName}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {currentStore.city} • {currentStore.recordingDate}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {currentStore.storeName}
                </h2>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                  <span><strong>Asesor:</strong> {seller || 'No identificado'}</span>
                  <span>•</span>
                  <span><strong>Producto:</strong> {productEvaluated || 'General'}</span>
                  <span>•</span>
                  <span><strong>Duración:</strong> {duration || 'N/D'}</span>
                </div>
              </div>

              {/* Live Score Badge & Save Action */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Puntaje Recalculado</div>
                  <div className="text-xl font-black text-slate-900">{totalScore} / 100</div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClasses(computedLevel)}`}>
                    {computedLevel}
                  </div>
                </div>

                <button
                  onClick={handleSaveEvaluation}
                  className="bg-lime-400 hover:bg-lime-300 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-102"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Verificación</span>
                </button>
              </div>
            </div>

            {/* Notification Messages */}
            {saveSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verification Status Selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-lime-600" />
                <div>
                  <div className="font-bold text-slate-900">Estado de Verificación del Audio</div>
                  <div className="text-[11px] text-slate-500">Determina el nivel de certeza de los datos en el consolidado</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-800"
                >
                  <option value="verified">🟢 Verificado con Audio Real</option>
                  <option value="ai_transcribed">🔵 Transcrito con IA Gemini</option>
                  <option value="preliminary">🟡 Transcripción Preliminar</option>
                </select>

                <input
                  type="text"
                  placeholder="Nombre de Auditor..."
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-36"
                  title="Auditor que escuchó el audio"
                />
              </div>
            </div>
          </div>

          {/* REAL AUDIO PLAYER & GEMINI INGESTION WORKSPACE */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileAudio className="w-5 h-5 text-lime-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Reproductor de Audio & Motor Gemini de Transcripción
                </h3>
              </div>

              {currentStore.audioUrl && (
                <a
                  href={currentStore.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <span>Abrir en Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Embedded Google Drive Preview if available */}
            {currentStore.audioUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                <div className="text-[11px] text-slate-400 font-mono mb-1.5 flex items-center justify-between px-2">
                  <span className="text-lime-400 font-bold">Audio enlazado en Google Drive:</span>
                  <span className="text-slate-300 truncate max-w-xs">{currentStore.audioUrl}</span>
                </div>
                {/* Embed iframe for instant playback */}
                <iframe
                  src={
                    currentStore.audioDriveId
                      ? `https://drive.google.com/file/d/${currentStore.audioDriveId}/preview`
                      : currentStore.audioUrl.replace('/view', '/preview')
                  }
                  title={`Audio - ${currentStore.storeName}`}
                  className="w-full h-14 border-0 rounded-lg"
                  allow="autoplay"
                />
              </div>
            )}

            {/* Real Audio File Dropzone & HTML5 Waveform Player */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleAudioDrop}
              className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
                localAudioFile
                  ? 'border-lime-400 bg-lime-50/30'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-lime-400 text-slate-950 rounded-xl font-bold">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {localAudioFile ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Archivo cargado: {localAudioFile.name} ({(localAudioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      ) : (
                        'Cargar / Arrastrar archivo de audio real (.mp4, .mp3, .m4a, .wav)'
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Carga el audio original descargado de Drive para transcribirlo con Gemini y sincronizarlo con el reproductor interactivo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-2xs">
                    <span>Examinar Archivo</span>
                    <input
                      type="file"
                      accept="audio/*,video/mp4,.mp4,.mp3,.m4a,.wav,.ogg"
                      onChange={handleLocalAudioSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Local HTML5 Audio Player Controls */}
              {localAudioUrl && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <audio
                    ref={audioRef}
                    src={localAudioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  {/* Player Timeline */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-600 font-bold w-12 text-right">
                      {formatSeconds(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lime-500"
                    />
                    <span className="font-mono text-xs text-slate-400 w-12">
                      {formatSeconds(audioDuration)}
                    </span>
                  </div>

                  {/* Player Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSkip(-5)}
                        title="Retroceder 5 segundos"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>-5s</span>
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 text-lime-400" /> : <Play className="w-4 h-4 text-lime-400" />}
                        <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                      </button>

                      <button
                        onClick={() => handleSkip(5)}
                        title="Avanzar 5 segundos"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>+5s</span>
                      </button>
                    </div>

                    {/* Speed Controls */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold px-1.5">Velocidad:</span>
                      {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleRateChange(rate)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            playbackRate === rate
                              ? 'bg-slate-900 text-lime-400 font-black shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Transcribe and Audit with Gemini Button & Progress */}
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span>Gemini 3.7 Flash procesará el audio completo mediante transferencia optimizada para extraer el diálogo literal y auditar los 9 criterios.</span>
                  </div>

                  <button
                    onClick={handleTranscribeWithGemini}
                    disabled={isTranscribingWithGemini}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                      isTranscribingWithGemini
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 hover:scale-102'
                    }`}
                  >
                    {isTranscribingWithGemini ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                        <span>Procesando audio...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>✨ Transcribir y Auditar con IA Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {isTranscribingWithGemini && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl border border-lime-400/50 shadow-inner space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-lime-400" />
                        <span className="font-mono text-lime-300 font-semibold">{geminiProgressStage || 'Procesando archivo de audio...'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Transferencia segura por fragmentos</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-lime-400 to-emerald-400 h-1.5 rounded-full animate-pulse w-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI AUDIT RESULT PREVIEW MODAL / BANNER (If newly generated) */}
            {aiAuditResult && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-lime-400 shadow-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-lime-400" />
                    <h4 className="font-bold text-sm text-lime-400">
                      Resultado de Auditoría Generado por Gemini 3.7 Flash
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Puntaje Calculado: </span>
                    <strong className="text-lime-400 font-mono text-base">{aiAuditResult.score} / 100 ({aiAuditResult.level})</strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <p><strong>Resumen del audio:</strong> {aiAuditResult.narrativeSummary}</p>
                  <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                    <span><strong>Asesor detectado:</strong> {aiAuditResult.seller || 'N/D'}</span>
                    <span><strong>Producto:</strong> {aiAuditResult.productEvaluated || 'N/D'}</span>
                    <span><strong>Cierre de venta:</strong> {aiAuditResult.saleClosed ? 'Sí' : 'No'}</span>
                    <span><strong>Captura de contacto:</strong> {aiAuditResult.contactCaptured ? 'Sí' : 'No'}</span>
                    <span><strong>Líneas transcritas:</strong> {aiAuditResult.transcript?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setAiAuditResult(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleApplyAiResult}
                    className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
                  >
                    <Check className="w-4 h-4" />
                    <span>✅ Aplicar Transcripción y Calificación al Consolidado</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE WORKSPACE: TABS (Transcript vs Criteria Breakdown vs Summary) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Workspace Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
              <button
                onClick={() => setActiveRightTab('transcript')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRightTab === 'transcript'
                    ? 'border-lime-500 bg-white text-slate-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Transcripción Verbatim ({transcript.length} líneas)</span>
              </button>

              <button
                onClick={() => setActiveRightTab('criteria')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRightTab === 'criteria'
                    ? 'border-lime-500 bg-white text-slate-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Desglose de 9 Criterios ({totalScore} pts)</span>
              </button>

              <button
                onClick={() => setActiveRightTab('narrative')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRightTab === 'narrative'
                    ? 'border-lime-500 bg-white text-slate-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>3. Resumen y Áreas Críticas</span>
              </button>
            </div>

            {/* TAB 1: TRANSCRIPT VERBATIM EDITOR */}
            {activeRightTab === 'transcript' && (
              <div className="p-5 space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 text-xs">
                  <div className="relative flex-1 max-w-sm w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar palabras o frases en la transcripción..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Dictation (Speech to text) toggle */}
                    <button
                      onClick={toggleDictation}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isDictating
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title="Dictar por voz mientras escuchas el audio"
                    >
                      {isDictating ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-lime-600" />}
                      <span>{isDictating ? 'Detener Dictado' : 'Dictado por Voz'}</span>
                    </button>

                    <button
                      onClick={handleCopyTranscript}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-200 transition-colors"
                      title="Copiar texto completo"
                    >
                      {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTranscript ? '¡Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    <button
                      onClick={() => handleAddTranscriptLine()}
                      className="px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Añadir Línea</span>
                    </button>
                  </div>
                </div>

                {/* Live Dictation Active Card */}
                {isDictating && (
                  <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-rose-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                        Escuchando tu micrófono en tiempo real... (Habla lo que oyes en el audio)
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs font-mono text-slate-800 min-h-[40px]">
                      {dictationTranscript || 'Esperando voz...'}
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="text-slate-500 font-semibold">Guardar como:</span>
                      <button
                        onClick={() => handleAddDictationLine('Mystery Shopper')}
                        className="px-2.5 py-1 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold rounded"
                      >
                        + Mystery Shopper
                      </button>
                      <button
                        onClick={() => handleAddDictationLine('Vendedor')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                      >
                        + Vendedor
                      </button>
                      <button
                        onClick={() => handleAddDictationLine('Cajero')}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded"
                      >
                        + Cajero
                      </button>
                    </div>
                  </div>
                )}

                {/* Transcript dialogue rows */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredTranscript.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                      <FileAudio className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-bold text-sm text-slate-700">
                        {transcript.length === 0
                          ? 'No hay líneas de diálogo transcritas'
                          : 'No se encontraron resultados para la búsqueda'}
                      </div>
                      <p className="text-xs max-w-md mx-auto">
                        {transcript.length === 0
                          ? 'Carga el audio y haz clic en "Transcribir y Auditar con IA Gemini" o añade líneas manualmente para construir la transcripción verbatim.'
                          : 'Intenta con otro término o limpia el buscador para ver todo el diálogo.'}
                      </p>
                    </div>
                  ) : (
                    filteredTranscript.map((line, idx) => {
                      const isShopper = line.speaker === 'Mystery Shopper';
                      const isSeller = line.speaker === 'Vendedor';
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            isShopper
                              ? 'bg-lime-50/40 border-lime-200'
                              : isSeller
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-purple-50/40 border-purple-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={line.speaker}
                                onChange={(e) =>
                                  handleUpdateTranscriptLine(idx, 'speaker', e.target.value)
                                }
                                className={`text-xs font-black px-2 py-1 rounded border shadow-2xs ${
                                  isShopper
                                    ? 'bg-lime-400 text-slate-950 border-lime-500'
                                    : isSeller
                                    ? 'bg-slate-900 text-white border-slate-800'
                                    : 'bg-purple-600 text-white border-purple-700'
                                }`}
                              >
                                <option value="Mystery Shopper">Mystery Shopper (Cliente)</option>
                                <option value="Vendedor">Vendedor / Asesor</option>
                                <option value="Cajero">Cajero</option>
                                <option value="Seguridad">Seguridad</option>
                                <option value="Ambiente">Ambiente</option>
                              </select>

                              <input
                                type="text"
                                placeholder="mm:ss"
                                value={line.timestamp || ''}
                                onChange={(e) =>
                                  handleUpdateTranscriptLine(idx, 'timestamp', e.target.value)
                                }
                                className="w-16 px-2 py-1 font-mono text-[11px] text-center bg-white border border-slate-300 rounded font-semibold text-slate-700"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAddTranscriptLine(idx)}
                                title="Añadir línea debajo"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTranscriptLine(idx)}
                                title="Eliminar línea"
                                className="p-1 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={line.text}
                            onChange={(e) => handleUpdateTranscriptLine(idx, 'text', e.target.value)}
                            placeholder="Diálogo exacto dicho en el audio..."
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed font-sans text-slate-800 focus:ring-2 focus:ring-lime-400 focus:outline-hidden"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Recalculate 9 Criteria Button at bottom of transcript */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    ¿Modificaste el diálogo? Recalcula los 9 criterios automáticamente con IA:
                  </span>
                  <button
                    onClick={handleRegradeWithGemini}
                    disabled={isRegrading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    {isRegrading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-lime-400" /> : <Sparkles className="w-3.5 h-3.5 text-lime-400" />}
                    <span>{isRegrading ? 'Recalculando con IA...' : 'Recalcular 9 Criterios'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CRITERIA BREAKDOWN EDITOR */}
            {activeRightTab === 'criteria' && (
              <div className="p-5 space-y-4">
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold">Puntaje Consolidado Auditado</div>
                    <div className="text-2xl font-black text-lime-400">{totalScore} / 100 Pts</div>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${getLevelBadgeClasses(computedLevel)}`}>
                    Nivel: {computedLevel}
                  </div>
                </div>

                {/* 9 Criteria List */}
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {criteriaBreakdown.map((cb) => {
                    const status = getCriterionStatus(cb.score, cb.maxScore);
                    const color = getStatusColorClasses(status);
                    return (
                      <div key={cb.criterionId} className="p-4 bg-white hover:bg-slate-50/50 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-xs sm:text-sm text-slate-900">
                            {cb.criterionName}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={cb.maxScore}
                              value={cb.score}
                              onChange={(e) =>
                                handleScoreChange(cb.criterionId, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-16 px-2 py-1 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-xs"
                            />
                            <span className="text-xs text-slate-400 font-semibold">/ {cb.maxScore} pts</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color.badge}`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={cb.observation}
                            onChange={(e) => handleObservationChange(cb.criterionId, e.target.value)}
                            placeholder="Cita textual del audio y observación..."
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-700"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SUMMARY & QUALITATIVE ANALYSIS */}
            {activeRightTab === 'narrative' && (
              <div className="p-5 space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Resumen Ejecutivo / Narrativa Verificada
                  </label>
                  <textarea
                    rows={4}
                    value={narrativeSummary}
                    onChange={(e) => setNarrativeSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans"
                    placeholder="Descripción detallada de la visita..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Fortalezas Observadas
                      </span>
                      <button
                        onClick={() => setStrengths((prev) => [...prev, 'Nueva fortaleza'])}
                        className="text-xs bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold"
                      >
                        + Añadir
                      </button>
                    </div>
                    {strengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={s}
                          onChange={(e) =>
                            setStrengths((prev) => prev.map((item, idx) => (idx === i ? e.target.value : item)))
                          }
                          className="flex-1 text-xs px-2 py-1 bg-white border border-emerald-200 rounded"
                        />
                        <button
                          onClick={() => setStrengths((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
                    <div className="font-bold text-rose-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Áreas Críticas de Mejora
                      </span>
                      <button
                        onClick={() => setCriticalAreas((prev) => [...prev, 'Nueva oportunidad de mejora'])}
                        className="text-xs bg-rose-100 px-2 py-0.5 rounded text-rose-800 font-bold"
                      >
                        + Añadir
                      </button>
                    </div>
                    {criticalAreas.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={c}
                          onChange={(e) =>
                            setCriticalAreas((prev) => prev.map((item, idx) => (idx === i ? e.target.value : item)))
                          }
                          className="flex-1 text-xs px-2 py-1 bg-white border border-rose-200 rounded"
                        />
                        <button
                          onClick={() => setCriticalAreas((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Toggles: Sale Closed & Contact Captured */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saleClosed}
                      onChange={(e) => setSaleClosed(e.target.checked)}
                      className="w-4 h-4 rounded text-lime-500 focus:ring-lime-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">¿Venta Concretada / Cerrada?</div>
                      <div className="text-[11px] text-slate-500">Marcar si el cliente pagó o se procedió a caja</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactCaptured}
                      onChange={(e) => setContactCaptured(e.target.checked)}
                      className="w-4 h-4 rounded text-lime-500 focus:ring-lime-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">¿Captura de Contacto / WhatsApp?</div>
                      <div className="text-[11px] text-slate-500">Marcar si el asesor solicitó datos para seguimiento</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
