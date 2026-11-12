import React, { useState } from 'react';
import { DokumenArsip, BerkasKegiatan, UserRole, TAHAPAN_BERKAS } from '../types';
import { StatusChip } from './StatusChip';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Edit3,
  FileText,
  Eye,
  Shield,
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';

interface VerifikasiViewProps {
  dokumenList: DokumenArsip[];
  berkasList: BerkasKegiatan[];
  onApproveDokumen: (doc: DokumenArsip) => void;
  onRejectDokumen: (doc: DokumenArsip, catatan: string) => void;
  onPreviewDokumen: (doc: DokumenArsip) => void;
  currentUser: { inisial: string; role: UserRole };
}

export const VerifikasiView: React.FC<VerifikasiViewProps> = ({
  dokumenList,
  berkasList,
  onApproveDokumen,
  onRejectDokumen,
  onPreviewDokumen,
  currentUser,
}) => {
  const pendingDocs = dokumenList.filter(
    (d) => d.statusVerifikasi === 'Menunggu Verifikasi' || d.statusVerifikasi === 'Perlu Verifikasi Ulang'
  );

  const [selectedDocId, setSelectedDocId] = useState<string>(
    pendingDocs[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Editable fields for correction
  const selectedDoc = dokumenList.find((d) => d.id === selectedDocId) || pendingDocs[0];
  const parentBerkas = berkasList.find((b) => b.id === selectedDoc?.berkasId);

  const [editTahapId, setEditTahapId] = useState<number>(selectedDoc?.tahapId || 1);
  const [editKodeKlasifikasi, setEditKodeKlasifikasi] = useState<string>(
    selectedDoc?.usulanKodeKlasifikasi || selectedDoc?.kodeKlasifikasi || ''
  );
  const [editNamaFile, setEditNamaFile] = useState<string>(
    selectedDoc?.usulanNamaFile || selectedDoc?.namaFile || ''
  );
  const [editRingkasan, setEditRingkasan] = useState<string>(selectedDoc?.ringkasan || '');
  const [editKataKunci, setEditKataKunci] = useState<string>(
    selectedDoc?.kataKunci.join(', ') || ''
  );
  const [editLokasiSimpan, setEditLokasiSimpan] = useState<string>(
    selectedDoc?.lokasiSimpan || 'Ruang Arsip Pusat / Box Aktif'
  );

  const selectDoc = (doc: DokumenArsip) => {
    setSelectedDocId(doc.id);
    setIsEditing(false);
    setEditTahapId(doc.tahapId);
    setEditKodeKlasifikasi(doc.usulanKodeKlasifikasi || doc.kodeKlasifikasi);
    setEditNamaFile(doc.usulanNamaFile || doc.namaFile);
    setEditRingkasan(doc.ringkasan);
    setEditKataKunci(doc.kataKunci.join(', '));
    setEditLokasiSimpan(doc.lokasiSimpan);
  };

  const handleApprove = () => {
    if (!selectedDoc) return;
    const tahapDef = TAHAPAN_BERKAS.find((t) => t.id === editTahapId)!;

    const approvedDoc: DokumenArsip = {
      ...selectedDoc,
      tahapId: editTahapId,
      tahapNama: tahapDef.nama,
      kodeKlasifikasi: editKodeKlasifikasi.trim(),
      usulanKodeKlasifikasi: editKodeKlasifikasi.trim(),
      usulanNamaFile: editNamaFile.trim(),
      ringkasan: editRingkasan.trim(),
      kataKunci: editKataKunci.split(',').map((k) => k.trim()).filter(Boolean),
      lokasiSimpan: editLokasiSimpan.trim(),
      statusVerifikasi: 'Terverifikasi',
      diverifikasiOleh: `${currentUser.inisial} (${currentUser.role})`,
      tanggalVerifikasi: new Date().toISOString(),
      catatanVerifikasi: isEditing ? 'Disetujui dengan koreksi arsiparis' : 'Disetujui sesuai usulan AI',
    };

    onApproveDokumen(approvedDoc);
    setIsEditing(false);
  };

  const handleReject = () => {
    if (!selectedDoc || !rejectReason.trim()) {
      return;
    }

    onRejectDokumen(selectedDoc, rejectReason.trim());
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Antrean Verifikasi Kartu Indeks Kearsipan (Meja Arsiparis)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Pemeriksaan berdampingan antara dokumen sumber kearsipan dinas dan kartu indeks usulan AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
            {pendingDocs.length} Menunggu Verifikasi
          </span>
        </div>
      </div>

      {pendingDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Semua Kartu Indeks Telah Terverifikasi
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada dokumen yang menunggu verifikasi arsiparis saat ini. Dokumen baru yang diunggah akan otomatis masuk ke antrean ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Queue List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daftar Antrean Dokumen ({pendingDocs.length})
            </h2>

            <div className="space-y-2">
              {pendingDocs.map((doc) => {
                const isSelected = doc.id === selectedDoc?.id;
                const parent = berkasList.find((b) => b.id === doc.berkasId);

                return (
                  <div
                    key={doc.id}
                    onClick={() => selectDoc(doc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                        {doc.usulanKodeKlasifikasi || doc.kodeKlasifikasi}
                      </span>
                      <StatusChip status={doc.statusVerifikasi} size="sm" />
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {doc.usulanNamaFile || doc.namaFile}
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {parent?.judul || 'Kegiatan'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Tahap {doc.tahapId} ({doc.tahapNama})</span>
                      <span>Oleh: {doc.diunggahOleh}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Side-by-Side Verification Panel (8 cols) */}
          {selectedDoc && (
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{selectedDoc.id}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {parentBerkas?.judul}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedDoc.namaFile}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPreviewDokumen(selectedDoc)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau File</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto">
                {/* Column 1: Dokumen Sumber */}
                <div className="space-y-3 border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    1. Dokumen Sumber / Metadata Asli
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Nama File Fisik:</span>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white break-all">
                        {selectedDoc.namaFile}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Ukuran & Format:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {(selectedDoc.fileSize / 1024).toFixed(0)} KB · Tipe {selectedDoc.fileType.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Tanggal Unggah & Pelaksana:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(selectedDoc.tanggalUnggah).toLocaleString('id-ID')} ({selectedDoc.diunggahOleh})
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Status Keamanan & Sensor PII:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {selectedDoc.penandaKeamanan}
                        </span>
                        {selectedDoc.piiMasked && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            PII Disamarkan (NIK/HP)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Snippet Teks Sumber */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Potongan Teks Dokumen Sumber:
                    </span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono max-h-48 overflow-y-auto leading-relaxed">
                      {selectedDoc.ringkasan || 'Tidak ada ekstraksi teks langsung.'}
                    </div>
                  </div>
                </div>

                {/* Column 2: Usulan AI vs Koreksi Arsiparis */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      2. Usulan Kartu Indeks AI
                    </h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Batal Koreksi' : 'Koreksi Data'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Tahap */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tahapan Berkas (1-8)
                      </label>
                      {isEditing ? (
                        <select
                          value={editTahapId}
                          onChange={(e) => setEditTahapId(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        >
                          {TAHAPAN_BERKAS.map((th) => (
                            <option key={th.id} value={th.id}>
                              {th.kode} - {th.nama}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-semibold text-slate-900 dark:text-white">
                          Tahap {selectedDoc.tahapId} ({selectedDoc.tahapNama})
                        </div>
                      )}
                    </div>

                    {/* Kode Klasifikasi */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Kode Klasifikasi Arsip Kominfo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editKodeKlasifikasi}
                          onChange={(e) => setEditKodeKlasifikasi(e.target.value)}
                          className="w-full font-mono p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                          {selectedDoc.usulanKodeKlasifikasi || selectedDoc.kodeKlasifikasi}
                        </div>
                      )}
                    </div>

                    {/* Usulan Nama File */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nama File Terstandar
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNamaFile}
                          onChange={(e) => setEditNamaFile(e.target.value)}
                          className="w-full font-mono p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 break-all">
                          {selectedDoc.usulanNamaFile || selectedDoc.namaFile}
                        </div>
                      )}
                    </div>

                    {/* Ringkasan */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Ringkasan Isi Dokumen
                      </label>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editRingkasan}
                          onChange={(e) => setEditRingkasan(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedDoc.ringkasan}
                        </div>
                      )}
                    </div>

                    {/* Kata Kunci */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Kata Kunci Baku
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editKataKunci}
                          onChange={(e) => setEditKataKunci(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDoc.kataKunci.map((kw, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lokasi Simpan */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Lokasi Simpan Fisik / Digital
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editLokasiSimpan}
                          onChange={(e) => setEditLokasiSimpan(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                          {selectedDoc.lokasiSimpan}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Kartu</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isEditing ? 'Simpan Koreksi & Setujui' : 'Setujui Kartu Indeks'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Tolak Usulan Kartu Indeks
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Berikan catatan penolakan agar pelaksana dapat memperbaiki dokumen atau metadata yang diunggah.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Dokumen lampiran belum dibubuhi tanda tangan narasumber..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
