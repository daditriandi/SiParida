import React, { useState, useEffect } from 'react';
import {
  UserRole,
  UnitKerja,
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  KendalaRisikoItem,
  LogAudit,
  PengaturanSistem,
  USER_ROLES,
  ROLE_AUTHORITIES,
} from './types';
import {
  initializeStorageIfNeeded,
  getBerkasKegiatan,
  getDokumenArsip,
  getRekomendasi,
  getKendalaRisiko,
  getAuditLogs,
  getSettings,
  saveSettings,
  getCurrentRole,
  setCurrentRole,
  getCurrentUnit,
  setCurrentUnit,
  resetToSampleData,
  addOrUpdateBerkas,
  addOrUpdateDokumen,
  relocateDokumenToBerkas,
  addOrUpdateRekomendasi,
  addAuditLog,
} from './utils/storage';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BerkasView } from './components/BerkasView';
import { BerkasDetailModal } from './components/BerkasDetailModal';
import { CreateBerkasModal } from './components/CreateBerkasModal';
import { UnggahView } from './components/UnggahView';
import { CariView } from './components/CariView';
import { RekomendasiView } from './components/RekomendasiView';
import { DrafPenagihanModal } from './components/DrafPenagihanModal';
import { VerifikasiView } from './components/VerifikasiView';
import { LaporanView } from './components/LaporanView';
import { PengaturanView } from './components/PengaturanView';
import { AuditLogView } from './components/AuditLogView';
import { DokumenPreviewModal } from './components/DokumenPreviewModal';
import { GoogleAuthGuideModal } from './components/GoogleAuthGuideModal';
import { VercelDomainModal } from './components/VercelDomainModal';
import { RoleAuthorityMatrixModal } from './components/RoleAuthorityMatrixModal';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentUser,
} from './services/googleAuth';
import {
  syncDokumenToGoogleDocs,
  syncDashboardToGoogleDocs,
  DashboardSyncData,
} from './services/googleDocs';
import { CheckCircle2, AlertCircle, Info, ExternalLink, X, HelpCircle, Globe } from 'lucide-react';

