import React, { useState } from 'react';
import { StoreEvaluation } from '../types';
import {
  getStatusColorClasses,
  getLevelBadgeClasses,
} from '../data/criteria';
import { EditEvaluationModal } from './EditEvaluationModal';
import { regradeTranscriptWithGemini } from '../services/geminiAudioService';
import { saveEvaluationsSafely } from '../services/storageManager';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User,
  Store,
  CheckCircle,
  XCircle,
  Lightbulb,
  FileAudio,
  MessageSquare,
  AlertCircle,
  Tag,
  Info,
  Edit3,
  Play,
  Volume2,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface EvaluacionesIndividualesViewProps {
  evaluations: StoreEvaluation[];
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  onUpdateEvaluation: (updated: StoreEvaluation) => void;
  onGoToAudios?: (storeId: string) => void;
}

export const EvaluacionesIndividualesView: React.FC<EvaluacionesIndividualesViewProps> = ({
  evaluations,
  selectedStoreId,
  onSelectStore,
  onUpdateEvaluation,
  onGoToAudios,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('Todas');
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReauditing, setIsReauditing] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const getGoogleDriveId = (url?: string, driveId?: string): string | null => {
    if (driveId) return driveId;
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const cities = ['Todas', ...Array.from(new Set(evaluations.map((e) => e.city)))];

  const filteredEvaluations = evaluations.filter((item) => {
    const matchesSearch =
      item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productEvaluated.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'Todas' || item.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const currentIndex = evaluations.findIndex((e) => e.id === selectedStoreId);
  const currentEval = evaluations[currentIndex !== -1 ? currentIndex : 0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStore(evaluations[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < evaluations.length - 1) {
      onSelectStore(evaluations[currentIndex + 1].id);
    }
  };

  const handleReauditWithGemini = async () => {
    if (!currentEval.transcript || currentEval.transcript.length === 0) {
      setToastMessage('No hay transcripción disponible para auditar.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsReauditing(true);
    try {
      const regradeResult = await regradeTranscriptWithGemini(
        currentEval.transcript,
        currentEval.storeName,
        currentEval.city,
        currentEval.productEvaluated
      );

      const updated: StoreEvaluation = {
        ...currentEval,
        score: regradeResult.score !== undefined ? regradeResult.score : currentEval.score,
        level: regradeResult.level || currentEval.level,
        criteriaBreakdown: regradeResult.criteriaBreakdown || currentEval.criteriaBreakdown,
        narrativeSummary: regradeResult.narrativeSummary || currentEval.narrativeSummary,
        strengths: regradeResult.strengths || currentEval.strengths,
        criticalAreas: regradeResult.criticalAreas || currentEval.criticalAreas,
        recommendations: regradeResult.recommendations || currentEval.recommendations,
        saleClosed: regradeResult.saleClosed !== undefined ? regradeResult.saleClosed : currentEval.saleClosed,
        contactCaptured: regradeResult.contactCaptured !== undefined ? regradeResult.contactCaptured : currentEval.contactCaptured,
        verificationStatus: 'verified',
        verificationDate: new Date().toLocaleDateString('es-VE'),
        verifiedBy: 'Gemini 3.7 Flash AI',
      };

      onUpdateEvaluation(updated);
      setToastMessage(`¡Evaluación de ${updated.storeName} re-auditada exitosamente! Puntaje: ${updated.score}/100`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      setToastMessage(err instanceof Error ? err.message : 'Error al re-auditar con Gemini');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsReauditing(false);
    }
  };

  const handleCopyTranscript = () => {
    const text = currentEval.transcript
      .map((t) => `[${t.timestamp || '00:00'}] ${t.speaker}${t.speakerName ? ` (${t.speakerName})` : ''}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setToastMessage('Transcripción copiada al portapapeles');
    setTimeout(() => {
      setCopiedTranscript(false);
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Filter & Store Selector Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Evaluaciones Individuales por Tienda
            </h2>
            <p className="text-xs text-slate-500">
              Explora las {evaluations.length} evaluaciones con desglose de 9 criterios, transcripción y reproductor de audio
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar tienda o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 text-slate-800"
            />
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1">Ciudad:</span>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedCity === city
                  ? 'bg-slate-900 text-lime-400 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Store Horizontal Selector List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {filteredEvaluations.map((item) => {
            const isSelected = item.id === currentEval.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectStore(item.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-lime-400 ring-offset-1'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-lime-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  #{evaluations.findIndex((e) => e.id === item.id) + 1}
                </span>
                <div>
                  <div className="text-xs font-bold leading-tight truncate max-w-[140px]">
                    {item.storeName.replace('IVOO ', '')}
                  </div>
                  <div className="text-[10px] opacity-75">{item.score} pts • {item.level}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Single Evaluation Container */}
      <article className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Navigation Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title="Tienda anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400">
              Evaluación {currentIndex + 1} de {evaluations.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === evaluations.length - 1}
              className={`p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                currentIndex === evaluations.length - 1 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title="Siguiente tienda"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold bg-lime-400 text-slate-950 px-3 py-1.5 rounded-lg hover:bg-lime-300 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Fecha y Audio</span>
            </button>
            <div className="text-xs font-mono text-lime-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              {currentEval.identifier}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* 1. Header Section */}
          <div className="border-b border-slate-200 pb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                  Evaluación Mystery Shopper
                </p>
                {/* Verification Status Badge */}
                {currentEval.verificationStatus === 'verified' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Audio Verificado Verbatim
                  </span>
                )}
                {currentEval.verificationStatus === 'ai_transcribed' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-blue-600" />
                    Transcrito con IA Gemini
                  </span>
                )}
                {(!currentEval.verificationStatus || currentEval.verificationStatus === 'unverified') && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Transcripción Preliminar (Sin auditar)
                  </span>
                )}
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {currentEval.storeName}
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                <span>Grabación del {currentEval.recordingDate}</span>
                {currentEval.verifiedBy && (
                  <span className="text-xs text-slate-400">
                    • Auditado por: <strong className="text-slate-600">{currentEval.verifiedBy}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onGoToAudios && (
                <button
                  onClick={() => onGoToAudios(currentEval.id)}
                  className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-lime-400 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-slate-700"
                  title="Abrir en Estudio de Verificación de Audios con IA"
                >
                  <FileAudio className="w-3.5 h-3.5 text-lime-400" />
                  <span>Auditar Audio & Criterios</span>
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors bg-slate-50 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modificar datos</span>
              </button>
            </div>
          </div>

          {/* 2. Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-bold text-slate-700 text-left border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Tienda</th>
                  <th className="py-2.5 px-4">Vendedor</th>
                  <th className="py-2.5 px-4">Fecha grabación</th>
                  <th className="py-2.5 px-4">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">{currentEval.storeName}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {currentEval.seller === 'No identificado' ? (
                      <span className="italic text-slate-400">No identificado</span>
                    ) : (
                      currentEval.seller
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{currentEval.recordingDate}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{currentEval.duration}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2.5 Audio Player Card (If audioUrl is provided or configured) */}
          {(() => {
            const driveId = getGoogleDriveId(currentEval.audioUrl, currentEval.audioDriveId);
            return (
              <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-lg bg-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-lime-400 flex items-center gap-2">
                        <span>Audio de Grabación • {currentEval.duration}</span>
                        {driveId && (
                          <span className="text-[10px] bg-lime-400/20 text-lime-300 font-mono px-2 py-0.5 rounded">
                            Google Drive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
                        {currentEval.audioUrl
                          ? `Grabación de audio de la auditoría en ${currentEval.storeName}`
                          : 'Sin audio vinculado actualmente'}
                      </div>
                    </div>
                  </div>

                  {currentEval.audioUrl ? (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={currentEval.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                        title="Abrir archivo en Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-lime-400" />
                        <span>Abrir en Drive</span>
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileAudio className="w-3.5 h-3.5 text-lime-400" />
                      <span>Vincular audio o archivo</span>
                    </button>
                  )}
                </div>

                {/* Direct In-App Audio Playback */}
                {currentEval.audioUrl && (
                  <div className="pt-2 border-t border-slate-800/80">
                    {driveId ? (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-lime-400" />
                          <span>Reproductor de nota de voz integrado (presiona Play para escuchar):</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
                          <iframe
                            src={`https://drive.google.com/file/d/${driveId}/preview`}
                            title={`Audio Mystery Shopper - ${currentEval.storeName}`}
                            className="w-full h-14 border-0"
                            allow="autoplay"
                          />
                        </div>
                      </div>
                    ) : (
                      <audio
                        controls
                        key={currentEval.audioUrl}
                        className="w-full h-10 rounded-lg bg-slate-800"
                      >
                        <source src={currentEval.audioUrl} />
                        Tu navegador no soporta el reproductor de audio.
                      </audio>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. General Score & Closure Banner */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl sm:text-4xl font-black text-slate-900">
                  {currentEval.score}
                  <span className="text-lg font-semibold text-slate-400">/100</span>
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${getLevelBadgeClasses(
                    currentEval.level
                  )}`}
                >
                  {currentEval.level}
                </span>
              </div>

              <div className="bg-rose-100 border border-rose-300 text-rose-900 font-black text-xs sm:text-sm uppercase tracking-widest px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                VENTA NO CERRADA
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-white p-4 rounded-lg border border-slate-200/80">
              {currentEval.narrativeSummary}
            </p>
          </div>

          {/* 4. Criteria Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-lime-600" />
                Desglose por Criterio (Metodología IVOO)
              </h4>
              <span className="text-xs text-slate-500 font-medium">9 Criterios evaluados</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-44">Criterio</th>
                    <th className="py-3 px-3 text-center w-16">Pts</th>
                    <th className="py-3 px-3 text-center w-16">Máx</th>
                    <th className="py-3 px-4">Observación Específica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {currentEval.criteriaBreakdown.map((criterion) => {
                    const colorStyle = getStatusColorClasses(criterion.status);
                    return (
                      <tr key={criterion.criterionId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900 align-top">
                          {criterion.criterionName}
                        </td>
                        <td className="py-3 px-3 text-center align-top">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${colorStyle.badge} border`}
                          >
                            {criterion.score}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400 align-top">
                          {criterion.maxScore}
                        </td>
                        <td className="py-3 px-4 text-slate-700 leading-relaxed text-xs sm:text-sm align-top">
                          {criterion.observation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td className="py-3.5 px-4 text-sm font-black">
                      Total Puntuación
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-lime-400 text-base">
                      {currentEval.score}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                      100
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      <strong>Total: {currentEval.score} / 100 puntos ({currentEval.score}%)</strong> — Nivel: {currentEval.level}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. Key Findings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-200">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Fortalezas
              </h5>
              <ul className="space-y-2.5 text-xs text-emerald-950 leading-relaxed">
                {currentEval.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50/60 rounded-xl p-5 border border-rose-200">
              <h5 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Áreas de Mejora Críticas
              </h5>
              <ul className="space-y-2.5 text-xs text-rose-950 leading-relaxed">
                {currentEval.criticalAreas.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 mt-1.5"></span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-300">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Recomendaciones
              </h5>
              <ul className="space-y-2.5 text-xs text-slate-800 leading-relaxed">
                {currentEval.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-1.5"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. Complete Verbatim Transcript */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-lime-400" />
                <h4 className="text-sm font-bold tracking-tight">Transcripción Verbatim</h4>
                <span className="text-[11px] font-mono text-slate-400">({currentEval.transcript.length} intervenciones)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReauditWithGemini}
                  disabled={isReauditing}
                  className="px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Calcular de nuevo los 9 criterios y puntaje con Gemini 3.7 Flash"
                >
                  {isReauditing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  )}
                  <span>Re-Auditar con IA</span>
                </button>

                <button
                  onClick={handleCopyTranscript}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  title="Copiar texto de la transcripción"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTranscript ? 'Copiado' : 'Copiar'}</span>
                </button>

                <div className="text-xs text-slate-400 font-mono hidden md:inline">
                  {currentEval.recordingDate} | {currentEval.duration}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 space-y-3.5">
              {currentEval.transcript.map((line, idx) => {
                const isShopper = line.speaker === 'Mystery Shopper';
                const isSeller = line.speaker === 'Vendedor';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col p-3 rounded-lg text-xs sm:text-sm leading-relaxed border ${
                      isShopper
                        ? 'bg-white border-slate-200 text-slate-800'
                        : isSeller
                        ? 'bg-lime-50/70 border-lime-200 text-slate-900 font-medium'
                        : 'bg-slate-100 border-slate-200 text-slate-600 italic'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                      <span
                        className={
                          isShopper
                            ? 'text-slate-600'
                            : isSeller
                            ? 'text-lime-800'
                            : 'text-slate-500'
                        }
                      >
                        {line.speaker}
                        {line.speakerName ? ` (${line.speakerName})` : ''}:
                      </span>
                    </div>
                    <p className="text-slate-800">{line.text}</p>
                  </div>
                );
              })}

              {currentEval.ambientNotes && (
                <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Notas de ambiente del evaluador:</strong>{' '}
                    <span>{currentEval.ambientNotes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      {isEditing && (
        <EditEvaluationModal
          evaluation={currentEval}
          onSave={(updated) => {
            onUpdateEvaluation(updated);
            setIsEditing(false);
            setToastMessage(`¡Reporte de ${updated.storeName} actualizado exitosamente!`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-lime-400/50 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-lime-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
