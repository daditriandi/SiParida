import React, { useState, useRef } from 'react';
import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  TAHAPAN_BERKAS,
  UserRole,
} from '../types';
import { parseUploadedFile, ParsedDocumentInput } from '../utils/documentParser';
import { saveFileToIndexedDB } from '../utils/indexedDb';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Sparkles,
  Save,
  Trash2,
  Eye,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface UnggahViewProps {
  berkasList: BerkasKegiatan[];
  onDokumenUploaded: (doc: DokumenArsip, newRecs?: RekomendasiItem[]) => void;
  currentUser: { inisial: string; role: UserRole };
  preselectedTahap?: number;
}

interface QueuedUpload {
  id: string;
  file: File;
  parsed?: ParsedDocumentInput;
  isProcessing: boolean;
  error?: string;
  securityRestricted?: boolean;
  securityMessage?: string;
  piiWarning?: boolean;
  nikCount?: number;
  phoneCount?: number;
  manualOnly?: boolean;

  // Form Fields (Editable by User)
  selectedBerkasId: string;
  tahapId: number;
  kodeKlasifikasi: string;
  namaFileStandar: string;
  ringkasan: string;
  kataKunciInput: string;
  lokasiSimpan: string;
  tanggalDokumen: string;
  extractedRecs: { isi: string; stakeholder: string; tenggat: string }[];
  isSaved?: boolean;
}

