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
  | 'Deputi'
  | 'Sesdep'
  | 'Asdep'
  | 'Pelaksana Asdep'
  | 'Arsiparis'
  | 'Admin';

export interface RoleAuthorityDefinition {
  role: UserRole;
  title: string;
  singkatan: string;
  badgeLabel: string;
  fungsiUtama: string;
  kewenangan: string[];
  larangan: string[];
  allowedPages: string[];
  defaultPage: string;
  defaultUnit?: UnitKerja;
  canUpload: boolean;
  canVerifyCard: boolean;
  canApproveDraf: boolean;
  canApproveSummary: boolean;
  canSearch: boolean;
  canReadQuarterlyOnly?: boolean;
}

export const ROLE_AUTHORITIES: Record<UserRole, RoleAuthorityDefinition> = {
  Sesdep: {
    role: 'Sesdep',
    title: 'Sekretaris Deputi',
    singkatan: 'Sesdep',
    badgeLabel: 'Cari Arsip, Pantau Dashboard & Setujui Ringkasan',
    fungsiUtama: 'Hanya bisa mencari arsip, memantau dashboard, dan menyetujui ringkasan',
    kewenangan: [
      'Pencarian cerdas temu kembali arsip dinas (target ≤ 30 menit)',
      'Memantau seluruh indikator KPI kearsipan dan matriks 8 tahap di Dashboard',
      'Menyetujui & menyinkronkan Ringkasan Eksekutif Dashboard ke Google Docs resmi',
      'Melihat laporan akuntabilitas kearsipan dinas',
    ],
    larangan: [
      'Tidak mengunggah dokumen teknis operasional (tugas Pelaksana Asdep)',
      'Tidak memverifikasi kartu indeks atau kode klasifikasi teknis (tugas Arsiparis)',
    ],
    allowedPages: ['dashboard', 'cari', 'laporan'],
    defaultPage: 'dashboard',
    defaultUnit: 'Sekretaris Deputi',
    canUpload: false,
    canVerifyCard: false,
    canApproveDraf: false,
    canApproveSummary: true,
    canSearch: true,
  },
  'Pelaksana Asdep': {
    role: 'Pelaksana Asdep',
    title: 'Pelaksana Asdep',
    singkatan: 'Pelaksana',
    badgeLabel: 'Unggah Dokumen & Periksa Usulan AI',
    fungsiUtama: 'Hanya bisa unggah dokumen dan periksa usulan AI',
    kewenangan: [
      'Mengunggah berkas dokumen kegiatan pada 8 tahapan kearsipan dinas',
      'Memeriksa hasil ekstraksi AI: usulan nama file terstandar, usulan kode klasifikasi, ringkasan, dan kata kunci',
      'Memeriksa deteksi data sensitif (PII: NIK & No. HP) sebelum dokumen didaftarkan',
      'Melihat status kelengkapan berkas kegiatan unit kerjanya',
    ],
    larangan: [
      'Tidak memverifikasi atau menyetujui kartu indeks (wewenang Arsiparis)',
      'Tidak menyetujui draf surat penagihan rekomendasi (wewenang Asdep)',
      'Tidak menyetujui ringkasan eksekutif (wewenang Sesdep)',
    ],
    allowedPages: ['unggah', 'berkas'],
    defaultPage: 'unggah',
    defaultUnit: 'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik',
    canUpload: true,
    canVerifyCard: false,
    canApproveDraf: false,
    canApproveSummary: false,
    canSearch: false,
  },
  Arsiparis: {
    role: 'Arsiparis',
    title: 'Arsiparis Unit Kearsipan',
    singkatan: 'Arsiparis',
    badgeLabel: 'Verifikasi Kode, Nama File & Kelengkapan',
    fungsiUtama: 'Hanya memverifikasi kode, nama file, dan kelengkapan',
    kewenangan: [
      'Memverifikasi keabsahan kode klasifikasi kearsipan dinas',
      'Menetapkan dan mengoreksi format penamaan file baku dinas',
      'Menyetujui (Approve) atau menolak (Reject) usulan kartu indeks dengan catatan perbaikan',
      'Memeriksa matriks kelengkapan 8 tahap rangkaian berkas utuh',
      'Menelusuri register arsip untuk kontrol mutu kearsipan',
    ],
    larangan: [
      'Tidak mengunggah dokumen kegiatan operasional unit (tugas Pelaksana Asdep)',
      'Tidak menyetujui draf naskah dinas penagihan rekomendasi (wewenang Asdep)',
      'Tidak menyetujui ringkasan eksekutif (wewenang Sesdep)',
    ],
    allowedPages: ['verifikasi', 'berkas', 'cari'],
    defaultPage: 'verifikasi',
    defaultUnit: 'Sekretaris Deputi',
    canUpload: false,
    canVerifyCard: true,
    canApproveDraf: false,
    canApproveSummary: false,
    canSearch: true,
  },
  Asdep: {
    role: 'Asdep',
    title: 'Asisten Deputi',
    singkatan: 'Asdep',
    badgeLabel: 'Pantau Rekomendasi & Setujui Dokumen Draf',
    fungsiUtama: 'Hanya memantau rekomendasi dan setujui dokumen',
    kewenangan: [
      'Memantau perkembangan pemenuhan rekomendasi kebijakan unit kerjanya lintas K/L',
      'Menelaah dan menyetujui Draf Surat Penagihan Rekomendasi Kebijakan',
      'Mengunduh draf naskah dinas Word (.docx) atau sinkronisasi ke Google Docs',
      'Memantau berkas kegiatan unit kerjanya',
    ],
    larangan: [
      'Tidak mengunggah dokumen teknis operasional (tugas Pelaksana Asdep)',
      'Tidak memverifikasi kode klasifikasi teknis arsip (tugas Arsiparis)',
    ],
    allowedPages: ['rekomendasi', 'dashboard', 'berkas'],
    defaultPage: 'rekomendasi',
    defaultUnit: 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik',
    canUpload: false,
    canVerifyCard: false,
    canApproveDraf: true,
    canApproveSummary: false,
    canSearch: false,
  },
  Deputi: {
    role: 'Deputi',
    title: 'Deputi Bidang Koordinasi',
    singkatan: 'Deputi',
    badgeLabel: 'Membaca Ringkasan Triwulan',
    fungsiUtama: 'Hanya membaca ringkasan triwulan',
    kewenangan: [
      'Membaca Laporan Ringkasan Eksekutif Triwulan (Triwulan I s.d. IV 2026)',
      'Membaca rekapitulasi capaian kepatuhan 8 tahap kearsipan seluruh Asisten Deputi',
      'Melihat status capaian tindak lanjut rekomendasi strategis pimpinan',
      'Memantau Ringkasan Dashboard Eksekutif (Mode Read-Only)',
    ],
    larangan: [
      'Bebas dari beban teknis input dokumen, unggah, dan verifikasi kartu',
    ],
    allowedPages: ['laporan', 'dashboard'],
    defaultPage: 'laporan',
    defaultUnit: 'Sekretaris Deputi',
    canUpload: false,
    canVerifyCard: false,
    canApproveDraf: false,
    canApproveSummary: false,
    canSearch: false,
    canReadQuarterlyOnly: true,
  },
  Admin: {
    role: 'Admin',
    title: 'Administrator Sistem (Kabag Administrasi)',
    singkatan: 'Admin',
    badgeLabel: 'Pengelolaan Penuh Sistem & Sumber Pengetahuan',
    fungsiUtama: 'Riandi J. Sulistyono, S.I.Kom., M.Si. - Pengelolaan menyeluruh, audit log, dan integrasi Google Docs',
    kewenangan: [
      'Akses ke seluruh fitur dan pengujian seluruh mode peran agen',
      'Konfigurasi sistem, sumber pengetahuan, dan prompt AI kearsipan',
      'Pemantauan Log Audit aktivitas kearsipan',
    ],
    larangan: [],
    allowedPages: [
      'dashboard',
      'berkas',
      'unggah',
      'cari',
      'rekomendasi',
      'verifikasi',
      'laporan',
      'pengaturan',
      'audit',
    ],
    defaultPage: 'dashboard',
    defaultUnit: 'Sekretaris Deputi',
    canUpload: true,
    canVerifyCard: true,
    canApproveDraf: true,
    canApproveSummary: true,
    canSearch: true,
  },
};

export const USER_ROLES = (Object.values(ROLE_AUTHORITIES) as RoleAuthorityDefinition[]).map((auth) => ({
  role: auth.role,
  title: auth.title,
  deskripsi: auth.fungsiUtama,
  defaultUnit: auth.defaultUnit,
}));

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
