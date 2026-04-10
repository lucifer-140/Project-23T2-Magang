import Link from 'next/link';
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react';
import Image from 'next/image';

export default async function LobbyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isRejected = status === 'rejected';

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-uph-grayBg">
      <div className="bg-white rounded-2xl pt-10 px-10 pb-8 w-full max-w-[480px] relative shadow-[0_24px_64px_rgba(0,0,0,0.12)] border border-gray-100">
        <div className={`absolute top-0 left-0 right-0 h-[5px] rounded-t-2xl ${isRejected ? 'bg-uph-red' : 'bg-uph-blue'}`} />

        <div className="text-center mb-6 flex flex-col items-center">
          <Image
            src="/Gambar/Logo UPH.png"
            alt="Logo UPH"
            width={64}
            height={64}
            className="mb-4 object-contain"
          />

          {isRejected ? (
            <>
              <div className="w-14 h-14 bg-red-100 text-uph-red rounded-full flex items-center justify-center mb-4">
                <XCircle size={28} />
              </div>
              <h1 className="font-playfair text-[22px] font-bold text-gray-800 tracking-wide mb-2">
                Pendaftaran Ditolak
              </h1>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Maaf, permohonan akun Anda telah ditolak oleh administrator. Hubungi pihak akademik untuk informasi lebih lanjut.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                <Clock size={28} />
              </div>
              <h1 className="font-playfair text-[22px] font-bold text-gray-800 tracking-wide mb-2">
                Menunggu Persetujuan
              </h1>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Akun Anda telah berhasil dibuat dan sedang menunggu persetujuan dari administrator. Anda akan dapat masuk setelah akun disetujui.
              </p>
            </>
          )}
        </div>

        <div className="h-[1px] bg-gray-100 my-6" />

        <div className={`rounded-xl p-4 mb-6 ${isRejected ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-start gap-3">
            <Mail size={18} className={`mt-0.5 flex-shrink-0 ${isRejected ? 'text-uph-red' : 'text-uph-blue'}`} />
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {isRejected
                ? 'Silakan hubungi admin akademik di email resmi kampus untuk mengajukan banding atau mendapatkan penjelasan lebih lanjut.'
                : 'Proses persetujuan biasanya memakan waktu 1–2 hari kerja. Anda dapat mencoba masuk kembali setelah menerima konfirmasi dari administrator.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-[11px] bg-uph-blue hover:bg-uph-blue/90 text-white font-semibold text-[14px] rounded-lg text-center transition-all"
          >
            Kembali ke Halaman Masuk
          </Link>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400">
          © 2026 <span className="text-uph-blue font-semibold">Universitas Pelita Harapan</span>. All rights reserved.
        </p>
      </div>
    </main>
  );
}
