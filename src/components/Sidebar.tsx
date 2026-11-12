import React, { useState } from 'react';
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
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { UserRole, ROLE_AUTHORITIES } from '../types';

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
  const [showOtherMenus, setShowOtherMenus] = useState(false);
  const currentAuth = ROLE_AUTHORITIES[currentRole] || ROLE_AUTHORITIES.Sesdep;

  const allNavItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number; ownerRole: string }[] = [
    { id: 'dashboard', label: 'Dashboard Kearsipan', icon: <LayoutDashboard className="w-4 h-4" />, ownerRole: 'Sesdep / Asdep / Deputi' },
    { id: 'cari', label: 'Cari Arsip (Temu Kembali)', icon: <Search className="w-4 h-4" />, ownerRole: 'Sesdep / Arsiparis' },
    { id: 'unggah', label: 'Unggah Dokumen & AI', icon: <UploadCloud className="w-4 h-4" />, ownerRole: 'Pelaksana Asdep' },
    {
      id: 'verifikasi',
      label: 'Verifikasi Kartu & Kode',
      icon: <FileCheck className="w-4 h-4" />,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
      ownerRole: 'Arsiparis',
    },
    { id: 'rekomendasi', label: 'Rekomendasi & TL', icon: <CheckCircle2 className="w-4 h-4" />, ownerRole: 'Asisten Deputi' },
    { id: 'berkas', label: 'Berkas Kegiatan (8 Tahap)', icon: <FolderArchive className="w-4 h-4" />, ownerRole: 'Pelaksana / Arsiparis / Asdep' },
    { id: 'laporan', label: 'Laporan & Ringkasan Triwulan', icon: <BarChart3 className="w-4 h-4" />, ownerRole: 'Deputi / Sesdep' },
    { id: 'pengaturan', label: 'Pengaturan Sistem', icon: <Settings className="w-4 h-4" />, ownerRole: 'Admin' },
    { id: 'audit', label: 'Log Audit Kearsipan', icon: <History className="w-4 h-4" />, ownerRole: 'Admin' },
  ];

  // Separate authorized vs other menus for strict role authority visibility
  const authorizedItems = allNavItems.filter((item) =>
    currentAuth.allowedPages.includes(item.id)
  );

  const lockedItems = allNavItems.filter(
    (item) => !currentAuth.allowedPages.includes(item.id)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none overflow-y-auto">
      {/* Brand & Active Role Banner */}
      <div>
        <div className="p-4 border-b border-slate-800">
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

        {/* Current Role Authority Box */}
        <div className="m-3 p-2.5 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Peran Aktif
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {currentAuth.singkatan}
            </span>
          </div>
          <div className="text-xs font-bold text-white leading-tight">
            {currentAuth.title}
          </div>
          <div className="text-[10px] text-slate-300 mt-1 leading-snug line-clamp-2">
            {currentAuth.fungsiUtama}
          </div>
        </div>

        {/* Navigation Items (Authorized) */}
        <div className="px-3 pt-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Menu Kewenangan Anda ({authorizedItems.length})</span>
          </div>

          <nav className="space-y-1 mt-1">
            {authorizedItems.map((item) => {
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
                    <span className={isActive ? 'text-white' : 'text-blue-400'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
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

          {/* Locked Menus Section (Educational & Demo switching) */}
          {lockedItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowOtherMenus(!showOtherMenus)}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Menu Peran Lainnya ({lockedItems.length} Terkunci)</span>
                </span>
                {showOtherMenus ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showOtherMenus && (
                <div className="mt-1 space-y-1 pl-1">
                  {lockedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onPageChange(item.id)}
                      className="group flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer transition-colors"
                      title={`Kewenangan Khusus: ${item.ownerRole}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 group-hover:text-slate-400">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                        {item.ownerRole.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Details: Admin, Target, and Reset Sample Data */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40 mt-4">
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
          onClick={onResetData}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data Contoh</span>
        </button>
      </div>
    </aside>
  );
};
