import React, { useState } from 'react';
import {
  getStorageStats,
  autoPurgeStorage,
  resetToFactoryData,
  exportBackupJSON,
  StorageStats,
} from '../services/storageManager';
import { StoreEvaluation } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  HardDrive,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface StorageManagerModalProps {
  evaluations: StoreEvaluation[];
  onResetData: (evals: StoreEvaluation[]) => void;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  evaluations,
  onResetData,
  onClose,
}) => {
  const [stats, setStats] = useState<StorageStats>(getStorageStats());
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'warn'; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    icon?: 'trash' | 'warning' | 'restore';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleManualPurge = () => {
    const result = autoPurgeStorage(true);
    setStats(getStorageStats());
    setMessage({
      type: 'success',
      text: `Auto-depuración ejecutada con éxito. Se liberaron ${result.freedBytes} bytes y ${result.purgedCount} elementos temporales antiguos.`,
    });
  };

  const handleExportBackup = () => {
    exportBackupJSON(evaluations);
    setMessage({
      type: 'success',
      text: 'Respaldo completo descargado en formato JSON.',
    });
  };

  const handleResetFactory = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restablecer Fichas Oficiales',
      message:
        '¿Estás seguro de restablecer los datos a los valores originales de fábrica? Se recargarán las 7 evaluaciones oficiales de IVOO.',
      confirmText: 'Restablecer',
      variant: 'primary',
      icon: 'restore',
      onConfirm: () => {
        const reset = resetToFactoryData();
        onResetData(reset);
        setStats(getStorageStats());
        setMessage({
          type: 'info',
          text: 'Datos restablecidos a los valores oficiales de auditoría de IVOO.',
        });
      },
    });
  };

  const handleStartBlank = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Iniciar Reporte en Blanco',
      message:
        '¿Deseas iniciar un reporte nuevo en blanco? Se vaciarán las evaluaciones viejas para que puedas cargar tus nuevas notas de voz sin mezclarlas. (Podrás restaurar los datos oficiales en cualquier momento).',
      confirmText: 'Sí, Vaciar Todo',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        onResetData([]);
        setStats(getStorageStats());
        setMessage({
          type: 'success',
          text: 'Se ha creado un reporte en blanco. Ahora puedes subir o auditar tus nuevos audios.',
        });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-lime-400 text-slate-950">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Memoria y Auto-Depuración
              </h3>
              <p className="text-xs text-slate-400">
                Gestión de almacenamiento local y depuración de archivos viejos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {message && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : message.type === 'warn'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium text-xs leading-relaxed">{message.text}</p>
            </div>
          )}

          {/* Storage Gauge */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Espacio de Almacenamiento Utilizado:</span>
              <span className="font-mono font-black text-slate-900">
                {stats.usedFormatted} / {stats.maxFormatted} ({stats.percentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  stats.percentage > 80
                    ? 'bg-rose-500'
                    : stats.percentage > 50
                    ? 'bg-amber-500'
                    : 'bg-lime-500'
                }`}
                style={{ width: `${Math.max(2, stats.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auto-depuración activa (FIFO)
              </span>
              <span>{stats.snapshotCount} revisiones guardadas</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime-600" />
              ¿Cómo funciona la auto-depuración?
            </p>
            <p>
              La aplicación monitoriza el uso de memoria en cada guardado. Si el espacio supera el <strong>75% de capacidad</strong>, el sistema <strong>auto-elimina automáticamente los archivos temporales y revisiones más antiguas</strong> (FIFO) sin interrumpir tus 11 evaluaciones activas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleManualPurge}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-lime-400" />
              <span>Ejecutar Depuración Manual de Archivos Viejos</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Descargar Respaldo Completo (JSON)</span>
            </button>

            <button
              onClick={handleStartBlank}
              className="w-full py-2.5 px-4 bg-lime-400 hover:bg-lime-300 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Iniciar Nuevo Reporte en Blanco (Vaciar Anteriores)</span>
            </button>

            <button
              onClick={handleResetFactory}
              className="w-full py-2 px-4 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Fichas Oficiales (7 Tiendas IVOO)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* In-app Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
