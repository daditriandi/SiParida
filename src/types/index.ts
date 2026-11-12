export type UnitKerja =
  | 'Sekretaris Deputi'
  | 'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik'
  | 'Asdep Koordinasi Media Komunikasi dan Informasi'
  | 'Asdep Koordinasi Telekomunikasi dan Informatika'
  | 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik'
  | 'Asdep Koordinasi Peningkatan dan Pencegahan Keamanan Siber';

export const UNIT_KERJA_LIST: UnitKerja[] = [
  'Sekretaris Deputi',
  'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik',
  'Asdep Koordinasi Media Komunikasi dan Informasi',
  'Asdep Koordinasi Telekomunikasi dan Informatika',
  'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik',
  'Asdep Koordinasi Peningkatan dan Pencegahan Keamanan Siber',
];

export const DAFTAR_BULAN_2026 = [
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
  'November 2026',
  'Desember 2026',
] as const;

export type PeriodeBulan2026 = (typeof DAFTAR_BULAN_2026)[number];

export type UserRole =
  | 'Sesdep'
  | 'Pelaksana Asdep'
  | 'Arsiparis'
  | 'Asdep'
  | 'Admin';

export const USER_ROLES: { role: UserRole; title: string; deskripsi: string; defaultUnit?: UnitKerja }[] = [
  {
    role: 'Sesdep',
    title: 'Sekretaris Deputi',
    deskripsi: 'Melihat semua berkas, pemantauan menyeluruh, pengguna utama pimpinan',
    defaultUnit: 'Sekretaris Deputi',
  },
  {
    role: 'Pelaksana Asdep',
    title: 'Pelaksana Asdep (Staff)',
    deskripsi: 'Unggah dan sunting berkas unit kerja yang ditugaskan',
    defaultUnit: 'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik',
  },
  {
    role: 'Arsiparis',
    title: 'Arsiparis Unit Kearsipan',
    deskripsi: 'Verifikasi kartu indeks usulan AI, penomoran, penataan berkas utuh',
    defaultUnit: 'Sekretaris Deputi',
  },
  {
    role: 'Asdep',
    title: 'Asisten Deputi (Pimpinan Unit)',
    deskripsi: 'Melihat dan menyetujui draf penagihan rekomendasi unitnya',
    defaultUnit: 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik',
  },
  {
    role: 'Admin',
    title: 'Administrator Sistem',
    deskripsi: 'Riandi J. Sulistyono, S.I.Kom., M.Si. (Kabag Administrasi) - Kelola sumber pengetahuan & prompt',
    defaultUnit: 'Sekretaris Deputi',
  },
];

export interface TahapanDef {
  id: number;
  nama: string;
  kode: string;
  deskripsi: string;
  arsipWajib: string[];
}

export const TAHAPAN_BERKAS: TahapanDef[] = [
  {
    id: 1,
    nama: 'Arsip Perencanaan',
    kode: 'T1',
    deskripsi: 'Kerangka Acuan Kerja (KAK/TOR), Rencana Anggaran Biaya (RAB), Nota Dinas Usulan',
    arsipWajib: ['KAK/TOR Kegiatan', 'Rencana Anggaran Biaya (RAB)', 'Nota Dinas Persetujuan'],
  },
  {
    id: 2,
    nama: 'Dokumen Kegiatan',
    kode: 'T2',
    deskripsi: 'Surat Undangan, Daftar Hadir Peserta, Bahan Paparan Narasumber, Jadwal Acara',
    arsipWajib: ['Surat Undangan & Distribusi', 'Daftar Hadir Terverifikasi', 'Materi/Paparan Narasumber'],
  },
  {
    id: 3,
    nama: 'Dokumentasi Kegiatan',
    kode: 'T3',
    deskripsi: 'Foto Kegiatan Ber-GeoTag/Timestamp, Rekaman Audio/Video, Siaran Pers, Spanduk',
    arsipWajib: ['Foto Kegiatan (Cap Waktu & Tempat)', 'Siaran Pers / Publikasi Media'],
  },
  {
    id: 4,
    nama: 'Laporan dan Hasil Kegiatan',
    kode: 'T4',
    deskripsi: 'Notula/Risalah Rapat Resmi, Laporan Pelaksanaan Kegiatan, Policy Brief, Ringkasan Eksekutif',
    arsipWajib: ['Notula / Risalah Rapat Resmi', 'Laporan Pelaksanaan Kegiatan Final'],
  },
  {
    id: 5,
    nama: 'Rekomendasi',
    kode: 'T5',
    deskripsi: 'Matriks Rekomendasi Kebijakan, Penetapan Stakeholder Pelaksana, Target Tenggat Waktu',
    arsipWajib: ['Matriks Rekomendasi Resmi', 'Penetapan Stakeholder K/L'],
  },
  {
    id: 6,
    nama: 'Tindak Lanjut Stakeholder',
    kode: 'T6',
    deskripsi: 'Surat Jawaban/Tanggapan K/L, Bukti Implementasi Lapangan, Notula Koordinasi Lanjutan',
    arsipWajib: ['Surat Bukti Tindak Lanjut dari K/L', 'Dokumen Pembuktian Implementasi'],
  },
  {
    id: 7,
    nama: 'Kendala',
    kode: 'T7',
    deskripsi: 'Identifikasi Hambatan Regulasi, Teknis, Koordinasi Antar-Lembaga, atau Anggaran',
    arsipWajib: ['Lembar Catatan Kendala Lapangan'],
  },
  {
    id: 8,
    nama: 'Mitigasi Risiko',
    kode: 'T8',
    deskripsi: 'Matriks Penilaian Risiko 5x5, Rencana Kontinjensi, Langkah Intervensi Kebijakan',
    arsipWajib: ['Matriks Mitigasi Risiko & Tindakan Korektif'],
  },
];

