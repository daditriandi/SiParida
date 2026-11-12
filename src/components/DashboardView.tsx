import React, { useState, useMemo } from 'react';
import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  KendalaRisikoItem,
  LogAudit,
  UnitKerja,
  UNIT_KERJA_LIST,
  TAHAPAN_BERKAS,
  DAFTAR_BULAN_2026,
  UserRole,
  ROLE_AUTHORITIES,
} from '../types';
import { computeAverageRetrievalTime } from '../utils/calculations';
import { StatusChip } from './StatusChip';
import {
  FolderArchive,
  FileCheck2,
  CheckCircle,
  AlertOctagon,
  Timer,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Filter,
  Flame,
  FileText,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Globe,
  Shield,
  Award,
  Ban,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DashboardSyncData, SyncDocsResult } from '../services/googleDocs';

interface DashboardViewProps {
  berkasList: BerkasKegiatan[];
  dokumenList: DokumenArsip[];
  rekomendasiList: RekomendasiItem[];
  risikoList: KendalaRisikoItem[];
  auditLogs: LogAudit[];
  onOpenBerkas: (berkasId: string) => void;
  onNavigateToVerifikasi: () => void;
  onNavigateToRekomendasi: () => void;
  onNavigateToUnggah: () => void;
  onNavigateToCari: () => void;
  onSyncDashboard?: (data: DashboardSyncData) => Promise<SyncDocsResult | void>;
  googleUser?: User | null;
  onOpenAuthGuide?: () => void;
  onOpenVercelGuide?: () => void;
  isSyncingDashboard?: boolean;
  lastSyncedDashboardUrl?: string | null;
  currentRole?: UserRole;
  onNavigateToLaporanTriwulan?: () => void;
  onOpenRoleMatrixModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  berkasList,
  dokumenList,
  rekomendasiList,
  risikoList,
  auditLogs,
  onOpenBerkas,
  onNavigateToVerifikasi,
  onNavigateToRekomendasi,
  onNavigateToUnggah,
  onNavigateToCari,
  onSyncDashboard,
  googleUser,
  onOpenAuthGuide,
  onOpenVercelGuide,
  isSyncingDashboard = false,
  lastSyncedDashboardUrl = null,
  currentRole = 'Sesdep',
  onNavigateToLaporanTriwulan,
  onOpenRoleMatrixModal,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Semua');
  const [selectedTahapFilter, setSelectedTahapFilter] = useState<number | null>(null);
  const [selectedRiskCell, setSelectedRiskCell] = useState<{ k: number; d: number } | null>(null);
  const [showRoleMatrix, setShowRoleMatrix] = useState<boolean>(false);

  const currentAuth = ROLE_AUTHORITIES[currentRole] || ROLE_AUTHORITIES.Sesdep;

  // Filter datasets by unit and periode (Januari 2026 s.d. Desember 2026)
  const filteredBerkas = useMemo(() => {
    return berkasList.filter((b) => {
      const matchUnit = selectedUnit === 'Semua' || b.unitKerja === selectedUnit;
      const matchPeriode =
        selectedPeriode === 'Semua' ||
        b.periodeBulan === selectedPeriode ||
        b.periodeBulan.includes(selectedPeriode);
      const matchTahap =
        selectedTahapFilter === null ||
        b.tahapanStatus[selectedTahapFilter] === 'Lengkap' ||
        b.tahapanStatus[selectedTahapFilter] === 'Verifikasi';
      return matchUnit && matchPeriode && matchTahap;
    });
  }, [berkasList, selectedUnit, selectedPeriode, selectedTahapFilter]);

  const filteredDokumen = useMemo(() => {
    return dokumenList.filter((d) => {
      const parent = berkasList.find((b) => b.id === d.berkasId);
      if (!parent) return false;
      const matchUnit = selectedUnit === 'Semua' || parent.unitKerja === selectedUnit;
      const matchPeriode =
        selectedPeriode === 'Semua' ||
        parent.periodeBulan === selectedPeriode ||
        parent.periodeBulan.includes(selectedPeriode);
      return matchUnit && matchPeriode;
    });
  }, [dokumenList, berkasList, selectedUnit, selectedPeriode]);

