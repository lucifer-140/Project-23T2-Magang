"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Loader2, ChevronLeft, ChevronRight,
  Highlighter, Pencil, Square, MessageSquare, X,
} from 'lucide-react';
import type { RpsAnnotation } from '@/lib/api-types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type AnnotationType = 'highlight' | 'draw' | 'box' | 'sticky';

const COLORS = ['#FFD700', '#FF4444', '#44BB44', '#4488FF', '#FF8800', '#CC44FF'];
const PAGE_WIDTH = 760;

interface Props {
  pdfUrl: string;
  rpsId: string;
  readOnly?: boolean;
  reviewerRole?: 'koordinator' | 'kaprodi';
}

export function PdfAnnotationViewer({ pdfUrl, rpsId, readOnly = false, reviewerRole }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [annotations, setAnnotations] = useState<RpsAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationType>('highlight');
  const [activeColor, setActiveColor] = useState('#FFD700');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [drawPath, setDrawPath] = useState<{ x: number; y: number }[]>([]);

  // Sticky note input state
  const [stickyPos, setStickyPos] = useState<{ x: number; y: number } | null>(null);
  const [stickyText, setStickyText] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch existing annotations on mount / rpsId change
  useEffect(() => {
    fetch(`/api/rps/${rpsId}/annotations`)
      .then(r => r.json())
      .then((data: RpsAnnotation[]) => setAnnotations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [rpsId]);

  const getPercentCoords = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const saveAnnotation = async (ann: Omit<RpsAnnotation, 'id' | 'rpsId' | 'createdAt'>) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/rps/${rpsId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ann, reviewerRole }),
      });
      if (res.ok) {
        const saved: RpsAnnotation = await res.json();
        setAnnotations(prev => [...prev, saved]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAnnotation = async (id: string) => {
    const res = await fetch(`/api/rps/${rpsId}/annotations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAnnotations(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || e.button !== 0) return;
    e.preventDefault();
    const pos = getPercentCoords(e);

    if (activeTool === 'sticky') {
      setStickyPos(pos);
      setStickyText('');
      return;
    }

    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
    if (activeTool === 'draw') setDrawPath([pos]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || readOnly) return;
    const pos = getPercentCoords(e);
    setDrawCurrent(pos);
    if (activeTool === 'draw') setDrawPath(prev => [...prev, pos]);
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !drawCurrent || readOnly) return;
    setIsDrawing(false);

    if (activeTool === 'draw') {
      if (drawPath.length > 3) {
        await saveAnnotation({
          type: 'draw',
          page: activePage,
          x: drawPath[0].x,
          y: drawPath[0].y,
          width: null,
          height: null,
          color: activeColor,
          content: null,
          pathData: JSON.stringify(drawPath),
          reviewerRole: reviewerRole ?? 'koordinator',
        });
      }
      setDrawPath([]);
    } else if (activeTool === 'highlight' || activeTool === 'box') {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);
      if (w > 0.5 && h > 0.3) {
        await saveAnnotation({
          type: activeTool,
          page: activePage,
          x,
          y,
          width: w,
          height: h,
          color: activeColor,
          content: null,
          pathData: null,
          reviewerRole: reviewerRole ?? 'koordinator',
        });
      }
    }

    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setDrawPath([]);
    }
  };

  const handleSaveSticky = async () => {
    if (!stickyPos || !stickyText.trim()) {
      setStickyPos(null);
      return;
    }
    await saveAnnotation({
      type: 'sticky',
      page: activePage,
      x: stickyPos.x,
      y: stickyPos.y,
      width: null,
      height: null,
      color: activeColor,
      content: stickyText,
      pathData: null,
      reviewerRole: reviewerRole ?? 'koordinator',
    });
    setStickyPos(null);
    setStickyText('');
  };

  const pageAnnotations = annotations.filter(a => a.page === activePage);

  // Preview shape while drawing
  const previewRect =
    isDrawing && drawStart && drawCurrent && (activeTool === 'highlight' || activeTool === 'box')
      ? {
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          w: Math.abs(drawCurrent.x - drawStart.x),
          h: Math.abs(drawCurrent.y - drawStart.y),
        }
      : null;

  const previewDrawPath =
    isDrawing && activeTool === 'draw' && drawPath.length > 1
      ? drawPath.map(p => `${p.x},${p.y}`).join(' ')
      : null;

  const getCursor = () => {
    if (readOnly) return 'default';
    switch (activeTool) {
      case 'highlight': return 'crosshair';
      case 'draw': return 'crosshair';
      case 'box': return 'crosshair';
      case 'sticky': return 'cell';
    }
  };

  const annotationCountOnPage = pageAnnotations.length;
  const totalAnnotations = annotations.length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar (reviewer only) ── */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl flex-wrap">
          {/* Tool selector */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-1">
            {(
              [
                { tool: 'highlight' as AnnotationType, icon: <Highlighter size={14} />, label: 'Highlight' },
                { tool: 'draw' as AnnotationType, icon: <Pencil size={14} />, label: 'Gambar' },
                { tool: 'box' as AnnotationType, icon: <Square size={14} />, label: 'Kotak' },
                { tool: 'sticky' as AnnotationType, icon: <MessageSquare size={14} />, label: 'Catatan' },
              ] as const
            ).map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                title={label}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  activeTool === tool
                    ? 'bg-uph-blue text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                title={c}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  activeColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Counts + saving indicator */}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            {isSaving && <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Menyimpan…</span>}
            {totalAnnotations > 0 && (
              <span>{annotationCountOnPage}/{totalAnnotations} anotasi</span>
            )}
          </div>
        </div>
      )}

      {/* Read-only banner */}
      {readOnly && totalAnnotations > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
          <MessageSquare size={14} className="text-amber-600 flex-shrink-0" />
          {totalAnnotations} anotasi dari reviewer. Lihat setiap halaman untuk panduan revisi yang ditandai.
        </div>
      )}

      {/* ── PDF canvas with overlay ── */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 select-none">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-sm">Memuat dokumen PDF…</span>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-40 text-red-400 text-sm">
              Gagal memuat PDF.
            </div>
          }
        >
          <div
            ref={containerRef}
            className="relative"
            style={{ cursor: getCursor(), userSelect: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <Page
              pageNumber={activePage}
              width={PAGE_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />

            {/* ── SVG annotation layer ── */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              {/* Saved annotations */}
              {pageAnnotations.map(ann => {
                if (ann.type === 'highlight' && ann.width != null && ann.height != null) {
                  return (
                    <rect
                      key={ann.id}
                      x={ann.x} y={ann.y} width={ann.width} height={ann.height}
                      fill={ann.color} fillOpacity={0.35}
                    />
                  );
                }
                if (ann.type === 'box' && ann.width != null && ann.height != null) {
                  return (
                    <rect
                      key={ann.id}
                      x={ann.x} y={ann.y} width={ann.width} height={ann.height}
                      fill="none" stroke={ann.color} strokeWidth={0.4}
                    />
                  );
                }
                if (ann.type === 'draw' && ann.pathData) {
                  const pts = (JSON.parse(ann.pathData) as { x: number; y: number }[])
                    .map(p => `${p.x},${p.y}`)
                    .join(' ');
                  return (
                    <polyline
                      key={ann.id}
                      points={pts}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={0.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                }
                return null;
              })}

              {/* Preview while drawing */}
              {previewRect && activeTool === 'highlight' && (
                <rect
                  x={previewRect.x} y={previewRect.y}
                  width={previewRect.w} height={previewRect.h}
                  fill={activeColor} fillOpacity={0.3}
                />
              )}
              {previewRect && activeTool === 'box' && (
                <rect
                  x={previewRect.x} y={previewRect.y}
                  width={previewRect.w} height={previewRect.h}
                  fill="none" stroke={activeColor} strokeWidth={0.4} strokeDasharray="1,0.5"
                />
              )}
              {previewDrawPath && (
                <polyline
                  points={previewDrawPath}
                  fill="none" stroke={activeColor}
                  strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round"
                />
              )}
            </svg>

            {/* ── HTML overlay: sticky notes + delete buttons ── */}
            {pageAnnotations.map(ann => (
              <div key={`html-${ann.id}`} style={{ zIndex: 20 }}>
                {/* Sticky note bubble */}
                {ann.type === 'sticky' && (
                  <div
                    className="absolute pointer-events-auto"
                    style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-8px, -8px)', zIndex: 20 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div
                      className="max-w-[180px] min-w-[80px] rounded-lg shadow-lg border px-2.5 py-2 text-xs font-medium leading-snug whitespace-pre-wrap"
                      style={{ backgroundColor: ann.color + 'EE', borderColor: ann.color }}
                    >
                      {ann.content}
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => deleteAnnotation(ann.id)}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300 rounded-full flex items-center justify-center shadow-sm"
                        title="Hapus"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                )}

                {/* Delete button for non-sticky annotations */}
                {ann.type !== 'sticky' && !readOnly && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                    className="absolute w-4 h-4 bg-white border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300 rounded-full flex items-center justify-center shadow-sm pointer-events-auto"
                    style={{
                      left: `${ann.type === 'draw' ? ann.x : (ann.x + (ann.width ?? 0))}%`,
                      top: `${ann.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 20,
                    }}
                    title="Hapus anotasi"
                  >
                    <X size={9} />
                  </button>
                )}
              </div>
            ))}

            {/* Sticky note input popup */}
            {stickyPos && !readOnly && (
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `${stickyPos.x}%`,
                  top: `${stickyPos.y}%`,
                  transform: 'translate(-4px, -4px)',
                  zIndex: 30,
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                <div className="bg-white border-2 border-uph-blue rounded-xl shadow-2xl p-3 w-56">
                  <p className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                    <MessageSquare size={12} className="text-uph-blue" /> Tambah Catatan
                  </p>
                  <textarea
                    autoFocus
                    value={stickyText}
                    onChange={e => setStickyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSaveSticky(); }}
                    className="w-full text-xs p-1.5 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-uph-blue min-h-[64px]"
                    placeholder="Tulis catatan revisi… (Ctrl+Enter untuk simpan)"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveSticky}
                      className="flex-1 bg-uph-blue text-white text-xs font-bold py-1.5 rounded-lg hover:bg-[#111c33] transition-colors"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setStickyPos(null)}
                      className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Document>
      </div>

      {/* ── Page navigation ── */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setActivePage(p => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Halaman {activePage} / {numPages}
          </span>
          <button
            onClick={() => setActivePage(p => Math.min(numPages, p + 1))}
            disabled={activePage === numPages}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