export type StatusTahap = 'Lengkap' | 'Verifikasi' | 'Belum Lengkap' | 'Belum Ada' | 'Lewat Tenggat';

export interface BerkasKegiatan {
  id: string;
  nomorBerkas: string;
  judul: string;
  unitKerja: UnitKerja;
  pjInisial: string;
  pjNama: string;
  periodeBulan: string;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  deskripsi: string;
  statusKelengkapan: StatusTahap;
  tahapanStatus: Record<number, StatusTahap>;
  persentaseKelengkapan: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatusVerifikasi =
  | 'Menunggu Verifikasi'
  | 'Terverifikasi'
  | 'Ditolak'
  | 'Perlu Verifikasi Ulang';

export interface DokumenArsip {
  id: string;
  berkasId: string;
  tahapId: number;
  tahapNama: string;
  namaFile: string;
  usulanNamaFile: string;
  kodeKlasifikasi: string;
  usulanKodeKlasifikasi: string;
  fileType: string;
  fileSize: number;
  ringkasan: string;
  kataKunci: string[];
  statusVerifikasi: StatusVerifikasi;
  catatanVerifikasi?: string;
  lokasiSimpan: string;
  tanggalDokumen: string;
  tanggalUnggah: string;
  diunggahOleh: string;
  diverifikasiOleh?: string;
  tanggalVerifikasi?: string;
  penandaKeamanan: 'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia';
  nikDetected?: boolean;
  phoneDetected?: boolean;
  piiMasked?: boolean;
  fileData?: string; // base64 or text preview
  fileBlobKey?: string; // IndexedDB key
  sinkronisasiDocs: {
    status: 'Belum Tersinkron' | 'Tersinkron' | 'Perlu Verifikasi Ulang';
    mode: 'Simulasi' | 'Google Drive';
    docUrl?: string;
    lastSync?: string;
  };
  isSample: boolean;
}

export type StatusRekomendasi =
  | 'Sesuai'
  | 'Belum sesuai'
  | 'Belum ditindaklanjuti'
  | 'Tidak dapat ditindaklanjuti';

export interface RekomendasiItem {
  id: string;
  kode: string;
  berkasId: string;
  berkasJudul: string;
  unitKerja: UnitKerja;
  isi: string;
  stakeholder: string; // Institutional level e.g. "BSSN", "Kemenkomdigi", "Kemendagri"
  tenggat: string; // YYYY-MM-DD
  status: StatusRekomendasi;
  arsipBuktiIds: string[];
  catatanTindakLanjut?: string;
  isOverdue: boolean;
  drafPenagihan?: {
    nomorSurat: string;
    tanggalSurat: string;
    tujuan: string;
    perihal: string;
    isiRingkas: string;
    status: 'DRAF';
  };
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KendalaRisikoItem {
  id: string;
  berkasId: string;
  berkasJudul: string;
  unitKerja: UnitKerja;
  deskripsiKendala: string;
  deskripsiRisiko: string;
  kemungkinan: 1 | 2 | 3 | 4 | 5; // 1 (Sangat Jarang) - 5 (Hampir Pasti)
  dampak: 1 | 2 | 3 | 4 | 5; // 1 (Tidak Signifikan) - 5 (Katastropik)
  skorRisiko: number; // kemungkinan * dampak
  tingkatRisiko: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem';
  mitigasi: string;
  statusPenanganan: 'Terbuka' | 'Dalam Penanganan' | 'Terkendali';
  isSample: boolean;
}

export interface LogAudit {
  id: string;
  waktu: string;
  pengguna: string;
  peran: UserRole;
  aksi:
    | 'Unggah Dokumen'
    | 'Verifikasi Kartu'
    | 'Koreksi Kartu'
    | 'Tolak Kartu'
    | 'Ubah Status Rekomendasi'
    | 'Buat Draf Penagihan'
    | 'Sinkronisasi Docs'
    | 'Pencarian Arsip'
    | 'Ekspor Laporan'
    | 'Reset Data'
    | 'Buat Berkas';
  detail: string;
  durasiMs?: number;
}

export interface PengaturanSistem {
  modeSinkronisasi: 'Simulasi' | 'Google Drive';
  googleClientId?: string;
  folderRootDrive: string;
  versiPromptAktif: string;
  daftarVersiPrompt: {
    versi: string;
    tanggal: string;
    catatan: string;
    instruksi: string;
  }[];
  klasifikasiArsip: { kode: string; nama: string; retensiAktif: string; retensiInaktif: string }[];
  aturanPenamaanBaku: string;
  kataKunciBaku: string[];
  templatNaskah: { jenis: string; kode: string; isiTemplat: string }[];
}
