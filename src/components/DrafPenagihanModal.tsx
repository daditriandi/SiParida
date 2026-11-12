import React, { useState } from 'react';
import { RekomendasiItem } from '../types';
import { generateDrafPenagihanDocx } from '../utils/docxExport';
import { syncDrafPenagihanToGoogleDocs, SyncDocsResult } from '../services/googleDocs';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import {
  X,
  Copy,
  Check,
  FileText,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  AlertCircle,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';

interface DrafPenagihanModalProps {
  rekomendasi: RekomendasiItem;
  onClose: () => void;
}

export const DrafPenagihanModal: React.FC<DrafPenagihanModalProps> = ({
  rekomendasi,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isSyncingDocs, setIsSyncingDocs] = useState(false);
  const [docsResult, setDocsResult] = useState<SyncDocsResult | null>(null);

  const nomorDraf = `DRAF/B-PENAGIHAN/KOMINFO/2026/${rekomendasi.kode.replace(/\//g, '-')}`;
  const tanggalHariIni = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Handle downloading real .docx (Word document)
  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      const blob = await generateDrafPenagihanDocx(rekomendasi);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${nomorDraf.replace(/\//g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate docx:', err);
      alert('Terjadi kendala saat membuat dokumen Word (.docx). Silakan coba kembali.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  // Handle Export / Sync to Google Docs
  const handleSyncToGoogleDocs = async () => {
    try {
      setIsSyncingDocs(true);
      let token = getAccessToken();

      // If token not present, try sign in prompt
      if (!token) {
        try {
          const authRes = await googleSignIn();
          token = authRes.accessToken;
        } catch (authErr) {
          console.warn('OAuth prompt cancelled or failed, falling back to simulated Docs view:', authErr);
        }
      }

      const res = await syncDrafPenagihanToGoogleDocs(rekomendasi, token);
      setDocsResult(res);
      if (res.success && res.docUrl) {
        window.open(res.docUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('Error syncing to Google Docs:', err);
      alert(err.message || 'Gagal menyinkronkan draf ke Google Docs');
    } finally {
      setIsSyncingDocs(false);
    }
  };

  // Copy plain text as backup
  const handleCopyText = () => {
    const rawText = `KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110

DRAF SURAT DINAS PENAGIHAN TINDAK LANJUT REKOMENDASI KEBIJAKAN

Nomor       : ${nomorDraf}
Sifat       : Segera
Lampiran    : 1 (satu) Berkas Risalah Rekomendasi
Perihal     : Penagihan Tindak Lanjut Pemenuhan Rekomendasi Kebijakan

Jakarta, ${tanggalHariIni}

Yth.
Pimpinan Instansi ${rekomendasi.stakeholder}
di Tempat

Dengan hormat,

Menindaklanjuti pelaksanaan kegiatan "${rekomendasi.berkasJudul}" yang diselenggarakan oleh unit kerja ${rekomendasi.unitKerja}, bersama ini kami sampaikan bahwa terdapat rekomendasi strategis kebijakan yang memerlukan pemenuhan tindak lanjut resmi dari instansi Saudara:

* Nomor Rekomendasi : ${rekomendasi.kode}
* Rangkaian Berkas  : ${rekomendasi.berkasJudul}
* Unit Pemrakarsa   : ${rekomendasi.unitKerja}
* Instansi Terkait  : ${rekomendasi.stakeholder}
* Isi Rekomendasi   : "${rekomendasi.isi}"
* Batas Waktu       : ${rekomendasi.tenggat}
* Status Terkini    : ${rekomendasi.status.toUpperCase()}

Mengingat batas waktu pemenuhan target telah mendekati atau melewati tenggat waktu yang disepakati bersama, kami memohon kesediaan instansi Saudara untuk segera menyampaikan konfirmasi perkembangan tindak lanjut serta melampirkan berkas atau arsip bukti implementasi lapangan kepada Sekretariat Kedeputian Kominfo.

Demikian kami sampaikan. Atas perhatian, komitmen, dan kerja sama yang baik, kami ucapkan terima kasih.

a.n. Deputi Bidang Koordinasi Komunikasi dan Informasi,
Asisten Deputi / Sekretaris Deputi

(Tanda Tangan & Cap Dinas Resmi)
Kedeputian Bidang Koordinasi Komunikasi dan Informasi
Kementerian Koordinator Bidang Politik dan Keamanan RI
`;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Draf Naskah Dinas Penagihan Rekomendasi
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300">
                  FORMAT DOCS / WORD
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instansi Tujuan: <strong>{rekomendasi.stakeholder}</strong> • Kode: {rekomendasi.kode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup naskah draf"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar (Docs / Word Export Buttons) */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary: Download Word .docx */}
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:scale-98 rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50"
              title="Unduh berkas dokumen Microsoft Word (.docx)"
            >
              {isDownloadingDocx ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Membuat .docx...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen Word (.docx)</span>
                </>
              )}
            </button>

            {/* Secondary: Open in Google Docs */}
            <button
              onClick={handleSyncToGoogleDocs}
              disabled={isSyncingDocs}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer transition-all disabled:opacity-50"
              title="Buka atau sinkronkan langsung ke Google Docs"
            >
              {isSyncingDocs ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Menyinkronkan Docs...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Google Docs</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-colors"
              title="Cetak atau simpan ke PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>
          </div>
        </div>

        {/* Google Docs Sync Notification */}
        {docsResult && docsResult.success && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Dokumen resmi telah dibuat di <strong>Google Docs</strong> ({docsResult.mode}).
              </span>
            </div>
            {docsResult.docUrl && (
              <a
                href={docsResult.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-800"
              >
                <span>Buka Dokumen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Regulatory Governance Banner */}
        <div className="px-6 py-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Tata Kelola Naskah Dinas:</strong> Dokumen penagihan berstatus <strong>DRAF</strong> dalam format Word/Docs untuk ditelaah dan diparaf pejabat berwenang sebelum penomoran definitif dan penerbitan resmi.
          </span>
        </div>

        {/* Body: High-Fidelity Word / Google Docs Page Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 dark:bg-slate-950/80 flex justify-center">
          {/* A4 Sheet Container */}
          <div className="bg-white text-slate-900 w-full max-w-[720px] p-8 sm:p-14 shadow-2xl rounded-sm border border-slate-300 leading-normal font-serif text-[13px] relative selection:bg-blue-100 selection:text-blue-900">
            {/* Watermark "DRAF" */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
              <span className="text-[120px] font-black tracking-widest -rotate-45 text-black">
                DRAF
              </span>
            </div>

            {/* Official Letterhead (Kop Dinas) */}
            <div className="text-center pb-3 relative">
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/assets/aistudio/AdobeExpressPhotos_e1597e79a64544959408b3de0ddfd46a_CopyEdited_494af226.png"
                  alt="Lambang Negara Garuda Pancasila / Kemenko Polkam"
                  className="w-16 h-auto mb-2 object-contain filter drop-shadow-xs"
                />
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Kementerian Koordinator Bidang Politik dan Keamanan
                </h1>
                <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Republik Indonesia
                </h2>
                <h3 className="text-xs sm:text-xs font-semibold tracking-wide text-slate-800 uppercase mt-0.5">
                  Kedeputian Bidang Koordinasi Komunikasi dan Informasi
                </h3>
                <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                  Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110 • Laman: polkam.go.id
                </p>
              </div>

              {/* Official Double Border Line */}
              <div className="mt-3 border-t-2 border-black" />
              <div className="mt-[2px] border-t border-black" />
            </div>

            {/* Draf Status Notice Tag */}
            <div className="my-3 text-center">
              <span className="text-[10px] tracking-wider font-sans font-bold text-amber-700 uppercase bg-amber-50 px-3 py-0.5 border border-amber-300 rounded">
                [ DRAF NASKAH DINAS — MEMERLUKAN PARAF & PENOMORAN RESMI ]
              </span>
            </div>

            {/* Letter Metadata (Nomor, Sifat, Lampiran, Hal, Tanggal) */}
            <div className="grid grid-cols-2 gap-4 my-4 font-sans text-xs">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-20 text-slate-600 font-medium">Nomor</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 font-mono text-[11px]">{nomorDraf}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-slate-600 font-medium">Sifat</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900">Segera</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-slate-600 font-medium">Lampiran</span>
                  <span className="mr-2">:</span>
                  <span>1 (satu) Berkas Risalah Rekomendasi</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 text-slate-600 font-medium">Perihal</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold text-slate-900">
                    Penagihan Tindak Lanjut Pemenuhan Rekomendasi Kebijakan
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-medium text-slate-800">Jakarta, {tanggalHariIni}</span>
              </div>
            </div>

            {/* Recipient Block */}
            <div className="my-5 font-serif text-[13px] leading-relaxed">
              <p>Yth.</p>
              <p className="font-bold text-slate-900">Pimpinan Instansi {rekomendasi.stakeholder}</p>
              <p>di Tempat</p>
            </div>

            {/* Opening Greeting & Context */}
            <div className="space-y-3 font-serif text-[13px] leading-relaxed text-justify">
              <p>Dengan hormat,</p>
              <p>
                Menindaklanjuti pelaksanaan kegiatan <em>"{rekomendasi.berkasJudul}"</em> yang diselenggarakan dan dikoordinasikan oleh unit kerja <strong>{rekomendasi.unitKerja}</strong>, bersama ini kami sampaikan bahwa terdapat rekomendasi strategis kebijakan yang telah disepakati bersama dan memerlukan percepatan pemenuhan tindak lanjut resmi dari instansi Saudara dengan rincian sebagai berikut:
              </p>
            </div>

            {/* Recommendation Structured Table (Formal Word/Docs Table Look) */}
            <div className="my-4 overflow-hidden border border-slate-300 rounded font-sans text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="py-2 px-3 text-center w-10 border-r border-slate-300">No</th>
                    <th className="py-2 px-3 text-left w-1/3 border-r border-slate-300">Parameter Kebijakan</th>
                    <th className="py-2 px-3 text-left">Uraian Kesepakatan & Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">1</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Nomor / Kode Rekomendasi</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">{rekomendasi.kode}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">2</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Rangkaian Berkas Kegiatan</td>
                    <td className="py-2 px-3 text-slate-900">{rekomendasi.berkasJudul}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">3</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Unit Pemrakarsa Koordinasi</td>
                    <td className="py-2 px-3 text-slate-900">{rekomendasi.unitKerja}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">4</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Instansi Stakeholder Sasaran</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{rekomendasi.stakeholder}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">5</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Substansi / Isi Rekomendasi</td>
                    <td className="py-2 px-3 font-serif italic text-slate-900 bg-amber-50/50">
                      "{rekomendasi.isi}"
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">6</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Target Batas Waktu (Tenggat)</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-mono">{rekomendasi.tenggat}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">7</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-300">Status Tindak Lanjut Terkini</td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {rekomendasi.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Follow-up Urgency Body Text */}
            <div className="space-y-3 font-serif text-[13px] leading-relaxed text-justify my-4">
              <p>
                Mengingat batas waktu pemenuhan target telah mendekati atau melewati tenggat waktu yang disepakati bersama, kami memohon kesediaan instansi Saudara untuk segera menyampaikan konfirmasi perkembangan tindak lanjut serta melampirkan berkas atau arsip bukti implementasi lapangan kepada Sekretariat Kedeputian Kominfo.
              </p>
              <p>
                Demikian kami sampaikan. Atas perhatian, komitmen, dan kerja sama yang baik, kami ucapkan terima kasih.
              </p>
            </div>

            {/* Signature Block (Tanda Tangan & Cap Dinas Resmi) */}
            <div className="mt-8 flex justify-end font-sans">
              <div className="w-72 text-left space-y-1">
                <p className="text-xs text-slate-700">
                  a.n. Deputi Bidang Koordinasi Komunikasi dan Informasi,
                </p>
                <p className="text-xs font-bold text-slate-900">
                  Asisten Deputi / Sekretaris Deputi
                </p>

                {/* Signature / Stamp Simulator Box */}
                <div className="py-6 my-1 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center bg-slate-50/50">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    [ Tanda Tangan & Cap Dinas Resmi ]
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    Memerlukan paraf fisik / TTE Tersertifikasi BSrE
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800">
                  Kedeputian Bidang Koordinasi Komunikasi dan Informasi
                </p>
                <p className="text-xs text-slate-600">
                  Kementerian Koordinator Bidang Politik dan Keamanan RI
                </p>
              </div>
            </div>

            {/* Official Tembusan Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 font-sans text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-800">Tembusan Yth.:</p>
              <p>1. Menteri Koordinator Bidang Politik dan Keamanan RI (sebagai laporan);</p>
              <p>2. Deputi Bidang Koordinasi Komunikasi dan Informasi.</p>
              <p className="text-[10px] text-slate-400 pt-2 italic">
                *Dokumen naskah dinas ini dibuat dan disinkronkan langsung via SiParida (Sistem Panduan Arsip dan Data).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Format Word (.docx) & Google Docs siap dibuka dan diedit sesuai kaidah tata naskah dinas.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              {isDownloadingDocx ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Unduh Dokumen Word (.docx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
