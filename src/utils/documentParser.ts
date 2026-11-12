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
      // Multimodal files -> convert to base64
      base64Data = await fileToBase64(file);
      textContent = `[File Multimodal: ${fileName} (${mimeType || ext}) - Ukuran: ${(fileSize / 1024).toFixed(0)} KB]`;
    } else {
      // PPTX or other formats that cannot be parsed automatically
      isUnsupported = true;
      unsupportedReason = `Format .${ext} tidak mendukung ekstraksi teks otomatis di peramban. File dan metadata tersimpan aman; silakan lengkapi kartu indeks secara manual.`;
      base64Data = await fileToBase64(file);
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
      // Strip metadata header e.g. "data:application/pdf;base64,"
      const base64 = res.split(',')[1] || res;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
  });
}
