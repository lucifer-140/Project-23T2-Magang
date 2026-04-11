"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, Upload, Trash2, RotateCcw, BookmarkCheck, Star } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  /** Existing saved signature from the user's profile (base64 PNG) */
  savedSignature?: string | null;
  /** Called when the user wants to persist the current signature to their profile */
  onSaveSignature?: (dataUrl: string) => Promise<void>;
  className?: string;
}

type Tab = 'draw' | 'upload' | 'saved';

export function SignaturePad({
  onSignatureChange,
  savedSignature,
  onSaveSignature,
  className = '',
}: SignaturePadProps) {
  const defaultTab: Tab = savedSignature ? 'saved' : 'draw';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  // Track current emitted value so the save button knows what to persist
  const currentDataUrlRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Initialize canvas — transparent background (no white fill)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    setHasDrawing(true);
  }

  function stopDraw() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    emitDrawnSignature();
  }

  function emitDrawnSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return;
    // Export as PNG — canvas background is already transparent
    const dataUrl = canvas.toDataURL('image/png');
    currentDataUrlRef.current = dataUrl;
    onSignatureChange(dataUrl);
    setSavedOk(false);
  }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Clear to transparent, not white
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    currentDataUrlRef.current = null;
    onSignatureChange(null);
    setSavedOk(false);
  }, [onSignatureChange]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadPreview(dataUrl);
      currentDataUrlRef.current = dataUrl;
      onSignatureChange(dataUrl);
      setSavedOk(false);
    };
    reader.readAsDataURL(file);
  }

  function clearUpload() {
    setUploadPreview(null);
    currentDataUrlRef.current = null;
    onSignatureChange(null);
    setSavedOk(false);
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSavedOk(false);
    if (tab !== 'draw') clearCanvas();
    if (tab !== 'upload') { setUploadPreview(null); }
    if (tab === 'saved' && savedSignature) {
      currentDataUrlRef.current = savedSignature;
      onSignatureChange(savedSignature);
    } else if (tab !== 'draw' && tab !== 'upload') {
      currentDataUrlRef.current = null;
      onSignatureChange(null);
    }
  }

  function useSavedSignature() {
    if (!savedSignature) return;
    currentDataUrlRef.current = savedSignature;
    onSignatureChange(savedSignature);
  }

  async function handleSave() {
    const dataUrl = currentDataUrlRef.current;
    if (!dataUrl || !onSaveSignature) return;
    setIsSaving(true);
    try {
      await onSaveSignature(dataUrl);
      setSavedOk(true);
    } finally {
      setIsSaving(false);
    }
  }

  const hasCurrent = !!currentDataUrlRef.current;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'draw', label: 'Gambar', icon: <Pen size={13} /> },
    { key: 'upload', label: 'Upload', icon: <Upload size={13} /> },
    ...(savedSignature ? [{ key: 'saved' as Tab, label: 'Tersimpan', icon: <Star size={13} /> }] : []),
  ];

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
              activeTab === t.key ? 'bg-uph-blue text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Draw tab */}
      {activeTab === 'draw' && (
        <div className="p-3">
          <div
            className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              className="w-full h-auto cursor-crosshair block"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm select-none">Gambar tanda tangan Anda di sini</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={clearCanvas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw size={13} /> Hapus
            </button>
            {onSaveSignature && hasDrawing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  savedOk
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-uph-blue/10 text-uph-blue hover:bg-uph-blue/20'
                }`}
              >
                <BookmarkCheck size={13} />
                {isSaving ? 'Menyimpan…' : savedOk ? 'Tersimpan!' : 'Simpan ke Profil'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="p-3">
          {!uploadPreview ? (
            <label className="flex flex-col items-center justify-center h-[160px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:border-uph-blue hover:bg-blue-50/30 transition-colors">
              <Upload size={28} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-500">Klik untuk upload gambar tanda tangan</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG, atau SVG (transparan lebih baik)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="relative">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center h-[160px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadPreview} alt="Signature preview" className="max-h-full max-w-full object-contain" />
              </div>
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
          {onSaveSignature && uploadPreview && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  savedOk
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-uph-blue/10 text-uph-blue hover:bg-uph-blue/20'
                }`}
              >
                <BookmarkCheck size={13} />
                {isSaving ? 'Menyimpan…' : savedOk ? 'Tersimpan!' : 'Simpan ke Profil'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Saved tab — quick-select from profile */}
      {activeTab === 'saved' && savedSignature && (
        <div className="p-3">
          <div className="border border-green-200 rounded-lg overflow-hidden bg-green-50 flex items-center justify-center h-[160px] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={savedSignature} alt="Tanda tangan tersimpan" className="max-h-full max-w-full object-contain" />
            <span className="absolute top-2 left-2 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 rounded px-1.5 py-0.5 flex items-center gap-1">
              <Star size={9} /> Tersimpan di profil
            </span>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={useSavedSignature}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
            >
              <BookmarkCheck size={13} /> Gunakan Tanda Tangan Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
