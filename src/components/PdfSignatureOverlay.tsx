"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Move, ZoomIn, ZoomOut } from 'lucide-react';

// Use locally hosted worker to avoid CDN dependency
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export type SignaturePosition = {
  x: number;      // % of page width from left (0-100)
  y: number;      // % of page height from top (0-100)
  page: number;   // 1-based
  width: number;  // % of page width (0-100)
};

interface PdfSignatureOverlayProps {
  pdfUrl: string;
  signatureDataUrl: string | null;
  position: SignaturePosition;
  onPositionChange: (pos: SignaturePosition) => void;
  userName?: string;
}

export function PdfSignatureOverlay({
  pdfUrl,
  signatureDataUrl,
  position,
  onPositionChange,
  userName,
}: PdfSignatureOverlayProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHeight, setPageHeight] = useState(880); // estimated until rendered
  const [containerWidth, setContainerWidth] = useState(700); // measured from DOM

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, sigX: 0, sigY: 0 });
  const resizeStartRef = useRef({ mouseX: 0, origWidth: 0 });

  // Measure container width and update on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 100) setContainerWidth(w);
    });
    observer.observe(el);
    setContainerWidth(el.offsetWidth || 700);
    return () => observer.disconnect();
  }, []);

  // Keep position.page synced with currentPage
  useEffect(() => {
    onPositionChange({ ...position, page: currentPage });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  function onDocumentLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onPageRenderSuccess(page: { height: number }) {
    setPageHeight(page.height);
  }

  // Drag handlers on the signature overlay div
  const onSigMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      sigX: position.x,
      sigY: position.y,
    };
  }, [position.x, position.y]);

  // Resize handle (bottom-right corner)
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeStartRef.current = { mouseX: e.clientX, origWidth: position.width };
  }, [position.width]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.sigX + (dx / rect.width) * 100;
      const newY = dragStartRef.current.sigY + (dy / pageHeight) * 100;
      onPositionChange({
        ...position,
        x: Math.max(0, Math.min(90, newX)),
        y: Math.max(0, Math.min(90, newY)),
      });
    }

    if (isResizingRef.current) {
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const newWidth = resizeStartRef.current.origWidth + (dx / rect.width) * 100;
      onPositionChange({
        ...position,
        width: Math.max(5, Math.min(60, newWidth)),
      });
    }
  }, [position, pageHeight, onPositionChange]);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
  }, []);

  const sigWidthPx = (position.width / 100) * containerWidth;
  const sigLeftPx = (position.x / 100) * containerWidth;
  const sigTopPx = (position.y / 100) * pageHeight;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Page navigation */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(p => p - 1)}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium">
          Halaman {currentPage} / {numPages || '…'}
        </span>
        <button
          disabled={currentPage >= numPages}
          onClick={() => setCurrentPage(p => p + 1)}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* PDF + signature overlay */}
      <div
        ref={containerRef}
        className="relative overflow-hidden border border-gray-300 rounded-lg bg-gray-100 select-none w-full"
        style={{ minHeight: 400, cursor: isDraggingRef.current ? 'grabbing' : 'default' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoad}
          loading={
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Memuat PDF…
            </div>
          }
          error={
            <div className="flex items-center justify-center h-48 text-red-500 text-sm">
              Gagal memuat PDF. Pastikan file adalah PDF yang valid.
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={containerWidth || undefined}
            onRenderSuccess={onPageRenderSuccess}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>

        {/* Signature drag overlay - only shown when a signature exists */}
        {signatureDataUrl && (
          <div
            className="absolute border-2 border-dashed border-uph-blue rounded shadow-md cursor-grab active:cursor-grabbing"
            style={{
              left: sigLeftPx,
              top: sigTopPx,
              width: sigWidthPx,
              userSelect: 'none',
              touchAction: 'none',
            }}
            onMouseDown={onSigMouseDown}
            title="Seret untuk memposisikan tanda tangan"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureDataUrl}
              alt="Tanda tangan"
              className="w-full h-auto pointer-events-none block"
              draggable={false}
            />
            {/* Name + timestamp preview */}
            {userName && (
              <div className="pointer-events-none pb-0.5 bg-white/80 text-center" style={{ fontSize: Math.max(5, sigWidthPx * 0.06) }}>
                <div className="font-sans text-black leading-none truncate" style={{ fontSize: 'inherit' }}>{userName}</div>
                <div className="font-sans text-gray-500 leading-none" style={{ fontSize: Math.max(4, sigWidthPx * 0.05) }}>
                  {new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric' })} WIB
                </div>
              </div>
            )}
            {/* Drag indicator */}
            <div className="absolute top-1 left-1 bg-uph-blue/80 text-white rounded px-1 py-0.5 flex items-center gap-1 text-[10px] font-bold pointer-events-none">
              <Move size={10} /> Seret
            </div>
            {/* Resize handle (bottom-right) */}
            <div
              className="absolute bottom-0 right-0 w-5 h-5 bg-uph-blue rounded-tl cursor-se-resize flex items-center justify-center"
              onMouseDown={onResizeMouseDown}
              title="Ubah ukuran"
            >
              <ZoomIn size={11} className="text-white pointer-events-none" />
            </div>
          </div>
        )}

        {/* Hint overlay when no signature yet */}
        {!signatureDataUrl && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
            <div className="bg-uph-blue/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              Buat tanda tangan di bawah, lalu seret ke posisi yang diinginkan
            </div>
          </div>
        )}
      </div>

      {/* Position info */}
      {signatureDataUrl && (
        <div className="text-[11px] text-gray-400 flex gap-4">
          <span>Posisi X: {position.x.toFixed(1)}%</span>
          <span>Posisi Y: {position.y.toFixed(1)}%</span>
          <span>Lebar: {position.width.toFixed(1)}%</span>
          <span className="flex items-center gap-1"><ZoomOut size={11} /> Seret sudut kanan-bawah untuk resize</span>
        </div>
      )}
    </div>
  );
}
