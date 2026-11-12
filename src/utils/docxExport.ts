import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { RekomendasiItem } from '../types';

export async function generateDrafPenagihanDocx(rekomendasi: RekomendasiItem): Promise<Blob> {
  const nomorDraf = `DRAF/B-PENAGIHAN/KOMINFO/2026/${rekomendasi.kode.replace(/\//g, '-')}`;
  const tanggalHariIni = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Kop Surat
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN',
                bold: true,
                size: 26, // 13pt
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'REPUBLIK INDONESIA',
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KEDEPUTIAN BIDANG KOORDINASI KOMUNIKASI DAN INFORMASI',
                bold: true,
                size: 22, // 11pt
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110 | Laman: polkam.go.id',
                size: 18, // 9pt
                font: 'Times New Roman',
                color: '475569',
              }),
            ],
          }),
          // Double horizontal line simulation
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.DOUBLE,
                size: 12,
              },
            },
            children: [],
          }),
          new Paragraph({ children: [] }),

          // Watermark Banner / Status
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '[ DRAF NASKAH DINAS — MEMERLUKAN PARAF & PENOMORAN SEBELUM DITERBITKAN ]',
                italics: true,
                bold: true,
                size: 18,
                font: 'Times New Roman',
                color: 'B45309', // amber-700
              }),
            ],
          }),
          new Paragraph({ children: [] }),

          // Nomor & Tanggal Table (Borderless 2 Column)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorder,
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Nomor       : ', font: 'Times New Roman', size: 22 }),
                          new TextRun({ text: nomorDraf, bold: true, font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Sifat       : Segera', font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Lampiran    : 1 (satu) Berkas Risalah Rekomendasi', font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Hal         : ', font: 'Times New Roman', size: 22 }),
                          new TextRun({ text: 'Penagihan Tindak Lanjut Pemenuhan Rekomendasi Kebijakan', bold: true, font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorder,
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: `Jakarta, ${tanggalHariIni}`, font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Tujuan Surat
          new Paragraph({
            children: [
              new TextRun({ text: 'Yth.', font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Pimpinan Instansi ${rekomendasi.stakeholder}`, bold: true, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'di Tempat', font: 'Times New Roman', size: 22 }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Salam Pembuka & Paragraf 1
          new Paragraph({
            children: [
              new TextRun({ text: 'Dengan hormat,', font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Menindaklanjuti pelaksanaan kegiatan "${rekomendasi.berkasJudul}" yang diselenggarakan dan dikoordinasikan oleh unit kerja ${rekomendasi.unitKerja}, bersama ini kami sampaikan bahwa terdapat rekomendasi strategis kebijakan yang telah disepakati bersama dan memerlukan percepatan pemenuhan tindak lanjut resmi dari instansi Saudara dengan rincian sebagai berikut:`,
                font: 'Times New Roman',
                size: 22,
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Tabel Rincian Rekomendasi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    shading: { fill: 'F1F5F9' },
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'NO', bold: true, font: 'Times New Roman', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    shading: { fill: 'F1F5F9' },
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'PARAMETER KEBIJAKAN', bold: true, font: 'Times New Roman', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    shading: { fill: 'F1F5F9' },
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'URAIAN KESEPAKATAN & TARGET', bold: true, font: 'Times New Roman', size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
              // Row 1: Kode
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nomor / Kode Rekomendasi', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.kode, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 2: Berkas
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rangkaian Berkas Kegiatan', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.berkasJudul, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 3: Unit Pemrakarsa
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '3', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Unit Pemrakarsa Koordinasi', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.unitKerja, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 4: Stakeholder Pelaksana
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Instansi Pelaksana / Sasaran', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.stakeholder, bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 5: Isi Rekomendasi
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '5', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Substansi / Isi Rekomendasi', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: `"${rekomendasi.isi}"`, italics: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 6: Batas Waktu
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '6', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Target Batas Waktu (Tenggat)', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.tenggat, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
              // Row 7: Status Terkini
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '7', font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Status Tindak Lanjut Terkini', bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                  new TableCell({
                    borders: tableBorder,
                    children: [new Paragraph({ children: [new TextRun({ text: rekomendasi.status.toUpperCase(), bold: true, font: 'Times New Roman', size: 20 })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Paragraf Penegasan
          new Paragraph({
            children: [
              new TextRun({
                text: 'Mengingat batas waktu pemenuhan target telah mendekati atau melewati tenggat waktu yang disepakati bersama, kami memohon kesediaan instansi Saudara untuk segera menyampaikan konfirmasi perkembangan tindak lanjut serta melampirkan berkas atau arsip bukti implementasi lapangan kepada Sekretariat Kedeputian Kominfo.',
                font: 'Times New Roman',
                size: 22,
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Penutup
          new Paragraph({
            children: [
              new TextRun({
                text: 'Demikian kami sampaikan. Atas perhatian, komitmen, dan kerja sama yang baik, kami ucapkan terima kasih.',
                font: 'Times New Roman',
                size: 22,
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Blok Tanda Tangan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorder,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [] })],
                  }),
                  new TableCell({
                    borders: noBorder,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'a.n. Deputi Bidang Koordinasi Komunikasi dan Informasi,', font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Asisten Deputi / Sekretaris Deputi', bold: true, font: 'Times New Roman', size: 22 }),
                        ],
                      }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '[ Tanda Tangan & Cap Dinas Resmi ]', font: 'Times New Roman', size: 20, color: '64748B' }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Kedeputian Bidang Koordinasi Komunikasi dan Informasi', font: 'Times New Roman', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Kementerian Koordinator Bidang Politik dan Keamanan RI', font: 'Times New Roman', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ children: [] }),

          // Tembusan
          new Paragraph({
            children: [
              new TextRun({ text: 'Tembusan Yth.:', bold: true, font: 'Times New Roman', size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Menteri Koordinator Bidang Politik dan Keamanan RI (sebagai laporan);', font: 'Times New Roman', size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Deputi Bidang Koordinasi Komunikasi dan Informasi.', font: 'Times New Roman', size: 20 }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
