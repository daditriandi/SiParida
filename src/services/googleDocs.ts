import { DokumenArsip, BerkasKegiatan, RekomendasiItem } from '../types';

export interface SyncDocsResult {
  success: boolean;
  docUrl: string;
  documentId?: string;
  mode: 'Google Drive' | 'Simulasi';
  error?: string;
}

/**
 * Creates and populates an official Google Document in Google Docs via Google Workspace REST API
 */
export async function syncDokumenToGoogleDocs(
  doc: DokumenArsip,
  berkas: BerkasKegiatan | undefined,
  accessToken: string | null,
  folderRootDrive: string = 'Arsip_Kedeputian_Kominfo'
): Promise<SyncDocsResult> {
  // If no accessToken provided, run in high-fidelity simulated mode
  if (!accessToken) {
    const simDocId = `1simDoc_${Date.now()}_${doc.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    return {
      success: true,
      docUrl: `https://docs.google.com/document/d/${simDocId}/edit`,
      documentId: simDocId,
      mode: 'Simulasi',
    };
  }

  try {
    const documentTitle = `[SiParida] ${doc.usulanNamaFile || doc.namaFile}`;

    // 1. Create a blank Google Document
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: documentTitle,
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error('Google Docs create error:', errBody);
      throw new Error(`Gagal membuat Google Doc: ${createRes.status} ${createRes.statusText}`);
    }

    const createdDoc = await createRes.json();
    const documentId = createdDoc.documentId;
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Prepare structured official content
    const contentText = `KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
Sistem Panduan Arsip dan Data (SiParida)
========================================================================

LEMBAR ARSIP DINAS DIGITAL
Nomor Berkas : ${berkas?.nomorBerkas || '-'}
Nama File    : ${doc.namaFile}
Nama Baku    : ${doc.usulanNamaFile}
Tahapan      : Tahap ${doc.tahapId} - ${doc.tahapNama}
Klasifikasi  : ${doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi || '-'}
Unit Kerja   : ${berkas?.unitKerja || '-'}
PJ Kegiatan  : ${berkas?.pjNama || '-'} (${berkas?.pjInisial || '-'})
Periode      : ${berkas?.periodeBulan || '-'}
Lokasi Simpan: ${doc.lokasiSimpan || 'Ruang Arsip Pusat Lt. 3'}
Status Kartu : ${doc.statusVerifikasi}
Tanggal Unggah: ${new Date(doc.tanggalUnggah).toLocaleString('id-ID')}

RINGKASAN EKSEKUTIF KEARSIPAN:
${doc.ringkasan || '-'}

KATA KUNCI BAKU:
${(doc.kataKunci || []).join(', ') || '-'}

CATATAN VERIFIKASI ARSIPARIS:
${doc.catatanVerifikasi || 'Kartu indeks terverifikasi dan memenuhi standar tata kearsipan dinas.'}

========================================================================
Mengetahui / Administrator Kearsipan:
Riandi J. Sulistyono, S.I.Kom., M.Si.
Kabag Administrasi Kedeputian Bidang Koordinasi Komunikasi dan Informasi
Kemenko Polkam Republik Indonesia
Tersinkronisasi otomatis via SiParida pada: ${new Date().toLocaleString('id-ID')}
`;

    // 3. Insert content into the created document
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: contentText,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      console.warn('Batch update text failed, but doc was created:', await updateRes.text());
    }

    return {
      success: true,
      docUrl,
      documentId,
      mode: 'Google Drive',
    };
  } catch (error: any) {
    console.error('syncDokumenToGoogleDocs failed:', error);
    return {
      success: false,
      docUrl: '',
      mode: 'Google Drive',
      error: error.message || 'Gagal menyinkronkan dokumen ke Google Docs',
    };
  }
}

export interface DashboardSyncData {
  unitKerja: string;
  periode: string;
  totalKegiatan: number;
  docsVerified: number;
  docsPending: number;
  recsCompleted: number;
  recsTotal: number;
  recsOverdue: number;
  avgSearchTime: number;
  berkasList: BerkasKegiatan[];
  rekomendasiList: RekomendasiItem[];
}

/**
 * Creates an executive summary report directly in Google Docs for the current Dashboard view
 */
