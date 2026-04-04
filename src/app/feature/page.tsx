"use client";

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, PenTool, X, RotateCcw, Download, ChevronLeft, Loader2, Pen } from 'lucide-react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';
import dynamic from 'next/dynamic';

const PdfRenderer = dynamic(() => import('./PdfRenderer'), {
  ssr: false,
  loading: () => <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Memuat Modul PDF Engine...</div>
});

export default function RealFeatureSandbox() {
  const [step, setStep] = useState<'upload' | 'converting' | 'preview'>('upload');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  
  // React-pdf Config
  const [numPages, setNumPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);

  // Signing Logic
  const [isSigning, setIsSigning] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number, y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);

  // Menerima file dan menghubungi Backend (API Convert)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      // Jika sudah PDF, langsung buka
      setPdfBlobUrl(URL.createObjectURL(file));
      setStep('preview');
      return;
    }

    setStep('converting');
    
    // Siapkan FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Konversi Gagal: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setStep('preview');

    } catch (error) {
      console.error(error);
      alert("Gagal melakukan konversi. Pastikan container Gotenberg sudah hidup di Docker (Port 3001).");
      setStep('upload');
    }
  };

  // -------------------------
  // Interaksi Viewer & Rendering Modal
  // -------------------------

  // Membaca ketukan klik persis di atas kertas PDF
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Buka Modal Canvas Signer
    setSignaturePosition({ x, y });
    setIsSigning(true);
  };

  // -------------------------
  // Pembuatan Garis Kanvas
  // -------------------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    e.preventDefault(); // Hindari scroll pada ponsel saat menggambar
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.type.includes('mouse')) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // -------------------------
  // Burning Metadata via pdf-lib
  // -------------------------
  const embedSignature = async () => {
    if (!pdfBlobUrl || !signaturePosition || !canvasRef.current) return;
    setIsProcessingSignature(true);
    
    try {
      // 1. Ekstrak gambar tanda tangan dari canvas HTML
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      
      // 2. Unduh array buffer PDF lokal sementara dari Object URL
      const existingPdfBytes = await fetch(pdfBlobUrl).then(res => res.arrayBuffer());
      
      // 3. Modifikasi Biner PDF-nya
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(signatureImageBytes);
      
      // 4. Cari index titik halaman
      const pages = pdfDoc.getPages();
      const pageIdx = activePage - 1; 
      const targetPage = pages[pageIdx];
      
      const { height } = targetPage.getSize();
      
      // 5. Kalkulus Posisi Tanda Tangan
      // Pada sistem grafika browser, Y = 0 (Puncak layar).
      // Pada sistem grafika PDF, Y = 0 (Bawah layar/Pojok Kiri Bawah).
      // Kita asumsikan ukuran Tangan (png) kita render 200x100
      const sigWidth = 200;
      const sigHeight = 100;
      
      const pdfX = signaturePosition.x - (sigWidth / 2); // Center image di titik klik
      const pdfY = height - signaturePosition.y - (sigHeight / 2); 

      // 6. Cetak/Bakar Stampelnya!
      targetPage.drawImage(pngImage, {
        x: pdfX,
        y: pdfY,
        width: sigWidth,
        height: sigHeight,
      });

      // 7. Simpan Buffer PDF yang telah dimodifikasi
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      
      // Render ulang secara lokal
      setPdfBlobUrl(URL.createObjectURL(blob));
      setIsSigning(false);

    } catch (e) {
      console.error(e);
      alert("Kesalahan saat membubuhkan tanda tangan. Dokumen rusak atau format asimetris.");
    } finally {
      setIsProcessingSignature(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Sandbox */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center">
          <Link href="/dashboard/admin" className="text-gray-400 hover:text-uph-blue transition-colors mr-4">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-uph-blue">Engine: Sign Anywhere & Auto Convert</h1>
            <p className="text-xs text-gray-500">Mengesahkan dokumen berbasiskan pdf-lib & Gotenberg Local Server.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col p-4 md:p-8">
        
        {step === 'upload' && (
          <div className="max-w-xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center my-auto transition-all">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download size={32} className="text-uph-blue" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unggah Salinan RPS</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Sistem cerdas akan melakukan kompilasi file Microsoft Word Anda ke dalam format PDF tak-terubah (Lossless) secara nyata.</p>
            
            <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-uph-blue transition-colors cursor-pointer group">
              <UploadCloud size={40} className="text-gray-400 group-hover:text-uph-blue mb-3 transition-colors" />
              <span className="text-sm font-semibold text-gray-700">Pilih File Master (*.docx) atau PDF</span>
              <span className="text-xs text-gray-500 mt-1">Menggunakan Endpoint Gotenberg Backend</span>
              <input type="file" className="hidden" accept=".docx,.pdf" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {step === 'converting' && (
          <div className="max-w-xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center my-auto">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-uph-blue rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sinkronisasi LibreOffice (Docker)...</h2>
            <p className="text-gray-500 text-sm">Mentransfer biner DOCX melalui aliran data ke Container Gotenberg Anda.</p>
          </div>
        )}

        {step === 'preview' && pdfBlobUrl && (
          <div className="w-full flex justify-center gap-8 items-start relative max-w-7xl mx-auto">
            {/* Real PDF Engine Viewer */}
            <div className="flex flex-col items-center flex-1 w-full bg-transparent overflow-y-auto pb-20">
               <div className="bg-uph-blue text-white w-full rounded-t-xl px-4 py-3 flex text-sm shadow-md font-bold max-w-[800px] items-center">
                 <Pen size={18} className="mr-2" />
                 Klik area di bagian mana saja pada kertas di bawah untuk merekatkan Tanda Tangan.
               </div>
               
               <PdfRenderer 
                 pdfBlobUrl={pdfBlobUrl} 
                 activePage={activePage} 
                 setNumPages={setNumPages} 
                 handlePdfClick={handlePdfClick} 
               />
               
               <div className="mt-4 flex items-center justify-center bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm text-sm font-semibold max-w-[800px]">
                 <button disabled={activePage <= 1} onClick={() => setActivePage(p => p - 1)} className="px-3 hover:text-uph-blue disabled:opacity-30 disabled:hover:text-black">Sebelah</button>
                 <span className="px-4 border-x border-gray-200">Halaman {activePage} dari {numPages}</span>
                 <button disabled={activePage >= numPages} onClick={() => setActivePage(p => p + 1)} className="px-3 hover:text-uph-blue disabled:opacity-30 disabled:hover:text-black">Selanjutnya</button>
               </div>
            </div>

            {/* Sidebar Floating Action */}
            <div className="w-80 flex flex-col gap-4 sticky top-24 shrink-0 hidden lg:flex">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">Panel Validasi TTD</h3>
                <p className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">Setiap modifikasi `pdf-lib` akan mencetak layer permanen ke dalam file buffer lokal ini.</p>
                
                <a 
                  href={pdfBlobUrl}
                  download="Surat_Terverifikasi_Kaprodi.pdf"
                  className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold rounded-lg transition-all bg-green-500 hover:bg-green-600 text-white shadow-md cursor-pointer"
                >
                  <Download size={16} className="mr-2" />
                  Kunci & Download PDF
                </a>
              </div>
              <button 
                onClick={() => setStep('upload')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline text-center"
              >
                Kembali ke Pilih Dokumen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signature Canvas Popup Modal */}
      {isSigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <PenTool size={18} className="mr-2 text-uph-blue" />
                Kolom Otorisasi Kaprodi
              </h2>
              <button 
                onClick={() => setIsSigning(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <p className="text-sm text-gray-500 w-full text-center mb-4">Anda akan menempelkan tanda tangan ini pada koordinat X: {Math.round(signaturePosition?.x ?? 0)}, Y: {Math.round(signaturePosition?.y ?? 0)}.</p>
              
              <div className="w-full h-48 border-2 border-slate-300 rounded-xl bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-white overflow-hidden touch-none relative cursor-crosshair">
                <canvas 
                  ref={canvasRef}
                  width={340} // Resolusi pas box border desktop
                  height={190}
                  className="w-full h-full"
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchMove={draw}
                />
              </div>

              <div className="w-full mt-3 flex justify-end">
                <button 
                  onClick={clearCanvas}
                  className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-uph-red transition-colors"
                >
                  <RotateCcw size={12} className="mr-1" />
                  Bersihkan Kanvas
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
              {isProcessingSignature ? (
                 <span className="flex items-center text-sm text-uph-blue font-bold px-4">
                   <Loader2 size={16} className="animate-spin mr-2" /> Membakar PDF...
                 </span>
              ) : (
                <>
                  <button 
                    onClick={() => setIsSigning(false)}
                    className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={embedSignature}
                    className="px-5 py-2.5 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-none"
                  >
                    Bakar & Tempelkan TTD
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
