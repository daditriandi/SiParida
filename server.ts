import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Utility: PII Sanitizer & Security check on server
function sanitizeContent(text: string): { sanitized: string; isSecurityRestricted: boolean; restrictedTerm?: string; piiDetected: boolean } {
  const upper = text.toUpperCase();
  const restrictedKeywords = ['SANGAT RAHASIA', 'RAHASIA', 'TERBATAS'];
  for (const kw of restrictedKeywords) {
    if (upper.includes(kw)) {
      return { sanitized: text, isSecurityRestricted: true, restrictedTerm: kw, piiDetected: false };
    }
  }

  let piiDetected = false;
  // 16 digit NIK
  let sanitized = text.replace(/\b(\d{4})\d{8}(\d{4})\b/g, (_m, p1, p2) => {
    piiDetected = true;
    return `${p1}********${p2}`;
  });

  // Indonesian phone numbers (08xx or +628xx)
  sanitized = sanitized.replace(/(\+?62|0)8[1-9][0-9]{1,2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, (match) => {
    piiDetected = true;
    const clean = match.replace(/[-.\s]/g, '');
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-2);
    return `${prefix}****${suffix}`;
  });

  return { sanitized, isSecurityRestricted: false, piiDetected };
}

// API: Document Indexing & Analysis
app.post('/api/gemini/index-document', async (req, res) => {
  try {
    const { fileName, fileType, textContent, base64Data, mimeType } = req.body;

    const rawText = textContent || '';
    const securityCheck = sanitizeContent(rawText + ' ' + (fileName || ''));

    if (securityCheck.isSecurityRestricted) {
      return res.status(403).json({
        error: 'SECURITY_RESTRICTION',
        message: `Dokumen memuat tanda keamanan "${securityCheck.restrictedTerm}". Sesuai regulasi keamanan data kearsipan Kominfo, pemrosesan AI ditolak. Silakan lakukan pengisian kartu indeks secara manual.`,
      });
    }

    const sanitizedText = securityCheck.sanitized;
    const piiWarning = securityCheck.piiDetected;

    // If Gemini client is available, run multimodal or text extraction
    if (aiClient) {
      const systemInstruction = `Anda adalah asisten cerdas arsiparis SiParida (Sistem Panduan Arsip dan Data) di Kedeputian Bidang Koordinasi Komunikasi dan Informasi.
Tugas Anda adalah membaca dokumen kearsipan dinas dan menyusun USULAN KARTU INDEKS kegiatan pemerintahan.
Aturan Wajib:
1. Usulkan salah satu dari 8 tahap berkas:
   1: Arsip Perencanaan
   2: Dokumen Kegiatan
   3: Dokumentasi Kegiatan
   4: Laporan dan Hasil Kegiatan
   5: Rekomendasi
   6: Tindak Lanjut Stakeholder
   7: Kendala
   8: Mitigasi Risiko
2. Usulkan kode klasifikasi arsip Kominfo (misal: KA.01.01 Perencanaan, KA.02.01 Pelaksanaan, KA.03.01 Notula/Dokumentasi, KA.04.01 Laporan Kinerja, KA.05.01 Rekomendasi Kebijakan).
3. Usulkan nama file terstandar Kominfo: [KODE_TAHAP]_[KODE_KLASIFIKASI]_[JUDUL_RINGKAS].
4. Ringkasan maksimal 3 kalimat padat berdasar fakta dokumen. Dilarang menambah fakta di luar dokumen sumber! Jika informasi tidak ada, biarkan kosong.
5. Maksimal 6 kata kunci teknis/arsip.
6. Rekomendasi: Jika dokumen berupa notula/laporan/kajian/evaluasi yang memuat arahan atau rekomendasi, ekstrak daftar rekomendasi (isi rekomendasi, stakeholder tingkat instansi pemerintah/lembaga, tenggat YYYY-MM-DD jika ada atau kosongkan).
7. Suhu rendah (0.2), patuhi batasan.`;

      const prompt = `Nama File: ${fileName}\nTipe File: ${fileType}\nIsi Teks:\n${sanitizedText.slice(0, 15000)}`;

      const parts: any[] = [];
      if (base64Data && mimeType && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tahapId: { type: Type.INTEGER, description: 'Nomor tahap berkas antara 1 sampai 8' },
              tahapNama: { type: Type.STRING, description: 'Nama tahapan berkas' },
              usulanKodeKlasifikasi: { type: Type.STRING, description: 'Kode klasifikasi arsip Kominfo' },
              usulanNamaFile: { type: Type.STRING, description: 'Nama file terstandar Kominfo' },
              ringkasan: { type: Type.STRING, description: 'Ringkasan dokumen maksimal 3 kalimat' },
              kataKunci: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Maksimal 6 kata kunci baku',
              },
              rekomendasi: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    isi: { type: Type.STRING },
                    stakeholder: { type: Type.STRING, description: 'Tingkat instansi, bukan nama orang' },
                    tenggat: { type: Type.STRING, description: 'Format YYYY-MM-DD atau kosong' },
                  },
                  required: ['isi', 'stakeholder'],
                },
              },
            },
            required: ['tahapId', 'usulanKodeKlasifikasi', 'usulanNamaFile', 'ringkasan', 'kataKunci'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: parsed,
        piiWarning,
        sanitizedSnippet: sanitizedText.slice(0, 500),
      });
    }

    // Deterministic Rule-Based Fallback when Gemini API Key is not set or network is offline
    const isPlan = /kerangka|kak|tor|nota dinas usulan|anggaran|rab|rencana|undangan/i.test(fileName + ' ' + sanitizedText);
    const isPhoto = /dokumentasi|foto|foto_|img|banner|spanduk|video/i.test(fileName);
    const isReport = /laporan|hasil|notula|risalah|kajian|evaluasi/i.test(fileName + ' ' + sanitizedText);
    const isFollowUp = /tindak lanjut|surat jawaban|laporan penanganan/i.test(fileName + ' ' + sanitizedText);
    const isRisk = /risiko|mitigasi|ancaman/i.test(fileName + ' ' + sanitizedText);

    let tahapId = 2;
    let tahapNama = 'Dokumen Kegiatan';
    let kodeKlas = 'KA.02.01';

    if (isPlan) {
      tahapId = 1;
      tahapNama = 'Arsip Perencanaan';
      kodeKlas = 'KA.01.01';
    } else if (isPhoto) {
      tahapId = 3;
      tahapNama = 'Dokumentasi Kegiatan';
      kodeKlas = 'KA.03.01';
    } else if (isReport) {
      tahapId = 4;
      tahapNama = 'Laporan dan Hasil Kegiatan';
      kodeKlas = 'KA.04.01';
    } else if (isFollowUp) {
      tahapId = 6;
      tahapNama = 'Tindak Lanjut Stakeholder';
      kodeKlas = 'KA.05.02';
    } else if (isRisk) {
      tahapId = 8;
      tahapNama = 'Mitigasi Risiko';
      kodeKlas = 'KA.05.03';
    }

    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\- ]/g, '');
    const usulanNamaFile = `T${tahapId}_${kodeKlas}_${cleanTitle.toUpperCase().replace(/\s+/g, '_')}`;

    return res.json({
      success: true,
      data: {
        tahapId,
        tahapNama,
        usulanKodeKlasifikasi: kodeKlas,
        usulanNamaFile,
        ringkasan: `Dokumen ${fileName} tercatat sebagai arsip tahap ${tahapNama} dalam rangkaian kegiatan kedeputian Kominfo. Disusun untuk mendukung tata kelola arsip dinas yang akuntabel dan tertib administrasi.`,
        kataKunci: ['Kominfo', 'Kearsipan', tahapNama, 'Kedeputian', 'Dokumen Kedinasan'],
        rekomendasi: isReport ? [
          {
            isi: `Penguatan koordinasi tindak lanjut hasil kegiatan ${cleanTitle} bersama kementerian/lembaga terkait.`,
            stakeholder: 'Kementerian Komunikasi dan Digital',
            tenggat: '2026-03-31',
          },
        ] : [],
      },
      piiWarning,
      sanitizedSnippet: sanitizedText.slice(0, 500),
    });
  } catch (error: any) {
    console.error('Error indexing document:', error);
    res.status(500).json({ error: error.message || 'Gagal memproses dokumen kearsipan' });
  }
});

