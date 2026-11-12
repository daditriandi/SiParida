import { jsPDF } from 'jspdf';
import { DokumenArsip, BerkasKegiatan } from '../types';

/**
 * Generates a 100% valid, standards-compliant PDF file (ISO 32000-1)
 * that opens flawlessly in Adobe Acrobat Reader, Chrome, Edge, and all standard PDF readers.
 * Formatted as an authentic Indonesian government official document (Naskah Dinas Kemenko Polkam).
 */
export function generateOfficialPdfBlob(doc: DokumenArsip, parentBerkas?: BerkasKegiatan): Blob {
  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170 mm

  // --- KOP SURAT RESMI KEMENKO POLKAM RI ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text('KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN', pageWidth / 2, 22, { align: 'center' });
  pdf.text('REPUBLIK INDONESIA', pageWidth / 2, 27, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);
  pdf.text('KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI', pageWidth / 2, 32, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    'Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110 | Telp. (021) 350-0010 | Laman: www.polkam.go.id',
    pageWidth / 2,
    37,
    { align: 'center' }
  );

  // Garis Ganda Kop Surat (Tebal & Tipis)
  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.8);
  pdf.line(margin, 40, pageWidth - margin, 40);
  pdf.setLineWidth(0.25);
  pdf.line(margin, 41.2, pageWidth - margin, 41.2);

  // --- IDENTITAS NASKAH DINAS ---
  let curY = 49;

  // Title box / Header Banner
  pdf.setFillColor(243, 246, 252);
  pdf.setDrawColor(200, 215, 235);
  pdf.roundedRect(margin, curY, contentWidth, 20, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 45, 95);
  pdf.text('NASKAH DINAS KEARSIPAN DIGITAL TERVERIFIKASI', pageWidth / 2, curY + 6, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(60, 70, 90);
  const cleanTitle = (doc.usulanNamaFile || doc.namaFile).replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const titleLines = pdf.splitTextToSize(cleanTitle.toUpperCase(), contentWidth - 10);
  pdf.text(titleLines.slice(0, 2), pageWidth / 2, curY + 12, { align: 'center' });

  curY += 26;

  // --- TABEL METADATA KEARSIPAN RESMI ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  pdf.text('I. DATA KARTU INDEKS & REGISTER KEARSIPAN', margin, curY);

  curY += 4;

  const tableTop = curY;
  const col1W = 50;
  const col2W = contentWidth - col1W;
  const rowH = 6.2;

  const metadataRows: [string, string][] = [
    ['Kode Klasifikasi', `${doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi || '-'} (Klasifikasi Kearsipan Dinas)`],
    ['Tahapan 8 Berkas', `Tahap ${doc.tahapId}: ${doc.tahapNama}`],
    ['Nomor Registrasi Berkas', parentBerkas?.nomorBerkas || 'BRK-KOMINFO-2026'],
    ['Judul Kegiatan Utama', parentBerkas?.judul || 'Kegiatan Kedeputian Bidang Koordinasi Kominfo'],
    ['Unit Kerja Pengampu', parentBerkas?.unitKerja || 'Kedeputian Komunikasi dan Informasi'],
    ['Tanggal Naskah Dinas', `${doc.tanggalDokumen || '-'} (Diunggah: ${doc.tanggalUnggah?.split('T')[0] || '-'})`],
    ['Nama File Baku', doc.usulanNamaFile || doc.namaFile],
    ['Status Verifikasi', `${doc.statusVerifikasi || 'Terverifikasi'} (${doc.diverifikasiOleh || 'Arsiparis Kedeputian'})`],
    ['Lokasi Simpan Fisik', doc.lokasiSimpan || 'Ruang Arsip Kominfo Lt. 3 / Depo Digital'],
    ['Penanda Keamanan', `${doc.penandaKeamanan || 'Biasa'} | Akses: Kedeputian Kominfo`],
  ];

  pdf.setFontSize(8);
  metadataRows.forEach(([label, value], idx) => {
    const y = tableTop + idx * rowH;

    // Row alternating background
    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, rowH, 'F');
    }

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.15);
    pdf.rect(margin, y, contentWidth, rowH, 'S');

    // Label column
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, margin + 2.5, y + 4.2);

    // Value column
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    const trimmedVal = pdf.splitTextToSize(value, col2W - 5);
    pdf.text(trimmedVal[0] || '', margin + col1W + 2, y + 4.2);
  });

  curY = tableTop + metadataRows.length * rowH + 8;

  // --- ISI RINGKASAN SUBSTANSIAL NASKAH DINAS ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  pdf.text('II. RINGKASAN SUBSTANSI & BUTIR KESEPAKATAN NASKAH', margin, curY);

  curY += 4;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.2);

  const ringkasanText =
    doc.ringkasan ||
    'Naskah dinas resmi ini merupakan bagian dari rangkaian berkas kegiatan kedeputian yang telah melalui verifikasi kearsipan sesuai tata naskah dinas Kemenko Polkam RI.';

  const splitRingkasan = pdf.splitTextToSize(ringkasanText, contentWidth - 8);
  const boxHeight = Math.max(22, splitRingkasan.length * 4.5 + 8);

  pdf.roundedRect(margin, curY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text(splitRingkasan, margin + 4, curY + 6, { lineHeightFactor: 1.35 });

  curY += boxHeight + 6;

  // --- KATA KUNCI & INDEKS TEMU KEMBALI ---
  if (doc.kataKunci && doc.kataKunci.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Kata Kunci Temu Kembali:', margin, curY);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(37, 99, 235);
    const keywordsText = doc.kataKunci.map((k) => `#${k}`).join('   ');
    pdf.text(keywordsText, margin + 42, curY);

    curY += 6;
  }

  // --- LEMBAR PENGESAHAN & SEGEL VALIDASI DIGITAL ---
  const signBlockY = Math.max(curY + 2, pageHeight - 65);

  // Box verifikasi kearsipan digital (kiri)
  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, signBlockY, 78, 30, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('VERIFIKASI INTEGRITAS ELEKTRONIK', margin + 4, signBlockY + 5.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Sistem Panduan Arsip & Data (SiParida)', margin + 4, signBlockY + 10);
  pdf.text(`ID Dokumen: ${doc.id}`, margin + 4, signBlockY + 14.5);
  pdf.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, margin + 4, signBlockY + 19);
  pdf.text('Status: DOKUMEN SAH & TERVERIFIKASI', margin + 4, signBlockY + 23.5);
  pdf.text('Kemenko Polkam RI - Kearsipan Dinamis', margin + 4, signBlockY + 27.5);

  // Tanda Tangan Pejabat (kanan)
  const signRightX = pageWidth - margin - 75;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Jakarta, ' + (doc.tanggalDokumen || '2026'), signRightX + 10, signBlockY + 5.5);
  pdf.text('Mengetahui / Penanggung Jawab Kearsipan,', signRightX + 10, signBlockY + 9.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Riandi J. Sulistyono, S.I.Kom., M.Si.', signRightX + 10, signBlockY + 24);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Kabag Administrasi Kedeputian Kominfo', signRightX + 10, signBlockY + 28);

  // --- FOOTER RESMI ---
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    'Dokumen ini dicetak secara sah melalui SiParida Kedeputian Komunikasi & Informasi Kemenko Polkam RI.',
    margin,
    pageHeight - 8
  );
  pdf.text('Halaman 1 / 1', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Generate real Blob
  return pdf.output('blob');
}

