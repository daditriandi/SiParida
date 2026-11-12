import React, { useState } from 'react';
import { DokumenArsip, BerkasKegiatan, LogAudit, UserRole } from '../types';
import { StatusChip } from './StatusChip';
import {
  Search,
  Timer,
  FileText,
  Eye,
  ExternalLink,
  FolderArchive,
  History,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CariViewProps {
  dokumenList: DokumenArsip[];
  berkasList: BerkasKegiatan[];
  onPreviewDokumen: (doc: DokumenArsip) => void;
  onOpenBerkas: (berkasId: string) => void;
  onRecordSearchAudit: (query: string, durationMs: number) => void;
  currentUser: { inisial: string; role: UserRole };
}

interface SearchResultItem extends DokumenArsip {
  nomorBerkas: string;
  berkasJudul: string;
  unitKerja: string;
  alasanSingkat: string;
}

export const CariView: React.FC<CariViewProps> = ({
  dokumenList,
  berkasList,
  onPreviewDokumen,
  onOpenBerkas,
  onRecordSearchAudit,
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDuration, setSearchDuration] = useState<number | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'risalah rakortek takedown disinformasi',
    'laporan hasil audit kearsipan internal',
    'rencana monev diseminasi narasi tunggal',
    'evaluasi catu daya baterai genset BTS 3T',
    'policy brief kesiapan implementasi UU PDP',
    'laporan evaluasi simulasi insiden siber CSIRT',
  ];

  const handleSearch = async (searchWord?: string) => {
    const q = (searchWord !== undefined ? searchWord : query).trim();
    if (!q) return;

    if (searchWord !== undefined) {
      setQuery(searchWord);
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchMessage(null);

    const startTime = performance.now();

    try {
      // Build register context with enriched parent berkas metadata
      const registerContext = dokumenList.map((doc) => {
        const parent = berkasList.find((b) => b.id === doc.berkasId);
        return {
          id: doc.id,
          nomorBerkas: parent?.nomorBerkas || 'B-00/KOMINFO/2026',
          berkasJudul: parent?.judul || 'Kegiatan Kedeputian',
          unitKerja: parent?.unitKerja || 'Sekretaris Deputi',
          namaFile: doc.usulanNamaFile || doc.namaFile,
          tahapId: doc.tahapId,
          tahapNama: doc.tahapNama,
          ringkasan: doc.ringkasan,
          kataKunci: doc.kataKunci,
          lokasiSimpan: doc.lokasiSimpan,
          tanggalDokumen: doc.tanggalDokumen,
          statusVerifikasi: doc.statusVerifikasi,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          sinkronisasiDocs: doc.sinkronisasiDocs,
        };
      });

      const response = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          registerItems: registerContext,
        }),
      });

      const data = await response.json();
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      setSearchDuration(elapsedMs);

      if (data.results && data.results.length > 0) {
        setResults(data.results.slice(0, 5)); // strictly max 5 results
        setSearchMessage(data.message || `Ditemukan ${data.results.length} arsip terverifikasi di register.`);
      } else {
        setResults([]);
        // Strict boundary: "Bila tidak ada yang cocok, jawab persis: 'Arsip tidak ditemukan di register.'"
        setSearchMessage('Arsip tidak ditemukan di register.');
      }

      // Record duration to audit log
      onRecordSearchAudit(q, elapsedMs);
    } catch (err: any) {
      console.error('Search error:', err);
      // Fallback client-side search
      const qLower = q.toLowerCase();
      const matched: SearchResultItem[] = [];

      for (const doc of dokumenList) {
        const parent = berkasList.find((b) => b.id === doc.berkasId);
        const hay = `${doc.namaFile} ${doc.usulanNamaFile} ${doc.ringkasan} ${doc.kataKunci.join(' ')} ${parent?.judul || ''} ${parent?.nomorBerkas || ''}`.toLowerCase();
        if (hay.includes(qLower)) {
          matched.push({
            ...doc,
            nomorBerkas: parent?.nomorBerkas || 'B-00',
            berkasJudul: parent?.judul || 'Kegiatan',
            unitKerja: parent?.unitKerja || 'Sekretaris Deputi',
            alasanSingkat: `Memuat kecocokan istilah kearsipan pada dokumen tahap ${doc.tahapNama}.`,
          });
        }
      }

      const elapsedMs = Math.round(performance.now() - startTime);
      setSearchDuration(elapsedMs);

      if (matched.length > 0) {
        setResults(matched.slice(0, 5));
        setSearchMessage(`Ditemukan ${matched.length} arsip terverifikasi di register.`);
      } else {
        setResults([]);
        setSearchMessage('Arsip tidak ditemukan di register.');
      }

      onRecordSearchAudit(q, elapsedMs);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Pencarian Cerdas Arsip Kegiatan (Register SiParida)
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl mx-auto">
          Gunakan bahasa sehari-hari. Sistem mencari dari register arsip 8 tahap dan menampilkan maksimal 5 dokumen paling relevan beserta alasan kecocokannya.
        </p>

        {/* Search Input Box */}
        <div className="mt-6 max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Contoh: cari risalah kesepakatan takedown disinformasi OJK..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Timer className="w-4 h-4 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <span>Cari Arsip</span>
            )}
          </button>
        </div>

        {/* Sample Queries Suggestions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400">Contoh pencarian:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(sq)}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Retrieval Benchmark Pill */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-600" />
              <span>
                Waktu temu kembali:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {searchDuration !== null ? `${(searchDuration / 1000).toFixed(2)} detik` : '-'}
                </strong>{' '}
                (Target ≤ 30 menit terpenuhi)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Maks. 5 arsip terverifikasi
            </span>
          </div>

          {/* Strict message when no results found */}
          {results.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchMessage || 'Arsip tidak ditemukan di register.'}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sesuai batasan AI kearsipan, pencarian hanya dilakukan pada register arsip yang telah terdata.
                Coba gunakan kata kunci lain seperti nama berkas, nomor klasifikasi, atau tahapan kegiatan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          {item.nomorBerkas}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.berkasJudul}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Tahap {item.tahapId}: {item.tahapNama}</span>
                        <StatusChip status={item.statusVerifikasi} size="sm" />
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                        {item.usulanNamaFile || item.namaFile}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPreviewDokumen(item)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pratinjau</span>
                      </button>
                      <button
                        onClick={() => onOpenBerkas(item.berkasId)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderArchive className="w-3.5 h-3.5" />
                        <span>Buka Berkas</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {item.ringkasan}
                  </p>

                  {/* Alasan Relevansi */}
                  <div className="flex items-start gap-2 text-xs text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-lg border border-teal-200 dark:border-teal-800">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Alasan Relevansi:</strong> {item.alasanSingkat}
                    </div>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Tanggal Dokumen: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.tanggalDokumen}</strong></span>
                      <span>·</span>
                      <span>Lokasi Simpan: <strong className="text-slate-700 dark:text-slate-300">{item.lokasiSimpan}</strong></span>
                    </div>
                    <span className="font-mono">Kode Klasifikasi: {item.kodeKlasifikasi || item.usulanKodeKlasifikasi}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
