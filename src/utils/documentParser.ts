import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { checkSecurityRestrictions, maskPII } from './security';

export interface ParsedDocumentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  textContent: string;
  base64Data?: string;
  mimeType: string;
  isUnsupportedForAutoExtract: boolean;
  unsupportedReason?: string;
  securityRestricted: boolean;
  securityMessage?: string;
  hasPII: boolean;
  nikCount: number;
  phoneCount: number;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB in bytes

export async function parseUploadedFile(file: File): Promise<ParsedDocumentInput> {
  const fileName = file.name;
  const fileSize = file.size;
  const mimeType = file.type || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. File Size Verification (20 MB limit)
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file "${fileName}" (${(fileSize / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal prototipe 20 MB. Harap kompres file atau unggah dokumen di bawah 20 MB.`
    );
  }

  // Pre-check security in filename
  const filenameSecurity = checkSecurityRestrictions('', fileName);
  if (filenameSecurity.isRestricted) {
    return {
      fileName,
      fileType: ext,
      fileSize,
      textContent: '',
      mimeType,
      isUnsupportedForAutoExtract: true,
      securityRestricted: true,
      securityMessage: filenameSecurity.errorMessage,
      hasPII: false,
      nikCount: 0,
      phoneCount: 0,
    };
  }

  let textContent = '';
  let base64Data: string | undefined = undefined;
  let isUnsupported = false;
  let unsupportedReason: string | undefined = undefined;

  try {
    if (['txt', 'md', 'json', 'html', 'csv'].includes(ext)) {
      // Direct text reading
      textContent = await file.text();
    } else if (['xlsx', 'xls'].includes(ext)) {
      // Spreadsheet table parsing via SheetJS
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetSummaries: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const previewRows = rows.slice(0, 30).map((r) => r.join(' | '));
        sheetSummaries.push(`[Sheet: ${sheetName}]\n${previewRows.join('\n')}`);
      }
      textContent = sheetSummaries.join('\n\n');
    } else if (['docx'].includes(ext)) {
      // Word document text extraction via mammoth
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      textContent = result.value || '';
    } else if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3', 'wav', 'm4a'].includes(ext)) {
      // Only encode base64 if <= 2.5MB to avoid huge JSON payloads that fail fetch
      if (fileSize <= 2.5 * 1024 * 1024) {
        try {
          base64Data = await fileToBase64(file);
        } catch {
          // Ignore base64 encoding error, fall back to filename & metadata
        }
      }
      textContent = `[File Multimodal: ${fileName} (${mimeType || ext}) - Ukuran: ${(fileSize / 1024).toFixed(0)} KB]`;
    } else {
      isUnsupported = true;
      unsupportedReason = `Format .${ext} tidak mendukung ekstraksi teks otomatis di peramban. File dan metadata tersimpan aman; silakan lengkapi kartu indeks secara manual.`;
      if (fileSize <= 2.5 * 1024 * 1024) {
        try {
          base64Data = await fileToBase64(file);
        } catch {
          // ignore
        }
      }
    }
  } catch (err: any) {
    console.warn(`Extraction fallback for ${fileName}:`, err);
    isUnsupported = true;
    unsupportedReason = `Gagal mengekstrak teks (${err.message || 'Format tidak didukung'}). Harap isi kartu indeks manual.`;
  }

  // 2. Security Check on extracted content
  const contentSecurity = checkSecurityRestrictions(textContent, fileName);
  if (contentSecurity.isRestricted) {
    return {
      fileName,
      fileType: ext,
      fileSize,
      textContent: '',
      mimeType,
      isUnsupportedForAutoExtract: true,
      securityRestricted: true,
      securityMessage: contentSecurity.errorMessage,
      hasPII: false,
      nikCount: 0,
      phoneCount: 0,
    };
  }

  // 3. PII Masking
  const piiResult = maskPII(textContent);

  return {
    fileName,
    fileType: ext,
    fileSize,
    textContent: piiResult.sanitized,
    base64Data,
    mimeType,
    isUnsupportedForAutoExtract: isUnsupported,
    unsupportedReason,
    securityRestricted: false,
    hasPII: piiResult.hasPII,
    nikCount: piiResult.nikCount,
    phoneCount: piiResult.phoneCount,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || res;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Deterministic metadata inference based on filename and contents.
 * Used for instant, zero-delay pre-filling so the user never sees empty or hanging fields.
 */
export function guessDocumentMetadata(fileName: string, textSnippet: string = '') {
  const combined = (fileName + ' ' + textSnippet).toLowerCase();

  let tahapId = 2;
  let kodeKlasifikasi = 'KA.02.01';
  let defaultTahapPrefix = 'T2';

  if (/kerangka|kak|tor|nota dinas usulan|anggaran|rab|rencana|undangan|surat tugas/i.test(combined)) {
    tahapId = 1;
    kodeKlasifikasi = 'KA.01.01';
    defaultTahapPrefix = 'T1';
  } else if (/foto|dokumentasi|banner|spanduk|rekaman|video|infografis/i.test(combined)) {
    tahapId = 3;
    kodeKlasifikasi = 'KA.03.01';
    defaultTahapPrefix = 'T3';
  } else if (/laporan|hasil|notula|risalah|kajian|evaluasi/i.test(combined)) {
    tahapId = 4;
    kodeKlasifikasi = 'KA.04.01';
    defaultTahapPrefix = 'T4';
  } else if (/rekomendasi|arahan|kebijakan|usulan kebijakan/i.test(combined)) {
    tahapId = 5;
    kodeKlasifikasi = 'KA.05.01';
    defaultTahapPrefix = 'T5';
  } else if (/tindak lanjut|surat jawaban|penagihan|balasan|disposisi/i.test(combined)) {
    tahapId = 6;
    kodeKlasifikasi = 'KA.05.02';
    defaultTahapPrefix = 'T6';
  } else if (/kendala|hambatan|masalah/i.test(combined)) {
    tahapId = 7;
    kodeKlasifikasi = 'KA.06.01';
    defaultTahapPrefix = 'T7';
  } else if (/mitigasi|penanganan|solusi|sop/i.test(combined)) {
    tahapId = 8;
    kodeKlasifikasi = 'KA.06.02';
    defaultTahapPrefix = 'T8';
  }

  // Generate standardized file name: T[TAHAP]_[KODE]_[CLEAN_NAME].EXT
  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toUpperCase();
  const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
  const namaFileStandar = `${defaultTahapPrefix}_${kodeKlasifikasi}_${cleanBase}.${ext}`;

  // Default summary based on file name
  const readableName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const ringkasan = `Dokumen ${readableName} sebagai bukti kearsipan dinas pada tahapan ${tahapId} rangkaian kegiatan kedeputian Komunikasi dan Informasi.`;

  // Keywords
  const kataKunci = ['Kominfo', 'Kearsipan', 'Kedeputian', readableName.slice(0, 15).trim()].filter(Boolean);

  return {
    tahapId,
    kodeKlasifikasi,
    namaFileStandar,
    ringkasan,
    kataKunci,
  };
}

/**
 * Intelligent "Rumah Rekomendasi" (Berkas Kegiatan) Matcher
 * Maps an uploaded document to its correct Unit Kerja / Berkas Kegiatan
 * so files like "Laporan ND PP Tunas" are guaranteed to go into
 * "Asdep Koordinasi Media Komunikasi dan Informasi" (BRK-2026-005)
 * instead of defaulting incorrectly into "Sekretaris Deputi" (BRK-2026-001).
 */
export function matchDocumentToBerkas(
  fileName: string,
  textSnippet: string = '',
  berkasList: { id: string; nomorBerkas: string; judul: string; unitKerja: string }[],
  preferredUnit?: string
): { berkasId: string; berkasJudul: string; unitKerja: string; matchReason: string } {
  const combined = (fileName + ' ' + textSnippet).toLowerCase();

  // 1. Rule: PP TUNAS / Pelindungan Anak / Literasi Digital Ruang Publik -> Asdep Media (BRK-2026-005)
  if (/tunas|perlindungan anak|pelindungan anak/i.test(combined)) {
    const tunasBerkas =
      berkasList.find((b) => /tunas/i.test(b.judul) || b.id === 'BRK-2026-005') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Media Komunikasi dan Informasi');
    if (tunasBerkas) {
      return {
        berkasId: tunasBerkas.id,
        berkasJudul: tunasBerkas.judul,
        unitKerja: tunasBerkas.unitKerja,
        matchReason: 'Terdeteksi Regulasi PP TUNAS / Pelindungan Anak -> Disalurkan ke Asdep Koordinasi Media Komunikasi dan Informasi',
      };
    }
  }

  // 2. Rule: Indeks Kemerdekaan Pers (IKP) / Dewan Pers / BEJO\'S / Jurnalis / Media Massa -> Asdep Media (BRK-2026-004)
  if (/pers\b|ikp\b|bejo|dewan pers|jurnalis|wartawan/i.test(combined)) {
    const mediaBerkas =
      berkasList.find((b) => /pers|bejo/i.test(b.judul) || b.id === 'BRK-2026-004') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Media Komunikasi dan Informasi');
    if (mediaBerkas) {
      return {
        berkasId: mediaBerkas.id,
        berkasJudul: mediaBerkas.judul,
        unitKerja: mediaBerkas.unitKerja,
        matchReason: 'Terdeteksi Kemerdekaan Pers / BEJO\'S -> Disalurkan ke Asdep Koordinasi Media Komunikasi dan Informasi',
      };
    }
  }

  // 3. Rule: KPIP / Keterbukaan Informasi Publik / KIP -> Asdep Komunikasi Publik (BRK-2026-002)
  if (/kpip|keterbukaan informasi|komisi informasi|uu 14/i.test(combined)) {
    const kpipBerkas =
      berkasList.find((b) => /kpip|keterbukaan/i.test(b.judul) || b.id === 'BRK-2026-002') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik');
    if (kpipBerkas) {
      return {
        berkasId: kpipBerkas.id,
        berkasJudul: kpipBerkas.judul,
        unitKerja: kpipBerkas.unitKerja,
        matchReason: 'Terdeteksi Keterbukaan Informasi Publik (KPIP) -> Disalurkan ke Asdep Pengelolaan Komunikasi & Informasi Publik',
      };
    }
  }

  // 4. Rule: Humas K/L / DFK / Disrupsi Informasi -> Asdep Komunikasi Publik (BRK-2026-003)
  if (/humas|dfk|disrupsi/i.test(combined)) {
    const humasBerkas =
      berkasList.find((b) => /humas|dfk/i.test(b.judul) || b.id === 'BRK-2026-003') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Pengelolaan Komunikasi & Informasi Publik');
    if (humasBerkas) {
      return {
        berkasId: humasBerkas.id,
        berkasJudul: humasBerkas.judul,
        unitKerja: humasBerkas.unitKerja,
        matchReason: 'Terdeteksi Humas & DFK -> Disalurkan ke Asdep Pengelolaan Komunikasi & Informasi Publik',
      };
    }
  }

  // 5. Rule: Blankspot / Pos TNI Perbatasan / 3T -> Asdep Telekomunikasi (BRK-2026-006)
  if (/blankspot|tni perbatasan|pos tni|desa 3t|bakti/i.test(combined)) {
    const blankspotBerkas =
      berkasList.find((b) => /blankspot/i.test(b.judul) || b.id === 'BRK-2026-006') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Telekomunikasi dan Informatika');
    if (blankspotBerkas) {
      return {
        berkasId: blankspotBerkas.id,
        berkasJudul: blankspotBerkas.judul,
        unitKerja: blankspotBerkas.unitKerja,
        matchReason: 'Terdeteksi Blankspot 3T -> Disalurkan ke Asdep Koordinasi Telekomunikasi dan Informatika',
      };
    }
  }

  // 6. Rule: Permendagri 7 / IKN / PDN / Pusat Data Nasional -> Asdep Telekomunikasi (BRK-2026-007)
  if (/permendagri|ikn|pdn|pusat data nasional/i.test(combined)) {
    const pdnBerkas =
      berkasList.find((b) => /pdn|ikn/i.test(b.judul) || b.id === 'BRK-2026-007') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Telekomunikasi dan Informatika');
    if (pdnBerkas) {
      return {
        berkasId: pdnBerkas.id,
        berkasJudul: pdnBerkas.judul,
        unitKerja: pdnBerkas.unitKerja,
        matchReason: 'Terdeteksi PDN / IKN -> Disalurkan ke Asdep Koordinasi Telekomunikasi dan Informatika',
      };
    }
  }

  // 7. Rule: Satgas Judi Daring / Rekening Bank / PPATK -> Asdep Pelindungan Data (BRK-2026-009)
  if (/judi|perjudian|rekening|ppatk|satgas judi/i.test(combined)) {
    const judiBerkas =
      berkasList.find((b) => /judi/i.test(b.judul) || b.id === 'BRK-2026-009') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik');
    if (judiBerkas) {
      return {
        berkasId: judiBerkas.id,
        berkasJudul: judiBerkas.judul,
        unitKerja: judiBerkas.unitKerja,
        matchReason: 'Terdeteksi Satgas Perjudian Daring -> Disalurkan ke Asdep Pelindungan Data dan Transaksi Elektronik',
      };
    }
  }

  // 8. Rule: GNSS / AirNav / Frekuensi Penerbangan -> Asdep Pelindungan Data (BRK-2026-010)
  if (/gnss|airnav|penerbangan|interferensi/i.test(combined)) {
    const gnssBerkas =
      berkasList.find((b) => /gnss|airnav/i.test(b.judul) || b.id === 'BRK-2026-010') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik');
    if (gnssBerkas) {
      return {
        berkasId: gnssBerkas.id,
        berkasJudul: gnssBerkas.judul,
        unitKerja: gnssBerkas.unitKerja,
        matchReason: 'Terdeteksi GNSS / Navigasi Penerbangan -> Disalurkan ke Asdep Pelindungan Data dan Transaksi Elektronik',
      };
    }
  }

  // 9. Rule: BSSN / GCI / Siber -> Asdep Pelindungan Data (BRK-2026-011)
  if (/bssn|gci|siber|cyber/i.test(combined)) {
    const siberBerkas =
      berkasList.find((b) => /gci|siber/i.test(b.judul) || b.id === 'BRK-2026-011') ||
      berkasList.find((b) => b.unitKerja === 'Asdep Koordinasi Pelindungan Data dan Transaksi Elektronik');
    if (siberBerkas) {
      return {
        berkasId: siberBerkas.id,
        berkasJudul: siberBerkas.judul,
        unitKerja: siberBerkas.unitKerja,
        matchReason: 'Terdeteksi Keamanan Siber / BSSN -> Disalurkan ke Asdep Pelindungan Data dan Transaksi Elektronik',
      };
    }
  }

  // 10. Rule: SAKIP / Kearsipan / ANRI -> Sekretaris Deputi (BRK-2026-001)
  if (/sakip|kearsipan|anri|srikandi/i.test(combined)) {
    const sesdepBerkas =
      berkasList.find((b) => /sakip|kearsipan/i.test(b.judul) || b.id === 'BRK-2026-001') ||
      berkasList.find((b) => b.unitKerja === 'Sekretaris Deputi');
    if (sesdepBerkas) {
      return {
        berkasId: sesdepBerkas.id,
        berkasJudul: sesdepBerkas.judul,
        unitKerja: sesdepBerkas.unitKerja,
        matchReason: 'Terdeteksi Tata Kelola Kearsipan / SAKIP -> Disalurkan ke Sekretaris Deputi',
      };
    }
  }

  // 11. Fallback: Check if user currently selected a specific unit
  if (preferredUnit && preferredUnit !== 'Semua' && preferredUnit !== 'Semua Unit Kerja (6)') {
    const unitMatch = berkasList.find((b) => b.unitKerja === preferredUnit);
    if (unitMatch) {
      return {
        berkasId: unitMatch.id,
        berkasJudul: unitMatch.judul,
        unitKerja: unitMatch.unitKerja,
        matchReason: `Diselaraskan dengan unit kerja aktif: ${preferredUnit}`,
      };
    }
  }

  // 12. Final default: first berkas in list
  const fallback = berkasList[0] || { id: 'BRK-2026-001', judul: 'Kegiatan Kedeputian', unitKerja: 'Sekretaris Deputi' };
  return {
    berkasId: fallback.id,
    berkasJudul: fallback.judul,
    unitKerja: fallback.unitKerja,
    matchReason: 'Diselaraskan dengan berkas kegiatan default',
  };
}
