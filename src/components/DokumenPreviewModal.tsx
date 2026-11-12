import React, { useEffect, useState } from 'react';
import { DokumenArsip, BerkasKegiatan } from '../types';
import { StatusChip } from './StatusChip';
import { getFileFromIndexedDB } from '../utils/indexedDb';
import { generateOfficialPdfBlob, downloadDokumenArsip } from '../utils/pdfGenerator';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Maximize2,
  FileSpreadsheet,
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
  const [rawBlob, setRawBlob] = useState<Blob | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const ext = (doc.fileType || doc.namaFile.split('.').pop() || 'pdf').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';
  const isVideo = ['mp4', 'webm'].includes(ext);
  const isAudio = ['mp3', 'wav', 'm4a'].includes(ext);
  const isOfficeDoc = ['doc', 'docx', 'rtf'].includes(ext);
  const isOfficeSheet = ['xls', 'xlsx', 'csv'].includes(ext);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const prepareDocument = async () => {
      setLoadingFile(true);
      try {
        // 1. Check IndexedDB if the user uploaded this file previously
        if (doc.fileBlobKey) {
          const stored = await getFileFromIndexedDB(doc.fileBlobKey);
          if (stored && stored.fileData instanceof Blob && active) {
            setRawBlob(stored.fileData);
            createdUrl = URL.createObjectURL(stored.fileData);
            setFileObjectUrl(createdUrl);
            setLoadingFile(false);
            return;
          }
        }

        // 2. If it's a PDF (either sample document or without local raw binary),
        // generate a 100% valid, ISO-standard PDF blob so preview and download work perfectly.
        if (isPdf && active) {
          const validPdfBlob = generateOfficialPdfBlob(doc, parentBerkas);
          setRawBlob(validPdfBlob);
          createdUrl = URL.createObjectURL(validPdfBlob);
          setFileObjectUrl(createdUrl);
        }
      } catch (err) {
        console.warn('Gagal memuat atau membuat berkas dokumen:', err);
      } finally {
        if (active) setLoadingFile(false);
      }
    };

    prepareDocument();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [doc.id, doc.fileBlobKey, doc.namaFile, isPdf]);

  const handleDownload = () => {
    try {
      downloadDokumenArsip(doc, parentBerkas, rawBlob);
      setDownloadSuccessToast(`Berhasil mengunduh ${doc.namaFile}. File PDF resmi siap dibuka di Adobe Acrobat Reader.`);
      setTimeout(() => {
        setDownloadSuccessToast(null);
      }, 5000);
    } catch (err) {
      console.error('Error saat mengunduh naskah:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Toast Notifikasi Unduh */}
        {downloadSuccessToast && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-md shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadSuccessToast}</span>
            </div>
            <button
              onClick={() => setDownloadSuccessToast(null)}
              className="text-emerald-100 hover:text-white text-xs p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950/40 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
              </span>
              <StatusChip status={doc.statusVerifikasi} size="sm" />
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tahap {doc.tahapId}: {doc.tahapNama}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                <span>PDF Standar Baku</span>
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {doc.usulanNamaFile || doc.namaFile}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Berkas: <span className="font-semibold text-slate-700 dark:text-slate-300">{parentBerkas?.judul || 'Kegiatan Kedeputian'}</span> ({parentBerkas?.nomorBerkas})
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pratinjau dokumen"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* File Viewer Section */}
          <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800">
            {/* Header Viewer Toolbar */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Pratinjau Naskah Dinas Digital
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({(doc.fileSize ? (doc.fileSize / 1024).toFixed(0) : 150)} KB · .{ext.toUpperCase()})
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {fileObjectUrl && (
                  <a
                    href={fileObjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50"
                    title="Buka dokumen di tab baru peramban"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Layar Penuh</span>
                  </a>
                )}
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 cursor-pointer"
                  title="Unduh file resmi (kompatibel Adobe Acrobat Reader)"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh File Asli</span>
                </button>
              </div>
            </div>

            {/* Viewer Canvas / Frame */}
            {loadingFile ? (
              <div className="min-h-[280px] flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-500">Menyiapkan berkas dokumen...</span>
              </div>
            ) : isImage && fileObjectUrl ? (
              <div className="flex justify-center p-2 bg-slate-900/5 dark:bg-slate-900/40 rounded-lg">
                <img
                  src={fileObjectUrl}
                  alt={doc.namaFile}
                  className="max-h-96 max-w-full rounded-lg object-contain shadow-sm"
                />
              </div>
            ) : isVideo && fileObjectUrl ? (
              <video controls src={fileObjectUrl} className="max-h-96 w-full rounded-lg" />
            ) : isAudio && fileObjectUrl ? (
              <div className="p-6 flex justify-center">
                <audio controls src={fileObjectUrl} className="w-full max-w-md" />
              </div>
            ) : isPdf && fileObjectUrl ? (
              <div className="w-full rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white shadow-inner">
                <iframe
                  src={fileObjectUrl}
                  title={doc.namaFile}
                  className="w-full h-[420px] rounded-lg"
                />
              </div>
            ) : isOfficeDoc ? (
              <div className="text-center py-8 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {doc.namaFile}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Format naskah dinas Microsoft Word / RTF. Klik tombol di bawah untuk mengunduh dokumen asli.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Asli (.doc/.docx)</span>
                </button>
              </div>
            ) : isOfficeSheet ? (
              <div className="text-center py-8 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {doc.namaFile}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Berkas tabel spreadsheet / rekapitulasi data. Unduh file asli untuk membuka di Excel.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Asli (.xlsx)</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {doc.namaFile}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pratinjau visual daring siap diunduh ke komputer Anda.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Asli</span>
                </button>
              </div>
            )}
          </div>

          {/* Kartu Indeks Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Data Kartu Indeks Kearsipan</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal px-2 py-0.5 rounded">
                Standar Kearsipan Dinamis Kemenko Polkam
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Nama File Asli:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {doc.namaFile}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Usulan Nama File Standar (Baku):</span>
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
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                {doc.ringkasan}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-500">Kata Kunci Baku:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {doc.kataKunci.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Asli (.pdf)</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-slate-500">
              Format standar PDF resmi (Adobe Acrobat compatible)
            </span>
          </div>

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
