# UPH Lecturer Administration Dashboard

Sistem Informasi Dasbor Administrasi terpadu untuk Dosen dan Kaprodi Universitas Pelita Harapan (UPH). Aplikasi ini dirancang untuk mendigitalisasi dan memusatkan berbagai manajemen berkas akademis dengan antarmuka yang modern, cepat, dan berorientasi pada penyelesaian tindakan (action-oriented).

## Fitur Utama Rencana Pengembangan
*   ✅ **Verifikasi RPS** (Rencana Pembelajaran Semester)
*   ⏳ **Verifikasi SOAL** (UTS dan UAS)
*   ⏳ **Verifikasi LPP** (Beserta Fitur Tindak Lanjut oleh Kaprodi dari hasil LPP)
*   ⏳ **Verifikasi EPP** (Beserta Fitur Tindak Lanjut oleh Kaprodi dari hasil EPP)
*   ⏳ **Berita Acara Perwalian**

## Status Proyek Saat Ini
> **Saat Ini Selesai:** Purwarupa (Mockup) **UI and UX** ekstensif untuk sistem **Verifikasi RPS**. 

Aktor Dosen dapat mengeklaim lembar RPS dan mengajukannya. Aktor Admin (Kaprodi) memiliki 4-Workspace Prioritas (Needs Review, Menunggu Revisi, Direktori Dosen, Arsip) lengkap dengan *interactive Pop-out Modal* untuk melakukan ulasan (Tolak/Revisi/Bantu Dokumen).

## Stack Teknologi
*   **Frontend:** Next.js 14, Tailwind CSS, React Lucide Icons.
*   **Database:** PostgreSQL (berbasis Docker) + Prisma ORM.

## Panduan Lokal & Instalasi
1. Menghidupkan *database container*: `docker compose up -d`
2. Menerapkan skema dan sampel ke dalam tabel (jika ada simulasi non-statis): `npx prisma db push`
3. Menjalankan lingkungan pengembangan: `npm run dev`
