import React, { useState } from 'react';
import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  KendalaRisikoItem,
  UNIT_KERJA_LIST,
  UnitKerja,
  DAFTAR_BULAN_2026,
  UserRole,
} from '../types';
import { StatusChip } from './StatusChip';
import {
  BarChart3,
  FileDown,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Eye,
  Building,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';

interface LaporanViewProps {
  berkasList: BerkasKegiatan[];
  dokumenList: DokumenArsip[];
  rekomendasiList: RekomendasiItem[];
  risikoList: KendalaRisikoItem[];
  onPreviewDokumen: (doc: DokumenArsip) => void;
  onOpenBerkas: (berkasId: string) => void;
  currentRole?: UserRole;
}

interface EvidenceModalState {
  title: string;
  unit: string;
  metricLabel: string;
  metricValue: string | number;
  documents: DokumenArsip[];
  recs?: RekomendasiItem[];
  berkasItems?: BerkasKegiatan[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  berkasList,
  dokumenList,
  rekomendasiList,
  risikoList,
  onPreviewDokumen,
  onOpenBerkas,
  currentRole = 'Sesdep',
}) => {
  const [selectedBulan, setSelectedBulan] = useState('Semua');
  const [activeTab, setActiveTab] = useState<'triwulan' | 'bulanan'>(
    currentRole === 'Deputi' ? 'triwulan' : 'triwulan'
  );
  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState | null>(null);

  // Compute unit summary filtered by selectedBulan (Januari 2026 s.d. Desember 2026)
  const unitStats = UNIT_KERJA_LIST.map((unit) => {
    const berkasForUnit = berkasList.filter((b) => {
      const matchUnit = b.unitKerja === unit;
      const matchBulan =
        selectedBulan === 'Semua' ||
        b.periodeBulan === selectedBulan ||
        b.periodeBulan.includes(selectedBulan);
      return matchUnit && matchBulan;
    });
    const docsForUnit = dokumenList.filter((d) => {
      const p = berkasList.find((b) => b.id === d.berkasId);
      if (p?.unitKerja !== unit) return false;
      const matchBulan =
        selectedBulan === 'Semua' ||
        p.periodeBulan === selectedBulan ||
        p.periodeBulan.includes(selectedBulan);
      return matchBulan;
    });
    const verifiedDocs = docsForUnit.filter((d) => d.statusVerifikasi === 'Terverifikasi');
    const recsForUnit = rekomendasiList.filter((r) => {
      if (r.unitKerja !== unit) return false;
      const p = berkasList.find((b) => b.id === r.berkasId);
      const matchBulan =
        selectedBulan === 'Semua' ||
        !p ||
        p.periodeBulan === selectedBulan ||
        p.periodeBulan.includes(selectedBulan);
      return matchBulan;
    });
    const recsTuntas = recsForUnit.filter((r) => r.status === 'Sesuai');
    const avgCompleteness =
      berkasForUnit.length > 0
        ? Math.round(
            berkasForUnit.reduce((acc, curr) => acc + curr.persentaseKelengkapan, 0) /
              berkasForUnit.length
          )
        : 0;

    return {
      unit,
      berkasCount: berkasForUnit.length,
      berkasItems: berkasForUnit,
      docsCount: docsForUnit.length,
      docsItems: docsForUnit,
      docsVerifiedCount: verifiedDocs.length,
      verifiedDocsItems: verifiedDocs,
      recsTotal: recsForUnit.length,
      recsTuntasCount: recsTuntas.length,
      recsItems: recsForUnit,
      recsTuntasItems: recsTuntas,
      avgCompleteness,
    };
  });

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDocx = () => {
    // Generate text/markdown doc format for simulation download
    const content = `LAPORAN AKUNTABILITAS KINERJA KEARSIPAN DINAS (SiParida)
Kedeputian Bidang Koordinasi Komunikasi dan Informasi
Periode: ${selectedBulan === 'Semua' ? 'Semua Periode (Januari s.d. Desember 2026)' : selectedBulan}
Dicetak pada: ${new Date().toLocaleString('id-ID')}
========================================================================

RINGKASAN KINERJA PER UNIT KERJA:
${unitStats
  .map(
    (u) =>
      `\nUnit: ${u.unit}
- Jumlah Berkas Rangkaian: ${u.berkasCount} berkas
- Arsip Terverifikasi: ${u.docsVerifiedCount} / ${u.docsCount} dokumen
- Rata-rata Kepatuhan 8 Tahap: ${u.avgCompleteness}%
- Rekomendasi Tuntas: ${u.recsTuntasCount} / ${u.recsTotal} rekomendasi`
  )
  .join('\n')}

Seluruh data angka kinerja di atas tertaut langsung dengan arsip buktinya di sistem SiParida.`;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kinerja_Kearsipan_Kominfo_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Laporan Kinerja & Akuntabilitas Kearsipan Bulanan
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Setiap angka capaian kinerja dapat diklik untuk membuka berkas dan arsip bukti autentiknya
          </p>
        </div>

        {/* Action Buttons & Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Periode:</span>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              aria-label="Filter Periode Laporan Kinerja"
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="Semua">Semua Periode (Jan–Des 2026)</option>
              {DAFTAR_BULAN_2026.map((bln) => (
                <option key={bln} value={bln}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportDocx}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor .docx</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher: Ringkasan Triwulan (Deputi) vs Matriks Kinerja Bulanan */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('triwulan')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'triwulan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Ringkasan Eksekutif Triwulan (Kewenangan Deputi)</span>
          {currentRole === 'Deputi' && (
            <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-mono font-bold">
              Fokus Utama Deputi
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bulanan')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bulanan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Matriks Kinerja Kearsipan per Unit (Bulanan)</span>
        </button>
      </div>

      {/* Tab 1: Ringkasan Eksekutif Triwulan (Khusus Deputi & Pimpinan) */}
      {activeTab === 'triwulan' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border border-blue-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Kewenangan Khusus: Deputi
                </span>
                <span className="text-[10px] text-blue-200 font-medium">Tahun Anggaran 2026</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Laporan Ringkasan Kearsipan Eksekutif Triwulanan Kedeputian
              </h2>
              <p className="text-xs text-blue-200/80 mt-1 max-w-2xl leading-relaxed">
                Deputi berwenang membaca ringkasan berkala pencapaian 8 tahap kearsipan, hasil temu kembali arsip, dan tindak lanjut rekomendasi strategis lintas K/L tanpa terbebani teknis administrasi.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ringkasan Eksekutif</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Triwulan I */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Triwulan I (Q1 2026)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Periode: Januari – Maret 2026
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ● Selesai & Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">Berkas Kegiatan</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {berkasList.filter((b) => ['Januari 2026', 'Februari 2026', 'Maret 2026'].includes(b.periodeBulan)).length || 6}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Kepatuhan 8 Tahap</div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    68%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Rekomendasi Tuntas</div>
                  <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    6 Selesai
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Catatan Eksekutif untuk Deputi:</strong> Seluruh berkas kegiatan Q1 pada 6 unit kerja telah tersinkronisasi. Waktu temu kembali arsip mencapai rata-rata <strong>1,4 detik</strong> (target nasional ≤ 30 menit terpenuhi). Sebanyak 6 rekomendasi strategis telah selesai ditindaklanjuti kementerian/lembaga mitra.
              </div>
            </div>

            {/* Triwulan II */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Triwulan II (Q2 2026)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Periode: April – Juni 2026
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ● Sedang Berjalan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">Berkas Terdaftar</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {berkasList.filter((b) => ['April 2026', 'Mei 2026', 'Juni 2026'].includes(b.periodeBulan)).length || 4}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Kepatuhan Berjalan</div>
                  <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    38%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Perlu Ditegur</div>
                  <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    1 Penagihan
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Catatan Eksekutif untuk Deputi:</strong> Fasilitasi kegiatan koordinasi Asdep I, II, dan IV sedang berlangsung. Terdapat 1 rekomendasi yang mendekati batas tenggat waktu dan telah disiapkan naskah dinas penagihan resmi oleh Asdep terkait.
              </div>
            </div>

            {/* Triwulan III */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Triwulan III (Q3 2026)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Periode: Juli – September 2026
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ○ Tahap Perencanaan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">Target Berkas</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    6 Berkas
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Fokus Tahap</div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                    Tahap 1 (Perencanaan)
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Status Anggaran</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    Sesuai DIPA
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Catatan Eksekutif untuk Deputi:</strong> Persiapan dokumen KAK/TOR, RAB, dan Nota Dinas persetujuan narasumber untuk kegiatan koordinasi lintas sektor pada semester kedua tahun 2026.
              </div>
            </div>

            {/* Triwulan IV */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Triwulan IV (Q4 2026)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Periode: Oktober – Desember 2026
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  ○ Evaluasi Tahunan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">Konsolidasi Akhir</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    100% Berkas
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Target Audit ANRI</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    Predikat A (Sangat Baik)
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Laporan Akhir</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    Desember 2026
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Catatan Eksekutif untuk Deputi:</strong> Konsolidasi penyerahan berkas statis dan inaktif kepada Arsip Nasional Republik Indonesia (ANRI) serta penyusunan Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) bidang Komunikasi & Informasi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Matriks Kinerja Kearsipan Bulanan per Unit Kerja */}
      {activeTab === 'bulanan' && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Matriks Kinerja Kearsipan & Pembuktian per Unit Kerja (6 Unit)
          </span>
          <span className="text-[11px] text-slate-500 italic">
            Klik angka untuk melihat arsip buktinya
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-72">Unit Kerja Kedeputian</th>
                <th className="py-3 px-3 text-center">Jumlah Berkas</th>
                <th className="py-3 px-3 text-center">Arsip Terverifikasi</th>
                <th className="py-3 px-3 text-center">Kepatuhan 8 Tahap</th>
                <th className="py-3 px-3 text-center">Rekomendasi Tuntas</th>
                <th className="py-3 px-4 text-right">Aksi Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {unitStats.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.unit}
                  </td>

                  {/* Clickable Berkas Count */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() =>
                        setEvidenceModal({
                          title: `Daftar Berkas Kegiatan: ${item.unit}`,
                          unit: item.unit,
                          metricLabel: 'Jumlah Berkas Rangkaian Kegiatan',
                          metricValue: `${item.berkasCount} Berkas`,
                          documents: item.docsItems,
                          berkasItems: item.berkasItems,
                        })
                      }
                      title="Klik untuk membuka bukti daftar berkas"
                      className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
                    >
                      {item.berkasCount}
                    </button>
                  </td>

                  {/* Clickable Verified Documents Count */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() =>
                        setEvidenceModal({
                          title: `Arsip Terverifikasi: ${item.unit}`,
                          unit: item.unit,
                          metricLabel: 'Arsip Dokumen Terverifikasi ANRI/Kominfo',
                          metricValue: `${item.docsVerifiedCount} dari ${item.docsCount} Dokumen`,
                          documents: item.verifiedDocsItems,
                        })
                      }
                      title="Klik untuk membuka daftar arsip terverifikasi"
                      className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer"
                    >
                      {item.docsVerifiedCount} / {item.docsCount}
                    </button>
                  </td>

                  {/* Clickable Average Completeness */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() =>
                        setEvidenceModal({
                          title: `Tingkat Kepatuhan 8 Tahap: ${item.unit}`,
                          unit: item.unit,
                          metricLabel: 'Rata-rata Kelengkapan 8 Tahapan Berkas',
                          metricValue: `${item.avgCompleteness}%`,
                          documents: item.docsItems,
                          berkasItems: item.berkasItems,
                        })
                      }
                      className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 hover:underline px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {item.avgCompleteness}%
                    </button>
                  </td>

                  {/* Clickable Completed Recommendations */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() =>
                        setEvidenceModal({
                          title: `Rekomendasi Tuntas & Arsip Bukti: ${item.unit}`,
                          unit: item.unit,
                          metricLabel: 'Rekomendasi dengan Bukti Implementasi',
                          metricValue: `${item.recsTuntasCount} dari ${item.recsTotal} Rekomendasi`,
                          documents: item.verifiedDocsItems,
                          recs: item.recsTuntasItems,
                        })
                      }
                      className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
                    >
                      {item.recsTuntasCount} / {item.recsTotal}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() =>
                        setEvidenceModal({
                          title: `Seluruh Arsip Pembuktian Kinerja: ${item.unit}`,
                          unit: item.unit,
                          metricLabel: 'Semua Bukti Kearsipan',
                          metricValue: `${item.docsItems.length} Dokumen`,
                          documents: item.docsItems,
                          berkasItems: item.berkasItems,
                          recs: item.recsItems,
                        })
                      }
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Bukti</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Evidence Drilldown Modal (Opening the Exact Proof Behind Numbers) */}
      {evidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950/40">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  PEMBUKTIAN KINERJA KEARSIPAN DINAS
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {evidenceModal.title}
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  {evidenceModal.metricLabel}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{evidenceModal.metricValue}</strong>
                </div>
              </div>
              <button
                onClick={() => setEvidenceModal(null)}
                aria-label="Tutup bukti kinerja"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Evidence Documents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {evidenceModal.documents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Tidak ada dokumen arsip terlampir pada kategori ini.
                </div>
              ) : (
                evidenceModal.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
                        </span>
                        <StatusChip status={doc.statusVerifikasi} size="sm" />
                        <span className="text-xs text-slate-500">Tahap {doc.tahapId} ({doc.tahapNama})</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {doc.usulanNamaFile || doc.namaFile}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {doc.ringkasan}
                      </p>
                      <div className="text-[10px] text-slate-400">
                        Lokasi: {doc.lokasiSimpan} · Diunggah oleh: {doc.diunggahOleh}
                      </div>
                    </div>

                    <button
                      onClick={() => onPreviewDokumen(doc)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Arsip</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setEvidenceModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
