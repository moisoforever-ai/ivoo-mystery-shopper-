/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PortadaView } from './components/PortadaView';
import { ResumenComparativoView } from './components/ResumenComparativoView';
import { EvaluacionesIndividualesView } from './components/EvaluacionesIndividualesView';
import { AudioVerificationStudio } from './components/AudioVerificationStudio';
import { GoogleDrivePanel } from './components/GoogleDrivePanel';
import { PrintReportView } from './components/PrintReportView';
import { EVALUATIONS_DATA } from './data/evaluationsData';
import { StoreEvaluation } from './types';
import { loadEvaluations, saveEvaluationsSafely } from './services/storageManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'portada' | 'resumen' | 'evaluaciones' | 'audios' | 'drive'>('portada');
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
      const updatedList = prev.map((item) => (item.id === updated.id ? updated : item));
      saveEvaluationsSafely(updatedList, `Actualización ${updated.storeName}`);
      return updatedList;
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
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'portada' && (
          <PortadaView
            evaluations={evaluations}
            onGoToStore={handleGoToStore}
            onGoToResumen={handleGoToResumen}
          />
        )}

        {activeTab === 'resumen' && (
          <ResumenComparativoView
            evaluations={evaluations}
            onSelectStore={handleGoToStore}
          />
        )}

        {activeTab === 'evaluaciones' && (
          <EvaluacionesIndividualesView
            evaluations={evaluations}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            onUpdateEvaluation={handleUpdateEvaluation}
            onGoToAudios={handleGoToAudios}
          />
        )}

        {activeTab === 'audios' && (
          <AudioVerificationStudio
            evaluations={evaluations}
            selectedStoreId={selectedStoreId}
            onSelectStore={(id) => setSelectedStoreId(id)}
            onUpdateEvaluation={handleUpdateEvaluation}
            onGoToConsolidated={handleGoToResumen}
          />
        )}

        {activeTab === 'drive' && (
          <GoogleDrivePanel
            evaluations={evaluations}
            onUpdateEvaluations={(newList) => {
              setEvaluations(newList);
              saveEvaluationsSafely(newList, 'Sincronización de Google Drive');
            }}
            onGoToResumen={handleGoToResumen}
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
            <span>Auditoría de Calidad y Mystery Shopper • Mayo 2026</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right">
            <span>Uso confidencial interno • Auto-depuración de memoria activa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
