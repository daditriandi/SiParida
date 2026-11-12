import React, { useState, useMemo } from 'react';
import { BerkasKegiatan, UnitKerja, UNIT_KERJA_LIST, TAHAPAN_BERKAS, DAFTAR_BULAN_2026 } from '../types';
import { StatusChip } from './StatusChip';
import {
  FolderArchive,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface BerkasViewProps {
  berkasList: BerkasKegiatan[];
  onOpenBerkas: (berkasId: string) => void;
  onCreateBerkas: () => void;
  currentUnit: UnitKerja;
}

export const BerkasView: React.FC<BerkasViewProps> = ({
  berkasList,
  onOpenBerkas,
  onCreateBerkas,
  currentUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPeriode, setFilterPeriode] = useState<string>('Semua');

  const filtered = useMemo(() => {
    return berkasList.filter((b) => {
      const matchSearch =
        b.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.nomorBerkas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pjInisial.toLowerCase().includes(searchQuery.toLowerCase());
      const matchUnit = filterUnit === 'Semua' || b.unitKerja === filterUnit;
      const matchStatus = filterStatus === 'Semua' || b.statusKelengkapan === filterStatus;
      const matchPeriode =
        filterPeriode === 'Semua' ||
        b.periodeBulan === filterPeriode ||
        b.periodeBulan.includes(filterPeriode);
      return matchSearch && matchUnit && matchStatus && matchPeriode;
    });
  }, [berkasList, searchQuery, filterUnit, filterStatus, filterPeriode]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Daftar Berkas Kegiatan Kearsipan Utuh
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Pengelolaan arsip dinas sebagai satu kesatuan rangkaian berkas dari perencanaan hingga tindak lanjut rekomendasi
          </p>
        </div>
        <button
          onClick={onCreateBerkas}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Berkas Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nomor berkas, judul kegiatan, atau inisial PJ..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Unit:</span>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            aria-label="Filter Unit Kerja Berkas"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Unit Kerja</option>
            {UNIT_KERJA_LIST.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter Status Berkas"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lengkap">Lengkap (100%)</option>
            <option value="Verifikasi">Verifikasi</option>
            <option value="Belum Lengkap">Belum Lengkap</option>
            <option value="Lewat Tenggat">Lewat Tenggat</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Periode:</span>
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value)}
            aria-label="Filter Periode Berkas"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Periode (Jan–Des 2026)</option>
            {DAFTAR_BULAN_2026.map((bln) => (
              <option key={bln} value={bln}>
                {bln}
              </option>
            ))}
          </select>
        </div>

        {(filterUnit !== 'Semua' || filterStatus !== 'Semua' || filterPeriode !== 'Semua' || searchQuery) && (
          <button
            onClick={() => {
              setFilterUnit('Semua');
              setFilterStatus('Semua');
              setFilterPeriode('Semua');
              setSearchQuery('');
            }}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Grid of Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((berkas) => {
          return (
            <div
              key={berkas.id}
              onClick={() => onOpenBerkas(berkas.id)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {berkas.nomorBerkas}
                    </span>
                    {berkas.isSample && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        DATA CONTOH
                      </span>
                    )}
                  </div>
                  <StatusChip status={berkas.statusKelengkapan} />
                </div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {berkas.judul}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {berkas.deskripsi}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>PJ: <strong className="text-slate-800 dark:text-slate-200">{berkas.pjInisial}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{berkas.periodeBulan}</span>
                  </div>
                </div>

                {/* 8-Stage Pipeline mini visual */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>Progres 8 Tahap</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white font-bold">
                      {berkas.persentaseKelengkapan}%
                    </span>
                  </div>

                  <div className="grid grid-cols-8 gap-1">
                    {TAHAPAN_BERKAS.map((th) => {
                      const st = berkas.tahapanStatus[th.id] || 'Belum Ada';
                      let bg = 'bg-slate-200 dark:bg-slate-700';
                      if (st === 'Lengkap') bg = 'bg-emerald-500';
                      else if (st === 'Verifikasi') bg = 'bg-blue-500';
                      else if (st === 'Belum Lengkap') bg = 'bg-amber-400';
                      else if (st === 'Lewat Tenggat') bg = 'bg-rose-500';

                      return (
                        <div
                          key={th.id}
                          className={`h-1.5 rounded-full ${bg}`}
                          title={`${th.kode} (${th.nama}): ${st}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                <span className="text-[11px] text-slate-500 font-normal truncate max-w-[200px]">
                  {berkas.unitKerja}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Buka Rangkaian Berkas
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
