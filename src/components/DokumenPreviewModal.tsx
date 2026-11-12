import React, { useEffect, useState } from 'react';
import { DokumenArsip, BerkasKegiatan } from '../types';
import { StatusChip } from './StatusChip';
import { getFileFromIndexedDB } from '../utils/indexedDb';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Shield,
  RefreshCw,
  FileCheck,
  Building,
  Calendar,
  Lock,
} from 'lucide-react';

interface DokumenPreviewModalProps {
  doc: DokumenArsip;
  parentBerkas?: BerkasKegiatan;
  onClose: () => void;
  onSyncDokumen: (doc: DokumenArsip) => void;
}

export const DokumenPreviewModal: React.FC<DokumenPreviewModalProps> = ({
  doc,
  parentBerkas,
  onClose,
  onSyncDokumen,
}) => {
  const [fileObjectUrl, setFileObjectUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    let active = true;
    const loadBinary = async () => {
      if (!doc.fileBlobKey) return;
      try {
        setLoadingFile(true);
        const stored = await getFileFromIndexedDB(doc.fileBlobKey);
        if (stored && stored.fileData && active) {
          if (stored.fileData instanceof Blob) {
            const url = URL.createObjectURL(stored.fileData);
            setFileObjectUrl(url);
          }
        }
      } catch (e) {
        console.warn('Could not load binary from IndexedDB:', e);
      } finally {
        if (active) setLoadingFile(false);
      }
    };

    loadBinary();

    return () => {
      active = false;
      if (fileObjectUrl) {
        URL.revokeObjectURL(fileObjectUrl);
      }
    };
  }, [doc.fileBlobKey]);

  const ext = doc.fileType.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';
  const isVideo = ['mp4', 'webm'].includes(ext);
  const isAudio = ['mp3', 'wav', 'm4a'].includes(ext);

  const handleDownload = () => {
    if (fileObjectUrl) {
      const a = document.createElement('a');
      a.href = fileObjectUrl;
      a.download = doc.namaFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback: create plain text or dummy blob
    const blob = new Blob([doc.ringkasan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                {doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
              </span>
              <StatusChip status={doc.statusVerifikasi} size="sm" />
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tahap {doc.tahapId}: {doc.tahapNama}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {doc.usulanNamaFile || doc.namaFile}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Berkas: {parentBerkas?.judul || 'Kegiatan Kedeputian'} ({parentBerkas?.nomorBerkas})
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pratinjau dokumen"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Viewer Section */}
          <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[220px] flex items-center justify-center">
            {isImage && fileObjectUrl ? (
              <img
                src={fileObjectUrl}
                alt={doc.namaFile}
                className="max-h-80 max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : isVideo && fileObjectUrl ? (
              <video controls src={fileObjectUrl} className="max-h-80 max-w-full rounded-lg" />
            ) : isAudio && fileObjectUrl ? (
              <audio controls src={fileObjectUrl} className="w-full max-w-md" />
            ) : isPdf && fileObjectUrl ? (
              <iframe
                src={fileObjectUrl}
                title={doc.namaFile}
                className="w-full h-80 rounded-lg border border-slate-300 dark:border-slate-700"
              />
            ) : (
              <div className="text-center py-6 space-y-2">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {doc.namaFile} ({(doc.fileSize / 1024).toFixed(0)} KB)
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Pratinjau visual langsung tidak tersedia atau format naskah dinas. Klik tombol unduh di bawah untuk membaca file asli.
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Asli</span>
                </button>
              </div>
            )}
          </div>

          {/* Kartu Indeks Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Data Kartu Indeks Kearsipan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Nama File Asli:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {doc.namaFile}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Usulan Nama File Standar:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {doc.usulanNamaFile || doc.namaFile}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Lokasi Simpan Fisik / Digital:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {doc.lokasiSimpan}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Tanggal Dokumen & Pengunggah:</span>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {doc.tanggalDokumen} ({doc.diunggahOleh})
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500">Ringkasan Resmi Dokumen:</span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                {doc.ringkasan}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-500">Kata Kunci Baku:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {doc.kataKunci.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Google Docs Status & Sync Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Integrasi Google Docs:</span>
                {doc.sinkronisasiDocs.status === 'Tersinkron' ? (
                  <a
                    href={doc.sinkronisasiDocs.docUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>Tersinkron ({doc.sinkronisasiDocs.mode})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="ml-2 text-slate-400">Belum tersinkron</span>
                )}
              </div>

              <button
                onClick={() => onSyncDokumen(doc)}
                className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkronkan ke Docs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
