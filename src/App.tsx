/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioAuditorHub } from './components/AudioAuditorHub';
import { ResumenComparativoView } from './components/ResumenComparativoView';
import { EvaluacionesIndividualesView } from './components/EvaluacionesIndividualesView';
import { PrintReportView } from './components/PrintReportView';
import { EVALUATIONS_DATA } from './data/evaluationsData';
import { StoreEvaluation } from './types';
import { loadEvaluations, saveEvaluationsSafely } from './services/storageManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'audios' | 'resumen' | 'evaluaciones'>('audios');
  const [evaluations, setEvaluations] = useState<StoreEvaluation[]>(() => {
    return loadEvaluations();
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>(evaluations[0]?.id || EVALUATIONS_DATA[0].id);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);

  useEffect(() => {
    saveEvaluationsSafely(evaluations, 'Sincronización de estado');
  }, [evaluations]);

  const handleUpdateEvaluation = (updated: StoreEvaluation) => {
    setEvaluations((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      const updatedList = exists
        ? prev.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...prev];
      saveEvaluationsSafely(updatedList, `Actualización ${updated.storeName}`);
      return updatedList;
    });
  };

  const handleUpdateEvaluationsList = (newList: StoreEvaluation[]) => {
    setEvaluations(newList);
    saveEvaluationsSafely(newList, 'Actualización masiva de evaluaciones');
  };

  const handleDeleteEvaluation = (storeId: string) => {
    setEvaluations((prev) => {
      const filtered = prev.filter((e) => e.id !== storeId);
      saveEvaluationsSafely(filtered, 'Eliminación de evaluación');
      if (selectedStoreId === storeId && filtered.length > 0) {
        setSelectedStoreId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleGoToStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setActiveTab('evaluaciones');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAudios = (storeId?: string) => {
    if (storeId) setSelectedStoreId(storeId);
    setActiveTab('audios');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToResumen = () => {
    setActiveTab('resumen');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-lime-400 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={() => setIsPrintOpen(true)}
        evaluations={evaluations}
        onResetEvaluations={(resetEvals) => setEvaluations(resetEvals)}
        selectedStoreId={selectedStoreId}
        onSelectStore={(id) => setSelectedStoreId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Tab 1: Primary Audio & AI Studio Hub */}
        {activeTab === 'audios' && (
          <AudioAuditorHub
            evaluations={evaluations}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            onUpdateEvaluation={handleUpdateEvaluation}
            onUpdateEvaluationsList={handleUpdateEvaluationsList}
            onGoToConsolidated={handleGoToResumen}
            onGoToFicha={handleGoToStore}
          />
        )}

        {/* Tab 2: Comparative Summary & Benchmark */}
        {activeTab === 'resumen' && (
          <ResumenComparativoView
            evaluations={evaluations}
            onSelectStore={handleGoToStore}
          />
        )}

        {/* Tab 3: Individual Store Mystery Shopper Scorecards */}
        {activeTab === 'evaluaciones' && (
          <EvaluacionesIndividualesView
            evaluations={evaluations}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            onUpdateEvaluation={handleUpdateEvaluation}
            onDeleteEvaluation={handleDeleteEvaluation}
            onGoToAudios={handleGoToAudios}
          />
        )}
      </main>

      {/* Full Document Print & PDF Export Modal */}
      {isPrintOpen && (
        <PrintReportView
          evaluations={evaluations}
          onClose={() => setIsPrintOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-lime-400 bg-slate-800 px-2 py-0.5 rounded">
              IVOO
            </span>
            <span>Auditoría de Calidad y Mystery Shopper • Julio 2026</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right">
            <span>Uso confidencial interno • Auditoría impulsada por Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
