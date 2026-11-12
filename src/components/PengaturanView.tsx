import React, { useState } from 'react';
import { PengaturanSistem } from '../types';
import {
  Settings,
  BookOpen,
  Code2,
  Cloud,
  Save,
  CheckCircle,
  FileText,
  Key,
  FolderTree,
  ShieldCheck,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { getAccessToken } from '../services/googleAuth';

interface PengaturanViewProps {
  settings: PengaturanSistem;
  onSaveSettings: (newSettings: PengaturanSistem) => void;
  googleUser?: User | null;
  onGoogleAuthChange?: (user: User | null) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  onSaveSettings,
  googleUser,
  onGoogleAuthChange,
}) => {
  const [activeTab, setActiveTab] = useState<'pengetahuan' | 'prompt' | 'gdocs'>('pengetahuan');
  const [currentSettings, setCurrentSettings] = useState<PengaturanSistem>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSaveSettings(currentSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Pengaturan Sistem & Sumber Pengetahuan Kearsipan
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Kelola pedoman tata kelola arsip dinas Kominfo, versi prompt AI, dan konfigurasi integrasi Google Docs
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan sistem dan sumber pengetahuan kearsipan berhasil diperbarui.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pengetahuan')}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pengetahuan'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Sumber Pengetahuan Kearsipan</span>
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'prompt'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Versi Prompt AI SiParida</span>
        </button>

        <button
          onClick={() => setActiveTab('gdocs')}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'gdocs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Sinkronisasi Google Docs</span>
        </button>
      </div>

      {/* Tab 1: Sumber Pengetahuan */}
      {activeTab === 'pengetahuan' && (
        <div className="space-y-6">
          {/* Klasifikasi Arsip Kominfo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Tabel Klasifikasi Kearsipan Dinas Kominfo
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Kode Klasifikasi</th>
                    <th className="py-2.5 px-3">Uraian / Jenis Arsip</th>
                    <th className="py-2.5 px-3">Retensi Aktif</th>
                    <th className="py-2.5 px-3">Retensi Inaktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentSettings.klasifikasiArsip.map((k, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600">{k.kode}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{k.nama}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{k.retensiAktif}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{k.retensiInaktif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aturan Penamaan & Kata Kunci */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Aturan Penamaan File Terstandar Kominfo
              </h2>
              <p className="text-xs text-slate-500">
                Pola baku yang digunakan AI untuk mengusulkan nama file yang tertib dan mudah dicari:
              </p>
              <input
                type="text"
                value={currentSettings.aturanPenamaanBaku}
                onChange={(e) =>
                  setCurrentSettings({ ...currentSettings, aturanPenamaanBaku: e.target.value })
                }
                className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
              />
              <div className="text-[11px] text-slate-500">
                Contoh hasil: <code className="font-mono text-blue-600 font-bold">T4_KA.04.01_B-01_LAPORAN_AUDIT_FINAL.PDF</code>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Kata Kunci Baku Kedeputian
              </h2>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {currentSettings.kataKunciBaku.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Templat Naskah Dinas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Templat Naskah Dinas Terintegrasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentSettings.templatNaskah.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{t.jenis}</span>
                    <span className="font-mono text-[10px] text-blue-600">{t.kode}</span>
                  </div>
                  <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {t.isiTemplat}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Versi Prompt AI */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Versi Prompt AI SiParida Aktif
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih versi prompt aktif yang mengarahkan sistem ekstraksi dokumen kearsipan
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {currentSettings.versiPromptAktif}
              </span>
            </div>

            <div className="space-y-3">
              {currentSettings.daftarVersiPrompt.map((vp) => {
                const isSelected = currentSettings.versiPromptAktif === vp.versi;
                return (
                  <div
                    key={vp.versi}
                    onClick={() =>
                      setCurrentSettings({ ...currentSettings, versiPromptAktif: vp.versi })
                    }
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {vp.versi}
                      </span>
                      <span className="text-slate-400 text-[11px]">{vp.tanggal}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {vp.catatan}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                      {vp.instruksi}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sinkronisasi Google Docs */}
      {activeTab === 'gdocs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Integrasi Google Workspace & Sinkronisasi Google Docs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dokumen kearsipan dinas terverifikasi disinkronkan secara otomatis ke Google Docs resmi dengan penamaan standar dan struktur folder per nomor berkas.
              </p>
            </div>

            {/* Google Account Authentication Status */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Akun Google Workspace Terhubung:
              </label>
              <GoogleSignInButton
                currentUser={googleUser || null}
                onAuthChange={onGoogleAuthChange}
                compact={false}
              />
            </div>

            {/* Permissions / Scopes info */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Izin Google Workspace Terverifikasi (OAuth Scopes Aktif):</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-blue-800 dark:text-blue-300 font-mono space-y-0.5 pl-1">
                <li>https://www.googleapis.com/auth/documents (Membuat dan memperbarui naskah dinas Google Docs)</li>
                <li>https://www.googleapis.com/auth/drive.file (Mengelola folder dan berkas kearsipan di Google Drive)</li>
              </ul>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mode Sinkronisasi Kearsipan *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer ${
                      currentSettings.modeSinkronisasi === 'Google Drive'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modeSinkronisasi"
                      value="Google Drive"
                      checked={currentSettings.modeSinkronisasi === 'Google Drive'}
                      onChange={() =>
                        setCurrentSettings({ ...currentSettings, modeSinkronisasi: 'Google Drive' })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Mode Google Docs & Drive Resmi</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                          Disarankan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Membuat dokumen Google Docs resmi secara langsung di cloud Google Workspace menggunakan OAuth 2.0.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer ${
                      currentSettings.modeSinkronisasi === 'Simulasi'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modeSinkronisasi"
                      value="Simulasi"
                      checked={currentSettings.modeSinkronisasi === 'Simulasi'}
                      onChange={() =>
                        setCurrentSettings({ ...currentSettings, modeSinkronisasi: 'Simulasi' })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Mode Simulasi (Offline / Uji Coba)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menghasilkan tautan Google Docs tiruan untuk demonstrasi tanpa memerlukan koneksi ke akun Google.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Folder Induk Kearsipan di Google Drive
                </label>
                <input
                  type="text"
                  value={currentSettings.folderRootDrive}
                  onChange={(e) =>
                    setCurrentSettings({ ...currentSettings, folderRootDrive: e.target.value })
                  }
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {/* Hierarchy Visualizer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span>Struktur Folder Kearsipan Google Drive:</span>
                </div>
                <pre className="font-mono text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                  📁 {currentSettings.folderRootDrive}/
                  {'\n'}   └── 📁 [Nomor_Berkas] B-01_Audit_Kearsipan_Internal/
                  {'\n'}       ├── 📁 01_Arsip_Perencanaan/
                  {'\n'}       ├── 📁 02_Dokumen_Kegiatan/
                  {'\n'}       ├── 📁 03_Dokumentasi_Kegiatan/
                  {'\n'}       ├── 📁 04_Laporan_dan_Hasil_Kegiatan/
                  {'\n'}       ├── 📁 05_Rekomendasi/
                  {'\n'}       ├── 📁 06_Tindak_Lanjut_Stakeholder/
                  {'\n'}       ├── 📁 07_Kendala/
                  {'\n'}       └── 📁 08_Mitigasi_Risiko/
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
