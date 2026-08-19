import React, { useState, useMemo } from 'react';
import { EVALUATIONS_DATA } from '../data/evaluationsData';
import { StoreEvaluation } from '../types';
import {
  IVOO_CRITERIA,
  getCriterionStatus,
  getStatusColorClasses,
  getLevelBadgeClasses,
} from '../data/criteria';
import {
  Trophy,
  BarChart,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ResumenComparativoViewProps {
  evaluations?: StoreEvaluation[];
  onSelectStore: (storeId: string) => void;
}

export const ResumenComparativoView: React.FC<ResumenComparativoViewProps> = ({
  evaluations = EVALUATIONS_DATA,
  onSelectStore,
}) => {
  const [highlightedCriterion, setHighlightedCriterion] = useState<string | null>(null);

  // Memoized statistical & mathematical metrics
  const stats = useMemo(() => {
    const total = evaluations.length || 1;
    const overallAvg = evaluations.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / total;

    const closedCount = evaluations.filter((e) => e.saleClosed).length;
    const closedPercentage = (closedCount / total) * 100;

    const contactCount = evaluations.filter((e) => e.contactCaptured).length;
    const contactPercentage = (contactCount / total) * 100;

    const goodCount = evaluations.filter((e) => e.score >= 75).length;
    const regularCount = evaluations.filter((e) => e.score >= 50 && e.score < 75).length;
    const deficientCount = evaluations.filter((e) => e.score < 50).length;
    const deficientPercentage = (deficientCount / total) * 100;

    const level = overallAvg >= 75 ? 'Bueno' : overallAvg >= 50 ? 'Regular' : 'Deficiente';

    // Unique cities and brands
    const citiesList = Array.from(new Set(evaluations.map((e) => e.city).filter(Boolean)));
    const citiesText = citiesList.join(', ');

    const brandsList = Array.from(new Set(evaluations.map((e) => e.storeName.split(' ')[0]).filter(Boolean)));
    const brandsText = brandsList.join(' / ');

    const dates = Array.from(new Set(evaluations.map((e) => e.recordingDate).filter(Boolean)));
    const periodText = dates.some((d) => d.toLowerCase().includes('julio')) ? 'Julio de 2026' : dates[0] || '2026';

    // Criteria averages across all evaluated stores
    const criteriaAverages = IVOO_CRITERIA.map((criterion) => {
      const totalScore = evaluations.reduce((sum, item) => {
        const found = item.criteriaBreakdown?.find((c) => c.criterionId === criterion.id);
        return sum + (found ? Number(found.score) || 0 : 0);
      }, 0);
      const avg = totalScore / total;
      const percentage = (avg / criterion.maxScore) * 100;
      return {
        ...criterion,
        average: avg,
        percentage,
        status: getCriterionStatus(avg, criterion.maxScore),
      };
    });

    // Sort criteria by performance
    const sortedCriteria = [...criteriaAverages].sort((a, b) => a.percentage - b.percentage);
    const weakestCriteria = sortedCriteria.slice(0, 3);
    const strongestCriteria = [...criteriaAverages].sort((a, b) => b.percentage - a.percentage).slice(0, 3);

    // Sorted evaluations by performance descending
    const sortedEvaluations = [...evaluations].sort((a, b) => b.score - a.score);
    const topEvaluation = sortedEvaluations[0];
    const bottomEvaluation = sortedEvaluations[sortedEvaluations.length - 1];

    return {
      total,
      overallAvg,
      level,
      closedCount,
      closedPercentage,
      contactCount,
      contactPercentage,
      goodCount,
      regularCount,
      deficientCount,
      deficientPercentage,
      citiesList,
      citiesText,
      brandsText,
      periodText,
      criteriaAverages,
      weakestCriteria,
      strongestCriteria,
      sortedEvaluations,
      topEvaluation,
      bottomEvaluation,
    };
  }, [evaluations]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* 1. Context Intro */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
          <BarChart className="w-4 h-4 text-lime-600" />
          <span>Análisis Ejecutivo Consolidado</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Resumen Comparativo — {stats.total} Visitas de Evaluación ({stats.periodText})
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed text-sm sm:text-base">
          Durante la ronda de auditoría comercial Mystery Shopper correspondiente a <strong>{stats.periodText}</strong>, se completaron <strong>{stats.total} evaluaciones presenciales</strong> en tiendas {stats.brandsText} ubicadas en las plazas de <strong>{stats.citiesText}</strong>. La metodología estandarizada evaluó <strong>9 criterios cuantitativos sobre 100 puntos</strong>. El resultado global arroja un promedio de <strong>{stats.overallAvg.toFixed(1)}/100 (Nivel {stats.level})</strong>, con una tasa de cierre de venta del <strong>{stats.closedPercentage.toFixed(1)}%</strong> ({stats.closedCount} de {stats.total} visitas) y una captura de datos de contacto del <strong>{stats.contactPercentage.toFixed(1)}%</strong> ({stats.contactCount} de {stats.total} visitas).
        </p>
      </div>

      {/* 2. Key Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">Promedio General</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{stats.overallAvg.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${getLevelBadgeClasses(stats.level as any)}`}>
            Nivel: {stats.level}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/40">
          <span className="text-xs uppercase font-semibold text-rose-700">Tasa de Cierre</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-rose-700">{stats.closedPercentage.toFixed(1)}%</span>
            <span className="text-xs text-rose-600 font-semibold">({stats.closedCount} / {stats.total})</span>
          </div>
          <span className="inline-block mt-2 text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
            {stats.closedCount === 0 ? 'Crítico transversal' : 'En seguimiento'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">Captura de Contacto</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{stats.contactPercentage.toFixed(1)}%</span>
            <span className="text-xs text-slate-400 font-semibold">({stats.contactCount} / {stats.total})</span>
          </div>
          <span className="inline-block mt-2 text-xs font-medium text-slate-600">
            {stats.contactCount} contacto(s) registrado(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">Distribución de Niveles</span>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold flex-wrap">
            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{stats.goodCount} Bueno</span>
            <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">{stats.regularCount} Regular</span>
            <span className="text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">{stats.deficientCount} Deficiente</span>
          </div>
          <span className="inline-block mt-2 text-xs text-slate-400 font-medium">
            {stats.deficientPercentage.toFixed(1)}% en rango deficiente
          </span>
        </div>
      </div>

      {/* 3. Ranking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking de Visitas y Puntuación General
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenado de mayor a menor desempeño global sobre 100 puntos
            </p>
          </div>
          <div className="text-xs text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <strong>Muestra:</strong> {stats.total} auditorías completas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Tienda</th>
                <th className="py-3.5 px-4">Ciudad</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4 text-center">Punt.</th>
                <th className="py-3.5 px-4 text-center">Nivel</th>
                <th className="py-3.5 px-4 text-center">Venta</th>
                <th className="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.sortedEvaluations.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onSelectStore(item.id)}
                >
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-lime-700">
                    {item.storeName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.city}</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {item.seller === 'No identificado' ? (
                      <span className="italic text-slate-400">No identificado</span>
                    ) : (
                      <strong>{item.seller}</strong>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-base text-slate-900">
                    {item.score}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelBadgeClasses(
                        item.level
                      )}`}
                    >
                      {item.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        item.saleClosed
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {item.saleClosed ? 'Cerrada' : 'No cerrada'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStore(item.id);
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 group-hover:underline cursor-pointer"
                    >
                      <span>Ver</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Comparative Matrix by Criteria (Stores x 9 Criteria) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Comparativo por Criterio (Matriz Detallada)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Desglose cuantitativo de puntuación por cada uno de los 9 criterios metodológicos
              </p>
            </div>

            {/* Color Legend */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="font-semibold text-slate-500">Rangos:</span>
              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Verde: Bueno (≥ 75%)
              </span>
              <span className="flex items-center gap-1 text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span> Marrón: Aceptable (50-74%)
              </span>
              <span className="flex items-center gap-1 text-rose-800 bg-rose-100 px-2 py-0.5 rounded font-bold border border-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span> Rojo: Deficiente (&lt; 50%)
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-3 w-48 text-left border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                  Tienda / Criterio
                </th>
                {IVOO_CRITERIA.map((c) => (
                  <th
                    key={c.id}
                    className={`py-3 px-2 text-center border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors ${
                      highlightedCriterion === c.id ? 'bg-slate-800 text-lime-400' : ''
                    }`}
                    onClick={() =>
                      setHighlightedCriterion(highlightedCriterion === c.id ? null : c.id)
                    }
                    title={c.description}
                  >
                    <div className="font-bold">{c.shortName}</div>
                    <div className="text-[10px] text-slate-400">Máx {c.maxScore}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center bg-slate-950 font-bold">Total (100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.sortedEvaluations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td
                    className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white shadow-xs cursor-pointer hover:text-lime-700"
                    onClick={() => onSelectStore(item.id)}
                  >
                    <div className="truncate max-w-[180px]">{item.storeName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{item.seller}</div>
                  </td>
                  {IVOO_CRITERIA.map((c) => {
                    const scoreObj = item.criteriaBreakdown?.find(
                      (cb) => cb.criterionId === c.id
                    );
                    const score = scoreObj ? scoreObj.score : 0;
                    const status = getCriterionStatus(score, c.maxScore);
                    const colorStyle = getStatusColorClasses(status);

                    return (
                      <td
                        key={c.id}
                        className={`py-2 px-1 text-center font-mono font-bold border-r border-slate-100 ${
                          highlightedCriterion === c.id ? 'ring-2 ring-lime-400 inset-0' : ''
                        }`}
                      >
                        <span
                          className={`inline-block w-8 py-0.5 rounded text-center ${colorStyle.badge} border`}
                        >
                          {score}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center font-mono font-black text-sm text-slate-900 bg-slate-50">
                    {item.score}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Summary Averages Row */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td className="py-3 px-3 text-slate-900 font-bold border-r border-slate-200 sticky left-0 bg-slate-100">
                  Promedio por Criterio
                </td>
                {stats.criteriaAverages.map((c) => {
                  const colorStyle = getStatusColorClasses(c.status);
                  return (
                    <td key={c.id} className="py-3 px-1 text-center font-mono border-r border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${colorStyle.badge} border`}>
                        {c.average.toFixed(1)}
                      </span>
                      <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                        {c.percentage.toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
                <td className="py-3 px-3 text-center font-mono font-black text-sm text-slate-950 bg-slate-200">
                  {stats.overallAvg.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Transversal Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patrones Comunes Negativos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-200">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-base mb-4">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>Patrones Críticos y Brechas Identificadas ({stats.total} Evaluaciones)</span>
          </div>
          <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Cierre comercial deficitario ({stats.closedPercentage.toFixed(0)}% de éxito):</strong> En {stats.total - stats.closedCount} de las {stats.total} tiendas evaluadas, el vendedor omitió formular un intento explícito de cierre o apartado, dejando marchar al cliente ante dudas de aplazamiento.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Pérdida de captación de clientes ({stats.contactPercentage.toFixed(0)}% de efectividad):</strong> Solo se registraron datos en {stats.contactCount} de las {stats.total} interacciones, desaprovechando la oportunidad de enviar cotizaciones formales por WhatsApp o realizar seguimiento comercial.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Criterios de menor desempeño:</strong> {stats.weakestCriteria.map((c) => `${c.name} (${c.percentage.toFixed(0)}%)`).join(', ')}, señalando la urgencia de fortalecer la detección de necesidades y la proactividad en el piso de venta.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Dispersión de servicio:</strong> La brecha entre la tienda con mayor puntuación ({stats.topEvaluation?.storeName} con {stats.topEvaluation?.score} pts) y la de menor ({stats.bottomEvaluation?.storeName} con {stats.bottomEvaluation?.score} pts) es de {((stats.topEvaluation?.score || 0) - (stats.bottomEvaluation?.score || 0))} puntos, evidenciando heterogeneidad en los estándares de atención.
              </div>
            </li>
          </ul>
        </div>

        {/* Fortalezas Destacadas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-4">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>Fortalezas y Prácticas Ejemplares en Tiendas</span>
          </div>
          <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Criterios con mejor valoración:</strong> {stats.strongestCriteria.map((c) => `${c.name} (${c.percentage.toFixed(0)}%)`).join(', ')}, demostrando buena actitud general y dominio en características de producto y formas de pago.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Dominio en medios de pago y financiamiento:</strong> Claridad en el desglose de precios en divisas, bolívares a tasa oficial y opciones de financiamiento y crédito en piso de venta.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Exhibición y ambientación tecnológica:</strong> Equipos de pantallas y tecnología encendidos y exhibidos adecuadamente para permitir la comparación visual directa por parte del comprador.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Tiendas de referencia en el ranking:</strong> Sucursales como {stats.topEvaluation?.storeName} ({stats.topEvaluation?.score} pts) demuestran que la aplicación consistente del protocolo eleva el nivel de satisfacción comercial.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* 6. Strategic Priority Recommendations */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-lime-400 font-mono text-xs uppercase font-bold tracking-widest mb-2">
          <Lightbulb className="w-4 h-4" />
          <span>Plan de Acción Estratégico</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Recomendaciones Prioritarias para la Dirección Comercial
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6">
          Ejes de intervención comercial inmediata aplicables a la red de tiendas en {stats.citiesText}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">1</span>
              <span>Implementar protocolo obligatorio de cierre de venta</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Entrenar a la fuerza de ventas en preguntas de transición y cierre por alternativa ("¿Preparamos la factura para entrega inmediata o reservamos el modelo?") ante cualquier señal de interés del comprador.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">2</span>
              <span>Captura sistemática de número telefónico (WhatsApp)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Establecer como KPI que todo asesor solicite el teléfono del cliente para enviar cotización digital, ficha técnica o notificar ofertas, asegurando el seguimiento post-visita.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">3</span>
              <span>Estandarizar el protocolo de saludo y bienvenida en 10 segundos</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Exigir contacto visual inmediato, sonrisa, presentación con nombre del asesor y bienvenida proactiva en puerta, erradicando los tiempos muertos de espera y el uso de celulares personales en pasillos.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">4</span>
              <span>Profundizar el sondeo de necesidades y venta consultiva</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Capacitar en preguntas abiertas sobre dimensiones, usos específicos y preferencias antes de ofrecer opciones, evitando limitarse únicamente al rango de precio inicial del cliente.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">5</span>
              <span>Incentivar la venta cruzada (Cross-Selling)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Vincular de forma natural accesorios complementarios indispensables (protectores de voltaje, soportes de pared articulados, cables certificados y periféricos) en cada cotización realizada.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">6</span>
              <span>Homologación de estándares entre sucursales</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Desplegar un plan de acompañamiento y nivelación en las sucursales con calificaciones menores a 60 puntos en las plazas de {stats.citiesText}, alineándolas con el rendimiento de las tiendas líderes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

