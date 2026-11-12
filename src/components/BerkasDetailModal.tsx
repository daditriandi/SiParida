import React, { useState } from 'react';
import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  KendalaRisikoItem,
  TAHAPAN_BERKAS,
} from '../types';
import { StatusChip } from './StatusChip';
import {
  X,
  FileText,
  Eye,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileCheck,
  Download,
} from 'lucide-react';

interface BerkasDetailModalProps {
  berkas: BerkasKegiatan;
  dokumenList: DokumenArsip[];
  rekomendasiList: RekomendasiItem[];
  risikoList: KendalaRisikoItem[];
  onClose: () => void;
  onPreviewDokumen: (doc: DokumenArsip) => void;
  onUnggahTahap: (tahapId: number) => void;
  onSyncDokumen: (doc: DokumenArsip) => void;
  onCreateDrafPenagihan: (rek: RekomendasiItem) => void;
}

export const BerkasDetailModal: React.FC<BerkasDetailModalProps> = ({
  berkas,
  dokumenList,
  rekomendasiList,
  risikoList,
  onClose,
  onPreviewDokumen,
  onUnggahTahap,
  onSyncDokumen,
  onCreateDrafPenagihan,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);

  const docsInBerkas = dokumenList.filter((d) => d.berkasId === berkas.id);
  const recsInBerkas = rekomendasiList.filter((r) => r.berkasId === berkas.id);
  const risksInBerkas = risikoList.filter((k) => k.berkasId === berkas.id);

  const currentTahapDef = TAHAPAN_BERKAS.find((t) => t.id === activeTab)!;
  const currentTahapDocs = docsInBerkas.filter((d) => d.tahapId === activeTab);
  const currentTahapStatus = berkas.tahapanStatus[activeTab] || 'Belum Ada';

  const handleDownloadLembarBerkas = () => {
    const tanggalCetak = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const content = `================================================================================
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
SISTEM PANDUAN ARSIP DAN DATA (SiParida)
================================================================================
LEMBAR KENDALI & REGISTRASI BERKAS KEGIATAN KEARSIPAN UTUH
================================================================================
Nomor Berkas : ${berkas.nomorBerkas}
Judul        : ${berkas.judul}
Unit Kerja   : ${berkas.unitKerja}
Penanggung J.: ${berkas.pjNama} (${berkas.pjInisial})
Periode      : ${berkas.periodeBulan} (${berkas.tanggalMulai} s.d. ${berkas.tanggalSelesai})
Kelengkapan  : ${berkas.persentaseKelengkapan}% (${berkas.statusKelengkapan})
Tanggal Cetak: ${tanggalCetak}

DESKRIPSI:
${berkas.deskripsi || '-'}

STATUS 8 TAHAPAN BERKAS KEARSIPAN:
${TAHAPAN_BERKAS.map(
  (t) =>
    `- Tahap ${t.id}: ${t.nama} [${berkas.tahapanStatus[t.id] || 'Belum Ada'}]`
).join('\n')}

DOKUMEN TERDATA (${docsInBerkas.length} DOKUMEN):
${docsInBerkas.length > 0
  ? docsInBerkas
      .map(
        (d, idx) =>
          `${idx + 1}. [Tahap ${d.tahapId}] ${d.usulanNamaFile || d.namaFile} (Kode: ${d.usulanKodeKlasifikasi}, Status: ${d.statusVerifikasi}, Lokasi: ${d.lokasiSimpan})`
      )
      .join('\n')
  : '- Belum ada dokumen terunggah.'}

REKOMENDASI STAKEHOLDER (${recsInBerkas.length} REKOMENDASI):
${recsInBerkas.length > 0
  ? recsInBerkas
      .map(
        (r, idx) =>
          `${idx + 1}. [${r.kode}] Kepada: ${r.stakeholder} | Status: ${r.status} | Tenggat: ${r.tenggat}\n   Isi: "${r.isi}"`
      )
      .join('\n')
  : '- Belum ada rekomendasi tercatat.'}

KENDALA & RISIKO (${risksInBerkas.length} POIN):
${risksInBerkas.length > 0
  ? risksInBerkas
      .map(
        (k, idx) =>
          `${idx + 1}. [${k.tingkatRisiko}] ${k.deskripsiKendala} (Status: ${k.statusPenanganan}) | Mitigasi: ${k.mitigasi}`
      )
      .join('\n')
  : '- Belum ada catatan kendala risiko.'}

Mengetahui / Administrator SiParida:
Riandi J. Sulistyono, S.I.Kom., M.Si.
Kabag Administrasi Kedeputian Bidang Koordinasi Komunikasi dan Informasi
`;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanNo = berkas.nomorBerkas.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `Lembar_Kendali_${cleanNo}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {berkas.nomorBerkas}
              </span>
              <StatusChip status={berkas.statusKelengkapan} />
              <span className="text-xs text-slate-600 dark:text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {berkas.unitKerja}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {berkas.judul}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
              <span>PJ: <strong className="text-slate-800 dark:text-slate-200">{berkas.pjInisial}</strong> ({berkas.pjNama})</span>
              <span>·</span>
              <span>Periode: {berkas.periodeBulan}</span>
              <span>·</span>
              <span>Kelengkapan Berkas: <strong className="font-mono text-blue-600 dark:text-blue-400">{berkas.persentaseKelengkapan}%</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadLembarBerkas}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              title="Unduh Lembar Kendali & Ringkasan Berkas (.doc)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Lembar Kendali</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup detail berkas"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 8-Stage Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max py-2">
            {TAHAPAN_BERKAS.map((th) => {
              const isActive = activeTab === th.id;
              const status = berkas.tahapanStatus[th.id] || 'Belum Ada';
              const count = docsInBerkas.filter((d) => d.tahapId === th.id).length;

              return (
                <button
                  key={th.id}
                  onClick={() => setActiveTab(th.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-80">{th.kode}</span>
                  <span>{th.nama}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  <StatusChip status={status} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body per Active Stage */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stage Overview Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                <span>TAHAPAN {activeTab} DARI 8</span>
                <span>·</span>
                <StatusChip status={currentTahapStatus} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {currentTahapDef.nama}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {currentTahapDef.deskripsi}
              </p>
            </div>
            <button
              onClick={() => onUnggahTahap(activeTab)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah ke Tahap Ini</span>
            </button>
          </div>

          {/* Mandatory Archive Checklist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Daftar Standar Arsip Wajib Tahap Ini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {currentTahapDef.arsipWajib.map((wajibItem, idx) => {
                const isFulfilled = currentTahapDocs.some(
                  (d) =>
                    d.namaFile.toLowerCase().includes(wajibItem.toLowerCase().slice(0, 5)) ||
                    d.ringkasan.toLowerCase().includes(wajibItem.toLowerCase().slice(0, 5))
                );

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                      isFulfilled
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="shrink-0">{isFulfilled ? '✓' : '○'}</span>
                    <span className="font-medium truncate">{wajibItem}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents in Current Stage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dokumen & Kartu Indeks Terdaftar ({currentTahapDocs.length})
              </h3>
            </div>

            {currentTahapDocs.length === 0 ? (
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-xs text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada dokumen pada tahap ini</p>
                <p className="mt-1 text-slate-500">Unggah berkas KAK, risalah, surat tugas, atau dokumentasi untuk melengkapi tahap ini.</p>
                <button
                  onClick={() => onUnggahTahap(activeTab)}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  Unggah Dokumen Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTahapDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                          {doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
                        </span>
                        <StatusChip status={doc.statusVerifikasi} size="sm" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {doc.lokasiSimpan}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {doc.usulanNamaFile || doc.namaFile}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {doc.ringkasan}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {doc.kataKunci.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      {/* Google Docs Sync indicator */}
                      <div className="pt-2 flex items-center gap-2 text-[11px]">
                        <span className="text-slate-500">Google Docs:</span>
                        {doc.sinkronisasiDocs.status === 'Tersinkron' ? (
                          <a
                            href={doc.sinkronisasiDocs.docUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Tersinkron ({doc.sinkronisasiDocs.mode})</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">Belum tersinkron</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center md:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => onPreviewDokumen(doc)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau</span>
                      </button>

                      <button
                        onClick={() => onSyncDokumen(doc)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sinkronkan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage 5 & 6 Special Section: Rekomendasi & Tindak Lanjut */}
          {(activeTab === 5 || activeTab === 6) && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Daftar Rekomendasi & Tindak Lanjut Terkait Berkas Ini ({recsInBerkas.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Setiap status "Sesuai" (tuntas) wajib memiliki minimal satu arsip bukti terverifikasi.
                  </p>
                </div>
              </div>

              {recsInBerkas.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-500">
                  Belum ada rekomendasi yang didaftarkan pada berkas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {recsInBerkas.map((rek) => (
                    <div
                      key={rek.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {rek.kode}
                          </span>
                          <StatusChip status={rek.status} size="sm" />
                          {rek.isOverdue && rek.status !== 'Sesuai' && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200">
                              Lewat Tenggat
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {rek.isi}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Instansi: <strong className="text-slate-700 dark:text-slate-300">{rek.stakeholder}</strong></span>
                          <span>·</span>
                          <span>Tenggat: <strong className="font-mono">{rek.tenggat}</strong></span>
                        </div>
                        {rek.catatanTindakLanjut && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            Catatan: {rek.catatanTindakLanjut}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          Arsip Bukti: {rek.arsipBuktiIds.length > 0 ? (
                            <span className="text-emerald-600 font-semibold">{rek.arsipBuktiIds.join(', ')}</span>
                          ) : (
                            <span className="text-amber-600">Belum ada arsip bukti terlampir</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => onCreateDrafPenagihan(rek)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Draf Penagihan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stage 7 & 8 Special Section: Kendala & Mitigasi Risiko */}
          {(activeTab === 7 || activeTab === 8) && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Identifikasi Kendala Lapangan & Mitigasi Risiko ({risksInBerkas.length})
              </h3>

              {risksInBerkas.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-500">
                  Belum ada catatan kendala atau penilaian risiko pada berkas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {risksInBerkas.map((rk) => (
                    <div
                      key={rk.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                            Skor {rk.skorRisiko} (K{rk.kemungkinan} × D{rk.dampak})
                          </span>
                          <StatusChip status={rk.tingkatRisiko} size="sm" />
                          <StatusChip status={rk.statusPenanganan} size="sm" />
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Kendala:</strong> {rk.deskripsiKendala}
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Risiko:</strong> {rk.deskripsiRisiko}
                      </div>
                      <div className="text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-lg border border-teal-200 dark:border-teal-800">
                        <strong>Mitigasi Kebijakan:</strong> {rk.mitigasi}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
