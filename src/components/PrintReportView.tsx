import React, { useState, useRef } from 'react';
import { EVALUATIONS_DATA, REPORT_METADATA } from '../data/evaluationsData';
import { StoreEvaluation } from '../types';
import {
  IVOO_CRITERIA,
  getCriterionStatus,
  getStatusColorClasses,
  getLevelBadgeClasses,
} from '../data/criteria';
import {
  Printer,
  X,
  Lock,
  Calendar,
  Building2,
  CheckCircle2,
  Trophy,
  XCircle,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Download,
  FileDown,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintReportViewProps {
  evaluations?: StoreEvaluation[];
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  evaluations = EVALUATIONS_DATA,
  onClose,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  /**
   * Method 1: DIRECT HIGH-RESOLUTION PDF GENERATION & DOWNLOAD
   * Converts the report into a clean, multi-page vector-raster PDF and triggers download
   */
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);
    setDownloadSuccess(null);

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Remaining pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = `Informe_Mystery_Shopper_IVOO_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      setDownloadSuccess(`¡PDF generado y descargado con éxito! (${fileName})`);
    } catch (err) {
      console.error('Error generando PDF con canvas:', err);
      // Fallback: trigger print window
      handleOpenPrintWindow();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /**
   * Method 2: OPEN CLEAN PRINT WINDOW
   * Solves iframe sandbox restrictions by opening a dedicated window and triggering native print
   */
  const handleOpenPrintWindow = () => {
    if (!documentRef.current) {
      window.print();
      return;
    }

    const contentHtml = documentRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1000,height=900');

    if (!printWindow) {
      // If popup blocked, fallback to direct print
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe Consolidado Mystery Shopper IVOO</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { padding: 0; margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break-after { page-break-after: always; break-after: page; }
              .no-print { display: none !important; }
            }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; }
          </style>
        </head>
        <body class="bg-white text-slate-900">
          <div class="max-w-4xl mx-auto p-4">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  /**
   * Method 3: Primary Action triggered by "Imprimir / Guardar como PDF" button
   */
  const handlePrintAction = () => {
    // Attempt PDF direct generation or open print window
    handleDownloadPDF();
  };

  const overallAvg = evaluations.reduce((sum, e) => sum + e.score, 0) / (evaluations.length || 1);
  const closedCount = evaluations.filter((e) => e.saleClosed).length;
  const closedPercent = Math.round((closedCount / (evaluations.length || 1)) * 100);
  const contactCount = evaluations.filter((e) => e.contactCaptured).length;
  const contactPercent = Math.round((contactCount / (evaluations.length || 1)) * 100);
  const dates = Array.from(new Set(evaluations.map((e) => e.recordingDate).filter(Boolean)));
  const periodText = dates.some((d) => d.toLowerCase().includes('julio')) ? 'Julio de 2026' : dates[0] || 'Julio 2026';
  const cities = Array.from(new Set(evaluations.map((e) => e.city).filter(Boolean)));
  const brandsList = Array.from(new Set(evaluations.map((e) => e.storeName.split(' ')[0]).filter(Boolean)));
  const brandsText = brandsList.join(' / ') || 'Retail';

  // Sorted evaluations
  const sortedEvaluations = [...evaluations].sort((a, b) => b.score - a.score);
  const topEval = sortedEvaluations[0];
  const bottomEval = sortedEvaluations[sortedEvaluations.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-lime-400" />
          <span className="font-bold text-sm">Vista de Impresión / Documento Consolidado ({evaluations.length} Evaluaciones)</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary Action Button: Guardar como PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-4 py-2.5 rounded-lg bg-lime-400 text-slate-950 font-black text-xs sm:text-sm hover:bg-lime-300 transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:scale-102 disabled:opacity-50"
            title="Generar y descargar el archivo PDF directamente a tu equipo"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-slate-950" />
                <span>Descargar como PDF</span>
              </>
            )}
          </button>

          {/* Secondary Print Window Button */}
          <button
            onClick={handleOpenPrintWindow}
            className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Abrir ventana de diálogo de impresión del navegador"
          >
            <Printer className="w-4 h-4 text-lime-400" />
            <span>Ventana de Impresión</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="max-w-5xl mx-auto mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 print:hidden animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main Print Document Container */}
      <div
        ref={documentRef}
        id="printable-report-document"
        className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl p-6 sm:p-12 print:p-0 print:shadow-none print:rounded-none space-y-12 print:space-y-8 text-slate-900 text-sm"
      >
        
        {/* ================= PÁGINA 1: PORTADA ================= */}
        <div className="border-b-4 border-slate-900 pb-10 page-break-after">
          <div className="flex justify-between items-start">
            <div className="bg-slate-950 text-lime-400 font-mono font-black text-4xl px-4 py-1 rounded">
              IVOO
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div className="font-bold text-slate-900">DOCUMENTO CONFIDENCIAL</div>
              <div>Uso Interno Exclusivo IVOO</div>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-xs uppercase tracking-widest font-mono text-lime-600 font-bold">
              AUDITORÍA DE SERVICIO Y EXPERIENCIA COMERCIAL
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-950 mt-2 tracking-tight">
              Evaluaciones Mystery Shopper
            </h1>
            <h2 className="text-2xl font-bold text-slate-600 mt-2">
              {REPORT_METADATA.reportType}
            </h2>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>Período de evaluación:</strong> {periodText}</p>
              <p className="mt-1"><strong>Metodología:</strong> {REPORT_METADATA.methodology}</p>
            </div>
            <div>
              <p><strong>Ciudades evaluadas:</strong> {cities.join(', ')}</p>
              <p className="mt-1"><strong>Muestra total:</strong> {evaluations.length} auditorías incógnitas</p>
            </div>
          </div>

          {/* Key Totals Box */}
          <div className="mt-8 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Promedio General</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{overallAvg.toFixed(1)} / 100</div>
              <div className="text-[11px] text-amber-800 font-bold">Nivel {overallAvg >= 75 ? 'Bueno' : overallAvg >= 50 ? 'Regular' : 'Deficiente'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Tasa de Cierre</div>
              <div className="text-2xl font-black text-rose-700 mt-0.5">{closedPercent}% ({closedCount} / {evaluations.length})</div>
              <div className="text-[11px] text-rose-800 font-bold">{closedCount === 0 ? 'Ninguna venta cerrada' : `${closedCount} cerradas`}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Captura de Contacto</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{contactPercent}% ({contactCount} / {evaluations.length})</div>
              <div className="text-[11px] text-slate-600 font-bold">{contactCount === 0 ? 'Sin registros' : `${contactCount} clientes`}</div>
            </div>
          </div>

          {/* Mini Table of contents */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Índice de Evaluaciones por Tienda (Ranking)
            </h3>
            <div className="border border-slate-200 rounded divide-y divide-slate-200 text-xs">
              {evaluations.map((e, idx) => (
                <div key={e.id} className="p-2 flex justify-between items-center">
                  <span><strong>#{idx + 1}</strong> {e.storeName} — {e.seller}</span>
                  <span className="font-mono font-bold">{e.score} pts ({e.level})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RESUMEN COMPARATIVO ================= */}
        <div className="border-b-2 border-slate-200 pb-10 page-break-after space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
              Resumen Comparativo
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Durante el período de {periodText} se completaron {evaluations.length} visitas de evaluación Mystery Shopper en tiendas {brandsText} ubicadas en las plazas de {cities.join(', ')}. La auditoría registró una puntuación media global de <strong>{overallAvg.toFixed(1)}/100</strong>, con una <strong>tasa de cierre comercial del {closedPercent}%</strong> ({closedCount} de {evaluations.length} ventas cerradas) y una <strong>captura de datos de contacto del {contactPercent}%</strong> ({contactCount} de {evaluations.length} visitas), reflejando oportunidades clave en técnicas de cierre directo y prospección comercial.
            </p>
          </div>

          {/* Ranking Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Ranking de Visitas</h3>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-2 border-b border-slate-300 text-center w-8">#</th>
                  <th className="py-2 px-2 border-b border-slate-300">Tienda</th>
                  <th className="py-2 px-2 border-b border-slate-300">Vendedor</th>
                  <th className="py-2 px-2 border-b border-slate-300 text-center">Punt.</th>
                  <th className="py-2 px-2 border-b border-slate-300 text-center">Nivel</th>
                  <th className="py-2 px-2 border-b border-slate-300 text-center">Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evaluations.map((e, idx) => (
                  <tr key={e.id}>
                    <td className="py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-bold">{e.storeName}</td>
                    <td className="py-1.5 px-2">{e.seller}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold">{e.score}</td>
                    <td className="py-1.5 px-2 text-center">{e.level}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`font-semibold ${e.saleClosed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {e.saleClosed ? 'Cerrada' : 'No cerrada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Criteria Matrix Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Comparativo por Criterio (9 Criterios)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px] border border-slate-300">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-2 px-2 text-left">Tienda</th>
                    {IVOO_CRITERIA.map((c) => (
                      <th key={c.id} className="py-1 px-1">
                        <div>{c.shortName}</div>
                        <div className="text-[8px] text-slate-400">/{c.maxScore}</div>
                      </th>
                    ))}
                    <th className="py-1 px-1 bg-slate-950 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {evaluations.map((e) => (
                    <tr key={e.id}>
                      <td className="py-1.5 px-2 text-left font-semibold truncate max-w-[140px]">
                        {e.storeName}
                      </td>
                      {IVOO_CRITERIA.map((c) => {
                        const scoreObj = e.criteriaBreakdown?.find((cb) => cb.criterionId === c.id);
                        const score = scoreObj ? scoreObj.score : 0;
                        return (
                          <td key={c.id} className="py-1.5 px-1 font-mono font-semibold">
                            {score}
                          </td>
                        );
                      })}
                      <td className="py-1.5 px-1 font-mono font-black">{e.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transversal findings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-rose-200 bg-rose-50/50 p-3 rounded">
              <h4 className="font-bold text-rose-900 mb-2">Patrones Críticos y Oportunidades:</h4>
              <ul className="space-y-1 text-slate-700 list-disc list-inside leading-tight">
                <li>Cierre comercial concretado en solo el {closedPercent}% de las visitas ({closedCount} de {evaluations.length}).</li>
                <li>Captura de datos de contacto efectuada en {contactCount} de {evaluations.length} interacciones ({contactPercent}%).</li>
                <li>Sondeo de necesidades enfocado primariamente al rango de precio.</li>
                <li>Brecha de rendimiento entre la tienda superior ({topEval?.storeName} - {topEval?.score} pts) y la inferior ({bottomEval?.storeName} - {bottomEval?.score} pts).</li>
              </ul>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 p-3 rounded">
              <h4 className="font-bold text-emerald-900 mb-2">Fortalezas Destacadas:</h4>
              <ul className="space-y-1 text-slate-700 list-disc list-inside leading-tight">
                <li>Buen trato, actitud y recepción general en el piso de venta.</li>
                <li>Dominio en especificaciones de producto y sistemas inteligentes (Google TV / 4K).</li>
                <li>Claridad en explicación de precios de contado, métodos de pago y financiamiento.</li>
                <li>Piso de venta con pantallas encendidas y precios señalizados.</li>
              </ul>
            </div>
          </div>

          {/* Priority recommendations */}
          <div className="border border-slate-300 bg-slate-50 p-3 rounded text-xs">
            <h4 className="font-bold text-slate-900 mb-1.5">Recomendaciones Estratégicas para la Dirección Comercial:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Implementar protocolo de cierre directo obligatorio mediante alternativas de facturación inmediata o reserva.</li>
              <li>Establecer como estándar la captura del número de WhatsApp del cliente para cotizaciones y seguimiento post-visita.</li>
              <li>Estandarizar el saludo de bienvenida proactivo en los primeros 10 segundos de ingreso a tienda.</li>
              <li>Profundizar el sondeo de necesidades mediante preguntas consultivas antes de presentar opciones de compra.</li>
              <li>Incentivar activamente la venta cruzada sistemática de accesorios (protectores de voltaje, soportes, cables).</li>
            </ol>
          </div>
        </div>

        {/* ================= EVALUACIONES INDIVIDUALES ================= */}
        <div className="space-y-12">
          {evaluations.map((evalItem, idx) => (
            <div
              key={evalItem.id}
              className="border border-slate-300 rounded-xl p-6 print:border-slate-400 print:rounded-none page-break-after space-y-6"
            >
              {/* Header */}
              <div className="border-b border-slate-200 pb-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                  Evaluación Mystery Shopper #{idx + 1} • {evalItem.identifier}
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {evalItem.storeName} ({evalItem.city}) | {evalItem.recordingDate}
                </h3>
              </div>

              {/* Data Table */}
              <table className="w-full text-xs border border-slate-200 text-left">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Tienda</th>
                    <th className="p-2 border-b border-slate-200">Vendedor</th>
                    <th className="p-2 border-b border-slate-200">Fecha grabación</th>
                    <th className="p-2 border-b border-slate-200">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-semibold">{evalItem.storeName}</td>
                    <td className="p-2">{evalItem.seller}</td>
                    <td className="p-2">{evalItem.recordingDate}</td>
                    <td className="p-2 font-mono">{evalItem.duration}</td>
                  </tr>
                </tbody>
              </table>

              {/* Score & Summary */}
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-slate-900">
                    PUNTUACIÓN: {evalItem.score}/100 ({evalItem.level})
                  </span>
                  <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    VENTA NO CERRADA
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {evalItem.narrativeSummary}
                </p>
              </div>

              {/* Desglose por Criterio */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 mb-1">
                  Desglose por Criterio
                </h4>
                <table className="w-full text-xs border border-slate-200 text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-b border-slate-200 w-40">Criterio</th>
                      <th className="p-2 border-b border-slate-200 text-center w-12">Pts</th>
                      <th className="p-2 border-b border-slate-200 text-center w-12">Máx</th>
                      <th className="p-2 border-b border-slate-200">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {evalItem.criteriaBreakdown.map((cb) => (
                      <tr key={cb.criterionId}>
                        <td className="p-2 font-semibold align-top">{cb.criterionName}</td>
                        <td className="p-2 text-center font-mono font-bold align-top">{cb.score}</td>
                        <td className="p-2 text-center font-mono text-slate-400 align-top">{cb.maxScore}</td>
                        <td className="p-2 text-slate-700 align-top">{cb.observation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold">
                    <tr>
                      <td className="p-2">TOTAL</td>
                      <td className="p-2 text-center text-lime-400 font-mono text-sm">{evalItem.score}</td>
                      <td className="p-2 text-center font-mono">100</td>
                      <td className="p-2 text-xs">Total: {evalItem.score} / 100 puntos ({evalItem.score}%)</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Strengths & Critical Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <h5 className="font-bold text-emerald-900 mb-1">Fortalezas:</h5>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {evalItem.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded">
                  <h5 className="font-bold text-rose-900 mb-1">Áreas de Mejora Críticas:</h5>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {evalItem.criticalAreas.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Transcripción */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  Transcripción Completa ({evalItem.recordingDate} | {evalItem.duration})
                </div>
                {evalItem.transcript.map((line, i) => (
                  <div key={i} className="text-slate-800">
                    <strong>{line.speaker}{line.speakerName ? ` (${line.speakerName})` : ''}:</strong>{' '}
                    <span>{line.text}</span>
                  </div>
                ))}
                {evalItem.ambientNotes && (
                  <div className="mt-2 text-slate-500 italic pt-1 border-t border-slate-200">
                    [Notas de ambiente: {evalItem.ambientNotes}]
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
