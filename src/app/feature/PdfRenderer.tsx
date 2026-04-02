"use client";

import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfRenderer({
    pdfBlobUrl,
    activePage,
    setNumPages,
    handlePdfClick
}: {
    pdfBlobUrl: string;
    activePage: number;
    setNumPages: (n: number) => void;
    handlePdfClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
    return (
        <div className="bg-transparent shadow-xl ring-1 ring-gray-900/5 max-w-[800px] w-full">
            <Document
            file={pdfBlobUrl}
            onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
            loading={<div className="p-20 text-center flex flex-col items-center text-gray-400"><Loader2 className="animate-spin mb-4" /> Membaca Struktur Biner PDF...</div>}
            className="w-full"
            >
            <div 
                className="cursor-crosshair w-full PDF-Hover-State relative transition-all group"
                onClick={handlePdfClick}
            >
                <Page 
                    pageNumber={activePage} 
                    width={800} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                    className="w-full h-full"
                />
                
                <div className="absolute inset-0 bg-uph-blue/0 hover:bg-uph-blue/5 transition-all text-transparent hover:text-white flex items-center justify-center pointer-events-none">
                    <span className="bg-slate-900/80 px-4 py-2 rounded-full font-bold shadow-xl flex items-center text-sm transform opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        Klik di Sini
                    </span>
                </div>
            </div>
            </Document>
        </div>
    );
}
