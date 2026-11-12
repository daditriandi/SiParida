/**
 * Security & PII Protection Utilities for SiParida
 * Enforces Kominfo data protection regulations and confidentiality rules.
 */

export const RESTRICTED_SECURITY_KEYWORDS = [
  'SANGAT RAHASIA',
  'RAHASIA',
  'TERBATAS',
] as const;

export interface SecurityCheckResult {
  isRestricted: boolean;
  restrictedTerm?: string;
  errorMessage?: string;
}

export interface PIIMaskingResult {
  sanitized: string;
  hasPII: boolean;
  nikCount: number;
  phoneCount: number;
}

/**
 * Checks if the text or filename contains restricted security classifications.
 * Documents with "RAHASIA", "SANGAT RAHASIA", or "TERBATAS" must reject AI processing.
 */
export function checkSecurityRestrictions(content: string, filename: string = ''): SecurityCheckResult {
  const combined = `${filename} ${content}`.toUpperCase();

  for (const term of RESTRICTED_SECURITY_KEYWORDS) {
    // Check if the term exists surrounded by non-alphanumeric chars or start/end
    const escaped = term.replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:[^A-Z0-9]|$)`, 'i');
    if (regex.test(combined)) {
      return {
        isRestricted: true,
        restrictedTerm: term,
        errorMessage: `Dokumen memuat klasifikasi pengamanan "${term}". Sesuai tata tertib kearsipan dan keamanan data Kominfo, dokumen tidak dapat diproses oleh AI. Silakan lengkapi kartu indeks secara manual.`,
      };
    }
  }

  return { isRestricted: false };
}

/**
 * Detects and masks Indonesian 16-digit NIK and Personal Phone Numbers.
 * NIK: 16 continuous digits -> keeps first 4 and last 2, masks 10 middle digits.
 * Phone: 08xx or +628xx -> masks middle digits.
 */
export function maskPII(text: string): PIIMaskingResult {
  if (!text) {
    return { sanitized: '', hasPII: false, nikCount: 0, phoneCount: 0 };
  }

  let nikCount = 0;
  let phoneCount = 0;

  // 1. Detect and mask 16-digit NIK (Nomor Induk Kependudukan)
  // Ensure word boundaries or non-digit surrounding
  const sanitizedNIK = text.replace(/(?<!\d)(\d{4})(\d{8})(\d{4})(?!\d)/g, (_m, p1, _mid, p2) => {
    nikCount += 1;
    return `${p1}********${p2}`;
  });

  // 2. Detect and mask Indonesian phone numbers (08xx or +628xx with optional dashes/spaces)
  const phoneRegex = /(?<!\w)(\+?62|0)8[1-9][0-9]{1,2}(?:[-.\s]?\d{3,4}){2}(?!\w)/g;
  const sanitized = sanitizedNIK.replace(phoneRegex, (match) => {
    phoneCount += 1;
    const clean = match.replace(/[-.\s]/g, '');
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-2);
    return `${prefix}****${suffix}`;
  });

  return {
    sanitized,
    hasPII: nikCount > 0 || phoneCount > 0,
    nikCount,
    phoneCount,
  };
}
