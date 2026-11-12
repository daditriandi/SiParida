import React, { useState, useMemo } from 'react';
import { LogAudit } from '../types';
import { History, Filter, Search, Shield, Timer, User, Calendar } from 'lucide-react';

interface AuditLogViewProps {
  logs: LogAudit[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchAction = filterAction === 'Semua' || log.aksi === filterAction;
      const matchSearch =
        log.pengguna.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.peran.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAction && matchSearch;
    });
  }, [logs, filterAction, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Log Audit & Jejak Aktivitas Kearsipan
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Pencatatan riwayat setiap tindakan pengguna: unggah berkas, verifikasi kartu indeks, perubahan status rekomendasi, sinkronisasi docs, dan durasi pencarian.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna, peran, atau uraian aktivitas..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Aksi:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            aria-label="Filter Aksi Audit Log"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Aksi</option>
            <option value="Unggah Dokumen">Unggah Dokumen</option>
            <option value="Verifikasi Kartu">Verifikasi Kartu</option>
            <option value="Ubah Status Rekomendasi">Ubah Status Rekomendasi</option>
            <option value="Buat Draf Penagihan">Buat Draf Penagihan</option>
            <option value="Sinkronisasi Docs">Sinkronisasi Docs</option>
            <option value="Pencarian Arsip">Pencarian Arsip</option>
            <option value="Ekspor Laporan">Ekspor Laporan</option>
            <option value="Reset Data">Reset Data</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-44">Waktu (WIB)</th>
                <th className="py-3 px-4 w-52">Pengguna & Peran</th>
                <th className="py-3 px-3 w-44">Aksi</th>
                <th className="py-3 px-4">Detail Aktivitas</th>
                <th className="py-3 px-3 w-28 text-right">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.map((log) => {
                let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                if (log.aksi === 'Verifikasi Kartu') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                } else if (log.aksi === 'Unggah Dokumen') {
                  badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
                } else if (log.aksi === 'Pencarian Arsip') {
                  badgeClass = 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300';
                } else if (log.aksi === 'Buat Draf Penagihan') {
                  badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 tabular-nums">
                      {new Date(log.waktu).toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.pengguna}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.peran}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}`}>
                        {log.aksi}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {log.detail}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[11px] tabular-nums text-slate-500">
                      {log.durasiMs !== undefined ? `${(log.durasiMs / 1000).toFixed(2)}s` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
