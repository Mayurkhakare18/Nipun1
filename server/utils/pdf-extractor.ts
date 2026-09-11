import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  fileSizeBytes: number;
}

export interface ExtractedPdfContent {
  text: string;
  pageCount: number;
  info?: any;
  isScanned: boolean;
  pageReferences?: { page: number; point: string }[];
}

/**
 * Validates PDF buffer for size, extension, and '%PDF-' magic bytes.
 */
export function validatePdfBuffer(buffer: Buffer, fileName: string): PdfValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'Uploaded file is empty or corrupted (0 bytes).',
      fileSizeBytes: 0,
    };
  }

  if (buffer.length > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${Math.round(buffer.length / (1024 * 1024))} MB) exceeds the 15MB limit.`,
      fileSizeBytes: buffer.length,
    };
  }

  const cleanName = (fileName || '').toLowerCase();
  if (!cleanName.endsWith('.pdf')) {
    return {
      valid: false,
      error: 'Invalid file extension. Only genuine PDF documents (.pdf) are permitted.',
      fileSizeBytes: buffer.length,
    };
  }

  // Verify PDF magic bytes: '%PDF' -> 0x25, 0x50, 0x44, 0x46
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x25 || // '%'
    buffer[1] !== 0x50 || // 'P'
    buffer[2] !== 0x44 || // 'D'
    buffer[3] !== 0x46    // 'F'
  ) {
    return {
      valid: false,
      error: 'Invalid PDF format: File header does not contain valid PDF magic bytes (%PDF).',
      fileSizeBytes: buffer.length,
    };
  }

  return {
    valid: true,
    fileSizeBytes: buffer.length,
  };
}

/**
 * Clean extracted PDF text by removing null bytes, normalizing whitespace, and stripping non-printable characters.
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    .replace(/\0/g, '') // remove null characters
    .replace(/\r\n/g, '\n') // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars except \t, \n
    .replace(/[ \t]+/g, ' ') // collapse multi-spaces
    .replace(/\n{3,}/g, '\n\n') // collapse multi-newlines
    .trim();
}

/**
 * Extracts text from PDF buffer using both v1 and v2 pdf-parse interfaces.
 * Detects scanned/image-only PDFs where no digital text stream exists.
 */
export async function extractPdfText(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedPdfContent> {
  const validation = validatePdfBuffer(buffer, fileName);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid PDF document.');
  }

  let extractedRawText = '';
  let pageCount = 1;
  let pagesList: Array<{ text: string; num: number }> = [];

  try {
    if (typeof pdfParseModule === 'function') {
      const v1Data = await pdfParseModule(buffer);
      extractedRawText = v1Data.text || '';
      pageCount = v1Data.numpages || 1;
    } else if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      try {
        const textRes = await parser.getText();
        extractedRawText = textRes.text || '';
        pageCount = textRes.total || (Array.isArray(textRes.pages) ? textRes.pages.length : 1);
        if (Array.isArray(textRes.pages)) {
          pagesList = textRes.pages;
        }
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    } else if (pdfParseModule?.default) {
      const v1Data = await pdfParseModule.default(buffer);
      extractedRawText = v1Data.text || '';
      pageCount = v1Data.numpages || 1;
    } else {
      throw new Error('No compatible PDF parser found in module exports.');
    }
  } catch (err: any) {
    console.error(`[PDF_PARSE_ERROR] Failed parsing "${fileName}":`, err?.message || String(err));
    throw new Error(`Failed to parse PDF document "${fileName}": ${err?.message || 'Corrupt PDF structure'}`);
  }

  const cleanedText = cleanExtractedText(extractedRawText);
  const wordTokens = cleanedText.split(/\s+/).filter((w) => w.length > 1);

  // Scanned / image-only detection:
  // If fewer than 40 characters or fewer than 6 recognizable words, document is scanned/image-based
  if (cleanedText.length < 40 || wordTokens.length < 6) {
    return {
      text: '',
      pageCount,
      isScanned: true,
    };
  }

  // Construct grounded page reference points from genuine page text
  const pageReferences: { page: number; point: string }[] = [];
  if (pagesList.length > 0) {
    for (const p of pagesList) {
      const pClean = cleanExtractedText(p.text || '');
      const firstLine = pClean.split('\n').find((l) => l.length > 25);
      if (firstLine) {
        pageReferences.push({
          page: p.num,
          point: firstLine.slice(0, 150),
        });
      }
    }
  } else {
    const lines = cleanedText.split('\n').filter((l) => l.length > 25);
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      pageReferences.push({
        page: Math.min(pageCount, Math.floor(i / 2) + 1),
        point: lines[i].slice(0, 150),
      });
    }
  }

  return {
    text: cleanedText,
    pageCount,
    isScanned: false,
    pageReferences,
  };
}
