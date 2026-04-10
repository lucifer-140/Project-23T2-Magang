# UPH Lecturer Administration Dashboard

![Version](https://img.shields.io/badge/version-0.5.0-blue)

Sistem Informasi Dasbor Administrasi terpadu untuk Dosen dan Kaprodi Universitas Pelita Harapan (UPH). Aplikasi ini dirancang untuk mendigitalisasi dan memusatkan berbagai manajemen berkas akademis dengan antarmuka yang modern, cepat, dan berorientasi pada penyelesaian tindakan (action-oriented).

## ✅ Fitur Utama Selesai
*   **Dashboards:** Admin, Kaprodi, Koordinator, Dosen, dan Master (System Master).
*   **Verifikasi RPS (Multi-Level):** Alur kerja dua tingkat persetujuan: Dosen → Koordinator → Kaprodi dengan status tracking real-time.
*   **Koordinator Page:** Dashboard khusus Koordinator (`/dashboard/koordinator/rps`) untuk verifikasi RPS pertama tingkat dengan UI identik Kaprodi.
*   **Approval Workflow:** Backend enforce sekuensial—Kaprodi hanya bisa review jika Koordinator sudah setuju.
*   **Rejection Attribution:** Sistem capai nama reviewer yang menolak dan catatan spesifik (Koordinator atau Kaprodi).
*   **Manajemen Matkul:** Penugasan Dosen (Assign Dosen) dengan sinkronisasi instan.
*   **Manajemen Pengguna (Admin):** RBAC (Role-Based Access Control) dengan perlindungan akun Master.
*   **Manajemen Pengguna (Master):** Full CRUD (Create, Read, Update, Delete) akun seluruh sistem.
*   **System Logs & Monitor:** Audit trail transaksi sistem dan status kesehatan server.
*   **UI Library:** Komponen standar (DataTable, Modal, NumberInput, StatusBadge) yang konsisten.

## ⏳ Pengembangan Selanjutnya (Roadmap)
*   Verifikasi SOAL (UTS dan UAS)
*   Verifikasi LPP (Beserta Fitur Tindak Lanjut oleh Kaprodi)
*   Verifikasi EPP (Beserta Fitur Tindak Lanjut oleh Kaprodi)
*   Berita Acara Perwalian

## 🏗️ Stack Teknologi
*   **Frontend:** Next.js 16, Tailwind CSS 4, React 19, Lucide Icons.
*   **Database:** PostgreSQL (Docker) + Prisma ORM 7.
*   **Tools:** PDF-lib (Signatures), PDF.js.

## 📌 Versioning & SemVer
Proyek ini mengikuti [Semantic Versioning](https://semver.org/).
*   **MAJOR (x.0.0):** Perubahan besar yang tidak kompatibel ke belakang.
*   **MINOR (0.x.0):** Penambahan fitur baru yang kompatibel ke belakang.
*   **PATCH (0.0.x):** Perbaikan bug yang kompatibel ke belakang.

**Current Version:** `v0.5.0` (Development Phase - Core workflows and Master-tier integration).

## 🚀 Panduan Lokal
1. Hidupkan database: `docker compose up -d`
2. Sync schema: `npx prisma db push`
3. Jalankan aplikasi: `npm run dev`
