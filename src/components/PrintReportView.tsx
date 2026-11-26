import React, { useState, useRef } from 'react';
import { EVALUATIONS_DATA, REPORT_METADATA } from '../data/evaluationsData';
import { StoreEvaluation } from '../types';
import {
  IVOO_CRITERIA,
  getCriterionStatus,
  getStatusColorClasses,
  getLevelBadgeClasses,
  getLevelDisplayName,
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
import html2canvas from 'html2canvas-pro';
import { computeBlockPageSlices } from '../utils/pdfPagination';

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
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * Method 1: DIRECT HIGH-RESOLUTION PDF GENERATION & DOWNLOAD
   * Converts the report into a clean, multi-page vector-raster PDF and triggers download
   */
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);
    setDownloadSuccess(null);
    setDownloadError(null);

    try {
      const element = documentRef.current;
      const scale = 2; // High resolution

      // IMPORTANT: no `windowWidth` override here. We measure atom positions from the live,
      // currently-displayed DOM (getBoundingClientRect) and need those measurements to line up
      // pixel-for-pixel with what html2canvas actually renders. Forcing a different virtual
      // window width than what's on screen would make the canvas reflow differently than the
      // DOM we measured, throwing off every cut point.
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // html2canvas renders a CLONE of the page inside an iframe. In the production build the
        // app's CSS is a <link rel="stylesheet">, which the clone may not have finished loading
        // when rendering starts — producing a PDF with no styles at all (plain serif text).
        // Inlining the compiled CSS as a <style> tag makes it apply synchronously.
        onclone: (clonedDoc: Document) => {
          let css = '';
          for (const sheet of Array.from(document.styleSheets)) {
            try {
              css += Array.from(sheet.cssRules)
                .map((r) => r.cssText)
                .join('\n');
            } catch {
              // Cross-origin stylesheets (e.g. web fonts) can't be read — safe to skip.
            }
          }
          clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.remove());
          const style = clonedDoc.createElement('style');
          style.textContent = css;
          clonedDoc.head.appendChild(style);
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

      // Canvas pixels per mm of PDF page (the image is always placed at width = pdfWidth).
      const canvasPxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = pdfHeight * canvasPxPerMm;

      const imgData = canvas.toDataURL('image/png');

      // Renders one page: the full document image, shifted up so that `topPx` aligns with the
      // top of the current page. The page's own physical boundary clips everything below it —
      // this is the same placement trick the original implementation used; only the choice of
      // where to cut (topPx) is smarter now.
      const renderPage = (topPx: number) => {
        const topMm = topPx / canvasPxPerMm;
        pdf.addImage(imgData, 'PNG', 0, -topMm, imgWidth, imgHeightMm, undefined, 'FAST');
      };

      // Each "page-break-after" element is a block that must always start on a fresh page
      // (cover, the comparative summary, and each individual store evaluation). Within a block,
      // we split by its marked [data-pdf-atom] children so a page break never falls in the
      // middle of a paragraph, table, or transcript line — only between them.
      const containerRect = element.getBoundingClientRect();
      const topBlocks = Array.from(element.querySelectorAll<HTMLElement>('.page-break-after'));
      const pxScale = canvas.width / containerRect.width;

      let isFirstPage = true;

      for (const block of topBlocks) {
        const atomEls = Array.from(block.querySelectorAll<HTMLElement>('[data-pdf-atom]'));
        const candidates = atomEls.length > 0 ? atomEls : [block];

        const atoms = candidates.map((atomEl) => {
          const rect = atomEl.getBoundingClientRect();
          return {
            top: (rect.top - containerRect.top) * pxScale,
            bottom: (rect.bottom - containerRect.top) * pxScale,
          };
        });

        const slices = computeBlockPageSlices(atoms, pageHeightPx);

        for (const slice of slices) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;
          renderPage(slice.top);

          // The full-document image continues below this slice (into the NEXT block). Paint the
          // unused rest of the page white so a short block never shows the next block's content
          // underneath it (that's what caused the cover page to also show "Resumen Comparativo").
          const usedMm = (slice.bottom - slice.top) / canvasPxPerMm;
          if (usedMm < pdfHeight) {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, usedMm, pdfWidth, pdfHeight - usedMm + 1, 'F');
          }
        }
      }

      const fileName = `Informe_Mystery_Shopper_IVOO_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      setDownloadSuccess(`¡PDF generado y descargado con éxito! (${fileName})`);
    } catch (err) {
      console.error('Error generando PDF con canvas:', err);
      setDownloadError(
        'No se pudo generar el PDF directamente. Prueba de nuevo o usa "Ventana de Impresión". Detalle: ' +
          (err instanceof Error ? err.message : String(err))
      );
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

    // Reuse the app's own compiled CSS (Tailwind v4 build) so the print window looks identical.
    // The old approach loaded the Tailwind CDN, which doesn't work with v4 classes / blocked networks.
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => {
        if (el.tagName === 'LINK') {
          const href = (el as HTMLLinkElement).href;
          return `<link rel="stylesheet" href="${href}">`;
        }
        return `<style>${el.textContent ?? ''}</style>`;
      })
      .join('\n');

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe Mystery Shopper</title>
          ${styleTags}
          <style>
            @page { margin: 0; size: A4; }
            @media print {
              body { padding: 0; margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break-after { page-break-after: always; break-after: page; }
              .no-print { display: none !important; }
            }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 20px; }
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
              }, 800);
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
  const levelLabel = (score: number) =>
    score >= 90 ? 'Asesor Smart' : score >= 80 ? 'Sólido' : score >= 65 ? 'En Desarrollo' : score >= 50 ? 'Insuficiente' : 'Crítico';

  // Average % of max per dimension, computed from the real evaluations.
  const dimensionStats = IVOO_CRITERIA.map((c) => {
    const scores = evaluations.map(
      (e) => e.criteriaBreakdown?.find((cb) => cb.criterionId === c.id)?.score ?? 0
    );
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { id: c.id, name: c.name, shortName: c.shortName, max: c.maxScore, avg, pct: c.maxScore ? avg / c.maxScore : 0 };
  });
  const rankedDims = [...dimensionStats].sort((a, b) => b.pct - a.pct);
  const strongDims = rankedDims.slice(0, 3);
  const weakDims = [...rankedDims].reverse().slice(0, 3);
  const flaggedCount = evaluations.filter((e) => (e.flags?.length ?? 0) > 0).length;

  const RECOMMENDATIONS: Record<string, string> = {
    actitud: 'Reforzar la bienvenida proactiva y la disposición de servicio desde los primeros segundos de la interacción.',
    necesidades: 'Profundizar el sondeo de necesidades (uso, presupuesto, preferencias) antes de presentar opciones.',
    conocimiento: 'Reforzar el conocimiento de producto, garantías y condiciones comerciales con información exacta.',
    propuesta: 'Traducir la necesidad detectada en una recomendación justificada, comparando alternativas.',
    objeciones: 'Entrenar el manejo de objeciones de precio, competencia y stock con respuestas estructuradas.',
    cierre: 'Incorporar preguntas de cierre y recuperación activa de la oportunidad cuando el cliente intenta retirarse.',
    cross_up: 'Identificar oportunidades razonables de venta complementaria vinculadas a la necesidad real.',
    experiencia: 'Cuidar la comunicación, la despedida y el seguimiento posterior a la visita.',
  };

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
            disabled={isGeneratingPDF || evaluations.length === 0}
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

      {downloadError && (
        <div className="max-w-5xl mx-auto mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {evaluations.length === 0 && (
        <div className="max-w-5xl mx-auto mb-4 p-6 bg-white rounded-xl text-center text-sm text-slate-700 print:hidden">
          <p className="font-bold text-slate-900 mb-1">No hay evaluaciones para generar el informe.</p>
          <p>Audita al menos un audio en la pestaña "Audios" y vuelve a abrir esta vista.</p>
        </div>
      )}

      {/* Main Print Document Container */}
      <div
        ref={documentRef}
        id="printable-report-document"
        hidden={evaluations.length === 0}
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
          <div className="mt-8 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Promedio General</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{overallAvg.toFixed(1)} / 100</div>
              <div className="text-[11px] text-amber-800 font-bold">Nivel {levelLabel(overallAvg)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Visitas Evaluadas</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{evaluations.length}</div>
              <div className="text-[11px] text-slate-600 font-bold">{flaggedCount} con banderas de fallo</div>
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
                  <span className="font-mono font-bold">{e.score} pts ({getLevelDisplayName(e.level)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RESUMEN COMPARATIVO ================= */}
        <div className="border-b-2 border-slate-200 pb-10 page-break-after space-y-6">
          <div data-pdf-atom>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
              Resumen Comparativo
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Durante el período de {periodText} se completaron {evaluations.length} visitas de evaluación Mystery Shopper en tiendas {brandsText} ubicadas en {cities.join(', ')}. La auditoría registró una puntuación media global de <strong>{overallAvg.toFixed(1)}/100</strong> (nivel {levelLabel(overallAvg)}){flaggedCount > 0 ? `, con ${flaggedCount} visita(s) con banderas de fallo` : ''}.</p>
          </div>

          {/* Ranking Table */}
          <div data-pdf-atom>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Ranking de Visitas</h3>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-2 border-b border-slate-300 text-center w-8">#</th>
                  <th className="py-2 px-2 border-b border-slate-300">Tienda</th>
                  <th className="py-2 px-2 border-b border-slate-300">Vendedor</th>
                  <th className="py-2 px-2 border-b border-slate-300 text-center">Punt.</th>
                  <th className="py-2 px-2 border-b border-slate-300 text-center">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evaluations.map((e, idx) => (
                  <tr key={e.id}>
                    <td className="py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-bold">{e.storeName}</td>
                    <td className="py-1.5 px-2">{e.seller}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold">{e.score}</td>
                    <td className="py-1.5 px-2 text-center">{getLevelDisplayName(e.level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Criteria Matrix Table */}
          <div data-pdf-atom>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Comparativo por Dimensión (8 Dimensiones)</h3>
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

          {/* Transversal findings (derived from the real evaluations) */}
          {evaluations.length > 0 && (
            <>
              <div data-pdf-atom className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-rose-200 bg-rose-50/50 p-3 rounded">
                  <h4 className="font-bold text-rose-900 mb-2">Dimensiones con Mayor Oportunidad:</h4>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside leading-tight">
                    {weakDims.map((d) => (
                      <li key={d.id}>{d.name}: promedio {d.avg.toFixed(1)}/{d.max} ({Math.round(d.pct * 100)}%).</li>
                    ))}
                    {topEval && bottomEval && evaluations.length > 1 && (
                      <li>Brecha entre la tienda superior ({topEval.storeName} — {topEval.score} pts) y la inferior ({bottomEval.storeName} — {bottomEval.score} pts).</li>
                    )}
                  </ul>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/50 p-3 rounded">
                  <h4 className="font-bold text-emerald-900 mb-2">Dimensiones más Fuertes:</h4>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside leading-tight">
                    {strongDims.map((d) => (
                      <li key={d.id}>{d.name}: promedio {d.avg.toFixed(1)}/{d.max} ({Math.round(d.pct * 100)}%).</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div data-pdf-atom className="border border-slate-300 bg-slate-50 p-3 rounded text-xs">
                <h4 className="font-bold text-slate-900 mb-1.5">Recomendaciones para la Dirección Comercial:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  {weakDims.map((d) => (
                    <li key={d.id}>{RECOMMENDATIONS[d.id]}</li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        {/* ================= EVALUACIONES INDIVIDUALES ================= */}
        <div className="space-y-12">
          {evaluations.map((evalItem, idx) => (
            <div
              key={evalItem.id}
              className="border border-slate-300 rounded-xl p-6 print:border-slate-400 print:rounded-none page-break-after space-y-6"
            >
              {/* Header */}
              <div data-pdf-atom className="border-b border-slate-200 pb-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                  Evaluación Mystery Shopper #{idx + 1} • {evalItem.identifier}
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {evalItem.storeName} ({evalItem.city}) | {evalItem.recordingDate}
                </h3>
              </div>

              {/* Data Table */}
              <table data-pdf-atom className="w-full text-xs border border-slate-200 text-left">
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
              <div data-pdf-atom className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-slate-900">
                    PUNTUACIÓN: {evalItem.score}/100 ({getLevelDisplayName(evalItem.level)})
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {evalItem.narrativeSummary}
                </p>
              </div>

              {/* Freelancer's own observations, if provided */}
              {evalItem.freelancerObservations && (
                <div data-pdf-atom className="p-3 bg-lime-50/60 border border-lime-200 rounded text-xs">
                  <h4 className="font-bold text-slate-900 mb-1">Observaciones del Freelance sobre el Recorrido:</h4>
                  <p className="text-slate-700 leading-relaxed">{evalItem.freelancerObservations}</p>
                </div>
              )}

              {/* Desglose por Criterio */}
              <div data-pdf-atom>
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
              <div data-pdf-atom className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                <div data-pdf-atom className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  Transcripción Completa ({evalItem.recordingDate} | {evalItem.duration})
                </div>
                {evalItem.transcript.map((line, i) => (
                  <div key={i} data-pdf-atom className="text-slate-800">
                    <strong>{line.speaker}{line.speakerName ? ` (${line.speakerName})` : ''}:</strong>{' '}
                    <span>{line.text}</span>
                  </div>
                ))}
                {evalItem.ambientNotes && (
                  <div data-pdf-atom className="mt-2 text-slate-500 italic pt-1 border-t border-slate-200">
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