export async function syncDashboardToGoogleDocs(
  data: DashboardSyncData,
  accessToken: string | null
): Promise<SyncDocsResult> {
  if (!accessToken) {
    const simDocId = `1simDash_${Date.now()}`;
    return {
      success: true,
      docUrl: `https://docs.google.com/document/d/${simDocId}/edit`,
      documentId: simDocId,
      mode: 'Simulasi',
    };
  }

  try {
    const docTitle = `[SiParida] Laporan Eksekutif Dashboard - ${data.unitKerja} (${data.periode || '2026'})`;

    // 1. Create Google Doc
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Google Docs dashboard create error:', errText);
      throw new Error(`Gagal membuat Google Doc: ${createRes.status} ${createRes.statusText}`);
    }

    const createdDoc = await createRes.json();
    const documentId = createdDoc.documentId;
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Format Structured Official Text
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const berkasSummaryLines = data.berkasList
      .slice(0, 15)
      .map((b, idx) => {
        const completedStages = Object.values(b.tahapanStatus).filter(
          (s) => s === 'Lengkap' || s === 'Verifikasi'
        ).length;
        const pct = Math.round((completedStages / 8) * 100);
        return `  ${idx + 1}. [${b.nomorBerkas}] ${b.judul}
     Unit: ${b.unitKerja} | Periode: ${b.periodeBulan} | Progres: ${completedStages}/8 Tahap (${pct}%)
     PJ: ${b.pjNama} | Status: ${b.statusKelengkapan}`;
      })
      .join('\n\n');

    const recsOverdueLines = data.rekomendasiList
      .filter((r) => r.isOverdue && r.status !== 'Sesuai')
      .slice(0, 8)
      .map(
        (r, idx) =>
          `  ${idx + 1}. [${r.kode}] Kepada: ${r.stakeholder} (Tenggat: ${new Date(
            r.tenggat
          ).toLocaleDateString('id-ID')}) - Status: ${r.status}
     Uraian: ${r.isi}`
      )
      .join('\n\n');

    const contentText = `KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
Sistem Panduan Arsip dan Data (SiParida)
========================================================================

LAPORAN EKSEKUTIF RINGKASAN DASHBOARD KEARSIPAN
Waktu Sinkronisasi : ${timestamp}
Unit Kerja Terpilih: ${data.unitKerja}
Periode Terpilih   : ${data.periode}

1. RINGKASAN INDIKATOR KINERJA UTAMA (KPI):
------------------------------------------------------------------------
* Total Rangkaian Berkas Kegiatan : ${data.totalKegiatan} Berkas
* Status Kartu Indeks Dokumen     : ${data.docsVerified} Terverifikasi | ${data.docsPending} Menunggu Verifikasi
* Capaian Rekomendasi Stakeholder : ${data.recsCompleted} Selesai dari total ${data.recsTotal} Rekomendasi
* Rekomendasi Lewat Tenggat       : ${data.recsOverdue} Perlu Ditagih
* Rata-rata Waktu Temu Kembali    : ${data.avgSearchTime > 0 ? (data.avgSearchTime / 1000).toFixed(2) : '< 30'} Detik (Standar Target: ≤ 30 Menit)

2. MATRIKS 8 TAHAP RANGKAIAN BERKAS KEGIATAN:
------------------------------------------------------------------------
Delapan tahapan standar kearsipan utuh:
(1) Perencanaan -> (2) Dokumen -> (3) Dokumentasi -> (4) Laporan -> (5) Rekomendasi -> (6) Tindak Lanjut -> (7) Kendala -> (8) Mitigasi Risiko

Daftar Rangkaian Berkas Aktif:
${berkasSummaryLines || '  (Tidak ada berkas yang sesuai filter)'}

3. DAFTAR REKOMENDASI PRIORITAS & LEWAT TENGGAT:
------------------------------------------------------------------------
${recsOverdueLines || '  Semua rekomendasi berjalan tepat waktu dan tidak ada yang lewat tenggat.'}

========================================================================
PENGESAHAN ADMINISTRATIF:
Penanggung Jawab Kearsipan Kedeputian:
Riandi J. Sulistyono, S.I.Kom., M.Si.
Kabag Administrasi Kedeputian Bidang Koordinasi Komunikasi dan Informasi
Kementerian Koordinator Bidang Politik dan Keamanan RI

*Dokumen ini dibuat dan disinkronkan secara langsung dari Sistem SiParida ke Google Docs.
`;

    // 3. Insert content into Google Doc
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: contentText,
              },
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      console.warn('Batch update text failed, but doc was created:', await updateRes.text());
    }

    return {
      success: true,
      docUrl,
      documentId,
      mode: 'Google Drive',
    };
  } catch (error: any) {
    console.error('syncDashboardToGoogleDocs failed:', error);
    return {
      success: false,
      docUrl: '',
      mode: 'Google Drive',
      error: error.message || 'Gagal menyinkronkan dashboard ke Google Docs',
    };
  }
}

/**
 * Creates an official Letter Draft for Recommendation Follow-up directly in Google Docs
 */
