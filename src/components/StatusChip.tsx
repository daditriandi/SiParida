import React from 'react';
import { StatusTahap, StatusVerifikasi, StatusRekomendasi } from '../types';

interface StatusChipProps {
  status: StatusTahap | StatusVerifikasi | StatusRekomendasi | string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  const s = String(status).toLowerCase();

  if (s === 'lengkap' || s === 'terverifikasi' || s === 'sesuai' || s === 'terkendali') {
    // Hijau (Lengkap / Tuntas / Normal)
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  } else if (s === 'verifikasi' || s === 'menunggu verifikasi' || s === 'dalam penanganan') {
    // Biru (Proses / Verifikasi)
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
  } else if (s === 'belum lengkap' || s === 'belum sesuai' || s === 'sedang') {
    // Kuning / Amber (Belum lengkap)
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  } else if (s === 'lewat tenggat' || s === 'ditolak' || s === 'tinggi' || s === 'ekstrem' || s === 'terbuka') {
    // Merah / Crimson (Lewat tenggat / Bahaya / Terbuka)
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-semibold';
  } else if (s === 'belum ada' || s === 'belum ditindaklanjuti' || s === 'tidak dapat ditindaklanjuti' || s === 'rendah') {
    // Abu-abu / Muted
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }

  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center justify-center font-medium border rounded-md whitespace-nowrap shrink-0 ${paddingClass} ${colorClasses}`}
    >
      {status}
    </span>
  );
};
