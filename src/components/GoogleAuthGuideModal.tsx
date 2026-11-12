import React from 'react';
import { X, CheckCircle2, ShieldCheck, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  onSignIn: () => Promise<void>;
}

export const GoogleAuthGuideModal: React.FC<GoogleAuthGuideModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Petunjuk Otorisasi & Sinkronisasi Google Docs
              </h2>
              <p className="text-xs text-blue-200/80">
                Solusi persetujuan akses Google Workspace untuk Sistem SiParida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Panduan"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 dark:text-slate-300">
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              Mengapa Jendela Persetujuan Google Muncul?
            </h3>
            <p className="text-xs text-blue-900/90 dark:text-blue-200/90 mt-1.5 leading-relaxed">
              Tampilan pada lampiran Anda (dialog Google dengan tombol <strong>Cancel</strong> dan{' '}
              <strong>Continue</strong>) adalah <em>standar keamanan resmi Google OAuth 2.0</em>. Dialog ini
              memastikan bahwa Anda mengizinkan sistem SiParida membuat naskah dinas kearsipan di Google Docs
              dan menyimpannya di Google Drive akun Anda.
            </p>
          </div>

          {/* Screenshot Explanation Mockup */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Langkah yang Harus Dilakukan pada Jendela Google:</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-full md:w-1/2 flex flex-col items-center">
                  <div className="relative border-2 border-blue-500 rounded-xl overflow-hidden shadow-md max-w-xs">
                    <img
                      src="/assets/aistudio/AdobeExpressPhotos_19c07df7b1414051970f8d8737b94da1_CopyEdited_5b107fc2.png"
                      alt="Tampilan Jendela Persetujuan Google OAuth"
                      className="w-full h-auto object-contain max-h-56"
                    />
                    <div className="absolute bottom-2 right-4 px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded shadow animate-pulse">
                      KLIK DI SINI ➔ Continue
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 italic">
                    Tampilan jendela otorisasi yang muncul di layar Anda
                  </span>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                      1
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Klik Tombol "Continue" (Lanjutkan)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pada jendela pop-up persetujuan resmi Google yang muncul, gulir ke bagian paling bawah dan klik tombol biru{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                      "Continue"
                    </span>
                    .
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
                    ⚠️ <strong>Penting:</strong> Jangan klik <em>"Cancel"</em>. SiParida memerlukan izin ini hanya untuk membuat & menata naskah kearsipan dan draf penagihan resmi di Google Docs akun Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Jendela Google Otomatis Menutup & Akun Terhubung
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Setelah tombol Continue diklik, status di pojok kanan atas akan langsung bertuliskan{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      "Terhubung: [email Anda]"
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Dokumen Google Docs Resmi Langsung Dibuat
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Ringkasan Dashboard atau naskah kearsipan langsung tersinkronkan dan dapat dibuka melalui tautan{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      https://docs.google.com/document/...
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Status Akun Google Workspace Saat Ini:</span>
            {googleUser ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Terhubung ({googleUser.email})
              </span>
            ) : (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Belum Terhubung (Menunggu Otorisasi)
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            SiParida menggunakan Google Docs API resmi dengan enkripsi token langsung di peramban.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!googleUser && (
              <button
                onClick={async () => {
                  try {
                    await onSignIn();
                    onClose();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Otorisasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