// API: Natural Language Search in Archive Register
app.post('/api/gemini/search', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query, registerItems } = req.body;

    if (!query || !query.trim()) {
      return res.json({
        results: [],
        durationMs: Date.now() - startTime,
        message: 'Masukkan kata kunci atau pertanyaan pencarian.',
      });
    }

    const items = (registerItems || []).slice(0, 50); // limit register context

    if (aiClient && items.length > 0) {
      try {
        const systemInstruction = `Anda adalah mesin pencari register arsip SiParida Bidang Kominfo.
Batasan Wajib:
1. Cari HANYA dari register arsip yang diberikan dalam konteks.
2. JANGAN berasumsi atau mengarang arsip yang tidak ada di daftar.
3. Jika tidak ada arsip yang relevan, keluarkan array kosong [] dan text alasan: "Arsip tidak ditemukan di register."
4. Maksimal 5 arsip yang paling relevan.
5. Untuk setiap hasil, sertakan: id, nomorBerkas, judulBerkas, namaFile, tahap, alasanSingkat.`;

        const prompt = `Pertanyaan Pengguna: "${query}"\n\nRegister Arsip Tersedia (JSON):\n${JSON.stringify(
          items.map((it: any) => ({
            id: it.id,
            nomorBerkas: it.nomorBerkas,
            judulBerkas: it.berkasJudul,
            namaFile: it.namaFile,
            tahap: it.tahapNama,
            ringkasan: it.ringkasan,
            kataKunci: it.kataKunci,
            lokasiSimpan: it.lokasiSimpan,
            tanggalDokumen: it.tanggalDokumen,
            unitKerja: it.unitKerja,
          }))
        )}`;

        const geminiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      alasanSingkat: { type: Type.STRING },
                    },
                    required: ['id', 'alasanSingkat'],
                  },
                },
                keterangan: { type: Type.STRING },
              },
              required: ['items'],
            },
          },
        });

        // Timeout race 1.8s
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 1800)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const parsed = JSON.parse(response.text || '{"items":[]}');
        const matchedIds = new Map(parsed.items.map((it: any) => [it.id, it.alasanSingkat]));

        const results = items
          .filter((it: any) => matchedIds.has(it.id))
          .slice(0, 5)
          .map((it: any) => ({
            ...it,
            alasanSingkat: matchedIds.get(it.id) || 'Relevan dengan kata kunci pencarian.',
          }));

        const durationMs = Date.now() - startTime;
        if (results.length > 0) {
          return res.json({
            results,
            durationMs,
            message: `Ditemukan ${results.length} arsip terverifikasi di register.`,
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini search fallback triggered:', geminiErr);
      }
    }

    // High-performance intelligent deterministic search
    const qLower = query.toLowerCase().trim();
    // Strip punctuation
    const cleanQ = qLower.replace(/[^\w\s]/g, ' ');
    const queryWords = cleanQ.split(/\s+/).filter((w: string) => w.length > 2);

    const stopWords = new Set(['cari', 'tentang', 'yang', 'pada', 'dan', 'atau', 'untuk', 'dari', 'oleh']);
    const meaningfulWords = queryWords.filter((w: string) => !stopWords.has(w));

    const scored = items.map((it: any) => {
      let score = 0;
      const haystack = `${it.namaFile} ${it.usulanNamaFile || ''} ${it.berkasJudul || ''} ${it.ringkasan || ''} ${(it.kataKunci || []).join(' ')} ${it.unitKerja || ''} ${it.tahapNama || ''} ${it.lokasiSimpan || ''}`.toLowerCase();

      // Exact phrase match
      if (haystack.includes(qLower)) {
        score += 15;
      }

      for (const w of meaningfulWords) {
        if (haystack.includes(w)) {
          score += 3;
        }
      }

      return { item: it, score };
    });

    const matched = scored
      .filter((s: any) => s.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((s: any) => ({
        ...s.item,
        alasanSingkat: `Memuat kecocokan istilah kearsipan pada dokumen tahap ${s.item.tahapNama || 'kegiatan'} dalam berkas "${s.item.berkasJudul || ''}".`,
      }));

    const durationMs = Date.now() - startTime;
    if (matched.length === 0) {
      return res.json({
        results: [],
        durationMs,
        message: 'Arsip tidak ditemukan di register.',
      });
    }

    return res.json({
      results: matched,
      durationMs,
      message: `Ditemukan ${matched.length} arsip terverifikasi di register.`,
    });
  } catch (err: any) {
    console.error('Error in search:', err);
    res.status(500).json({ error: err.message || 'Pencarian gagal diproses.' });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SiParida server running on port ${PORT}`);
  });
}

startServer();
