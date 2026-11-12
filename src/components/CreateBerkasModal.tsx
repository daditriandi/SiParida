import React, { useState } from 'react';
import { UnitKerja, UNIT_KERJA_LIST, BerkasKegiatan, DAFTAR_BULAN_2026 } from '../types';
import {
  X,
  FolderPlus,
  FileDown,
  FileText,
  CheckCircle,
  Download,
  Check,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';

interface CreateBerkasModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnit: UnitKerja;
  onSave: (newBerkas: BerkasKegiatan) => void;
}

export const CreateBerkasModal: React.FC<CreateBerkasModalProps> = ({
  isOpen,
  onClose,
  defaultUnit,
  onSave,
}) => {
  const [judul, setJudul] = useState('');
  const [unitKerja, setUnitKerja] = useState<UnitKerja>(defaultUnit);
  const [nomorBerkas, setNomorBerkas] = useState(`B-${Math.floor(Math.random() * 90 + 10)}/KOMINFO/2026`);
  const [pjInisial, setPjInisial] = useState('RJS');
  const [pjNama, setPjNama] = useState('Riandi J. Sulistyono, S.I.Kom., M.Si.');
  const [periodeBulan, setPeriodeBulan] = useState<string>(DAFTAR_BULAN_2026[0]);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [deskripsi, setDeskripsi] = useState('');
  const [downloadFormat, setDownloadFormat] = useState<'doc' | 'txt'>('doc');
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to trigger browser file download
  const triggerDownload = (filename: string, content: string, format: 'doc' | 'txt') => {
    const mime =
      format === 'doc'
        ? 'application/msword;charset=utf-8'
        : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg(`Berhasil mengunduh ${filename}.${format}`);
    setTimeout(() => setDownloadSuccessMsg(null), 3500);
  };

  // Generate Lembar Kendali Registrasi Berkas Baru (8 Tahap Utuh)
  const generateLembarKendali = () => {
    const tanggalCetak = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    return `================================================================================
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
SISTEM PANDUAN ARSIP DAN DATA (SiParida)
================================================================================
LEMBAR KENDALI & FORMULIR REGISTRASI BERKAS KEGIATAN DINAS (8 TAHAP UTUH)
================================================================================

A. IDENTITAS BERKAS KEGIATAN
1. Nomor Berkas Dinas   : ${nomorBerkas || '[Nomor Berkas Belum Diisi]'}
2. Judul Kegiatan       : ${judul || '[Judul Kegiatan Belum Diisi]'}
3. Unit Kerja Pengampu  : ${unitKerja}
4. Penanggung Jawab (PJ): ${pjNama} (${pjInisial})
5. Periode Pelaksanaan  : ${periodeBulan}
6. Jadwal Pelaksanaan   : ${tanggalMulai} s.d. ${tanggalSelesai}
7. Tanggal Registrasi   : ${tanggalCetak}
8. Deskripsi Ruang Lingkup:
   ${deskripsi || 'Kegiatan koordinasi kebijakan dan sinkronisasi bidang komunikasi dan informasi.'}

================================================================================
B. CHECKLIST KELENGKAPAN 8 TAHAPAN BERKAS KEARSIPAN (SiParida)
--------------------------------------------------------------------------------
No | Tahapan Berkas            | Dokumen Wajib               | Kode Klasifikasi | Status Fisik
--------------------------------------------------------------------------------
1  | Arsip Perencanaan         | Kerangka Acuan Kerja (TOR)  | KA.01.01         | [ ] Ada  [ ] Belum
   |                           | Rencana Anggaran Biaya (RAB)| KA.01.01         | [ ] Ada  [ ] Belum
   |                           | Nota Dinas Usulan           | KA.01.02         | [ ] Ada  [ ] Belum
2  | Dokumen Kegiatan          | Surat Undangan Rapat/Bimtek | KA.02.01         | [ ] Ada  [ ] Belum
   |                           | Surat Tugas / SPT           | KA.02.01         | [ ] Ada  [ ] Belum
   |                           | Materi Paparan Narasumber   | KA.02.02         | [ ] Ada  [ ] Belum
3  | Dokumentasi Kegiatan      | Foto Dokumentasi Kegiatan   | KA.03.01         | [ ] Ada  [ ] Belum
   |                           | Daftar Presensi Peserta     | KA.03.01         | [ ] Ada  [ ] Belum
4  | Laporan dan Hasil Kegiatan| Notula Resmi / Risalah      | KA.04.01         | [ ] Ada  [ ] Belum
   |                           | Laporan Akhir Pelaksanaan   | KA.04.02         | [ ] Ada  [ ] Belum
5  | Rekomendasi               | Matriks Rekomendasi Stakeholder| KA.05.01      | [ ] Ada  [ ] Belum
6  | Tindak Lanjut Stakeholder | Surat Tanggapan / Bukti TL  | KA.05.02         | [ ] Ada  [ ] Belum
7  | Kendala                   | Catatan Kendala Lapangan    | KA.05.03         | [ ] Ada  [ ] Belum
8  | Mitigasi Risiko           | Matriks Risiko & Kontinjensi| KA.05.03         | [ ] Ada  [ ] Belum
--------------------------------------------------------------------------------

================================================================================
C. PENGESAHAN REGISTRASI & ARSIPARIS
--------------------------------------------------------------------------------
Petugas Registrasi / Pengolah Arsip:
Nama         : ${pjNama}
Inisial PJ   : ${pjInisial}
Tanda Tangan : ____________________

Mengetahui / Verifikasi Arsiparis:
Kabag Administrasi Kedeputian / Admin SiParida
Riandi J. Sulistyono, S.I.Kom., M.Si.
Tanda Tangan : ____________________

(Dokumen registrasi otomatis di-generate melalui aplikasi SiParida Kedeputian Kominfo Kemenko Polkam RI)
`;
  };

  // Generate Templat TOR / Kerangka Acuan Kerja (Tahap 1)
  const generateTemplatTOR = () => {
    return `KERANGKA ACUAN KERJA (TERMS OF REFERENCE)
KEGIATAN KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN RI
TAHUN ANGGARAN 2026

I. LATAR BELAKANG
Kegiatan       : ${judul || '[Nama Kegiatan]'}
Nomor Berkas   : ${nomorBerkas || '[Nomor Berkas]'}
Unit Kerja     : ${unitKerja}
Waktu/Periode  : ${periodeBulan} (${tanggalMulai} s.d. ${tanggalSelesai})

A. Dasar Hukum:
1. Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan.
2. Peraturan Presiden tentang Organisasi dan Tata Kerja Kementerian Koordinator Bidang Politik dan Keamanan.
3. Pedoman Tata Kelola Arsip Dinamis Kedeputian Bidang Koordinasi Komunikasi dan Informasi.

B. Gambaran Umum:
${deskripsi || 'Uraian latar belakang pentingnya koordinasi teknis dan sinergi kebijakan lintas kementerian/lembaga...'}

II. MAKSUD DAN TUJUAN
A. Maksud:
Terselenggaranya koordinasi dan sinkronisasi kebijakan bidang komunikasi dan informasi secara komprehensif.
B. Tujuan:
1. Merumuskan rekomendasi kebijakan strategis yang terukur bagi kementerian/lembaga terkait.
2. Memastikan pengelolaan berkas kegiatan terkelola dalam 8 tahapan utuh sesuai target pencarian ≤ 30 menit.

III. OUTPUT / KELUARAN YANG DIHARAPKAN
1. Dokumen naskah dinas perencanaan dan pelaksanaan lengkap.
2. Risalah kesepakatan rapat dan matriks rekomendasi kebijakan.
3. Rangkaian berkas kegiatan digital yang terverifikasi dalam sistem SiParida.

IV. PENANGGUNG JAWAB KEGIATAN
Penanggung Jawab: ${pjNama} (${pjInisial})
Unit Kerja      : ${unitKerja}
`;
  };

  // Generate Templat Notula / Risalah Rapat (Tahap 4)
  const generateTemplatNotula = () => {
    return `NOTULA / RISALAH RAPAT KOORDINASI
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN RI

Nomor Berkas  : ${nomorBerkas || '[Nomor Berkas]'}
Agenda Rapat  : ${judul || '[Judul Rapat/Kegiatan]'}
Hari / Tanggal: [Hari, Tanggal Bulan 2026]
Waktu         : 09.00 - 12.30 WIB
Tempat        : Ruang Rapat Kedeputian Kominfo / Hybrid Zoom Meeting
Pimpinan Rapat: ${pjNama}

I. PESERTA RAPAT
1. Pejabat dan Pelaksana ${unitKerja}
2. Perwakilan Kementerian / Lembaga Mitra Terkait (Stakeholder)

II. PEMBAHASAN
1. Pembukaan oleh Pimpinan Rapat.
2. Paparan substansi permasalahan koordinasi teknis.
3. Tanggapan dan masukan dari kementerian/lembaga stakeholder.

III. KESEPAKATAN DAN REKOMENDASI KEBIJAKAN
1. Rekomendasi 1: [Rumusan rekomendasi terukur]
   - Instansi Stakeholder PIC: [Nama Instansi K/L]
   - Batas Waktu Tenggat     : [YYYY-MM-DD]
   - Indikator Bukti Selesai : [Surat Keputusan / SOP / Laporan]

2. Rekomendasi 2: [Rumusan rekomendasi terukur]
   - Instansi Stakeholder PIC: [Nama Instansi K/L]
   - Batas Waktu Tenggat     : [YYYY-MM-DD]

IV. PENUTUP
Rapat koordinasi ditutup oleh Pimpinan Rapat pada pukul 12.30 WIB.

Notulis Rapat:                       Disahkan oleh Pimpinan Rapat:
____________________                 ${pjNama}
`;
  };

  // Generate Templat Matriks Rekomendasi & Mitigasi Risiko (Tahap 5, 7, 8)
  const generateTemplatMatriks = () => {
    return `MATRIKS REKOMENDASI KEBIJAKAN & MANAJEMEN RISIKO
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN RI

Nomor Berkas : ${nomorBerkas || '[Nomor Berkas]'}
Kegiatan     : ${judul || '[Judul Kegiatan]'}
Unit Kerja   : ${unitKerja}
Penanggung Jawab: ${pjNama}

================================================================================
BAGIAN I: DAFTAR REKOMENDASI STAKEHOLDER (TAHAP 5 & 6)
================================================================================
No | Kode Rekomendasi | Uraian Rekomendasi Kebijakan | Instansi Stakeholder | Tenggat Waktu | Arsip Bukti Wajib
1  | REK-01/...       | [Uraian rekomendasi]         | [K/L Stakeholder]    | 2026-03-31    | [Surat/Notula/SOP]
2  | REK-02/...       | [Uraian rekomendasi]         | [K/L Stakeholder]    | 2026-04-15    | [Surat/Notula/SOP]

================================================================================
BAGIAN II: KENDALA DAN PENGENDALIAN RISIKO 5x5 (TAHAP 7 & 8)
================================================================================
No | Uraian Kendala/Risiko | Kemungkinan (1-5) | Dampak (1-5) | Level Risiko | Rencana Mitigasi & Tindakan
1  | [Kendala koordinasi]  | 3                 | 4            | Tinggi       | [Surat penagihan resmi pimpinan]
2  | [Kendala teknis]      | 2                 | 3            | Sedang       | [Konsolidasi berkala tim kerja]
`;
  };

  const handleDownloadLembarKendali = () => {
    const cleanNo = (nomorBerkas || 'BERKAS').replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(`Lembar_Kendali_Registrasi_${cleanNo}`, generateLembarKendali(), downloadFormat);
  };

  const handleDownloadTOR = () => {
    const cleanNo = (nomorBerkas || 'BERKAS').replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(`Templat_TOR_KAK_${cleanNo}`, generateTemplatTOR(), downloadFormat);
  };

  const handleDownloadNotula = () => {
    const cleanNo = (nomorBerkas || 'BERKAS').replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(`Templat_Notula_Rapat_${cleanNo}`, generateTemplatNotula(), downloadFormat);
  };

  const handleDownloadMatriks = () => {
    const cleanNo = (nomorBerkas || 'BERKAS').replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(`Templat_Matriks_Rekomendasi_Risiko_${cleanNo}`, generateTemplatMatriks(), downloadFormat);
  };

  const handleSubmit = (e: React.FormEvent, andDownload: boolean = false) => {
    e.preventDefault();
    if (!judul.trim() || !nomorBerkas.trim()) {
      alert('Harap isi Judul Kegiatan dan Nomor Berkas');
      return;
    }

    const newBerkas: BerkasKegiatan = {
      id: `BRK-${Date.now()}`,
      nomorBerkas: nomorBerkas.trim(),
      judul: judul.trim(),
      unitKerja,
      pjInisial: pjInisial.trim().toUpperCase(),
      pjNama: pjNama.trim(),
      periodeBulan,
      tahun: 2026,
      tanggalMulai,
      tanggalSelesai,
      deskripsi: deskripsi.trim(),
      statusKelengkapan: 'Belum Ada',
      persentaseKelengkapan: 0,
      tahapanStatus: {
        1: 'Belum Ada',
        2: 'Belum Ada',
        3: 'Belum Ada',
        4: 'Belum Ada',
        5: 'Belum Ada',
        6: 'Belum Ada',
        7: 'Belum Ada',
        8: 'Belum Ada',
      },
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (andDownload) {
      handleDownloadLembarKendali();
    }

    onSave(newBerkas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Berkas Rangkaian Kegiatan Baru
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pencatatan register kearsipan dinas 8 tahap utuh beserta formulir dan templat dokumen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Success Banner */}
        {downloadSuccessMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{downloadSuccessMsg}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Nomor Berkas & Judul */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Berkas Dinas *
              </label>
              <input
                type="text"
                required
                value={nomorBerkas}
                onChange={(e) => setNomorBerkas(e.target.value)}
                placeholder="B-07/KOMINFO/2026"
                className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Kegiatan Kearsipan Utuh *
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Teknis Mitigasi Penipuan Digital..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Unit Kerja & Periode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Kerja Pengampu *
              </label>
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value as UnitKerja)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              >
                {UNIT_KERJA_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Periode Bulan Pelaksanaan (Tahun 2026) *
              </label>
              <select
                value={periodeBulan}
                onChange={(e) => setPeriodeBulan(e.target.value)}
                aria-label="Periode Bulan Pelaksanaan"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              >
                {DAFTAR_BULAN_2026.map((bln) => (
                  <option key={bln} value={bln}>
                    {bln}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Penanggung Jawab */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inisial PJ *
              </label>
              <input
                type="text"
                required
                value={pjInisial}
                onChange={(e) => setPjInisial(e.target.value)}
                placeholder="RJS"
                className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Jabatan PJ
              </label>
              <input
                type="text"
                value={pjNama}
                onChange={(e) => setPjNama(e.target.value)}
                placeholder="Riandi J. Sulistyono, S.I.Kom., M.Si."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Jadwal Pelaksanaan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Singkat Rangkaian Kegiatan
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan tujuan dan ruang lingkup berkas kearsipan ini..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Fitur Unduh Dokumen & Templat Berkas Baru (New Feature) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Unduh Dokumen & Templat Kearsipan Dinas
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Siap Pakai
                </span>
              </div>

              {/* Format Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDownloadFormat('doc')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    downloadFormat === 'doc'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Word (.doc)
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadFormat('txt')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    downloadFormat === 'txt'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Teks (.txt)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Unduh lembar kendali registrasi berkas atau templat naskah dinas resmi untuk melengkapi 8 tahapan kearsipan sebelum diunggah ke SiParida:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Button 1: Lembar Registrasi */}
              <button
                type="button"
                onClick={handleDownloadLembarKendali}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Lembar Kendali Berkas
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Formulir registrasi 8 tahap
                    </div>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>

              {/* Button 2: Templat TOR */}
              <button
                type="button"
                onClick={handleDownloadTOR}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Templat TOR / KAK
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tahap 1: Arsip Perencanaan
                    </div>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </button>

              {/* Button 3: Templat Notula */}
              <button
                type="button"
                onClick={handleDownloadNotula}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      Templat Notula Resmi
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tahap 4: Laporan & Hasil
                    </div>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
              </button>

              {/* Button 4: Matriks Rekomendasi & Risiko */}
              <button
                type="button"
                onClick={handleDownloadMatriks}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Matriks Rekomendasi & Risiko
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tahap 5 & 8: TL & Mitigasi
                    </div>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
              </button>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDownloadLembarKendali}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              title="Unduh Lembar Kendali Registrasi Berkas sebelum menyimpan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Lembar Kendali</span>
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                title="Simpan data berkas sekaligus unduh lembar kendali registrasi"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan & Unduh Berkas</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Simpan Berkas Saja
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

