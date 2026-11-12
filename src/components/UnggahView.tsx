import React, { useState, useRef, useMemo } from 'react';
import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  TAHAPAN_BERKAS,
  UserRole,
} from '../types';
import { parseUploadedFile, guessDocumentMetadata, ParsedDocumentInput } from '../utils/documentParser';
import { saveFileToIndexedDB } from '../utils/indexedDb';
import { downloadDokumenArsip } from '../utils/pdfGenerator';
import { StatusChip } from './StatusChip';
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
  Download,
  FolderOpen,
  Search,
  Filter,
  Layers,
  FileCheck,
  Check,
} from 'lucide-react';

interface UnggahViewProps {
  berkasList: BerkasKegiatan[];
  dokumenList?: DokumenArsip[];
  onDokumenUploaded: (doc: DokumenArsip, newRecs?: RekomendasiItem[]) => void;
  currentUser: { inisial: string; role: UserRole };
  preselectedTahap?: number;
  onPreviewDokumen?: (doc: DokumenArsip) => void;
  onOpenBerkas?: (berkasId: string) => void;
}

interface QueuedUpload {
  id: string;
  file: File;
  parsed?: ParsedDocumentInput;
  isProcessing: boolean;
  aiEnriched?: boolean;
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
  savedDocId?: string;
}

