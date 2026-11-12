import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskLevel, isDateOverdue, computeAverageRetrievalTime } from './calculations';
import { checkSecurityRestrictions, maskPII } from './security';
import { LogAudit } from '../types';

test('Security check rejects documents marked RAHASIA or SANGAT RAHASIA', () => {
  const result1 = checkSecurityRestrictions('Dokumen ini bersifat RAHASIA negara', 'laporan.pdf');
  assert.equal(result1.isRestricted, true);
  assert.equal(result1.restrictedTerm, 'RAHASIA');

  const result2 = checkSecurityRestrictions('Lampiran rapat koordinasi biasa', 'SURAT_TERBATAS_2026.docx');
  assert.equal(result2.isRestricted, true);
  assert.equal(result2.restrictedTerm, 'TERBATAS');

  const result3 = checkSecurityRestrictions('Dokumen terbuka publik untuk diseminasi', 'paparan.pdf');
  assert.equal(result3.isRestricted, false);
});

test('PII mask masks 16-digit NIK and personal phone numbers', () => {
  const textWithPII = 'Penanggung jawab Bapak Budi NIK: 3171012345670001 dan nomor HP 081234567890 telah hadir.';
  const masked = maskPII(textWithPII);

  assert.equal(masked.hasPII, true);
  assert.equal(masked.nikCount, 1);
  assert.equal(masked.phoneCount, 1);
  assert.ok(masked.sanitized.includes('3171********0001'));
  assert.ok(!masked.sanitized.includes('3171012345670001'));
  assert.ok(!masked.sanitized.includes('081234567890'));
});

test('calculateRiskLevel maps 5x5 matrix correctly', () => {
  // 1x1 -> 1 (Rendah)
  assert.deepEqual(calculateRiskLevel(1, 1), { skor: 1, tingkat: 'Rendah' });
  // 3x2 -> 6 (Sedang)
  assert.deepEqual(calculateRiskLevel(3, 2), { skor: 6, tingkat: 'Sedang' });
  // 3x4 -> 12 (Tinggi)
  assert.deepEqual(calculateRiskLevel(3, 4), { skor: 12, tingkat: 'Tinggi' });
  // 5x4 -> 20 (Ekstrem)
  assert.deepEqual(calculateRiskLevel(5, 4), { skor: 20, tingkat: 'Ekstrem' });
});

test('isDateOverdue detects past deadlines', () => {
  const pastDate = '2020-01-01';
  const futureDate = '2030-01-01';
  assert.equal(isDateOverdue(pastDate), true);
  assert.equal(isDateOverdue(futureDate), false);
});

test('computeAverageRetrievalTime calculates correctly and checks <= 30 mins target', () => {
  const mockLogs: LogAudit[] = [
    {
      id: '1',
      waktu: '2026-02-01',
      pengguna: 'Sesdep',
      peran: 'Sesdep',
      aksi: 'Pencarian Arsip',
      detail: 'Cari berkas audit',
      durasiMs: 1200,
    },
    {
      id: '2',
      waktu: '2026-02-01',
      pengguna: 'Sesdep',
      peran: 'Sesdep',
      aksi: 'Pencarian Arsip',
      detail: 'Cari monev',
      durasiMs: 800,
    },
  ];

  const result = computeAverageRetrievalTime(mockLogs);
  assert.equal(result.seconds, 1);
  assert.equal(result.meetsTarget, true);
});
