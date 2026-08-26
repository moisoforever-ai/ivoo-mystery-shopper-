import React, { useState, useMemo } from 'react';
import { EVALUATIONS_DATA } from '../data/evaluationsData';
import { StoreEvaluation, BrandCategory } from '../types';
import {
  IVOO_CRITERIA,
  getCriterionStatus,
  getStatusColorClasses,
  getLevelBadgeClasses,
} from '../data/criteria';
import {
  getMonthlyConsolidatedSummaries,
  getComparativeCriteriaMatrix,
  normalizeEvaluationsList,
} from '../utils/evaluationHelpers';
import {
  Trophy,
  BarChart,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Building2,
} from 'lucide-react';

interface ResumenComparativoViewProps {
  evaluations?: StoreEvaluation[];
  onSelectStore: (storeId: string) => void;
}

export const ResumenComparativoView: React.FC<ResumenComparativoViewProps> = ({
  evaluations = EVALUATIONS_DATA,
  onSelectStore,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBrandCategory, setSelectedBrandCategory] = useState<'all' | 'IVOO' | 'COMPETENCIA'>('all');
  const [highlightedCriterion, setHighlightedCriterion] = useState<string | null>(null);

  // Normalize evaluations
  const normalizedAll = useMemo(() => normalizeEvaluationsList(evaluations), [evaluations]);

  // Monthly summary cards across entire history
  const monthlySummaries = useMemo(() => getMonthlyConsolidatedSummaries(normalizedAll), [normalizedAll]);

  // Available months extracted dynamically
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set<string>(normalizedAll.map((e) => e.monthPeriod || '2026-07')));
    return months.sort((a, b) => b.localeCompare(a));
  }, [normalizedAll]);

  // Filter evaluations based on active selection
  const filteredEvaluations = useMemo(() => {
    return normalizedAll.filter((item) => {
      const matchMonth = selectedMonth === 'all' || item.monthPeriod === selectedMonth;
      const matchBrand =
        selectedBrandCategory === 'all' || item.brandCategory === selectedBrandCategory;
      return matchMonth && matchBrand;
    });
  }, [normalizedAll, selectedMonth, selectedBrandCategory]);

  // Comparative Criteria Matrix between IVOO and Competencia for the active month selection
  const criteriaBenchmark = useMemo(() => {
    const monthFiltered = selectedMonth === 'all'
      ? normalizedAll
      : normalizedAll.filter((i) => i.monthPeriod === selectedMonth);
    return getComparativeCriteriaMatrix(monthFiltered);
  }, [normalizedAll, selectedMonth]);

  // Memoized statistical & mathematical metrics for the filtered view
  const stats = useMemo(() => {
    const total = filteredEvaluations.length || 1;
    const overallAvg = filteredEvaluations.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / total;

    const closedCount = filteredEvaluations.filter((e) => e.saleClosed).length;
    const closedPercentage = (closedCount / total) * 100;

    const contactCount = filteredEvaluations.filter((e) => e.contactCaptured).length;
    const contactPercentage = (contactCount / total) * 100;

    const goodCount = filteredEvaluations.filter((e) => e.score >= 75).length;
    const regularCount = filteredEvaluations.filter((e) => e.score >= 50 && e.score < 75).length;
    const deficientCount = filteredEvaluations.filter((e) => e.score < 50).length;
    const deficientPercentage = (deficientCount / total) * 100;

    const level = overallAvg >= 75 ? 'Bueno' : overallAvg >= 50 ? 'Regular' : 'Deficiente';

    // IVOO vs Competitor breakdown within filtered dataset
    const ivooItems = filteredEvaluations.filter((e) => e.brandCategory === 'IVOO' || e.brand === 'IVOO');
    const compItems = filteredEvaluations.filter((e) => e.brandCategory === 'COMPETENCIA' || e.brand !== 'IVOO');

    const ivooAvg = ivooItems.length > 0 ? ivooItems.reduce((acc, i) => acc + (Number(i.score) || 0), 0) / ivooItems.length : 0;
    const compAvg = compItems.length > 0 ? compItems.reduce((acc, i) => acc + (Number(i.score) || 0), 0) / compItems.length : 0;
    const deltaScore = ivooAvg - compAvg;

    // Unique cities and brands
    const citiesList = Array.from(new Set(filteredEvaluations.map((e) => e.city).filter(Boolean)));
    const citiesText = citiesList.join(', ');

    const brandsList = Array.from(new Set(filteredEvaluations.map((e) => e.brand || e.storeName.split(' ')[0]).filter(Boolean)));
    const brandsText = brandsList.join(' / ');

    const dates = Array.from(new Set(filteredEvaluations.map((e) => e.recordingDate).filter(Boolean)));
    const periodText = selectedMonth === 'all'
      ? 'Histórico Consolidado'
      : (monthlySummaries.find((m) => m.monthPeriod === selectedMonth)?.monthName || dates[0] || '2026');

    // Criteria averages across all evaluated stores in active filter
    const criteriaAverages = IVOO_CRITERIA.map((criterion) => {
      const totalScore = filteredEvaluations.reduce((sum, item) => {
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
    const sortedEvaluations = [...filteredEvaluations].sort((a, b) => b.score - a.score);
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
      ivooItems,
      compItems,
      ivooAvg,
      compAvg,
      deltaScore,
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
  }, [filteredEvaluations, selectedMonth, monthlySummaries]);

  const getBrandBadge = (brandName?: string, category?: BrandCategory) => {
    const b = (brandName || '').toUpperCase();
    if (b.includes('IVOO') || category === 'IVOO') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black bg-lime-400 text-slate-950 border border-lime-500 shadow-xs">
          IVOO
        </span>
      );
    }
    if (b.includes('DAKA')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
          DAKA
        </span>
      );
    }
    if (b.includes('DAMASCO')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
          DAMASCO
        </span>
      );
    }
    if (b.includes('MULTIMAX')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
          MULTIMAX
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300">
        COMPETENCIA
      </span>
    );
  };

  if (evaluations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 sm:px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5">
          <BarChart className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Todavía no hay nada que comparar</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          El panel comparativo entre tiendas va a aparecer aquí en cuanto tengas al menos una
          evaluación completada.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* 1. Interactive Consolidation & Filtering Controls */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-lime-400 font-mono text-xs uppercase font-bold tracking-wider mb-1">
            <Calendar className="w-4 h-4" />

            <span>Consolidado Mensual & Segmentación de Base de Datos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Panel de Control y Registro Histórico
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Analiza evaluaciones por período mensual y contrasta el desempeño de IVOO frente a competidores directos.
          </p>
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mes / Período:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-lime-400 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🌟 Todos los Meses ({normalizedAll.length} visitas)</option>
              {availableMonths.map((m) => {
                const summary = monthlySummaries.find((s) => s.monthPeriod === m);
                return (
                  <option key={m} value={m}>
                    📅 {summary?.monthName || m} ({summary?.totalVisits || 0} visitas)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Brand Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Segmento de Red:
            </label>
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedBrandCategory('all')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  selectedBrandCategory === 'all'
                    ? 'bg-slate-700 text-lime-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrandCategory('IVOO')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  selectedBrandCategory === 'IVOO'
                    ? 'bg-lime-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Solo IVOO
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrandCategory('COMPETENCIA')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  selectedBrandCategory === 'COMPETENCIA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Competencia
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Registry Table (Registro por Mes de Consolidados) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-lime-600" />
              <span>Registro Histórico de Consolidados por Mes</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evolución cronológica de visitas, puntajes comparativos y brecha diferencial (IVOO vs Competencia)
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2.5 py-1 rounded-full">
            {monthlySummaries.length} Período(s) Registrado(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/90 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mes / Período</th>
                <th className="py-3 px-3 text-center">Total Visitas</th>
                <th className="py-3 px-3 text-center">Muestras IVOO</th>
                <th className="py-3 px-3 text-center">Muestras Competencia</th>
                <th className="py-3 px-3 text-center bg-slate-100">Promedio General</th>
                <th className="py-3 px-3 text-center bg-lime-50 text-lime-900">Promedio IVOO</th>
                <th className="py-3 px-3 text-center bg-blue-50 text-blue-900">Promedio Competencia</th>
                <th className="py-3 px-3 text-center">Brecha (Delta)</th>
                <th className="py-3 px-3 text-center">Tasa Cierre</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthlySummaries.map((m) => {
                const isSelected = selectedMonth === m.monthPeriod;
                return (
                  <tr
                    key={m.monthPeriod}
                    className={`transition-colors ${
                      isSelected ? 'bg-lime-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-lime-500"></span>
                      <span>{m.monthName}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{m.totalVisits}</td>
                    <td className="py-3 px-3 text-center font-mono text-lime-700 font-bold">
                      {m.ivooVisits}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-blue-700 font-bold">
                      {m.competenciaVisits}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                      {m.avgScoreTotal.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-lime-900 bg-lime-50/50">
                      {m.avgScoreIvoo > 0 ? `${m.avgScoreIvoo.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-blue-900 bg-blue-50/50">
                      {m.avgScoreCompetencia > 0 ? `${m.avgScoreCompetencia.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {m.avgScoreIvoo > 0 && m.avgScoreCompetencia > 0 ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                            m.deltaScore >= 0
                              ? 'text-emerald-800 bg-emerald-100'
                              : 'text-rose-800 bg-rose-100'
                          }`}
                        >
                          {m.deltaScore >= 0 ? '+' : ''}
                          {m.deltaScore.toFixed(1)} pts
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {m.closedRateIvoo.toFixed(0)}% IVOO / {m.closedRateCompetencia.toFixed(0)}% Comp
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedMonth(m.monthPeriod)}
                        className={`text-xs font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-lime-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Activo' : 'Filtrar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Competitive Benchmark Matrix (IVOO vs Competencia) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <Building2 className="w-4 h-4 text-lime-600" />
              <span>Benchmark Competitivo • {stats.periodText}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Matriz Comparativa de Criterios: IVOO vs Red Competidora
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo de brecha diferencial (Delta = Promedio IVOO - Promedio Competencia) por cada uno de los 9 criterios comerciales
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-lime-400 border border-lime-600"></span>
              <span>IVOO Promedio: <strong>{stats.ivooAvg.toFixed(1)}/100</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Competencia Promedio: <strong>{stats.compAvg.toFixed(1)}/100</strong></span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/80 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Criterio de Evaluación</th>
                <th className="py-3.5 px-3 text-center">Puntaje Máx</th>
                <th className="py-3.5 px-3 text-center bg-lime-50/70 text-lime-900 font-black">
                  Promedio IVOO
                </th>
                <th className="py-3.5 px-3 text-center bg-blue-50/70 text-blue-900 font-black">
                  Promedio Competencia
                </th>
                <th className="py-3.5 px-3 text-center font-bold">Brecha Diferencial (Delta)</th>
                <th className="py-3.5 px-4 text-center">Liderazgo en Criterio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {criteriaBenchmark.map((crit) => {
                const isIvooLead = crit.delta > 0;
                const isTie = crit.delta === 0;

                return (
                  <tr key={crit.criterionId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {crit.name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500 font-semibold">
                      {crit.maxScore} pts
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-lime-950 bg-lime-50/30">
                      {crit.avgIvoo.toFixed(1)} ({crit.percentIvoo.toFixed(0)}%)
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-blue-950 bg-blue-50/30">
                      {crit.avgComp.toFixed(1)} ({crit.percentComp.toFixed(0)}%)
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          isIvooLead
                            ? 'text-emerald-800 bg-emerald-100 font-bold'
                            : isTie
                            ? 'text-slate-700 bg-slate-100'
                            : 'text-rose-800 bg-rose-100 font-bold'
                        }`}
                      >
                        {isIvooLead ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                        ) : isTie ? null : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-700" />
                        )}
                        {crit.delta >= 0 ? '+' : ''}
                        {crit.delta.toFixed(1)} pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-black ${
                          isIvooLead
                            ? 'bg-lime-400 text-slate-950 border border-lime-500'
                            : isTie
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {crit.winner}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Key Metrics Summary Cards for Filtered Set */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs uppercase font-semibold text-slate-500">
            Promedio Segmentado
          </span>
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
            {stats.closedCount === 0 ? 'Crítico transversal' : `${stats.closedCount} venta(s) cerrada(s)`}
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

      {/* 5. Ranking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Ranking de Visitas y Puntuación General ({stats.periodText})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenado de mayor a menor desempeño global sobre 100 puntos
            </p>
          </div>
          <div className="text-xs text-slate-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <strong>Muestra Activa:</strong> {stats.total} auditorías
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Cadena</th>
                <th className="py-3.5 px-4">Tienda / Sucursal</th>
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
                  <td className="py-3.5 px-4">
                    {getBrandBadge(item.brand || item.storeName, item.brandCategory)}
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

      {/* 6. Full Criteria Matrix (Tiendas x 9 Criterios) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Matriz General por Criterio ({stats.periodText})
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

      {/* 7. Transversal Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patrones Comunes Negativos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-200">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-base mb-4">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>Patrones Críticos y Brechas Identificadas ({stats.periodText})</span>
          </div>
          <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Cierre comercial deficitario ({stats.closedPercentage.toFixed(0)}% de éxito):</strong> En {stats.total - stats.closedCount} de las {stats.total} visitas evaluadas, el vendedor omitió formular un intento explícito de cierre o apartado.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Pérdida de captación de clientes ({stats.contactPercentage.toFixed(0)}% de efectividad):</strong> Solo se registraron datos en {stats.contactCount} de las {stats.total} interacciones, desaprovechando la oportunidad de enviar cotizaciones formales por WhatsApp.
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
                <strong>Dispersión de servicio:</strong> La brecha entre la tienda con mayor puntuación ({stats.topEvaluation?.storeName} con {stats.topEvaluation?.score} pts) y la de menor ({stats.bottomEvaluation?.storeName} con {stats.bottomEvaluation?.score} pts) es de {((stats.topEvaluation?.score || 0) - (stats.bottomEvaluation?.score || 0))} puntos.
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
                <strong>Exhibición y ambientación tecnológica:</strong> Equipos de pantallas y tecnología encendidos y exhibidos adecuadamente para permitir la comparación visual directa.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
              <div>
                <strong>Tiendas de referencia:</strong> Sucursales como {stats.topEvaluation?.storeName} ({stats.topEvaluation?.score} pts) demuestran que la aplicación consistente del protocolo eleva el nivel de satisfacción comercial.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* 8. Strategic Recommendations */}
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
              Exigir contacto visual inmediato, sonrisa, presentación con nombre del asesor y bienvenida proactiva en puerta, erradicando los tiempos muertos de espera.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2 text-lime-400 font-bold mb-1.5">
              <span className="bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded text-xs">4</span>
              <span>Profundizar el sondeo de necesidades y venta consultiva</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Capacitar en preguntas abiertas sobre dimensiones, usos específicos y preferencias antes de ofrecer opciones, evitando limitarse únicamente al rango de precio inicial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