export const UnggahView: React.FC<UnggahViewProps> = ({
  berkasList,
  onDokumenUploaded,
  currentUser,
  preselectedTahap,
}) => {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [selectedGlobalBerkas, setSelectedGlobalBerkas] = useState<string>(
    berkasList[0]?.id || ''
  );
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files selected via input or drop
  const handleFiles = async (files: FileList | File[]) => {
    const newItems: QueuedUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemId = `UP-${Date.now()}-${i}`;

      const item: QueuedUpload = {
        id: itemId,
        file,
        isProcessing: true,
        selectedBerkasId: selectedGlobalBerkas || berkasList[0]?.id || '',
        tahapId: preselectedTahap || 2,
        kodeKlasifikasi: 'KA.02.01',
        namaFileStandar: file.name,
        ringkasan: '',
        kataKunciInput: 'Kominfo, Arsip, Kedeputian',
        lokasiSimpan: 'Ruang Arsip Pusat / Box Aktif',
        tanggalDokumen: new Date().toISOString().split('T')[0],
        extractedRecs: [],
      };
      newItems.push(item);
    }

    setQueue((prev) => [...newItems, ...prev]);

    // Process each file
    for (const item of newItems) {
      await processSingleUpload(item);
    }
  };

  const processSingleUpload = async (item: QueuedUpload) => {
    try {
      // Step 1: Parse and screen file in browser
      const parsed = await parseUploadedFile(item.file);

      if (parsed.securityRestricted) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  isProcessing: false,
                  parsed,
                  securityRestricted: true,
                  securityMessage: parsed.securityMessage,
                  manualOnly: true,
                  ringkasan: '[PERLU PENGISIAN MANUAL KARENA DOKUMEN MEMUAT PENANDA KEAMANAN]',
                }
              : q
          )
        );
        return;
      }

      // Step 2: Call Server-Side Gemini Indexing API
      const response = await fetch('/api/gemini/index-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: item.file.name,
          fileType: parsed.fileType,
          textContent: parsed.textContent,
          base64Data: parsed.base64Data,
          mimeType: parsed.mimeType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403 && result.error === 'SECURITY_RESTRICTION') {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    isProcessing: false,
                    parsed,
                    securityRestricted: true,
                    securityMessage: result.message,
                    manualOnly: true,
                  }
                : q
            )
          );
          return;
        }
        throw new Error(result.error || result.message || 'Gagal memproses dokumen');
      }

      const aiData = result.data || {};
      const recs = aiData.rekomendasi || [];

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                isProcessing: false,
                parsed,
                piiWarning: parsed.hasPII || result.piiWarning,
                nikCount: parsed.nikCount,
                phoneCount: parsed.phoneCount,
                manualOnly: parsed.isUnsupportedForAutoExtract,
                tahapId: preselectedTahap || aiData.tahapId || q.tahapId,
                kodeKlasifikasi: aiData.usulanKodeKlasifikasi || q.kodeKlasifikasi,
                namaFileStandar: aiData.usulanNamaFile || item.file.name,
                ringkasan: aiData.ringkasan || '',
                kataKunciInput: (aiData.kataKunci || ['Kominfo', 'Kearsipan']).join(', '),
                extractedRecs: recs,
              }
            : q
        )
      );
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                isProcessing: false,
                error: err.message || 'Gagal mengekstrak dokumen',
                manualOnly: true,
              }
            : q
        )
      );
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSaveToRegister = async (item: QueuedUpload) => {
    if (!item.selectedBerkasId) {
      setFeedbackMsg({
        type: 'error',
        text: 'Pilih berkas kegiatan terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    try {
      // 1. Save binary file to IndexedDB
      const fileKey = `FILE-${Date.now()}-${item.file.name}`;
      await saveFileToIndexedDB(fileKey, item.file, item.file.type || 'application/octet-stream', item.file.name);

      // 2. Prepare DokumenArsip object
      const docId = `DOC-${Date.now()}`;
      const parentBerkas = berkasList.find((b) => b.id === item.selectedBerkasId);
      const tahapDef = TAHAPAN_BERKAS.find((t) => t.id === item.tahapId)!;

      const newDoc: DokumenArsip = {
        id: docId,
        berkasId: item.selectedBerkasId,
        tahapId: item.tahapId,
        tahapNama: tahapDef.nama,
        namaFile: item.file.name,
        usulanNamaFile: item.namaFileStandar || item.file.name,
        kodeKlasifikasi: item.kodeKlasifikasi,
        usulanKodeKlasifikasi: item.kodeKlasifikasi,
        fileType: item.file.name.split('.').pop()?.toLowerCase() || 'bin',
        fileSize: item.file.size,
        ringkasan: item.ringkasan || 'Tidak ada ringkasan yang disediakan.',
        kataKunci: item.kataKunciInput.split(',').map((k) => k.trim()).filter(Boolean),
        statusVerifikasi: 'Menunggu Verifikasi',
        lokasiSimpan: item.lokasiSimpan,
        tanggalDokumen: item.tanggalDokumen,
        tanggalUnggah: new Date().toISOString(),
        diunggahOleh: `${currentUser.inisial} (${currentUser.role})`,
        penandaKeamanan: item.securityRestricted ? 'Rahasia' : 'Biasa',
        nikDetected: (item.nikCount || 0) > 0,
        phoneDetected: (item.phoneCount || 0) > 0,
        piiMasked: item.piiWarning,
        fileBlobKey: fileKey,
        sinkronisasiDocs: {
          status: 'Belum Tersinkron',
          mode: 'Simulasi',
        },
        isSample: false,
      };

      // 3. Prepare any extracted recommendations
      const newRecs: RekomendasiItem[] = item.extractedRecs.map((r, idx) => ({
        id: `REK-${Date.now()}-${idx}`,
        kode: `REK-${idx + 1}/${parentBerkas?.pjInisial || 'KOMINFO'}/2026`,
        berkasId: item.selectedBerkasId,
        berkasJudul: parentBerkas?.judul || 'Kegiatan Kedeputian',
        unitKerja: parentBerkas?.unitKerja || 'Sekretaris Deputi',
        isi: r.isi,
        stakeholder: r.stakeholder || 'Kementerian/Lembaga Terkait',
        tenggat: r.tenggat || '2026-03-31',
        status: 'Belum ditindaklanjuti',
        arsipBuktiIds: [],
        catatanTindakLanjut: 'Rekomendasi diekstrak dari dokumen notula/laporan.',
        isOverdue: false,
        isSample: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Trigger callback to persist into storage and log audit
      onDokumenUploaded(newDoc, newRecs);

      // Mark saved in UI
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isSaved: true } : q))
      );
      setFeedbackMsg({
        type: 'success',
        text: `Dokumen "${newDoc.usulanNamaFile}" berhasil disimpan ke register!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Gagal menyimpan ke register: ${err.message}`,
      });
    }
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Unggah Dokumen Kearsipan & Ekstraksi Kartu Indeks AI
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Mendukung semua format file (PDF, DOCX, XLSX, TXT, gambar, audio, video). Batas ukuran maksimal 20 MB per file.
          AI membantu mengusulkan kartu indeks terstandar dengan batasan regulasi kearsipan dinas.
        </p>

        {/* Global Berkas Selector */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pilih Berkas Rangkaian Tujuan:
          </span>
          <select
            value={selectedGlobalBerkas}
            onChange={(e) => setSelectedGlobalBerkas(e.target.value)}
            aria-label="Pilih Berkas Rangkaian Tujuan"
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white max-w-md truncate focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {berkasList.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.nomorBerkas}] {b.judul}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-4 ring-blue-500/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
          }}
        />
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Tarik & Lepas File ke Sini atau Klik untuk Memilih
          </div>
          <p className="text-xs text-slate-500">
            Dapat memilih beberapa file sekaligus. PDF, Word (.docx), Excel (.xlsx), Foto, Video, Audio, TXT.
          </p>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Maksimal 20 MB · Penapisan Rahasia Aktif</span>
          </div>
        </div>
      </div>

      {/* Processing & Proposed Card Queue */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Antrean Usulan Kartu Indeks & Verifikasi ({queue.length})
          </h2>

          {queue.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 transition-all ${
                item.isSaved
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.file.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {(item.file.size / 1024).toFixed(0)} KB · Tipe: {item.file.name.split('.').pop()?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.isProcessing && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mengekstrak Isi & AI...
                    </span>
                  )}
                  {item.isSaved && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tersimpan di Register
                    </span>
                  )}
                  <button
                    onClick={() => removeQueueItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Hapus dari antrean"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Security Restricted Warning Banner */}
              {item.securityRestricted && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Penolakan Pemrosesan AI (Keamanan Kearsipan):</strong>
                    <p className="mt-0.5">{item.securityMessage}</p>
                    <p className="mt-1 font-semibold text-rose-700 dark:text-rose-300">
                      Dokumen tetap dapat didaftarkan secara manual di bawah tanpa dikirimkan ke model AI.
                    </p>
                  </div>
                </div>
              )}

              {/* PII Masking Warning Banner */}
              {item.piiWarning && !item.securityRestricted && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Peringatan Pelindungan Data Pribadi (UU PDP):</strong>
                    <p className="mt-0.5">
                      Terdeteksi NIK 16 digit ({item.nikCount || 0}) atau nomor telepon pribadi ({item.phoneCount || 0}).
                      Data telah disamarkan otomatis (misal: 3171********0001) sebelum diolah AI dan sebelum disimpan ke register.
                    </p>
                  </div>
                </div>
              )}

              {/* Editable Form for Proposed Index Card */}
              {!item.isProcessing && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Berkas Target */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Berkas Rangkaian Tujuan *
                      </label>
                      <select
                        value={item.selectedBerkasId}
                        disabled={item.isSaved}
                        onChange={(e) =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, selectedBerkasId: e.target.value } : q))
                          )
                        }
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      >
                        {berkasList.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.nomorBerkas}] {b.judul}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tahap (1-8) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tahapan Berkas (1-8) *
                      </label>
                      <select
                        value={item.tahapId}
                        disabled={item.isSaved}
                        onChange={(e) =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, tahapId: Number(e.target.value) } : q))
                          )
                        }
                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      >
                        {TAHAPAN_BERKAS.map((th) => (
                          <option key={th.id} value={th.id}>
                            {th.kode} - {th.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kode Klasifikasi */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Usulan Kode Klasifikasi *
                      </label>
                      <input
                        type="text"
                        disabled={item.isSaved}
                        value={item.kodeKlasifikasi}
                        onChange={(e) =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, kodeKlasifikasi: e.target.value } : q))
                          )
                        }
                        className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Nama File Terstandar */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Usulan Nama File Terstandar Kominfo *
                      </label>
                      <input
                        type="text"
                        disabled={item.isSaved}
                        value={item.namaFileStandar}
                        onChange={(e) =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, namaFileStandar: e.target.value } : q))
                          )
                        }
                        className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Lokasi Simpan */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Lokasi Simpan Fisik / Digital *
                      </label>
                      <input
                        type="text"
                        disabled={item.isSaved}
                        value={item.lokasiSimpan}
                        onChange={(e) =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, lokasiSimpan: e.target.value } : q))
                          )
                        }
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Ringkasan (Max 3 Kalimat) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ringkasan Dokumen (Maks. 3 Kalimat Berdasar Fakta Dokumen) *
                    </label>
                    <textarea
                      rows={2}
                      disabled={item.isSaved}
                      value={item.ringkasan}
                      onChange={(e) =>
                        setQueue((prev) =>
                          prev.map((q) => (q.id === item.id ? { ...q, ringkasan: e.target.value } : q))
                        )
                      }
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Kata Kunci */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kata Kunci Baku (Maks. 6, dipisahkan koma)
                    </label>
                    <input
                      type="text"
                      disabled={item.isSaved}
                      value={item.kataKunciInput}
                      onChange={(e) =>
                        setQueue((prev) =>
                          prev.map((q) => (q.id === item.id ? { ...q, kataKunciInput: e.target.value } : q))
                        )
                      }
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Extracted Recommendations (if any) */}
                  {item.extractedRecs.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                      <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Mendeteksi {item.extractedRecs.length} Rekomendasi Kebijakan:</span>
                      </div>
                      {item.extractedRecs.map((rec, rIdx) => (
                        <div key={rIdx} className="bg-white dark:bg-slate-900 p-2 rounded border border-blue-100 dark:border-blue-900 text-[11px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{rec.isi}</div>
                          <div className="text-slate-500 mt-0.5">
                            Instansi: <strong className="text-slate-700 dark:text-slate-300">{rec.stakeholder}</strong> · Tenggat: {rec.tenggat || 'Belum ada'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save to Register Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 italic">
                      Status kartu setelah disimpan: <strong>Menunggu Verifikasi</strong> (menunggu persetujuan arsiparis).
                    </span>

                    {!item.isSaved && (
                      <button
                        onClick={() => handleSaveToRegister(item)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Kartu Indeks ke Register</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
