import {
  BerkasKegiatan,
  DokumenArsip,
  RekomendasiItem,
  KendalaRisikoItem,
  LogAudit,
  PengaturanSistem,
  UserRole,
  UnitKerja,
} from '../types';
import {
  INITIAL_SETTINGS,
  SAMPLE_BERKAS,
  SAMPLE_DOKUMEN,
  SAMPLE_REKOMENDASI,
  SAMPLE_KENDALA_RISIKO,
  SAMPLE_AUDIT_LOGS,
} from './sampleData';
import { computeDossierCompleteness } from './calculations';

const STORAGE_KEYS = {
  VERSION: 'siparida_storage_version',
  BERKAS: 'siparida_berkas_v3',
  DOKUMEN: 'siparida_dokumen_v3',
  REKOMENDASI: 'siparida_rekomendasi_v3',
  RISIKO: 'siparida_risiko_v3',
  AUDIT_LOGS: 'siparida_audit_logs_v3',
  SETTINGS: 'siparida_settings_v3',
  CURRENT_ROLE: 'siparida_current_role_v3',
  CURRENT_UNIT: 'siparida_current_unit_v3',
};

// Safe JSON get/set
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load key ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save key ${key} to storage:`, e);
  }
}

export function initializeStorageIfNeeded(): void {
  const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  const needsReset = currentVersion !== 'v3';

  if (needsReset) {
    // Seed and synchronize dossiers with verified document statuses
    const syncedBerkas = SAMPLE_BERKAS.map((b) => {
      const { persentase, tahapanStatus, statusKelengkapan } = computeDossierCompleteness(
        b.id,
        SAMPLE_DOKUMEN,
        SAMPLE_REKOMENDASI,
        SAMPLE_KENDALA_RISIKO
      );
      return {
        ...b,
        persentaseKelengkapan: persentase,
        tahapanStatus,
        statusKelengkapan,
      };
    });

    saveToStorage(STORAGE_KEYS.BERKAS, syncedBerkas);
    saveToStorage(STORAGE_KEYS.DOKUMEN, SAMPLE_DOKUMEN);
    saveToStorage(STORAGE_KEYS.REKOMENDASI, SAMPLE_REKOMENDASI);
    saveToStorage(STORAGE_KEYS.RISIKO, SAMPLE_KENDALA_RISIKO);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, SAMPLE_AUDIT_LOGS);
    saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    saveToStorage(STORAGE_KEYS.CURRENT_ROLE, 'Sesdep');
    saveToStorage(STORAGE_KEYS.CURRENT_UNIT, 'Sekretaris Deputi');
    localStorage.setItem(STORAGE_KEYS.VERSION, 'v3');
    return;
  }

  if (!localStorage.getItem(STORAGE_KEYS.BERKAS)) {
    saveToStorage(STORAGE_KEYS.BERKAS, SAMPLE_BERKAS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOKUMEN)) {
    saveToStorage(STORAGE_KEYS.DOKUMEN, SAMPLE_DOKUMEN);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REKOMENDASI)) {
    saveToStorage(STORAGE_KEYS.REKOMENDASI, SAMPLE_REKOMENDASI);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RISIKO)) {
    saveToStorage(STORAGE_KEYS.RISIKO, SAMPLE_KENDALA_RISIKO);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, SAMPLE_AUDIT_LOGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE)) {
    saveToStorage(STORAGE_KEYS.CURRENT_ROLE, 'Sesdep');
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_UNIT)) {
    saveToStorage(STORAGE_KEYS.CURRENT_UNIT, 'Sekretaris Deputi');
  }
}

export function resetToSampleData(): void {
  saveToStorage(STORAGE_KEYS.BERKAS, SAMPLE_BERKAS);
  saveToStorage(STORAGE_KEYS.DOKUMEN, SAMPLE_DOKUMEN);
  saveToStorage(STORAGE_KEYS.REKOMENDASI, SAMPLE_REKOMENDASI);
  saveToStorage(STORAGE_KEYS.RISIKO, SAMPLE_KENDALA_RISIKO);
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, SAMPLE_AUDIT_LOGS);
  saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  saveToStorage(STORAGE_KEYS.CURRENT_ROLE, 'Sesdep');
  saveToStorage(STORAGE_KEYS.CURRENT_UNIT, 'Sekretaris Deputi');
  addAuditLog({
    pengguna: 'Riandi J. Sulistyono (Admin)',
    peran: 'Admin',
    aksi: 'Reset Data',
    detail: 'Mengembalikan seluruh data kegiatan, arsip, rekomendasi, dan risiko ke Data Contoh awal.',
  });
}

// Berkas CRUD
export function getBerkasKegiatan(): BerkasKegiatan[] {
  return loadFromStorage<BerkasKegiatan[]>(STORAGE_KEYS.BERKAS, SAMPLE_BERKAS);
}

export function saveBerkasKegiatan(items: BerkasKegiatan[]): void {
  saveToStorage(STORAGE_KEYS.BERKAS, items);
}

export function addOrUpdateBerkas(berkas: BerkasKegiatan): void {
  const all = getBerkasKegiatan();
  const index = all.findIndex((b) => b.id === berkas.id);
  if (index >= 0) {
    all[index] = berkas;
  } else {
    all.unshift(berkas);
  }
  saveBerkasKegiatan(all);
}

// Dokumen CRUD
export function getDokumenArsip(): DokumenArsip[] {
  return loadFromStorage<DokumenArsip[]>(STORAGE_KEYS.DOKUMEN, SAMPLE_DOKUMEN);
}

export function saveDokumenArsip(items: DokumenArsip[]): void {
  saveToStorage(STORAGE_KEYS.DOKUMEN, items);
}

export function addOrUpdateDokumen(doc: DokumenArsip): void {
  const all = getDokumenArsip();
  const index = all.findIndex((d) => d.id === doc.id);
  if (index >= 0) {
    all[index] = doc;
  } else {
    all.unshift(doc);
  }
  saveDokumenArsip(all);
  syncBerkasCompleteness(doc.berkasId);
}

// Rekomendasi CRUD
export function getRekomendasi(): RekomendasiItem[] {
  return loadFromStorage<RekomendasiItem[]>(STORAGE_KEYS.REKOMENDASI, SAMPLE_REKOMENDASI);
}

export function saveRekomendasi(items: RekomendasiItem[]): void {
  saveToStorage(STORAGE_KEYS.REKOMENDASI, items);
}

export function addOrUpdateRekomendasi(item: RekomendasiItem): void {
  const all = getRekomendasi();
  const index = all.findIndex((r) => r.id === item.id);
  if (index >= 0) {
    all[index] = item;
  } else {
    all.unshift(item);
  }
  saveRekomendasi(all);
  syncBerkasCompleteness(item.berkasId);
}

// Risiko CRUD
export function getKendalaRisiko(): KendalaRisikoItem[] {
  return loadFromStorage<KendalaRisikoItem[]>(STORAGE_KEYS.RISIKO, SAMPLE_KENDALA_RISIKO);
}

export function saveKendalaRisiko(items: KendalaRisikoItem[]): void {
  saveToStorage(STORAGE_KEYS.RISIKO, items);
}

export function addOrUpdateKendalaRisiko(item: KendalaRisikoItem): void {
  const all = getKendalaRisiko();
  const index = all.findIndex((k) => k.id === item.id);
  if (index >= 0) {
    all[index] = item;
  } else {
    all.unshift(item);
  }
  saveKendalaRisiko(all);
  syncBerkasCompleteness(item.berkasId);
}

// Synchronize dossier status & completeness percentage whenever child items change
export function syncBerkasCompleteness(berkasId: string): void {
  const allBerkas = getBerkasKegiatan();
  const target = allBerkas.find((b) => b.id === berkasId);
  if (!target) return;

  const docs = getDokumenArsip();
  const recs = getRekomendasi();
  const risks = getKendalaRisiko();

  const { persentase, tahapanStatus, statusKelengkapan } = computeDossierCompleteness(
    berkasId,
    docs,
    recs,
    risks
  );

  target.persentaseKelengkapan = persentase;
  target.tahapanStatus = tahapanStatus;
  target.statusKelengkapan = statusKelengkapan;
  target.updatedAt = new Date().toISOString();

  saveBerkasKegiatan(allBerkas);
}

// Audit Logs
export function getAuditLogs(): LogAudit[] {
  return loadFromStorage<LogAudit[]>(STORAGE_KEYS.AUDIT_LOGS, SAMPLE_AUDIT_LOGS);
}

export function addAuditLog(entry: Omit<LogAudit, 'id' | 'waktu'> & { id?: string; waktu?: string }): void {
  const all = getAuditLogs();
  const newEntry: LogAudit = {
    id: entry.id || `LOG-${Date.now().toString(36).toUpperCase()}`,
    waktu: entry.waktu || new Date().toISOString(),
    pengguna: entry.pengguna,
    peran: entry.peran,
    aksi: entry.aksi,
    detail: entry.detail,
    durasiMs: entry.durasiMs,
  };
  all.unshift(newEntry);
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, all.slice(0, 200)); // retain last 200 logs
}

// Settings
export function getSettings(): PengaturanSistem {
  return loadFromStorage<PengaturanSistem>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
}

export function saveSettings(settings: PengaturanSistem): void {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

// Role & Unit
export function getCurrentRole(): UserRole {
  return loadFromStorage<UserRole>(STORAGE_KEYS.CURRENT_ROLE, 'Sesdep');
}

export function setCurrentRole(role: UserRole): void {
  saveToStorage(STORAGE_KEYS.CURRENT_ROLE, role);
}

export function getCurrentUnit(): UnitKerja {
  return loadFromStorage<UnitKerja>(STORAGE_KEYS.CURRENT_UNIT, 'Sekretaris Deputi');
}

export function setCurrentUnit(unit: UnitKerja): void {
  saveToStorage(STORAGE_KEYS.CURRENT_UNIT, unit);
}
