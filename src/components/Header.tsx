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
  Radio,
} from 'lucide-react';
import { StorageManagerModal } from './StorageManagerModal';
import { StoreEvaluation } from '../types';

interface HeaderProps {
  activeTab: 'audios' | 'resumen' | 'evaluaciones';
  setActiveTab: (tab: 'audios' | 'resumen' | 'evaluaciones') => void;
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
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0 py-1"
            onClick={() => setActiveTab('audios')}
            title="Ir a Centro de Audios"
          >
            <div className="bg-lime-400 text-slate-950 font-black tracking-widest text-lg sm:text-xl px-2.5 py-0.5 rounded font-mono shadow-xs">
              IVOO
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Mystery Shopper</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-lime-400 font-mono font-bold border border-slate-700">
                  Julio 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Auditoría Comercial & Benchmark Retail
              </p>
            </div>
          </div>

          {/* Clean 3-Tab Main Navigation */}
          <nav className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-1 scrollbar-none">
            {/* Primary Tab: Audios & AI Hub */}
            <button
              id="nav-tab-audios"
              onClick={() => setActiveTab('audios')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'audios'
                  ? 'bg-lime-400 text-slate-950 shadow-md ring-2 ring-lime-400/50'
                  : 'bg-slate-900 text-lime-400 hover:bg-slate-800 border border-lime-400/30'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Audios & IA</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black ${
                activeTab === 'audios' ? 'bg-slate-950 text-lime-400' : 'bg-lime-400/20 text-lime-300'
              }`}>
                Auto-Auditoría
              </span>
            </button>

            {/* Second Tab: Comparative Summary */}
            <button
              id="nav-tab-resumen"
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'resumen'
                  ? 'bg-slate-800 text-lime-400 border border-lime-400/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Resumen Comparativo</span>
            </button>

            {/* Third Tab: Individual Store Evaluations */}
            <button
              id="nav-tab-evaluaciones"
              onClick={() => setActiveTab('evaluaciones')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'evaluaciones'
                  ? 'bg-slate-800 text-lime-400 border border-lime-400/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Fichas de Tienda ({evaluations.length})</span>
            </button>
          </nav>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsStorageModalOpen(true)}
              title="Gestión de Memoria y Auto-depuración"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-lime-400" />
              <span className="hidden xl:inline">Memoria</span>
            </button>

            <button
              id="btn-print-report"
              onClick={onPrint}
              title="Imprimir o exportar a PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <Printer className="w-3.5 h-3.5" />
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
