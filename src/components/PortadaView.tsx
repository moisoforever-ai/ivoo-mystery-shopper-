import React from 'react';
import { EVALUATIONS_DATA, REPORT_METADATA } from '../data/evaluationsData';
import { StoreEvaluation } from '../types';
import { getLevelBadgeClasses } from '../data/criteria';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Lock,
  ChevronRight,
  Award,
  AlertCircle,
  TrendingDown,
  Building2,
  Users,
} from 'lucide-react';

interface PortadaViewProps {
  evaluations?: StoreEvaluation[];
  onGoToStore: (storeId: string) => void;
  onGoToResumen: () => void;
}

export const PortadaView: React.FC<PortadaViewProps> = ({
  evaluations = EVALUATIONS_DATA,
  onGoToStore,
  onGoToResumen,
}) => {
  const avgScore = evaluations.reduce((acc, e) => acc + e.score, 0) / (evaluations.length || 1);
  const cities = Array.from(new Set(evaluations.map((e) => e.city)));
  const dates = Array.from(new Set(evaluations.map((e) => e.recordingDate)));
  const periodText = dates.length > 0 && dates[0].includes('julio') ? 'Julio 2026' : REPORT_METADATA.period;
  const closedCount = evaluations.filter((e) => e.saleClosed).length;
  const closedPercent = Math.round((closedCount / (evaluations.length || 1)) * 100);
  const contactCount = evaluations.filter((e) => e.contactCaptured).length;
  const contactPercent = Math.round((contactCount / (evaluations.length || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Main Cover Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-10">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-12 text-white relative">
          <div className="flex justify-between items-start">
            <div className="inline-block bg-lime-400 text-slate-950 font-black text-3xl sm:text-4xl px-4 py-1.5 rounded-lg tracking-widest font-mono shadow-md">
              IVOO
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-full">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              CONFIDENCIAL — USO INTERNO
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest font-mono text-lime-400 font-semibold mb-2">
              AUDITORÍA DE CALIDAD DE SERVICIO Y EXPERIENCIA COMERCIAL
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Evaluaciones Mystery Shopper
            </h1>
            <h2 className="text-xl sm:text-2xl text-slate-300 font-medium mt-3">
              {REPORT_METADATA.reportType}
            </h2>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-lime-400 shrink-0" />
              <span><strong>Período:</strong> {periodText}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span><strong>Muestra:</strong> {evaluations.length} evaluaciones</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span><strong>Metodología:</strong> 9 criterios (100 pts)</span>
            </div>
          </div>
        </div>

        {/* Cities & Scope Badges */}
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mr-2">
              <MapPin className="w-4 h-4 text-slate-600" />
              Plazas Evaluadas:
            </span>
            {cities.map((city) => (
              <span
                key={city}
                className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs"
              >
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* Executive Highlights Summary */}
        <div className="p-8 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-slate-500">Promedio General</span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{avgScore.toFixed(1)}</span>
                <span className="text-sm font-semibold text-slate-500">/ 100</span>
              </div>
              <p className="text-xs text-amber-800 font-medium mt-1 inline-block px-2 py-0.5 rounded bg-amber-100">
                Nivel Global: {avgScore >= 75 ? 'Bueno' : avgScore >= 50 ? 'Regular' : 'Deficiente'}
              </p>
            </div>

            <div className="bg-rose-50 rounded-xl p-5 border border-rose-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-rose-700">Tasa de Cierre</span>
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-800">{closedPercent}%</span>
                <span className="text-sm font-semibold text-rose-600">({closedCount} de {evaluations.length})</span>
              </div>
              <p className="text-xs text-rose-700 font-medium mt-1">
                {closedCount === 0 ? 'Ninguna venta fue concretada en tienda' : `${closedCount} ventas concretadas`}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-slate-500">Captura de Contacto</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{contactPercent}%</span>
                <span className="text-sm font-semibold text-slate-500">({contactCount} de {evaluations.length})</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {contactCount === 0 ? 'Sin recolección de datos de clientes' : `${contactCount} clientes registrados`}
              </p>
            </div>
          </div>

          {/* Table of Contents (Índice de Contenidos) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  Índice de Evaluaciones por Tienda (Ranking)
                </h3>
                <p className="text-xs text-slate-400">
                  Selecciona una tienda para consultar su desglose individual y transcripción completa
                </p>
              </div>
              <button
                onClick={onGoToResumen}
                className="text-xs font-semibold px-3 py-1.5 rounded bg-lime-400 text-slate-950 hover:bg-lime-300 transition-colors flex items-center gap-1 shadow-xs"
              >
                Ver Resumen Comparativo
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {evaluations.map((evalItem, index) => (
                <div
                  key={evalItem.id}
                  onClick={() => onGoToStore(evalItem.id)}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-lime-700 transition-colors text-sm sm:text-base">
                          {evalItem.storeName}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClasses(
                            evalItem.level
                          )}`}
                        >
                          {evalItem.level}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Vendedor: <strong>{evalItem.seller}</strong></span>
                        <span>•</span>
                        <span>Fecha: {evalItem.recordingDate}</span>
                        <span>•</span>
                        <span>Categoría: {evalItem.productEvaluated.split('(')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        {evalItem.score}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        evalItem.saleClosed 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                          : 'text-rose-600 bg-rose-50 border-rose-200'
                      }`}>
                        {evalItem.saleClosed ? 'Venta cerrada' : 'Sin cierre'}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Nota Metodológica & Propiedad Intelectual</p>
              <p className="mt-0.5 leading-relaxed">
                Este informe contiene el análisis riguroso de {evaluations.length} visitas presenciales efectuadas por evaluadores incógnitos bajo la metodología Mystery Shopper en las plazas de {cities.join(', ')}. Todos los audios, transcripciones literales y notas de campo han sido verificados conforme a la matriz oficial de 9 criterios de evaluación comercial (100 puntos máximos). Prohibida su reproducción o divulgación externa sin autorización escrita.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
