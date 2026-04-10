"use client";

export function SyncIndicator({ isValidating, error }: { isValidating: boolean; error?: Error }) {
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm z-50">
        Gagal memperbarui data. Memeriksa ulang...
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-100 text-blue-500 text-xs px-3 py-2 rounded-lg shadow-sm z-50 animate-pulse">
        Memperbarui...
      </div>
    );
  }

  return null;
}
