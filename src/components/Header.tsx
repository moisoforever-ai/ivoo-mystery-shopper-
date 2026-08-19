import React, { useState } from 'react';
import {
  FileText,
  BarChart3,
  ListOrdered,
  FolderSync,
  Printer,
  ShieldCheck,
  HardDrive,
  FileAudio,
  Sparkles,
} from 'lucide-react';
import { StorageManagerModal } from './StorageManagerModal';
import { StoreEvaluation } from '../types';

interface HeaderProps {
  activeTab: 'portada' | 'resumen' | 'evaluaciones' | 'audios' | 'drive';
  setActiveTab: (tab: 'portada' | 'resumen' | 'evaluaciones' | 'audios' | 'drive') => void;
  onPrint: () => void;
  evaluations?: StoreEvaluation[];
  onResetEvaluations?: (evals: StoreEvaluation[]) => void;
  selectedStoreId?: string;
  onSelectStore?: (storeId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  evaluations = [],
  onResetEvaluations,
}) => {
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const verifiedCount = evaluations.filter(
    (e) => e.verificationStatus === 'verified' || e.verificationStatus === 'ai_transcribed'
  ).length;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('portada')}
          >
            <div className="bg-lime-400 text-slate-950 font-black tracking-widest text-xl px-2.5 py-1 rounded font-mono shadow-xs">
              IVOO
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
                <span>Mystery Shopper</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-lime-400 font-mono font-normal">
                  Julio 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Informe Consolidado • {evaluations.length} Evaluaciones Benchmark
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-tab-portada"
              onClick={() => setActiveTab('portada')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'portada'
                  ? 'bg-slate-800 text-lime-400 border-b-2 border-lime-400 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Portada</span>
            </button>

            <button
              id="nav-tab-resumen"
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-slate-800 text-lime-400 border-b-2 border-lime-400 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Resumen Comparativo</span>
            </button>

            <button
              id="nav-tab-evaluaciones"
              onClick={() => setActiveTab('evaluaciones')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'evaluaciones'
                  ? 'bg-slate-800 text-lime-400 border-b-2 border-lime-400 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Evaluaciones ({evaluations.length})</span>
            </button>

            <button
              id="nav-tab-drive"
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-slate-800 text-lime-400 border-b-2 border-lime-400 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderSync className="w-4 h-4 text-lime-400" />
              <span className="font-bold">⚡ Automatización Drive & IA</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-lime-400/20 text-lime-300 border border-lime-400/30">
                {verifiedCount}/{evaluations.length}
              </span>
            </button>

            <button
              id="nav-tab-audios"
              onClick={() => setActiveTab('audios')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer text-slate-400 hover:text-slate-200 ${
                activeTab === 'audios'
                  ? 'bg-slate-800 text-slate-200 border-b-2 border-slate-400 font-semibold'
                  : 'hover:bg-slate-800/60'
              }`}
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-xs">Visor Manual</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStorageModalOpen(true)}
              title="Gestión de Memoria y Auto-depuración"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-lime-400" />
              <span className="hidden xl:inline">Memoria / Auto-Depuración</span>
            </button>

            <button
              id="btn-print-report"
              onClick={onPrint}
              title="Imprimir o exportar a PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar confidentiality notice */}
      <div className="bg-slate-950/80 px-4 py-1 text-[11px] text-slate-400 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-1 max-w-7xl mx-auto w-full">
          <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
          <span className="truncate">Documento confidencial — Uso interno IVOO Retail | Metodología de 9 Criterios (100 Pts)</span>
        </div>
      </div>

      {/* Storage & Auto-Purge Management Modal */}
      {isStorageModalOpen && (
        <StorageManagerModal
          evaluations={evaluations}
          onResetData={(reset) => {
            if (onResetEvaluations) onResetEvaluations(reset);
          }}
          onClose={() => setIsStorageModalOpen(false)}
        />
      )}
    </header>
  );
};