export async function syncDrafPenagihanToGoogleDocs(
  rekomendasi: RekomendasiItem,
  accessToken: string | null
): Promise<SyncDocsResult> {
  const nomorDraf = `DRAF/B-PENAGIHAN/KOMINFO/2026/${rekomendasi.kode.replace(/\//g, '-')}`;
  const tanggalHariIni = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (!accessToken) {
    const simDocId = `1simDrafPenagihan_${Date.now()}_${rekomendasi.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    return {
      success: true,
      docUrl: `https://docs.google.com/document/d/${simDocId}/edit`,
      documentId: simDocId,
      mode: 'Simulasi',
    };
  }

  try {
    const docTitle = `[DRAF NASKAH DINAS] Surat Penagihan Rekomendasi - ${rekomendasi.stakeholder}`;

    // 1. Create Google Doc
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Google Docs draf penagihan create error:', errText);
      throw new Error(`Gagal membuat Google Doc: ${createRes.status} ${createRes.statusText}`);
    }

    const createdDoc = await createRes.json();
    const documentId = createdDoc.documentId;
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    const contentText = `KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN REPUBLIK INDONESIA
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110 | Laman: polkam.go.id
================================================================================
DRAF SURAT DINAS PENAGIHAN TINDAK LANJUT REKOMENDASI KEBIJAKAN
(STATUS: DRAF - MEMERLUKAN PARAF & PENOMORAN RESMI SEBELUM DITERBITKAN)
================================================================================

Nomor       : ${nomorDraf}                                   Jakarta, ${tanggalHariIni}
Sifat       : Segera
Lampiran    : 1 (satu) Berkas Risalah Rekomendasi
Perihal     : Penagihan Tindak Lanjut Pemenuhan Rekomendasi Kebijakan

Yth.
Pimpinan Instansi ${rekomendasi.stakeholder}
di Tempat

Dengan hormat,

Menindaklanjuti penyelenggaraan kegiatan "${rekomendasi.berkasJudul}" yang difasilitasi oleh ${rekomendasi.unitKerja}, bersama ini kami sampaikan bahwa terdapat rekomendasi strategis kebijakan yang telah disepakati bersama dan memerlukan percepatan pemenuhan tindak lanjut resmi dari instansi Saudara:

RINCIAN REKOMENDASI KEBIJAKAN:
--------------------------------------------------------------------------------
* Nomor Rekomendasi : ${rekomendasi.kode}
* Rangkaian Berkas  : ${rekomendasi.berkasJudul}
* Unit Pemrakarsa   : ${rekomendasi.unitKerja}
* Instansi Terkait  : ${rekomendasi.stakeholder}
* Isi Rekomendasi   : "${rekomendasi.isi}"
* Target Batas Waktu: ${rekomendasi.tenggat}
* Status Terkini    : ${rekomendasi.status.toUpperCase()}
--------------------------------------------------------------------------------

Mengingat batas waktu pemenuhan target telah mendekati atau melewati tenggat waktu yang disepakati bersama, kami memohon kesediaan instansi Saudara untuk segera menyampaikan konfirmasi perkembangan tindak lanjut serta melampirkan berkas atau arsip bukti implementasi lapangan kepada Sekretariat Kedeputian Kominfo.

Demikian kami sampaikan. Atas perhatian, komitmen, dan kerja sama yang baik, kami ucapkan terima kasih.


a.n. Deputi Bidang Koordinasi Komunikasi dan Informasi,
Asisten Deputi / Sekretaris Deputi

(Tanda Tangan & Cap Dinas Resmi)
Kedeputian Bidang Koordinasi Komunikasi dan Informasi
Kementerian Koordinator Bidang Politik dan Keamanan RI

Tembusan:
1. Menteri Koordinator Bidang Politik dan Keamanan RI (sebagai laporan);
2. Deputi Bidang Koordinasi Komunikasi dan Informasi.

--------------------------------------------------------------------------------
*Naskah dinas ini digenerate secara otomatis melalui SiParida (Sistem Panduan Arsip dan Data)
dan disinkronkan langsung ke Google Docs Kedeputian.
`;

    // 2. Insert formatted content
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: contentText,
              },
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      console.warn('Batch update text failed, but doc was created:', await updateRes.text());
    }

    return {
      success: true,
      docUrl,
      documentId,
      mode: 'Google Drive',
    };
  } catch (error: any) {
    console.error('syncDrafPenagihanToGoogleDocs failed:', error);
    return {
      success: false,
      docUrl: '',
      mode: 'Google Drive',
      error: error.message || 'Gagal menyinkronkan draf penagihan ke Google Docs',
    };
  }
}