export const UnggahView: React.FC<UnggahViewProps> = ({
  berkasList,
  dokumenList = [],
  onDokumenUploaded,
  currentUser,
  preselectedTahap,
  onPreviewDokumen,
  onOpenBerkas,
}) => {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [selectedGlobalBerkas, setSelectedGlobalBerkas] = useState<string>(
    berkasList[0]?.id || ''
  );
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [recentUploadedDocIds, setRecentUploadedDocIds] = useState<string[]>([]);
  
  // Filter for already uploaded documents list
  const [filterBerkasId, setFilterBerkasId] = useState<string>('ALL');
  const [filterTahapId, setFilterTahapId] = useState<string>('ALL');
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [activeTabSection, setActiveTabSection] = useState<'upload' | 'history'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered list of documents already saved in system
  const filteredExistingDocs = useMemo(() => {
    return dokumenList.filter((doc) => {
      if (filterBerkasId !== 'ALL' && doc.berkasId !== filterBerkasId) return false;
      if (filterTahapId !== 'ALL' && doc.tahapId.toString() !== filterTahapId) return false;
      if (searchDocQuery.trim()) {
        const q = searchDocQuery.toLowerCase();
        const matchName = doc.namaFile.toLowerCase().includes(q);
        const matchStandard = (doc.usulanNamaFile || '').toLowerCase().includes(q);
        const matchCode = (doc.kodeKlasifikasi || '').toLowerCase().includes(q);
        const matchSummary = doc.ringkasan.toLowerCase().includes(q);
        if (!matchName && !matchStandard && !matchCode && !matchSummary) return false;
      }
      return true;
    });
  }, [dokumenList, filterBerkasId, filterTahapId, searchDocQuery]);

  // Handle files selected via input or drop
  const handleFiles = async (files: FileList | File[]) => {
    const newItems: QueuedUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemId = `UP-${Date.now()}-${i}`;

      // Instant heuristic inference so fields are NEVER blank or hanging
      const inferred = guessDocumentMetadata(file.name);
      const chosenTahap = preselectedTahap || inferred.tahapId;

      const item: QueuedUpload = {
        id: itemId,
        file,
        isProcessing: true,
        aiEnriched: false,
        selectedBerkasId: selectedGlobalBerkas || berkasList[0]?.id || '',
        tahapId: chosenTahap,
        kodeKlasifikasi: inferred.kodeKlasifikasi,
        namaFileStandar: inferred.namaFileStandar,
        ringkasan: inferred.ringkasan,
        kataKunciInput: inferred.kataKunci.join(', '),
        lokasiSimpan: 'Ruang Arsip Kominfo Lt. 3 / Box Aktif',
        tanggalDokumen: new Date().toISOString().split('T')[0],
        extractedRecs: [],
      };
      newItems.push(item);
    }

    // Immediately display the file in the queue
    setQueue((prev) => [...newItems, ...prev]);

    // Switch to upload tab if on history tab so user sees their new upload immediately
    setActiveTabSection('upload');

    // Asynchronously screen and enrich with AI in background without blocking
    for (const item of newItems) {
      processSingleUpload(item);
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

      // Step 2: Call Server-Side Gemini Indexing API with a 6-second timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      try {
        const response = await fetch('/api/gemini/index-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: item.file.name,
            fileType: parsed.fileType,
            textContent: parsed.textContent?.slice(0, 5000),
            base64Data: parsed.base64Data,
            mimeType: parsed.mimeType,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const aiData = result.data || {};
          const recs = aiData.rekomendasi || [];

          setQueue((prev) =>
            prev.map((q) => {
              if (q.id !== item.id) return q;
              return {
                ...q,
                isProcessing: false,
                aiEnriched: true,
                parsed,
                piiWarning: parsed.hasPII || result.piiWarning,
                nikCount: parsed.nikCount,
                phoneCount: parsed.phoneCount,
                manualOnly: parsed.isUnsupportedForAutoExtract,
                tahapId: preselectedTahap || aiData.tahapId || q.tahapId,
                kodeKlasifikasi: aiData.usulanKodeKlasifikasi || q.kodeKlasifikasi,
                namaFileStandar: aiData.usulanNamaFile || q.namaFileStandar,
                ringkasan: aiData.ringkasan || q.ringkasan,
                kataKunciInput: aiData.kataKunci ? aiData.kataKunci.join(', ') : q.kataKunciInput,
                extractedRecs: recs,
              };
            })
          );
          return;
        }
      } catch (fetchErr: any) {
        // Fallback gracefully to instant deterministic metadata
        console.info('Enrichment fallback used for upload:', item.file.name, fetchErr.message);
      }

      // If server took too long or offline, finish processing smoothly
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                isProcessing: false,
                parsed,
                piiWarning: parsed.hasPII,
                nikCount: parsed.nikCount,
                phoneCount: parsed.phoneCount,
              }
            : q
        )
      );
    } catch (err: any) {
      console.warn('Gagal memproses file upload:', err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                isProcessing: false,
                error: err.message || 'Ekstraksi otomatis dialihkan ke pengisian baku',
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
      // 1. Save binary file to IndexedDB for real downloads
      const fileKey = `FILE-${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      try {
        await saveFileToIndexedDB(fileKey, item.file, item.file.type || 'application/octet-stream', item.file.name);
      } catch (idbErr) {
        console.warn('IndexedDB write skipped or failed:', idbErr);
      }

      // 2. Prepare DokumenArsip object
      const docId = `DOC-${Date.now()}`;
      const parentBerkas = berkasList.find((b) => b.id === item.selectedBerkasId);
      const tahapDef = TAHAPAN_BERKAS.find((t) => t.id === item.tahapId) || TAHAPAN_BERKAS[1];

      const newDoc: DokumenArsip = {
        id: docId,
        berkasId: item.selectedBerkasId,
        tahapId: item.tahapId,
        tahapNama: tahapDef.nama,
        namaFile: item.file.name,
        usulanNamaFile: item.namaFileStandar || item.file.name,
        kodeKlasifikasi: item.kodeKlasifikasi || 'KA.02.01',
        usulanKodeKlasifikasi: item.kodeKlasifikasi || 'KA.02.01',
        fileType: item.file.name.split('.').pop()?.toLowerCase() || 'pdf',
        fileSize: item.file.size,
        ringkasan: item.ringkasan || 'Dokumen dinas kearsipan terdaftar resmi pada rangkaian kegiatan kedeputian.',
        kataKunci: item.kataKunciInput ? item.kataKunciInput.split(',').map((k) => k.trim()).filter(Boolean) : ['Kominfo', 'Kearsipan'],
        statusVerifikasi: 'Menunggu Verifikasi',
        lokasiSimpan: item.lokasiSimpan || 'Ruang Arsip Kominfo Lt. 3 / Box Aktif',
        tanggalDokumen: item.tanggalDokumen || new Date().toISOString().split('T')[0],
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
        catatanTindakLanjut: 'Rekomendasi diekstrak dari dokumen naskah dinas kearsipan.',
        isOverdue: false,
        isSample: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Trigger callback to persist into storage and log audit
      onDokumenUploaded(newDoc, newRecs);

      // Track recent uploaded doc id
      setRecentUploadedDocIds((prev) => [docId, ...prev]);

      // Mark saved in UI
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isSaved: true, savedDocId: docId } : q))
      );

      setFeedbackMsg({
        type: 'success',
        text: `Dokumen "${newDoc.usulanNamaFile}" berhasil disimpan ke register! Status: Menunggu Verifikasi Arsiparis.`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title & Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Unggah & Kelola Dokumen Kearsipan 8 Tahap</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Mendukung semua format file (PDF, DOCX, XLSX, TXT, gambar, audio, video). Berkas yang dimasukkan langsung tersimpan di register dan terintegrasi dengan berkas kegiatan.
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTabSection('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Formulir Unggah</span>
              {queue.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {queue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTabSection('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar File yang Sudah Dimasukkan</span>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {dokumenList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Global Berkas Selector */}
        {activeTabSection === 'upload' && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Berkas Rangkaian Tujuan Default:
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
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-1 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW SECTION 1: UPLOAD & PROCESS QUEUE */}
      {activeTabSection === 'upload' && (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
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
                  e.target.value = ''; // Reset input so same file can be selected again
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
                <span>Maksimal 20 MB per file · Penapisan Rahasia Aktif</span>
              </div>
            </div>
          </div>

          {/* Processing & Proposed Card Queue */}
          {queue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Antrean Berkas yang Baru Dimasukkan</span>
                  <span className="bg-blue-600 text-white text-[11px] font-mono px-2 py-0.5 rounded-full">
                    {queue.length}
                  </span>
                </h2>
                <button
                  onClick={() => setQueue([])}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Bersihkan Antrean Selesai
                </button>
              </div>

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
                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{item.file.name}</span>
                          {item.aiEnriched && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Diperkaya</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {(item.file.size / 1024).toFixed(0)} KB · Tipe: {item.file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.isProcessing && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Menganalisis Dokumen...</span>
                        </span>
                      )}
                      {item.isSaved && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Tersimpan di Register</span>
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
                          Data telah disamarkan otomatis sebelum disimpan ke register kearsipan.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Editable Form for Proposed Index Card */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Berkas Target */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Berkas Rangkaian Kegiatan Tujuan *
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

                    {/* Ringkasan */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Ringkasan Dokumen (Maks. 3 Kalimat Berdasarkan Fakta Dokumen) *
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
                        Kata Kunci Baku (dipisahkan koma)
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

                    {/* Save to Register Button / Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 italic">
                        Status kartu setelah disimpan: <strong>Menunggu Verifikasi</strong> (menunggu persetujuan Arsiparis).
                      </span>

                      <div className="flex items-center gap-2">
                        {item.isSaved ? (
                          <>
                            <button
                              onClick={() => {
                                const found = dokumenList.find((d) => d.id === item.savedDocId);
                                if (found && onPreviewDokumen) {
                                  onPreviewDokumen(found);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pratinjau Dokumen</span>
                            </button>
                            <button
                              onClick={() => setActiveTabSection('history')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 rounded-lg hover:bg-blue-100 cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Lihat di Daftar Dokumen</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSaveToRegister(item)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>Simpan Kartu Indeks ke Register</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW SECTION 2: DAFTAR FILE YANG SUDAH DIMASUKKAN KE REGISTER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Daftar File / Dokumen yang Sudah Dimasukkan ke Sistem</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono px-2 py-0.5 rounded-full">
                {filteredExistingDocs.length} Dokumen
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh file naskah dinas yang telah didaftarkan dan terhubung ke berkas kegiatan 8 tahap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total di Register:</span>
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              {dokumenList.length} Arsip
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama file, kode klasifikasi..."
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={filterBerkasId}
              onChange={(e) => setFilterBerkasId(e.target.value)}
              aria-label="Filter Berkas Kegiatan"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Berkas Rangkaian ({berkasList.length})</option>
              {berkasList.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.nomorBerkas}] {b.judul}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterTahapId}
              onChange={(e) => setFilterTahapId(e.target.value)}
              aria-label="Filter Tahapan Kearsipan"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tahap (1 - 8)</option>
              {TAHAPAN_BERKAS.map((th) => (
                <option key={th.id} value={th.id.toString()}>
                  Tahap {th.id}: {th.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List of Existing Documents */}
        {filteredExistingDocs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Belum ada file yang cocok dengan penyaringan
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Unggah file melalui dropzone di atas untuk mendaftarkan dokumen baru ke dalam register kearsipan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {filteredExistingDocs.map((doc) => {
              const parentBerkas = berkasList.find((b) => b.id === doc.berkasId);
              const isRecentlySaved = recentUploadedDocIds.includes(doc.id);

              return (
                <div
                  key={doc.id}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isRecentlySaved
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/60'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {isRecentlySaved && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Baru Saja Dimasukkan</span>
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
                      </span>
                      <StatusChip status={doc.statusVerifikasi} size="sm" />
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Tahap {doc.tahapId}: {doc.tahapNama}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {(doc.fileSize / 1024).toFixed(0)} KB · {doc.fileType.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {doc.usulanNamaFile || doc.namaFile}
                    </div>

                    {doc.namaFile !== (doc.usulanNamaFile || doc.namaFile) && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Nama Asli: {doc.namaFile}
                      </div>
                    )}

                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {doc.ringkasan}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>
                        Berkas: <strong className="text-slate-700 dark:text-slate-300">{parentBerkas?.judul || 'Kegiatan Kedeputian'}</strong> ({parentBerkas?.nomorBerkas})
                      </span>
                      <span>·</span>
                      <span>Lokasi: {doc.lokasiSimpan}</span>
                      <span>·</span>
                      <span>Diunggah: {doc.tanggalUnggah?.split('T')[0] || doc.tanggalDokumen}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {onPreviewDokumen && (
                      <button
                        onClick={() => onPreviewDokumen(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                        title="Pratinjau naskah dokumen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau</span>
                      </button>
                    )}

                    <button
                      onClick={() => downloadDokumenArsip(doc, parentBerkas)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                      title="Unduh file asli (PDF resmi)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>

                    {onOpenBerkas && doc.berkasId && (
                      <button
                        onClick={() => onOpenBerkas(doc.berkasId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Buka rincian berkas rangkaian"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Berkas</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