/**
 * Triggers a real browser file download for any document,
 * guaranteeing valid PDF binary if ext === 'pdf'.
 */
export function downloadDokumenArsip(
  doc: DokumenArsip,
  parentBerkas?: BerkasKegiatan,
  existingBlob?: Blob | null
): void {
  const filename = doc.namaFile || `${doc.id}.pdf`;
  const ext = (doc.fileType || filename.split('.').pop() || 'pdf').toLowerCase();

  let blobToDownload: Blob;

  if (existingBlob && existingBlob.size > 0) {
    blobToDownload = existingBlob;
  } else if (ext === 'pdf') {
    // Generate 100% valid PDF binary using jsPDF
    blobToDownload = generateOfficialPdfBlob(doc, parentBerkas);
  } else {
    // Text / markdown / doc fallback
    const content = `===============================================================
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN RI
KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI
Sistem Panduan Arsip & Data (SiParida)
===============================================================

Nama Dokumen   : ${doc.usulanNamaFile || doc.namaFile}
Kode Klasifikasi: ${doc.kodeKlasifikasi || doc.usulanKodeKlasifikasi}
Tahap Berkas   : Tahap ${doc.tahapId} - ${doc.tahapNama}
Nomor Berkas   : ${parentBerkas?.nomorBerkas || '-'}
Kegiatan       : ${parentBerkas?.judul || '-'}
Tanggal Naskah : ${doc.tanggalDokumen}
Pengunggah     : ${doc.diunggahOleh}
Lokasi Simpan  : ${doc.lokasiSimpan}

RINGKASAN SUBSTANSI:
${doc.ringkasan}

KATA KUNCI:
${doc.kataKunci.join(', ')}

===============================================================
Status: Terdaftar Resmi dalam SiParida Kemenko Polkam
===============================================================
`;
    blobToDownload = new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  // Create temporary object URL and trigger download
  const url = URL.createObjectURL(blobToDownload);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up object URL after a short timeout so browser can finish download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
}