  const filteredRekomendasi = useMemo(() => {
    return rekomendasiList.filter((r) => {
      const matchUnit = selectedUnit === 'Semua' || r.unitKerja === selectedUnit;
      const parent = berkasList.find((b) => b.id === r.berkasId);
      const matchPeriode =
        selectedPeriode === 'Semua' ||
        !parent ||
        parent.periodeBulan === selectedPeriode ||
        parent.periodeBulan.includes(selectedPeriode);
      return matchUnit && matchPeriode;
    });
  }, [rekomendasiList, berkasList, selectedUnit, selectedPeriode]);

  const filteredRisiko = useMemo(() => {
    return risikoList.filter((k) => {
      const matchUnit = selectedUnit === 'Semua' || k.unitKerja === selectedUnit;
      const parent = berkasList.find((b) => b.id === k.berkasId);
      const matchPeriode =
        selectedPeriode === 'Semua' ||
        !parent ||
        parent.periodeBulan === selectedPeriode ||
        parent.periodeBulan.includes(selectedPeriode);
      return matchUnit && matchPeriode;
    });
  }, [risikoList, berkasList, selectedUnit, selectedPeriode]);

  // KPI Computations
  const totalKegiatan = filteredBerkas.length;
  const docsVerified = filteredDokumen.filter((d) => d.statusVerifikasi === 'Terverifikasi').length;
  const docsPending = filteredDokumen.filter((d) => d.statusVerifikasi === 'Menunggu Verifikasi').length;

  const recsCompleted = filteredRekomendasi.filter((r) => r.status === 'Sesuai').length;
  const recsTotal = filteredRekomendasi.length;
  const recsOverdue = filteredRekomendasi.filter((r) => r.isOverdue && r.status !== 'Sesuai').length;

  const highRisksOpen = filteredRisiko.filter(
    (k) => (k.tingkatRisiko === 'Ekstrem' || k.tingkatRisiko === 'Tinggi') && k.statusPenanganan === 'Terbuka'
  ).length;

  const retrievalStats = computeAverageRetrievalTime(auditLogs);

