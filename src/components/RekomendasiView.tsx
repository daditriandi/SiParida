import React, { useState, useMemo } from 'react';
import {
  RekomendasiItem,
  DokumenArsip,
  StatusRekomendasi,
  UnitKerja,
  UNIT_KERJA_LIST,
} from '../types';
import { StatusChip } from './StatusChip';
import { DrafPenagihanModal } from './DrafPenagihanModal';
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  Filter,
  Search,
  Building,
  Calendar,
  FileCheck,
  Paperclip,
  Check,
  X,
  Plus,
} from 'lucide-react';

interface RekomendasiViewProps {
  rekomendasiList: RekomendasiItem[];
  dokumenList: DokumenArsip[];
  onUpdateRekomendasi: (rek: RekomendasiItem) => void;
  onPreviewDokumenById: (docId: string) => void;
}

export const RekomendasiView: React.FC<RekomendasiViewProps> = ({
  rekomendasiList,
  dokumenList,
  onUpdateRekomendasi,
  onPreviewDokumenById,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua');
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);

  const [activeDrafItem, setActiveDrafItem] = useState<RekomendasiItem | null>(null);
  const [editingItem, setEditingItem] = useState<RekomendasiItem | null>(null);

  // Status edit form state
  const [newStatus, setNewStatus] = useState<StatusRekomendasi>('Belum sesuai');
  const [newCatatan, setNewCatatan] = useState('');
  const [selectedBuktiIds, setSelectedBuktiIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const stakeholders = useMemo(() => {
    const set = new Set(rekomendasiList.map((r) => r.stakeholder));
    return Array.from(set).sort();
  }, [rekomendasiList]);

  const filtered = useMemo(() => {
    return rekomendasiList.filter((r) => {
      const matchSearch =
        r.isi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.stakeholder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.berkasJudul.toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnit = selectedUnit === 'Semua' || r.unitKerja === selectedUnit;
      const matchStakeholder = selectedStakeholder === 'Semua' || r.stakeholder === selectedStakeholder;
      const matchStatus = selectedStatus === 'Semua' || r.status === selectedStatus;
      const matchOverdue = !onlyOverdue || (r.isOverdue && r.status !== 'Sesuai');

      return matchSearch && matchUnit && matchStakeholder && matchStatus && matchOverdue;
    });
  }, [rekomendasiList, searchQuery, selectedUnit, selectedStakeholder, selectedStatus, onlyOverdue]);

  const openEditModal = (item: RekomendasiItem) => {
    setEditingItem(item);
    setNewStatus(item.status);
    setNewCatatan(item.catatanTindakLanjut || '');
    setSelectedBuktiIds(item.arsipBuktiIds || []);
    setValidationError(null);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // MANDATORY CONSTRAINT CHECK:
    // "status 'Tuntas' (Sesuai) wajib memiliki minimal satu arsip bukti."
    if (newStatus === 'Sesuai' && selectedBuktiIds.length === 0) {
      setValidationError(
        'Sesuai regulasi kearsipan: Status "Sesuai" (Tuntas) WAJIB melampirkan minimal satu arsip bukti dokumen yang telah diverifikasi di register.'
      );
      return;
    }

    const updated: RekomendasiItem = {
      ...editingItem,
      status: newStatus,
      catatanTindakLanjut: newCatatan.trim(),
      arsipBuktiIds: selectedBuktiIds,
      updatedAt: new Date().toISOString(),
    };

    onUpdateRekomendasi(updated);
    setEditingItem(null);
  };

  const toggleBuktiId = (docId: string) => {
    setSelectedBuktiIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Daftar Induk Rekomendasi & Tindak Lanjut Stakeholder
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Pengawalan implementasi rekomendasi kebijakan tingkat instansi K/L dengan kepastian bukti kearsipan
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode rekomendasi, isi rekomendasi, atau nama instansi..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Building className="w-3.5 h-3.5" />
          <span>Stakeholder:</span>
          <select
            value={selectedStakeholder}
            onChange={(e) => setSelectedStakeholder(e.target.value)}
            aria-label="Filter Stakeholder Rekomendasi"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white max-w-[200px] truncate"
          >
            <option value="Semua">Semua Stakeholder</option>
            {stakeholders.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter Status Rekomendasi"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Status</option>
            <option value="Sesuai">Sesuai (Tuntas)</option>
            <option value="Belum sesuai">Belum Sesuai</option>
            <option value="Belum ditindaklanjuti">Belum Ditindaklanjuti</option>
            <option value="Tidak dapat ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
          </select>
        </div>

        <button
          onClick={() => setOnlyOverdue(!onlyOverdue)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            onlyOverdue
              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Lewat Tenggat Saja</span>
        </button>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-44">Kode Rekomendasi</th>
                <th className="py-3 px-4">Isi Rekomendasi Kebijakan</th>
                <th className="py-3 px-3 w-48">Instansi Stakeholder</th>
                <th className="py-3 px-3 w-28 text-center">Tenggat</th>
                <th className="py-3 px-3 w-32 text-center">Status</th>
                <th className="py-3 px-3 w-40">Arsip Bukti</th>
                <th className="py-3 px-4 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filtered.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div>{item.kode}</div>
                      <div className="text-[10px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                        {item.berkasJudul}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {item.isi}
                      </div>
                      {item.catatanTindakLanjut && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                          <span className="font-semibold">Catatan TL:</span> {item.catatanTindakLanjut}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.stakeholder}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.unitKerja}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {item.tenggat}
                      </div>
                      {item.isOverdue && item.status !== 'Sesuai' && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded border border-rose-200">
                          Lewat Tenggat
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <StatusChip status={item.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      {item.arsipBuktiIds.length > 0 ? (
                        <div className="space-y-1">
                          {item.arsipBuktiIds.map((docId) => (
                            <button
                              key={docId}
                              onClick={() => onPreviewDokumenById(docId)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{docId}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Belum terlampir
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Ubah Status
                        </button>
                        <button
                          onClick={() => setActiveDrafItem(item)}
                          title="Buat draf surat penagihan tindak lanjut"
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Draf Penagihan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{editingItem.kode}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Perbarui Status Tindak Lanjut Rekomendasi
                </h2>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                aria-label="Tutup form"
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Rekomendasi
                </label>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-200">
                  {editingItem.isi}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Tindak Lanjut (Ubah Manual oleh Pengguna) *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value as StatusRekomendasi);
                    setValidationError(null);
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Belum ditindaklanjuti">Belum Ditindaklanjuti</option>
                  <option value="Belum sesuai">Belum Sesuai</option>
                  <option value="Sesuai">Sesuai (Tuntas - Wajib Lampirkan Bukti)</option>
                  <option value="Tidak dapat ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
                </select>
              </div>

              {/* Arsip Bukti Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Dokumen Arsip Bukti Terlampir {newStatus === 'Sesuai' && <span className="text-rose-500">* (Wajib)</span>}
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1.5 bg-slate-50 dark:bg-slate-800/50">
                  {dokumenList
                    .filter((d) => d.berkasId === editingItem.berkasId || d.statusVerifikasi === 'Terverifikasi')
                    .map((doc) => {
                      const isChecked = selectedBuktiIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBuktiId(doc.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-mono text-[11px] font-bold text-blue-600">{doc.id}</span>
                          <span className="truncate max-w-[320px]">{doc.usulanNamaFile || doc.namaFile}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Validation Warning */}
              {validationError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{validationError}</div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Kemajuan / Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  placeholder="Catatan perkembangan tindak lanjut dari stakeholder..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Draf Penagihan Modal */}
      {activeDrafItem && (
        <DrafPenagihanModal
          rekomendasi={activeDrafItem}
          onClose={() => setActiveDrafItem(null)}
        />
      )}
    </div>
  );
};
