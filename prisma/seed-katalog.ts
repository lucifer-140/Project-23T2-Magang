import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const KATALOG: { code: string; name: string; sks: number }[] = [
  { code: 'FLA12102 / FLA92102B',   name: 'Bahasa Indonesia',                                                    sks: 2 },
  { code: 'FLA12101A / FLA92101A',  name: 'Kewarganegaraan',                                                     sks: 2 },
  { code: 'FLA12101B / FLA92101B',  name: 'Pancasila',                                                           sks: 2 },
  { code: 'CFE20202 / CFE90202',    name: 'Kepemimpinan yang Melayani',                                          sks: 2 },
  { code: 'CFE20201 / CFE90201',    name: 'Penalaran Reflektif',                                                 sks: 2 },
  { code: 'CFE20203 / CFE90203',    name: 'Teks dan Konteks',                                                    sks: 2 },
  { code: 'FLA11101A / FLA91101A',  name: 'Pendidikan Agama Kristen',                                           sks: 4 },
  { code: 'FLA11101B / FLA 91101B', name: 'Pendidikan Agama-Agama Dunia',                                       sks: 4 },
  { code: 'CFE11201A / CFE91201A',  name: 'Allah dan Ciptaan',                                                   sks: 4 },
  { code: 'CFE11201B / CFE91201B',  name: 'Allah dan Semesta',                                                   sks: 4 },
  { code: 'CFE11202A / CFE 91202A', name: 'Allah dan Dosa',                                                      sks: 4 },
  { code: 'CFE11202B / CFE91202B',  name: 'Manusia dan Moralitas',                                               sks: 4 },
  { code: 'CFE11203A / CFE91203A',  name: 'Allah dan Ciptaan Baru',                                              sks: 4 },
  { code: 'CFE11203B / CFE91203B',  name: 'Sejarah dan Masyarakat',                                              sks: 4 },
  { code: 'FIT24001',               name: 'Sistem Operasi',                                                       sks: 3 },
  { code: 'INF24031',               name: 'Pengantar Keamanan Komputer dan Jaringan',                            sks: 2 },
  { code: 'INF24011',               name: 'Dasar Pemrograman',                                                    sks: 3 },
  { code: 'INF20011',               name: 'Matematika Diskrit',                                                   sks: 4 },
  { code: 'INF20012',               name: 'Kalkulus 1',                                                           sks: 4 },
  { code: 'INF24023',               name: 'Statistika',                                                           sks: 2 },
  { code: 'INF24024',               name: 'Probabilitas',                                                         sks: 2 },
  { code: 'INF20022',               name: 'Kalkulus 2',                                                           sks: 4 },
  { code: 'INF20032',               name: 'Aljabar Linier & Matriks',                                            sks: 2 },
  { code: 'INF20054',               name: 'Pemrograman Aplikasi Platform Mobile',                                sks: 3 },
  { code: 'INF20025',               name: 'Organisasi dan Arsitektur Komputer',                                  sks: 4 },
  { code: 'INF20053',               name: 'Perancangan & Pemrograman Web',                                       sks: 3 },
  { code: 'INF20013',               name: 'Pengantar Informatika & Komputasi',                                   sks: 3 },
  { code: 'INF20034',               name: 'Pemrograman Berorientasi Objek',                                      sks: 2 },
  { code: 'INF20024',               name: 'Pemrograman Java',                                                     sks: 3 },
  { code: 'INF20033',               name: 'Sistem Basis Data',                                                    sks: 4 },
  { code: 'INF20041',               name: 'Pengembangan Piranti Lunak',                                          sks: 4 },
  { code: 'INF20042',               name: 'Pemodelan Berorientasi Objek',                                        sks: 2 },
  { code: 'INF24021',               name: 'Algoritma & Struktur Data',                                           sks: 3 },
  { code: 'INF20031',               name: 'Desain & Analisis Algoritma',                                         sks: 2 },
  { code: 'INF20044',               name: 'Interaksi Manusia & Komputer',                                        sks: 2 },
  { code: 'INF24051',               name: 'Pengalaman Pengguna',                                                  sks: 2 },
  { code: 'INF20351',               name: 'Sistem Media Interaktif',                                              sks: 3 },
  { code: 'INF20043',               name: 'Grafika Komputer',                                                     sks: 2 },
  { code: 'INF24061',               name: 'Pengolahan Citra',                                                     sks: 3 },
  { code: 'INF20045',               name: 'Komunikasi Data dan Jaringan Komputer',                               sks: 3 },
  { code: 'INF20061',               name: 'Teknologi Awan',                                                       sks: 3 },
  { code: 'INF20052',               name: 'Kecerdasan Komputasional',                                            sks: 4 },
  { code: 'INF24042',               name: 'Pengantar Pemelajaran Mesin',                                         sks: 2 },
  { code: 'INF20071',               name: 'Kapita Selekta',                                                       sks: 2 },
  { code: 'INF24041',               name: 'Simulasi dan Pemodelan',                                               sks: 2 },
  { code: 'INF24062',               name: 'Metodologi Penelitian',                                                sks: 2 },
  { code: 'INF24072',               name: 'Tugas Akhir',                                                          sks: 6 },
  { code: 'INF24141',               name: 'Pemelajaran Mesin Lanjut',                                            sks: 3 },
  { code: 'INF24162',               name: 'Visi Komputer',                                                        sks: 3 },
  { code: 'INF24151',               name: 'Sistem Cerdas',                                                        sks: 3 },
  { code: 'INF20152',               name: 'Komputasi Paralel',                                                    sks: 3 },
  { code: 'INF20161',               name: 'Pemrosesan Bahasa Alami',                                             sks: 3 },
  { code: 'INF24171',               name: 'Studio Pengembangan Aplikasi Kecerdasan Artifisial',                  sks: 4 },
  { code: 'INF24241',               name: 'Keamanan Komputer dan Jaringan Lanjut',                               sks: 3 },
  { code: 'INF24251',               name: 'Pengkodean yang Aman',                                                 sks: 3 },
  { code: 'INF24261',               name: 'Kriptografi',                                                          sks: 3 },
  { code: 'INF20162',               name: 'Teknologi Blockchain',                                                 sks: 3 },
  { code: 'INF24271',               name: 'Studio Pengembangan Aplikasi Keamanan Siber',                         sks: 4 },
  { code: 'INF24252',               name: 'Forensik Digital',                                                     sks: 3 },
  { code: 'INF24361',               name: '(MK Pilihan) Topik Khusus Bahasa Pemrograman',                        sks: 3 },
  { code: 'INF24362',               name: '(MK Pilihan) Topik Khusus Bisnis Digital',                            sks: 3 },
  { code: 'INF24363',               name: '(MK Pilihan) Topik Khusus Data & Informasi',                          sks: 3 },
  { code: 'INF24364',               name: '(MK Pilihan) Topik Khusus Rekayasa Piranti Lunak Lanjut',             sks: 3 },
  { code: 'INF24365',               name: '(MK Pilihan) Topik Khusus Frontier Software & Technology',            sks: 3 },
  { code: 'INF24366',               name: '(MK Pilihan) Topik Khusus Inovasi Teknologi & Bisnis',                sks: 3 },
  { code: 'INF24367',               name: '(MK Pilihan) Topik Khusus Kecerdasan Budaya',                         sks: 3 },
  { code: 'INF24368',               name: '(MK Pilihan) Topik Khusus Manusia dan Semesta',                       sks: 3 },
  { code: 'INF24369',               name: '(MK Pilihan) Topik Khusus Kapita Selekta Dunia Industri',             sks: 2 },
  { code: 'INF24370',               name: '(MK Pilihan) Topik Khusus Kerjasama Tim',                             sks: 3 },
  { code: 'INF24371',               name: '(MK Pilihan) Topik Khusus Keterampilan Berkomunikasi',                sks: 4 },
  { code: 'INF24372',               name: '(MK Pilihan) Topik Khusus Keterampilan Praktik Kerja',                sks: 4 },
  { code: 'INF24373',               name: '(MK Pilihan) Topik Khusus Dokumentasi Proyek',                        sks: 3 },
  { code: 'INF24374',               name: '(MK Pilihan) Topik Khusus Studio Perancangan Aplikasi Industri',      sks: 4 },
];

async function main() {
  console.log('🌱 Seeding KatalogMatkul...');
  let count = 0;
  for (const k of KATALOG) {
    await prisma.katalogMatkul.upsert({
      where: { code: k.code },
      update: { name: k.name, sks: k.sks },
      create: { code: k.code, name: k.name, sks: k.sks },
    });
    count++;
  }
  console.log(`✅ Seeded ${count} KatalogMatkul entries`);
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => { prisma.$disconnect(); pool.end(); });