  // Group recommendations by stakeholder for stacked bar display
  const stakeholderGroups = useMemo(() => {
    const map = new Map<
      string,
      { sesuai: number; belumSesuai: number; belumTL: number; tidakDapat: number; total: number }
    >();

    filteredRekomendasi.forEach((r) => {
      const s = r.stakeholder || 'Lainnya';
      if (!map.has(s)) {
        map.set(s, { sesuai: 0, belumSesuai: 0, belumTL: 0, tidakDapat: 0, total: 0 });
      }
      const item = map.get(s)!;
      item.total += 1;
      if (r.status === 'Sesuai') item.sesuai += 1;
      else if (r.status === 'Belum sesuai') item.belumSesuai += 1;
      else if (r.status === 'Belum ditindaklanjuti') item.belumTL += 1;
      else if (r.status === 'Tidak dapat ditindaklanjuti') item.tidakDapat += 1;
    });

    return Array.from(map.entries())
      .map(([stakeholder, counts]) => ({ stakeholder, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRekomendasi]);

  // "Perlu Perhatian" items
  const attentionItems = useMemo(() => {
    // 1. Units / Dossiers without supporting documents uploaded yet
    const noDocsItems = filteredBerkas
      .filter((b) => !dokumenList.some((d) => d.berkasId === b.id))
      .map((b) => ({
        type: 'no_docs' as const,
        title: `Dokumen pendukung belum ada: ${b.nomorBerkas}`,
        subtitle: `${b.unitKerja} · ${b.judul} (Arsip belum diunggah)`,
        actionLabel: 'Unggah Dokumen',
        onClick: () => onOpenBerkas(b.id),
      }));

    const overdue = filteredRekomendasi.filter((r) => r.isOverdue && r.status !== 'Sesuai').map((r) => ({
      type: 'overdue' as const,
      title: `Rekomendasi lewat tenggat: ${r.kode}`,
      subtitle: `${r.stakeholder} · Tenggat: ${r.tenggat}`,
      actionLabel: 'Lihat Draf Penagihan',
      onClick: onNavigateToRekomendasi,
    }));

    const pendingDocs = filteredDokumen.filter((d) => d.statusVerifikasi === 'Menunggu Verifikasi').map((d) => ({
      type: 'pending' as const,
      title: `Kartu menunggu verifikasi: ${d.usulanNamaFile || d.namaFile}`,
      subtitle: `Tahap ${d.tahapId} · Diunggah oleh ${d.diunggahOleh}`,
      actionLabel: 'Verifikasi Kartu',
      onClick: onNavigateToVerifikasi,
    }));

    const incompleteDossiers = filteredBerkas
      .filter((b) => b.persentaseKelengkapan < 100 && dokumenList.some((d) => d.berkasId === b.id))
      .map((b) => ({
        type: 'incomplete' as const,
        title: `Berkas belum lengkap: ${b.nomorBerkas}`,
        subtitle: `${b.judul} (${b.persentaseKelengkapan}%)`,
        actionLabel: 'Lengkapi Berkas',
        onClick: () => onOpenBerkas(b.id),
      }));

    return [...noDocsItems, ...overdue, ...pendingDocs, ...incompleteDossiers].slice(0, 6);
  }, [filteredRekomendasi, filteredBerkas, filteredDokumen, dokumenList, onNavigateToRekomendasi, onNavigateToVerifikasi, onOpenBerkas]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src="/assets/aistudio/AdobeExpressPhotos_e1597e79a64544959408b3de0ddfd46a_CopyEdited_494af226.png"
                alt="Logo Resmi Kemenko Polkam Republik Indonesia"
                className="w-16 h-20 md:w-20 md:h-24 object-contain drop-shadow-md transition-transform group-hover:scale-105"
              />
              <span className="sr-only">Logo Kemenko Polkam RI</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Kemenko Polkam RI
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Kedeputian Koordinasi Komunikasi & Informasi
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                Dashboard Kearsipan Terpadu SiParida
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Pemantauan berkas kegiatan dinas 8 tahap utuh dari perencanaan hingga tindak lanjut rekomendasi stakeholder lintas K/L
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                aria-label="Filter Unit Kerja Dashboard"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semua">Semua Unit Kerja (6)</option>
                {UNIT_KERJA_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Periode:</span>
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                aria-label="Filter Periode Dashboard"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semua">Semua Periode (Jan–Des 2026)</option>
                {DAFTAR_BULAN_2026.map((bln) => (
                  <option key={bln} value={bln}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>

            {(selectedUnit !== 'Semua' || selectedPeriode !== 'Semua' || selectedTahapFilter !== null) && (
              <button
                onClick={() => {
                  setSelectedUnit('Semua');
                  setSelectedPeriode('Semua');
                  setSelectedTahapFilter(null);
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Google Workspace Docs Action Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Integrasi Google Workspace:
            </span>
            {googleUser ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px]">
                ● Terhubung ({googleUser.email})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium text-[11px]">
                ○ Memerlukan Otorisasi Google
              </span>
            )}

            {lastSyncedDashboardUrl && (
              <a
                href={lastSyncedDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800 flex items-center gap-1 hover:underline"
              >
                <span>Buka Dokumen Hasil Sinkronisasi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenVercelGuide && (
              <button
                onClick={onOpenVercelGuide}
                className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                title="Buka panduan mengatasi error domain di Vercel"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Solusi Vercel</span>
              </button>
            )}

            {onOpenAuthGuide && (
              <button
                onClick={onOpenAuthGuide}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Buka panduan otorisasi jika jendela Google muncul meminta persetujuan"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Petunjuk Otorisasi</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onSyncDashboard) {
                  onSyncDashboard({
                    unitKerja: selectedUnit,
                    periode: selectedPeriode,
                    totalKegiatan,
                    docsVerified,
                    docsPending,
                    recsCompleted,
                    recsTotal,
                    recsOverdue,
                    avgSearchTime: retrievalStats.seconds,
                    berkasList: filteredBerkas,
                    rekomendasiList: filteredRekomendasi,
                  });
                }
              }}
              disabled={isSyncingDashboard}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isSyncingDashboard ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sinkronkan Ringkasan ke Google Docs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Role Authority & Separation of Duties Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono">
                  Peran: {currentAuth.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {currentAuth.badgeLabel}
                </span>
              </div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                Fungsi Utama: {currentAuth.fungsiUtama}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Diizinkan: {currentAuth.kewenangan[0]}
                </span>
                {currentAuth.larangan.length > 0 && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <Ban className="w-3.5 h-3.5" />
                    Batasan: {currentAuth.larangan[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {/* Quick Action Button matching role authority */}
            {currentRole === 'Pelaksana Asdep' && (
              <button
                onClick={onNavigateToUnggah}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Unggah Dokumen & AI</span>
              </button>
            )}

            {currentRole === 'Arsiparis' && (
              <button
                onClick={onNavigateToVerifikasi}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Verifikasi Kartu</span>
              </button>
            )}

            {currentRole === 'Asdep' && (
              <button
                onClick={onNavigateToRekomendasi}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Pantau Rekomendasi & Draf</span>
              </button>
            )}

            {currentRole === 'Deputi' && (
              <button
                onClick={onNavigateToLaporanTriwulan}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Buka Ringkasan Triwulan (Q1–Q4)</span>
              </button>
            )}

            {currentRole === 'Sesdep' && (
              <button
                onClick={onNavigateToCari}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Cari Arsip Instan</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onOpenRoleMatrixModal) {
                  onOpenRoleMatrixModal();
                } else {
                  setShowRoleMatrix(!showRoleMatrix);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buka panduan matriks fungsi dan kewenangan 5 agent"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Matriks 5 Agent</span>
              {showRoleMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible 5-Agent Authority Matrix Table */}
        {showRoleMatrix && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Daftar Fungsi & Kewenangan 5 Agent / Peran pada Sistem SiParida:
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Peran / Agent</th>
                  <th className="py-2.5 px-3">Fungsi Utama</th>
                  <th className="py-2.5 px-3">Kewenangan yang Diizinkan</th>
                  <th className="py-2.5 px-3">Batasan / Dilarang</th>
                  <th className="py-2.5 px-3">Menu Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                <tr className={currentRole === 'Sesdep' ? 'bg-blue-50/60 dark:bg-blue-950/40 font-medium' : ''}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-400">1</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Sekretaris Deputi</td>
                  <td className="py-2 px-3 text-blue-700 dark:text-blue-300">Hanya bisa mencari arsip, memantau dashboard, dan menyetujui ringkasan</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400">Pencarian temu kembali arsip ≤ 30 menit, Setujui ringkasan ke Docs</td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Tidak mengunggah berkas mentah, tidak verifikasi kode teknis</td>
                  <td className="py-2 px-3 font-mono">Dashboard, Cari, Laporan</td>
                </tr>

                <tr className={currentRole === 'Pelaksana Asdep' ? 'bg-blue-50/60 dark:bg-blue-950/40 font-medium' : ''}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-400">2</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Pelaksana Asdep</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-300">Hanya bisa unggah dokumen dan periksa usulan AI</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400">Unggah berkas 8 tahap, periksa nama standar, kode klasifikasi AI & PII</td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Tidak memverifikasi kartu indeks, tidak setujui surat penagihan</td>
                  <td className="py-2 px-3 font-mono">Unggah Dokumen, Berkas</td>
                </tr>

                <tr className={currentRole === 'Arsiparis' ? 'bg-blue-50/60 dark:bg-blue-950/40 font-medium' : ''}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-400">3</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Arsiparis Unit Kearsipan</td>
                  <td className="py-2 px-3 text-indigo-700 dark:text-indigo-300">Hanya memverifikasi kode, nama file, dan kelengkapan</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400">Koreksi & sahkan kode klasifikasi kearsipan, Approve/Reject kartu</td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Tidak mengunggah dokumen dinas unit, tidak setujui naskah dinas</td>
                  <td className="py-2 px-3 font-mono">Verifikasi Kartu, Berkas, Cari</td>
                </tr>

                <tr className={currentRole === 'Asdep' ? 'bg-blue-50/60 dark:bg-blue-950/40 font-medium' : ''}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-400">4</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Asisten Deputi</td>
                  <td className="py-2 px-3 text-amber-700 dark:text-amber-300">Hanya memantau rekomendasi dan setujui dokumen</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400">Pantau tindak lanjut K/L, telaah & setujui Draf Surat Penagihan</td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Tidak unggah dokumen teknis, tidak verifikasi kode arsip</td>
                  <td className="py-2 px-3 font-mono">Rekomendasi & TL, Dashboard, Berkas</td>
                </tr>

                <tr className={currentRole === 'Deputi' ? 'bg-blue-50/60 dark:bg-blue-950/40 font-medium' : ''}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-400">5</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Deputi Bidang Koordinasi</td>
                  <td className="py-2 px-3 text-purple-700 dark:text-purple-300">Hanya membaca ringkasan triwulan</td>
                  <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400">Membaca rekapitulasi capaian triwulanan (Q1–Q4) & rekomendasi strategis</td>
                  <td className="py-2 px-3 text-rose-600 dark:text-rose-400">Bebas dari beban operasional teknis input & verifikasi harian</td>
                  <td className="py-2 px-3 font-mono">Laporan Triwulan, Dashboard</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unit Alert Banner if selected unit has NO supporting documents */}
      {selectedUnit !== 'Semua' && docsVerified === 0 && docsPending === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200">
              Dokumen Pendukung Belum Ada
            </div>
            <div className="text-amber-700 dark:text-amber-300 mt-0.5">
              Unit <strong>{selectedUnit}</strong> belum memiliki dokumen arsip pendukung yang diunggah. Seluruh tahapan dokumen berstatus <strong>Belum Lengkap / Belum Ada</strong> dan tidak ditandai sebagai lengkap.
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row (Tabular Numerals, High-Intent Colors) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Kegiatan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Kegiatan Berkas</span>
            <FolderArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalKegiatan}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Rangkaian berkas utuh</div>
        </div>

        {/* Arsip Verifikasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Arsip Terverifikasi</span>
            <FileCheck2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {docsVerified}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">/ {docsVerified + docsPending}</span>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
            {docsPending > 0 ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{docsPending} menunggu verifikasi</span>
            ) : docsVerified === 0 && docsPending === 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Dokumen pendukung belum ada</span>
            ) : (
              'Semua kartu terverifikasi'
            )}
          </div>
        </div>

        {/* Rekomendasi Tuntas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Rekomendasi Tuntas</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {recsCompleted}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">/ {recsTotal}</span>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
            {recsTotal > 0 ? `${Math.round((recsCompleted / recsTotal) * 100)}% kepatuhan TL` : '0%'}
          </div>
        </div>

        {/* Rekomendasi Lewat Tenggat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Lewat Tenggat</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {recsOverdue}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
            {recsOverdue > 0 ? 'Perlu penagihan segera' : 'Tepat waktu'}
          </div>
        </div>

        {/* Risiko Tinggi Terbuka */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Risiko Terbuka</span>
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {highRisksOpen}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Tingkat tinggi & ekstrem</div>
        </div>

        {/* Temu Kembali SLA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Waktu Temu Kembali</span>
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {retrievalStats.formatted}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Target ≤ 30 mnt tercapai</div>
        </div>
      </div>

      {/* Horizontal 8-Stage Pipeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Alur Rangkaian Berkas 8 Tahap Kearsipan Dinamis
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Klik pada tahapan untuk menyaring daftar kegiatan di bawah
            </p>
          </div>
          {selectedTahapFilter !== null && (
            <button
              onClick={() => setSelectedTahapFilter(null)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Hapus Saringan Tahap ({TAHAPAN_BERKAS.find((t) => t.id === selectedTahapFilter)?.nama})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TAHAPAN_BERKAS.map((tahap) => {
            const isSelected = selectedTahapFilter === tahap.id;
            const docsInStage = filteredDokumen.filter((d) => d.tahapId === tahap.id).length;
            const completedCount = filteredBerkas.filter((b) => b.tahapanStatus[tahap.id] === 'Lengkap').length;
            const progressRatio = filteredBerkas.length > 0 ? (completedCount / filteredBerkas.length) * 100 : 0;

            return (
              <button
                key={tahap.id}
                onClick={() => setSelectedTahapFilter(isSelected ? null : tahap.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {tahap.kode}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-400 font-semibold">
                    {docsInStage} arsip
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1" title={tahap.nama}>
                  {tahap.nama}
                </div>

                {/* Progress bar per tahap across all activities */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    <span>Lengkap</span>
                    <span className="font-mono tabular-nums">{completedCount}/{filteredBerkas.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        progressRatio === 100
                          ? 'bg-emerald-500'
                          : progressRatio > 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressRatio}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matriks Kegiatan x 8 Tahap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Matriks Kepatuhan Kegiatan × 8 Tahapan Berkas
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Klik pada baris kegiatan untuk membuka berkas utuh dan dokumen pendukungnya
            </p>
          </div>
          <button
            onClick={onNavigateToUnggah}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Unggah Berkas Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-64">Kegiatan & Nomor Berkas</th>
                <th className="py-3 px-2 text-center w-20">Kelengkapan</th>
                {TAHAPAN_BERKAS.map((th) => (
                  <th key={th.id} className="py-3 px-2 text-center">
                    <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{th.kode}</div>
                    <div className="text-[10px] truncate max-w-[80px]" title={th.nama}>{th.nama}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredBerkas.map((berkas) => {
                return (
                  <tr
                    key={berkas.id}
                    onClick={() => onOpenBerkas(berkas.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                        {berkas.judul}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{berkas.nomorBerkas}</span>
                        <span>·</span>
                        <span className="truncate max-w-[180px]">{berkas.unitKerja}</span>
                      </div>
                      {!dokumenList.some((d) => d.berkasId === berkas.id) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            Dokumen pendukung belum ada
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Progress Bar & Percentage */}
                    <td className="py-3 px-2 text-center">
                      <div className="text-xs font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
                        {berkas.persentaseKelengkapan}%
                      </div>
                      <div className="w-14 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            berkas.persentaseKelengkapan === 100 && dokumenList.some((d) => d.berkasId === berkas.id)
                              ? 'bg-emerald-500'
                              : berkas.persentaseKelengkapan >= 70
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${berkas.persentaseKelengkapan}%` }}
                        />
                      </div>
                      <div className="mt-1">
                        <StatusChip
                          status={!dokumenList.some((d) => d.berkasId === berkas.id) ? (berkas.statusKelengkapan === 'Lewat Tenggat' ? 'Lewat Tenggat' : 'Belum Ada') : berkas.statusKelengkapan}
                          size="sm"
                        />
                      </div>
                    </td>

                    {/* 8 Stages Chips */}
                    {TAHAPAN_BERKAS.map((th) => {
                      const st = berkas.tahapanStatus[th.id] || 'Belum Ada';
                      return (
                        <td key={th.id} className="py-3 px-2 text-center">
                          <StatusChip status={st} size="sm" />
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right">
                      <span className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                        Buka
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Recommendations by Stakeholder + "Perlu Perhatian" + 5x5 Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekomendasi per Stakeholder (Stacked Breakdown) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Rekomendasi per Stakeholder
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Pemantauan tindak lanjut tingkat instansi kementerian/lembaga
              </p>
            </div>
            <button
              onClick={onNavigateToRekomendasi}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Semua TL
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sesuai
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Belum Sesuai
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Belum TL
            </span>
          </div>

          <div className="space-y-3">
            {stakeholderGroups.map((st) => {
              const sesuaiPct = (st.sesuai / st.total) * 100;
              const belumSesuaiPct = (st.belumSesuai / st.total) * 100;
              const belumTLPct = ((st.belumTL + st.tidakDapat) / st.total) * 100;

              return (
                <div key={st.stakeholder} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={st.stakeholder}>
                      {st.stakeholder}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {st.sesuai}/{st.total} ({Math.round(sesuaiPct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                    {sesuaiPct > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${sesuaiPct}%` }}
                        title={`Sesuai: ${st.sesuai}`}
                      />
                    )}
                    {belumSesuaiPct > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${belumSesuaiPct}%` }}
                        title={`Belum Sesuai: ${st.belumSesuai}`}
                      />
                    )}
                    {belumTLPct > 0 && (
                      <div
                        className="bg-slate-400 dark:bg-slate-600 h-full"
                        style={{ width: `${belumTLPct}%` }}
                        title={`Belum Ditindaklanjuti: ${st.belumTL}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Perlu Perhatian Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Perlu Perhatian Khusus
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Tenggat terlewati, verifikasi tertunda, dan berkas belum lengkap
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {attentionItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-600 dark:text-slate-400">
                Seluruh berkas dan rekomendasi dalam kondisi tertib
              </div>
            ) : (
              attentionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <button
                    onClick={item.onClick}
                    className="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Interactive 5x5 Risk Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Peta Risiko 5×5 (Kemungkinan × Dampak)
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Klik sel matriks untuk memfilter kendala risiko terkait
              </p>
            </div>
            {selectedRiskCell && (
              <button
                onClick={() => setSelectedRiskCell(null)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Matrix Grid: Y-axis = Kemungkinan (5 down to 1), X-axis = Dampak (1 to 5) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-12 text-[10px] font-semibold text-slate-600 dark:text-slate-400">K\D</span>
              {[1, 2, 3, 4, 5].map((d) => (
                <div key={d} className="flex-1 text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  D{d}
                </div>
              ))}
            </div>

            {[5, 4, 3, 2, 1].map((k) => (
              <div key={k} className="flex items-center gap-1">
                <span className="w-12 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  K{k}
                </span>
                {[1, 2, 3, 4, 5].map((d) => {
                  const score = k * d;
                  let bgClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                  if (score >= 16) {
                    bgClass = 'bg-rose-500 text-white dark:bg-rose-600';
                  } else if (score >= 10) {
                    bgClass = 'bg-amber-400 text-amber-950 dark:bg-amber-600 dark:text-white';
                  } else if (score >= 5) {
                    bgClass = 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-200';
                  }

                  const matchingRisks = filteredRisiko.filter((r) => r.kemungkinan === k && r.dampak === d);
                  const isCellSelected = selectedRiskCell?.k === k && selectedRiskCell?.d === d;

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedRiskCell(isCellSelected ? null : { k, d })}
                      title={`Kemungkinan: ${k}, Dampak: ${d} (Skor: ${score}) - ${matchingRisks.length} item`}
                      className={`flex-1 h-8 rounded text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${bgClass} ${
                        isCellSelected ? 'ring-2 ring-blue-600 scale-105 z-10 shadow' : 'hover:opacity-85'
                      }`}
                    >
                      {matchingRisks.length > 0 ? (
                        <span className="tabular-nums underline decoration-2">{matchingRisks.length}</span>
                      ) : (
                        <span className="opacity-30">·</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Active Risk Cell Drilldown */}
          {selectedRiskCell && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Risiko pada Kemungkinan {selectedRiskCell.k} & Dampak {selectedRiskCell.d} (Skor {selectedRiskCell.k * selectedRiskCell.d}):
              </div>
              {filteredRisiko.filter((r) => r.kemungkinan === selectedRiskCell.k && r.dampak === selectedRiskCell.d)
                .length === 0 ? (
                <div className="text-slate-600 dark:text-slate-400 text-[11px]">Tidak ada risiko pada sel ini.</div>
              ) : (
                filteredRisiko
                  .filter((r) => r.kemungkinan === selectedRiskCell.k && r.dampak === selectedRiskCell.d)
                  .map((r) => (
                    <div key={r.id} className="py-1 border-t border-slate-200 dark:border-slate-700 first:border-none">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.deskripsiRisiko}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Mitigasi: {r.mitigasi}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
