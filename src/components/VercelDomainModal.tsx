import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Globe,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface VercelDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadFallbackDocx?: () => void;
}

export const VercelDomainModal: React.FC<VercelDomainModalProps> = ({
  isOpen,
  onClose,
  onDownloadFallbackDocx,
}) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'domain-anda.vercel.app';
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0576354763';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-400/30">
              <AlertTriangle className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  Firebase Error: auth/unauthorized-domain
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-1">
                Solusi Sinkronisasi Google Docs di Vercel
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 dark:text-slate-300">
          {/* Explanation Alert */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-amber-950 dark:text-amber-100 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Mengapa Muncul Pesan "auth/unauthorized-domain"?
            </h3>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-1.5 leading-relaxed">
              Firebase Authentication secara bawaan <strong>memblokir login dari domain baru</strong> demi keamanan,
              kecuali domain tersebut sudah Anda daftarkan ke dalam daftar <em>"Authorized domains"</em> (Domain yang diotorisasi) di Firebase Console proyek Anda.
            </p>
          </div>

          {/* Current Domain Box with 1-Click Copy */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Domain Vercel Anda Saat Ini:
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-1 select-all break-all">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{currentDomain}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Domain</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Steps Solution */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              3 Langkah Mudah Mengatasi Error Ini (Hanya Butuh Waktu ~30 Detik):
            </h4>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      Buka Halaman Pengaturan Firebase Console
                    </h5>
                    <a
                      href={firebaseSettingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <span>Buka Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Klik tombol biru di atas untuk langsung membuka tab <strong>Settings</strong> di Firebase Authentication proyek <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{projectId}</code>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                    Pilih Menu "Authorized domains" & Klik "Add domain"
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Pada bagian <strong>Authorized domains</strong> (Domain yang diotorisasi), klik tombol <strong>"Add domain"</strong>.
                  </p>
                  <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 font-mono">
                    Tempel: <strong className="text-blue-600 dark:text-blue-400">{currentDomain}</strong> <br />
                    <em>(Atau tempel <code className="text-emerald-600 dark:text-emerald-400">vercel.app</code> agar seluruh sub-domain vercel diizinkan).</em>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                    Klik "Done" / "Save" & Coba Sinkronkan Kembali
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Setelah domain tersimpan, kembali ke aplikasi SiParida ini dan klik kembali tombol <strong>"Sinkronkan Ringkasan ke Google Docs"</strong>. Jendela Google akan langsung mengizinkan sinkronisasi tanpa error!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onDownloadFallbackDocx && (
              <button
                onClick={() => {
                  onDownloadFallbackDocx();
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Unduh dokumen dalam format Word (.docx) langsung ke laptop"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Unduh Word (.docx) Langsung</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={firebaseSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Buka Firebase Console Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </a>
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
