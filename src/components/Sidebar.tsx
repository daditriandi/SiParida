import React from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  UploadCloud,
  Search,
  CheckCircle2,
  FileCheck,
  BarChart3,
  Settings,
  History,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../types';

export type PageId =
  | 'dashboard'
  | 'berkas'
  | 'unggah'
  | 'cari'
  | 'rekomendasi'
  | 'verifikasi'
  | 'laporan'
  | 'pengaturan'
  | 'audit';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  currentRole: UserRole;
  onResetData: () => void;
  pendingVerificationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  currentRole,
  onResetData,
  pendingVerificationCount,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'berkas', label: 'Berkas Kegiatan', icon: <FolderArchive className="w-4 h-4" /> },
    { id: 'unggah', label: 'Unggah Dokumen', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'cari', label: 'Cari Arsip', icon: <Search className="w-4 h-4" /> },
    { id: 'rekomendasi', label: 'Rekomendasi & TL', icon: <CheckCircle2 className="w-4 h-4" /> },
    {
      id: 'verifikasi',
      label: 'Verifikasi Kartu',
      icon: <FileCheck className="w-4 h-4" />,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
    },
    { id: 'laporan', label: 'Laporan Kinerja', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
    { id: 'audit', label: 'Log Audit', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/AdobeExpressPhotos_e1597e79a64544959408b3de0ddfd46a_CopyEdited_494af226.png"
              alt="Emblem Kemenko Polkam"
              className="w-9 h-11 object-contain drop-shadow shrink-0"
            />
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                SiParida
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Sistem Panduan Arsip & Data
              </p>
            </div>
          </div>
          <p className="text-[10px] text-teal-400 mt-2 font-medium tracking-wide">
            Kemenko Polkam · Kedeputian Kominfo
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-blue-500/30 text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Details: Admin, Target, and Reset Sample Data */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        {/* Administrator Info */}
        <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Administrator
            </span>
          </div>
          <div className="text-[11px] font-semibold text-white leading-snug">
            Riandi J. Sulistyono, S.I.Kom., M.Si.
          </div>
          <div className="text-[10px] text-slate-400">Kabag Administrasi Kedeputian</div>
        </div>

        {/* Target SLA Card */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-teal-950/40 border border-teal-800/40 text-[11px] text-teal-300">
          <Info className="w-3.5 h-3.5 shrink-0 text-teal-400" />
          <span>Target temu kembali: <strong className="font-mono text-white">≤ 30 menit</strong></span>
        </div>

        {/* Reset Sample Data Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset data contoh? Seluruh kegiatan, rekomendasi, dan dokumen akan kembali ke kondisi bawaan awal.')) {
              onResetData();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data Contoh</span>
        </button>
      </div>
    </aside>
  );
};