export default function App() {
  // Initialize storage
  useEffect(() => {
    initializeStorageIfNeeded();
  }, []);

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [currentRole, setRoleState] = useState<UserRole>(() => getCurrentRole());
  const [currentUnit, setUnitState] = useState<UnitKerja>(() => getCurrentUnit());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Google Workspace Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthGuideOpen, setIsAuthGuideOpen] = useState(false);
  const [isVercelDomainModalOpen, setIsVercelDomainModalOpen] = useState(false);
  const [isRoleMatrixModalOpen, setIsRoleMatrixModalOpen] = useState(false);
  const [isSyncingDashboard, setIsSyncingDashboard] = useState(false);
  const [lastSyncedDashboardUrl, setLastSyncedDashboardUrl] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    docUrl?: string;
    isUnauthorizedDomain?: boolean;
  } | null>(null);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Main data states
  const [berkasList, setBerkasList] = useState<BerkasKegiatan[]>(() => getBerkasKegiatan());
  const [dokumenList, setDokumenList] = useState<DokumenArsip[]>(() => getDokumenArsip());
  const [rekomendasiList, setRekomendasiList] = useState<RekomendasiItem[]>(() => getRekomendasi());
  const [risikoList, setRisikoList] = useState<KendalaRisikoItem[]>(() => getKendalaRisiko());
  const [auditLogs, setAuditLogs] = useState<LogAudit[]>(() => getAuditLogs());
  const [settings, setSettingsState] = useState<PengaturanSistem>(() => getSettings());

  // Modal states
  const [selectedBerkasDetailId, setSelectedBerkasDetailId] = useState<string | null>(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<DokumenArsip | null>(null);
  const [isCreateBerkasOpen, setIsCreateBerkasOpen] = useState(false);
  const [uploadPreselectedTahap, setUploadPreselectedTahap] = useState<number | undefined>(undefined);
  const [activeDrafRek, setActiveDrafRek] = useState<RekomendasiItem | null>(null);

  // Sync dark mode class
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleRoleChange = (role: UserRole) => {
    setRoleState(role);
    setCurrentRole(role);
    const authDef = ROLE_AUTHORITIES[role];
    if (authDef) {
      if (authDef.defaultUnit) {
        setUnitState(authDef.defaultUnit);
        setCurrentUnit(authDef.defaultUnit);
      }
      setCurrentPage(authDef.defaultPage as PageId);
    }
  };

  const handleUnitChange = (unit: UnitKerja) => {
    setUnitState(unit);
    setCurrentUnit(unit);
  };

  const refreshAllData = () => {
    setBerkasList(getBerkasKegiatan());
    setDokumenList(getDokumenArsip());
    setRekomendasiList(getRekomendasi());
    setRisikoList(getKendalaRisiko());
    setAuditLogs(getAuditLogs());
    setSettingsState(getSettings());
  };

  const handleResetData = () => {
    resetToSampleData();
    refreshAllData();
  };

  // Create Berkas Handler
  const handleSaveNewBerkas = (newBerkas: BerkasKegiatan) => {
    addOrUpdateBerkas(newBerkas);
    addAuditLog({
      pengguna: `Riandi J. Sulistyono (${currentRole})`,
      peran: currentRole,
      aksi: 'Buat Berkas',
      detail: `Membuat berkas rangkaian kegiatan baru: ${newBerkas.nomorBerkas} - ${newBerkas.judul}`,
    });
    refreshAllData();
    setSelectedBerkasDetailId(newBerkas.id);
  };

  // Upload Document Handler
  const handleDokumenUploaded = (doc: DokumenArsip, newRecs?: RekomendasiItem[]) => {
    addOrUpdateDokumen(doc);
    if (newRecs && newRecs.length > 0) {
      newRecs.forEach((r) => addOrUpdateRekomendasi(r));
    }
    addAuditLog({
      pengguna: doc.diunggahOleh,
      peran: currentRole,
      aksi: 'Unggah Dokumen',
      detail: `Mengunggah dokumen ${doc.namaFile} (Tahap ${doc.tahapId}) dengan kode ${doc.usulanKodeKlasifikasi}. Status: Menunggu Verifikasi.`,
    });
    refreshAllData();
  };

  // Approve Document Handler (Arsiparis)
  const handleApproveDokumen = (doc: DokumenArsip) => {
    addOrUpdateDokumen(doc);
    addAuditLog({
      pengguna: `${doc.diverifikasiOleh || 'Arsiparis'}`,
      peran: currentRole,
      aksi: 'Verifikasi Kartu',
      detail: `Menyetujui kartu indeks untuk dokumen ${doc.usulanNamaFile} (Kode ${doc.kodeKlasifikasi}). Status kini: Terverifikasi.`,
    });
    refreshAllData();
  };

  // Reject Document Handler (Arsiparis)
  const handleRejectDokumen = (doc: DokumenArsip, catatan: string) => {
    const rejectedDoc: DokumenArsip = {
      ...doc,
      statusVerifikasi: 'Ditolak',
      catatanVerifikasi: catatan,
      diverifikasiOleh: `Arsiparis (${currentRole})`,
      tanggalVerifikasi: new Date().toISOString(),
    };
    addOrUpdateDokumen(rejectedDoc);
    addAuditLog({
      pengguna: `Arsiparis (${currentRole})`,
      peran: currentRole,
      aksi: 'Tolak Kartu',
      detail: `Menolak kartu indeks dokumen ${doc.namaFile}. Alasan: ${catatan}`,
    });
    refreshAllData();
  };

  // Update Recommendation Handler
  const handleUpdateRekomendasi = (rek: RekomendasiItem) => {
    addOrUpdateRekomendasi(rek);
    addAuditLog({
      pengguna: `Pengguna (${currentRole})`,
      peran: currentRole,
      aksi: 'Ubah Status Rekomendasi',
      detail: `Memperbarui status rekomendasi ${rek.kode} menjadi "${rek.status}" dengan ${rek.arsipBuktiIds.length} arsip bukti terlampir.`,
    });
    refreshAllData();
  };

  // Relocate Document Handler (Koreksi Rumah Berkas / Unit Rekomendasi)
  const handleRelocateDokumen = (docId: string, newBerkasId: string) => {
    const res = relocateDokumenToBerkas(docId, newBerkasId);
    if (res.success && res.doc) {
      const targetBerkas = berkasList.find((b) => b.id === newBerkasId);
      addAuditLog({
        pengguna: `Riandi J. Sulistyono (${currentRole})`,
        peran: currentRole,
        aksi: 'Koreksi Rumah Berkas',
        detail: `Memindahkan dokumen ${res.doc.namaFile} ke rumah ${targetBerkas?.judul || newBerkasId} (${targetBerkas?.unitKerja}).`,
      });
      refreshAllData();
    }
  };

  // Sync Dokumen to Google Docs Handler
  const handleSyncDokumen = async (doc: DokumenArsip) => {
    try {
      let token = getAccessToken();
      if (!token) {
        try {
          const authRes = await googleSignIn();
          token = authRes.accessToken;
          setGoogleUser(authRes.user);
        } catch (authErr: any) {
          if (authErr?.code === 'auth/unauthorized-domain' || authErr?.message?.includes('unauthorized-domain')) {
            setIsVercelDomainModalOpen(true);
            setSyncToast({
              type: 'error',
              title: 'Domain Vercel Belum Terdaftar di Firebase',
              message: `Domain "${typeof window !== 'undefined' ? window.location.hostname : 'vercel.app'}" belum ditambahkan ke Authorized Domains di Firebase Console.`,
              isUnauthorizedDomain: true,
            });
            return;
          }
          if (authErr?.code === 'auth/popup-closed-by-user' || authErr?.code === 'auth/cancelled-popup-request') {
            setIsAuthGuideOpen(true);
            setSyncToast({
              type: 'info',
              title: 'Otorisasi Google Docs Ditunda',
              message:
                'Pada jendela Google yang muncul, klik tombol biru "Continue" (Lanjutkan) untuk mengizinkan pembuatan naskah kearsipan di Google Docs Anda.',
            });
            return;
          }
          throw authErr;
        }
      }

      const parentBerkas = berkasList.find((b) => b.id === doc.berkasId);
      const result = await syncDokumenToGoogleDocs(doc, parentBerkas, token, settings.folderRootDrive);

      if (result.success) {
        const updatedDoc: DokumenArsip = {
          ...doc,
          sinkronisasiDocs: {
            status: 'Tersinkron',
            mode: result.mode,
            docUrl: result.docUrl,
            lastSync: new Date().toISOString(),
          },
        };
        addOrUpdateDokumen(updatedDoc);
        addAuditLog({
          pengguna: `Riandi J. Sulistyono (${currentRole})`,
          peran: currentRole,
          aksi: 'Sinkronisasi Docs',
          detail: `Menyinkronkan dokumen ${doc.usulanNamaFile} ke Google Docs (${result.mode}). ID: ${result.documentId || '-'}`,
        });
        refreshAllData();
        setSyncToast({
          type: 'success',
          title: 'Berhasil Disinkronkan ke Google Docs!',
          message: `Naskah arsip "${doc.usulanNamaFile}" telah dibuat di Google Docs (${result.mode}).`,
          docUrl: result.docUrl,
        });
      } else {
        setSyncToast({
          type: 'error',
          title: 'Gagal Sinkronisasi Google Docs',
          message: result.error || 'Terjadi kesalahan saat memanggil Google Docs API.',
        });
      }
    } catch (err: any) {
      console.error('handleSyncDokumen error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsVercelDomainModalOpen(true);
        setSyncToast({
          type: 'error',
          title: 'Domain Vercel Belum Terdaftar di Firebase',
          message: `Domain "${typeof window !== 'undefined' ? window.location.hostname : 'vercel.app'}" belum ditambahkan ke Authorized Domains di Firebase Console.`,
          isUnauthorizedDomain: true,
        });
        return;
      }
      setSyncToast({
        type: 'error',
        title: 'Gagal Sinkronisasi Dokumen',
        message: err.message || 'Gagal menyinkronkan dokumen ke Google Docs.',
      });
    }
  };

  // Sync Dashboard Executive Summary to Google Docs Handler
  const handleSyncDashboard = async (data: DashboardSyncData) => {
    setIsSyncingDashboard(true);
    try {
      let token = getAccessToken();
      if (!token) {
        try {
          const authRes = await googleSignIn();
          token = authRes.accessToken;
          setGoogleUser(authRes.user);
        } catch (authErr: any) {
          if (authErr?.code === 'auth/unauthorized-domain' || authErr?.message?.includes('unauthorized-domain')) {
            setIsVercelDomainModalOpen(true);
            setSyncToast({
              type: 'error',
              title: 'Domain Vercel Belum Terdaftar di Firebase',
              message: `Domain "${typeof window !== 'undefined' ? window.location.hostname : 'vercel.app'}" belum ditambahkan ke Authorized Domains di Firebase Console.`,
              isUnauthorizedDomain: true,
            });
            return;
          }
          if (authErr?.code === 'auth/popup-closed-by-user' || authErr?.code === 'auth/cancelled-popup-request') {
            setIsAuthGuideOpen(true);
            setSyncToast({
              type: 'info',
              title: 'Otorisasi Google Belum Selesai',
              message:
                'Pada jendela Google yang muncul seperti di lampiran, klik tombol biru "Continue" untuk mengizinkan sinkronisasi Dashboard ke Google Docs.',
            });
            return;
          }
          throw authErr;
        }
      }

      const result = await syncDashboardToGoogleDocs(data, token);

      if (result.success) {
        setLastSyncedDashboardUrl(result.docUrl);
        addAuditLog({
          pengguna: `Riandi J. Sulistyono (${currentRole})`,
          peran: currentRole,
          aksi: 'Sinkronisasi Docs',
          detail: `Menyinkronkan Laporan Eksekutif Dashboard (${data.unitKerja}, ${data.periode}) ke Google Docs (${result.mode}).`,
        });
        refreshAllData();
        setSyncToast({
          type: 'success',
          title: 'Laporan Dashboard Berhasil Dibuat di Google Docs!',
          message: `Ringkasan eksekutif kearsipan 8 tahap & capaian KPI telah tersinkronkan ke Google Docs resmi (${result.mode}).`,
          docUrl: result.docUrl,
        });
      } else {
        setSyncToast({
          type: 'error',
          title: 'Gagal Sinkronisasi Dashboard',
          message: result.error || 'Terjadi kesalahan saat membuat laporan di Google Docs.',
        });
      }
    } catch (err: any) {
      console.error('handleSyncDashboard error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsVercelDomainModalOpen(true);
        setSyncToast({
          type: 'error',
          title: 'Domain Vercel Belum Terdaftar di Firebase',
          message: `Domain "${typeof window !== 'undefined' ? window.location.hostname : 'vercel.app'}" belum ditambahkan ke Authorized Domains di Firebase Console.`,
          isUnauthorizedDomain: true,
        });
        return;
      }
      setSyncToast({
        type: 'error',
        title: 'Gagal Sinkronisasi Dashboard',
        message: err.message || 'Gagal menyinkronkan dashboard ke Google Docs.',
      });
    } finally {
      setIsSyncingDashboard(false);
    }
  };

  // Record Search Audit
  const handleRecordSearchAudit = (searchQuery: string, durationMs: number) => {
    addAuditLog({
      pengguna: `Pengguna (${currentRole})`,
      peran: currentRole,
      aksi: 'Pencarian Arsip',
      detail: `Pencarian bahasa alami: "${searchQuery}"`,
      durasiMs: durationMs,
    });
    setAuditLogs(getAuditLogs());
  };

  // Save Settings
  const handleSaveSettings = (newSettings: PengaturanSistem) => {
    saveSettings(newSettings);
    setSettingsState(newSettings);
    addAuditLog({
      pengguna: `Riandi J. Sulistyono (Admin)`,
      peran: currentRole,
      aksi: 'Verifikasi Kartu',
      detail: 'Memperbarui sumber pengetahuan kearsipan dinas dan konfigurasi sistem SiParida.',
    });
    refreshAllData();
  };

  const pendingVerificationCount = dokumenList.filter(
    (d) => d.statusVerifikasi === 'Menunggu Verifikasi' || d.statusVerifikasi === 'Perlu Verifikasi Ulang'
  ).length;

  const overdueRecommendationCount = rekomendasiList.filter(
    (r) => r.isOverdue && r.status !== 'Sesuai'
  ).length;

  const currentBerkasDetail = berkasList.find((b) => b.id === selectedBerkasDetailId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        currentRole={currentRole}
        onResetData={handleResetData}
        pendingVerificationCount={pendingVerificationCount}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          currentUnit={currentUnit}
          onUnitChange={handleUnitChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          pendingVerificationCount={pendingVerificationCount}
          overdueRecommendationCount={overdueRecommendationCount}
          onNavigateToVerifikasi={() => setCurrentPage('verifikasi')}
          onNavigateToRekomendasi={() => setCurrentPage('rekomendasi')}
          googleUser={googleUser}
          onGoogleAuthChange={(user) => setGoogleUser(user)}
          onGoogleAuthError={(err) => {
            if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
              setIsVercelDomainModalOpen(true);
            }
          }}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {/* Role Helper Banner for Live Demo */}
          <div className="mb-6 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 dark:text-blue-200">
            <div className="flex items-center gap-2.5">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white shrink-0">
                Agen Aktif
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {ROLE_AUTHORITIES[currentRole]?.title || currentRole}
                </span>
                <span className="text-slate-600 dark:text-slate-300 ml-1.5 font-medium">
                  — {ROLE_AUTHORITIES[currentRole]?.fungsiUtama}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsRoleMatrixModalOpen(true)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>Matriks 5 Agent</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Page Routing */}
          {currentPage === 'dashboard' && (
            <DashboardView
              berkasList={berkasList}
              dokumenList={dokumenList}
              rekomendasiList={rekomendasiList}
              risikoList={risikoList}
              auditLogs={auditLogs}
              onOpenBerkas={(id) => setSelectedBerkasDetailId(id)}
              onNavigateToVerifikasi={() => setCurrentPage('verifikasi')}
              onNavigateToRekomendasi={() => setCurrentPage('rekomendasi')}
              onNavigateToUnggah={() => setCurrentPage('unggah')}
              onNavigateToCari={() => setCurrentPage('cari')}
              onSyncDashboard={handleSyncDashboard}
              googleUser={googleUser}
              onOpenAuthGuide={() => setIsAuthGuideOpen(true)}
              onOpenVercelGuide={() => setIsVercelDomainModalOpen(true)}
              isSyncingDashboard={isSyncingDashboard}
              lastSyncedDashboardUrl={lastSyncedDashboardUrl}
              currentRole={currentRole}
              onNavigateToLaporanTriwulan={() => setCurrentPage('laporan')}
              onOpenRoleMatrixModal={() => setIsRoleMatrixModalOpen(true)}
            />
          )}

          {currentPage === 'berkas' && (
            <BerkasView
              berkasList={berkasList}
              onOpenBerkas={(id) => setSelectedBerkasDetailId(id)}
              onCreateBerkas={() => setIsCreateBerkasOpen(true)}
              currentUnit={currentUnit}
            />
          )}

          {currentPage === 'unggah' && (
            <UnggahView
              berkasList={berkasList}
              dokumenList={dokumenList}
              onDokumenUploaded={handleDokumenUploaded}
              currentUser={{ inisial: 'RJS', role: currentRole }}
              preselectedTahap={uploadPreselectedTahap}
              onPreviewDokumen={(doc) => setSelectedPreviewDoc(doc)}
              onOpenBerkas={(id) => setSelectedBerkasDetailId(id)}
              onRelocateDokumen={handleRelocateDokumen}
            />
          )}

          {currentPage === 'cari' && (
            <CariView
              dokumenList={dokumenList}
              berkasList={berkasList}
              onPreviewDokumen={(doc) => setSelectedPreviewDoc(doc)}
              onOpenBerkas={(id) => setSelectedBerkasDetailId(id)}
              onRecordSearchAudit={handleRecordSearchAudit}
              currentUser={{ inisial: 'RJS', role: currentRole }}
            />
          )}

          {currentPage === 'rekomendasi' && (
            <RekomendasiView
              rekomendasiList={rekomendasiList}
              dokumenList={dokumenList}
              onUpdateRekomendasi={handleUpdateRekomendasi}
              onPreviewDokumenById={(docId) => {
                const found = dokumenList.find((d) => d.id === docId);
                if (found) setSelectedPreviewDoc(found);
              }}
            />
          )}

          {currentPage === 'verifikasi' && (
            <VerifikasiView
              dokumenList={dokumenList}
              berkasList={berkasList}
              onApproveDokumen={handleApproveDokumen}
              onRejectDokumen={handleRejectDokumen}
              onPreviewDokumen={(doc) => setSelectedPreviewDoc(doc)}
              currentUser={{ inisial: 'RJS', role: currentRole }}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanView
              berkasList={berkasList}
              dokumenList={dokumenList}
              rekomendasiList={rekomendasiList}
              risikoList={risikoList}
              onPreviewDokumen={(doc) => setSelectedPreviewDoc(doc)}
              onOpenBerkas={(id) => setSelectedBerkasDetailId(id)}
              currentRole={currentRole}
            />
          )}

          {currentPage === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              googleUser={googleUser}
              onGoogleAuthChange={(user) => setGoogleUser(user)}
            />
          )}

          {currentPage === 'audit' && (
            <AuditLogView logs={auditLogs} />
          )}
        </main>
      </div>

      {/* Berkas Detail Modal (8 Stages) */}
      {currentBerkasDetail && (
        <BerkasDetailModal
          berkas={currentBerkasDetail}
          dokumenList={dokumenList}
          rekomendasiList={rekomendasiList}
          risikoList={risikoList}
          onClose={() => setSelectedBerkasDetailId(null)}
          onPreviewDokumen={(doc) => setSelectedPreviewDoc(doc)}
          onUnggahTahap={(tahapId) => {
            setUploadPreselectedTahap(tahapId);
            setSelectedBerkasDetailId(null);
            setCurrentPage('unggah');
          }}
          onSyncDokumen={handleSyncDokumen}
          onCreateDrafPenagihan={(rek) => setActiveDrafRek(rek)}
        />
      )}

      {/* Create New Berkas Modal */}
      <CreateBerkasModal
        isOpen={isCreateBerkasOpen}
        onClose={() => setIsCreateBerkasOpen(false)}
        defaultUnit={currentUnit}
        onSave={handleSaveNewBerkas}
      />

      {/* Dokumen Preview Modal */}
      {selectedPreviewDoc && (
        <DokumenPreviewModal
          doc={selectedPreviewDoc}
          parentBerkas={berkasList.find((b) => b.id === selectedPreviewDoc.berkasId)}
          onClose={() => setSelectedPreviewDoc(null)}
          onSyncDokumen={handleSyncDokumen}
        />
      )}

      {/* Draf Penagihan Modal */}
      {activeDrafRek && (
        <DrafPenagihanModal
          rekomendasi={activeDrafRek}
          onClose={() => setActiveDrafRek(null)}
        />
      )}

      {/* Google Workspace OAuth Guidance Modal */}
      <GoogleAuthGuideModal
        isOpen={isAuthGuideOpen}
        onClose={() => setIsAuthGuideOpen(false)}
        googleUser={googleUser}
        onSignIn={async () => {
          const res = await googleSignIn();
          setGoogleUser(res.user);
        }}
      />

      {/* Vercel Domain Resolution Modal (auth/unauthorized-domain) */}
      <VercelDomainModal
        isOpen={isVercelDomainModalOpen}
        onClose={() => setIsVercelDomainModalOpen(false)}
      />

      {/* 5-Agent Authority Matrix Modal */}
      <RoleAuthorityMatrixModal
        isOpen={isRoleMatrixModalOpen}
        onClose={() => setIsRoleMatrixModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
      />

      {/* Google Docs Sync Feedback Toast */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl animate-fadeIn flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {syncToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {syncToast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            {syncToast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{syncToast.title}</h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{syncToast.message}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {syncToast.docUrl && (
                <a
                  href={syncToast.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Buka di Google Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {syncToast.isUnauthorizedDomain && (
                <button
                  onClick={() => {
                    setIsVercelDomainModalOpen(true);
                    setSyncToast(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Buka Solusi Vercel</span>
                </button>
              )}

              {syncToast.type === 'info' && !syncToast.isUnauthorizedDomain && (
                <button
                  onClick={() => {
                    setIsAuthGuideOpen(true);
                    setSyncToast(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Lihat Petunjuk Solusi</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setSyncToast(null)}
            aria-label="Tutup Pemberitahuan"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
