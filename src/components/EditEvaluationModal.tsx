import React, { useState } from 'react';
import { StoreEvaluation, CriterionScore } from '../types';
import { IVOO_CRITERIA, getCriterionStatus, getStatusColorClasses, getLevelBadgeClasses } from '../data/criteria';
import {
  X,
  Calendar,
  Clock,
  User,
  Store,
  FileAudio,
  Upload,
  Link,
  Save,
  CheckCircle2,
  Sliders,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';

interface EditEvaluationModalProps {
  evaluation: StoreEvaluation;
  onSave: (updated: StoreEvaluation) => void;
  onClose: () => void;
}

export const EditEvaluationModal: React.FC<EditEvaluationModalProps> = ({
  evaluation,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'criteria' | 'narrative'>('general');

  // Metadata & Audio
  const [recordingDate, setRecordingDate] = useState(evaluation.recordingDate);
  const [duration, setDuration] = useState(evaluation.duration);
  const [seller, setSeller] = useState(evaluation.seller);
  const [storeName, setStoreName] = useState(evaluation.storeName);
  const [identifier, setIdentifier] = useState(evaluation.identifier);
  const [city, setCity] = useState(evaluation.city);
  const [productEvaluated, setProductEvaluated] = useState(evaluation.productEvaluated);
  const [audioUrl, setAudioUrl] = useState(evaluation.audioUrl || '');
  const [ambientNotes, setAmbientNotes] = useState(evaluation.ambientNotes || '');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Criteria Breakdown & Scores
  const [criteriaBreakdown, setCriteriaBreakdown] = useState<CriterionScore[]>(
    evaluation.criteriaBreakdown.map((cb) => ({ ...cb }))
  );

  // Qualitative Analysis
  const [narrativeSummary, setNarrativeSummary] = useState(evaluation.narrativeSummary);
  const [strengths, setStrengths] = useState<string[]>([...evaluation.strengths]);
  const [criticalAreas, setCriticalAreas] = useState<string[]>([...evaluation.criticalAreas]);

  // Compute live total score
  const totalScore = criteriaBreakdown.reduce((sum, c) => sum + (Number(c.score) || 0), 0);
  const computedLevel =
    totalScore >= 75 ? 'Bueno' : totalScore >= 50 ? 'Regular' : 'Deficiente';

  const handleScoreChange = (criterionId: string, newScore: number) => {
    setCriteriaBreakdown((prev) =>
      prev.map((c) => {
        if (c.criterionId === criterionId) {
          const clamped = Math.max(0, Math.min(c.maxScore, newScore));
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setUploadedFileName(file.name);
    }
  };

  const handleAddStrength = () => {
    setStrengths((prev) => [...prev, 'Nueva fortaleza observada']);
  };

  const handleRemoveStrength = (index: number) => {
    setStrengths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStrengthChange = (index: number, val: string) => {
    setStrengths((prev) => prev.map((s, i) => (i === index ? val : s)));
  };

  const handleAddCriticalArea = () => {
    setCriticalAreas((prev) => [...prev, 'Nueva oportunidad de mejora detectada']);
  };

  const handleRemoveCriticalArea = (index: number) => {
    setCriticalAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCriticalAreaChange = (index: number, val: string) => {
    setCriticalAreas((prev) => prev.map((c, i) => (i === index ? val : c)));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEval: StoreEvaluation = {
      ...evaluation,
      storeName,
      identifier,
      city,
      recordingDate,
      duration,
      seller,
      productEvaluated,
      score: totalScore,
      level: computedLevel,
      audioUrl,
      ambientNotes,
      narrativeSummary,
      criteriaBreakdown,
      strengths,
      criticalAreas,
    };
    onSave(updatedEval);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-lime-400 text-slate-950 font-black text-xs">
              IVOO
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Editar Reporte de Evaluación
              </h3>
              <p className="text-xs text-slate-400">
                {storeName} • {seller}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Score Preview Badge */}
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Puntaje Recalculado</div>
              <div className="text-sm font-black text-lime-400">
                {totalScore} / 100 ({computedLevel})
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-lime-500 bg-white text-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Fecha, Audio y Vendedor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'criteria'
                ? 'border-lime-500 bg-white text-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Calificación por 9 Criterios ({totalScore} pts)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('narrative')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'narrative'
                ? 'border-lime-500 bg-white text-slate-900 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Resumen, Fortalezas y Fallas</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          {/* TAB 1: General & Audio */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-lime-600" />
                    <span>Nombre de Tienda</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 font-semibold"
                    required
                  />
                </div>

                {/* Seller */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-lime-600" />
                    <span>Asesor / Vendedor</span>
                  </label>
                  <input
                    type="text"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 font-semibold"
                    required
                  />
                </div>

                {/* Recording Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-lime-600" />
                    <span>Fecha de Grabación</span>
                  </label>
                  <input
                    type="text"
                    value={recordingDate}
                    onChange={(e) => setRecordingDate(e.target.value)}
                    placeholder="Ej: 14 de mayo de 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 font-semibold"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-lime-600" />
                    <span>Duración de la Visita / Audio</span>
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ej: 4 min 26 seg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800"
                  />
                </div>

                {/* Product Evaluated */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-lime-600" />
                    <span>Producto Evaluado</span>
                  </label>
                  <input
                    type="text"
                    value={productEvaluated}
                    onChange={(e) => setProductEvaluated(e.target.value)}
                    placeholder="Ej: Televisores Smart TV 55-65 pulgadas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800"
                  />
                </div>
              </div>

              {/* Audio Integration Section */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <label className="block font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <FileAudio className="w-4 h-4 text-lime-600" />
                  <span>Enlace o Archivo de Audio</span>
                </label>

                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Pegar enlace de Google Drive, Dropbox o URL directa (.mp3 / .m4a)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Subir archivo local de audio</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.ogg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadedFileName && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 truncate max-w-[240px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {uploadedFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Ambient Notes */}
              <div className="border-t border-slate-200 pt-3">
                <label className="block font-bold text-slate-700 mb-1">
                  Notas de Ambiente / Observaciones de Entrada
                </label>
                <textarea
                  rows={2}
                  value={ambientNotes}
                  onChange={(e) => setAmbientNotes(e.target.value)}
                  placeholder="Ej: Tienda con poco flujo. Vendedores agrupados en el área de televisores."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Criteria Scores Breakdown */}
          {activeTab === 'criteria' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Puntuación Total en Vivo</div>
                  <div className="text-2xl font-black text-lime-400">{totalScore} / 100</div>
                </div>
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${getLevelBadgeClasses(computedLevel)}`}>
                  Nivel: {computedLevel}
                </div>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {criteriaBreakdown.map((cb) => {
                  const status = getCriterionStatus(cb.score, cb.maxScore);
                  const color = getStatusColorClasses(status);
                  return (
                    <div key={cb.criterionId} className="p-4 bg-white hover:bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-bold text-slate-900">
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
                            className="w-16 px-2 py-1 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-lime-400 focus:outline-hidden"
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
                          placeholder="Observación específica..."
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Qualitative Analysis (Summary, Strengths, Critical Areas) */}
          {activeTab === 'narrative' && (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Resumen Ejecutivo / Narrativa de la Evaluación
                </label>
                <textarea
                  rows={4}
                  value={narrativeSummary}
                  onChange={(e) => setNarrativeSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lime-400 focus:outline-hidden text-slate-800 text-xs sm:text-sm leading-relaxed"
                />
              </div>

              {/* Strengths */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fortalezas Destacadas</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStrength}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-1 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {strengths.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleStrengthChange(idx, e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStrength(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Areas */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-rose-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Áreas de Mejora Críticas</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCriticalArea}
                    className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 px-2 py-1 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {criticalAreas.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleCriticalAreaChange(idx, e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCriticalArea(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200 shrink-0">
            <div className="text-xs text-slate-500">
              Puntuación Final: <strong className="text-slate-900">{totalScore} pts</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-102"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Actualizar Reporte</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
