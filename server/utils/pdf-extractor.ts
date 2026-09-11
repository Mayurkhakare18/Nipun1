import zlib from 'zlib';

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
      error: 'Uploaded file is empty. Please provide a valid PDF document.',
      fileSizeBytes: 0,
    };
  }

  if (buffer.length > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 15MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      fileSizeBytes: buffer.length,
    };
  }

  if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .pdf documents are supported.',
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
 * Native Pure-JS fallback extractor for environments (e.g. Vercel Serverless) where
 * native or binary pdf-parse dependencies might encounter environment constraints.
 */
function extractPdfNatively(buffer: Buffer): { text: string; pageCount: number; pages: { text: string; num: number }[] } {
  const binaryContent = buffer.toString('binary');
  let extractedAll = '';
  const pages: { text: string; num: number }[] = [];

  // Count /Type /Page occurrences for estimated page count
  const pageMatches = binaryContent.match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? Math.max(1, pageMatches.length) : 1;

  // Extract all text inside streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryContent)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary');
    let streamText = '';

    try {
      streamText = zlib.inflateSync(rawStream).toString('utf8');
    } catch {
      try {
        streamText = zlib.inflateRawSync(rawStream).toString('utf8');
      } catch {
        streamText = rawStream.toString('utf8');
      }
    }

    // Extract BT ... ET blocks
    const btRegex = /BT[\s\S]*?ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(streamText)) !== null) {
      const block = btMatch[0];

      // Match (text) Tj
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        extractedAll += tjMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
      }

      // Match [(text)...] TJ
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let tjArrMatch: RegExpExecArray | null;
      while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
        const parts = tjArrMatch[1].match(/\((.*?)\)/g) || [];
        for (const p of parts) {
          extractedAll += p.slice(1, -1).replace(/\\([()\\])/g, '$1') + ' ';
        }
      }

      extractedAll += '\n';
    }
  }

  const cleaned = cleanExtractedText(extractedAll);
  pages.push({ text: cleaned, num: 1 });

  return {
    text: cleaned,
    pageCount,
    pages,
  };
}

/**
 * Dynamically resolves pdf-parse module only when needed.
 * Prevents module-import crashes in serverless runtime environments.
 */
let cachedPdfParser: any = null;
let parserResolutionAttempted = false;

async function getPdfParser(): Promise<any> {
  if (cachedPdfParser) return cachedPdfParser;
  if (parserResolutionAttempted) return null;

  parserResolutionAttempted = true;
  try {
    const mod = await import('pdf-parse');
    cachedPdfParser = mod.PDFParse || (mod as any).default?.PDFParse || (mod as any).default || mod;
    return cachedPdfParser;
  } catch (err1) {
    try {
      const { createRequire } = await import('module');
      const req = createRequire(import.meta.url);
      const mod2 = req('pdf-parse');
      cachedPdfParser = mod2.PDFParse || mod2.default || mod2;
      return cachedPdfParser;
    } catch (err2) {
      console.warn('[PDFExtractor] pdf-parse dynamic import unavailable, using native stream extractor');
      return null;
    }
  }
}

export interface HybridPageDetail {
  page: number;
  method: 'native' | 'ocr';
  text: string;
  charCount: number;
}

export interface HybridPdfExtractionResult {
  text: string;
  pageCount: number;
  nativePagesCount: number;
  ocrPagesCount: number;
  isScanned: boolean;
  pages: HybridPageDetail[];
  pageReferences: { page: number; point: string }[];
}

/**
 * Hybrid Page-by-Page PDF Text Extraction.
 * For each page:
 * 1. Checks native digital text.
 * 2. If character count >= 40, marks method = 'native'.
 * 3. If character count < 40 and OCR callback is provided, executes real OCR and marks method = 'ocr'.
 * 4. Merges all pages in original sequence:
 *    PAGE 1
 *    [text]
 *    PAGE 2
 *    [text]
 */
export async function extractHybridPdfText(
  buffer: Buffer,
  fileName: string,
  ocrCallback?: (buffer: Buffer, pageNumber?: number) => Promise<string>
): Promise<HybridPdfExtractionResult> {
  const validation = validatePdfBuffer(buffer, fileName);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid PDF document.');
  }

  let rawPagesList: Array<{ text: string; num: number }> = [];
  let detectedPageCount = 1;

  const Parser = await getPdfParser();

  if (Parser) {
    try {
      if (typeof Parser === 'function' && !Parser.prototype?.getText) {
        const v1Data = await Parser(buffer);
        detectedPageCount = v1Data.numpages || 1;
        rawPagesList = [{ text: v1Data.text || '', num: 1 }];
      } else if (typeof Parser === 'function' || Parser?.PDFParse) {
        const TargetClass = Parser.PDFParse || Parser;
        const parserInstance = new TargetClass({ data: buffer });
        try {
          const textRes = await parserInstance.getText();
          detectedPageCount = textRes.total || (Array.isArray(textRes.pages) ? textRes.pages.length : 1);
          if (Array.isArray(textRes.pages) && textRes.pages.length > 0) {
            rawPagesList = textRes.pages.map((p: any, idx: number) => ({
              text: typeof p === 'string' ? p : p.text || '',
              num: typeof p?.num === 'number' ? p.num : idx + 1,
            }));
          }
        } finally {
          if (typeof parserInstance.destroy === 'function') {
            await parserInstance.destroy();
          }
        }
      }
    } catch (parseErr) {
      console.warn('[PDFExtractor] pdf-parse threw error, switching to native stream extractor:', parseErr);
    }
  }

  // Fallback to native stream extractor if parser returned nothing
  if (rawPagesList.length === 0) {
    const nativeRes = extractPdfNatively(buffer);
    detectedPageCount = Math.max(detectedPageCount, nativeRes.pageCount);
    rawPagesList = nativeRes.pages;
  }

  const pageCount = Math.max(1, detectedPageCount, rawPagesList.length);

  // Check total native text across all pages to identify 100% scanned documents
  const totalNativeChars = rawPagesList.reduce(
    (acc, p) => acc + cleanExtractedText(p.text).replace(/\s/g, '').length,
    0
  );
  const isScannedDocument = totalNativeChars < 40;

  const processedPages: HybridPageDetail[] = [];
  let nativePagesCount = 0;
  let ocrPagesCount = 0;

  // If document is 100% scanned and an OCR callback is provided, we can run document-level OCR
  if (isScannedDocument && ocrCallback) {
    try {
      console.log(`[PDFExtractor] Scanned document detected (${fileName}). Invoking real multimodal OCR...`);
      const ocrResult = await ocrCallback(buffer);
      const cleanedOcr = cleanExtractedText(ocrResult);

      // Split by PAGE <number> if present, otherwise treat as page 1
      const pageSections = cleanedOcr.split(/(?:^|\n)PAGE\s+(\d+)[^\n]*\n/i);

      if (pageSections.length > 1) {
        for (let i = 1; i < pageSections.length; i += 2) {
          const pageNum = parseInt(pageSections[i], 10) || Math.floor(i / 2) + 1;
          const pageText = cleanExtractedText(pageSections[i + 1] || '');
          if (pageText.length > 0) {
            processedPages.push({
              page: pageNum,
              method: 'ocr',
              text: pageText,
              charCount: pageText.length,
            });
            ocrPagesCount++;
          }
        }
      }

      if (processedPages.length === 0 && cleanedOcr.length > 0) {
        processedPages.push({
          page: 1,
          method: 'ocr',
          text: cleanedOcr,
          charCount: cleanedOcr.length,
        });
        ocrPagesCount = 1;
      }
    } catch (ocrErr) {
      console.error('[PDFExtractor] Multimodal OCR failed on scanned document:', ocrErr);
    }
  } else {
    // Process page-by-page hybrid extraction
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const existingPage = rawPagesList.find((p) => p.num === pageNum) || rawPagesList[pageNum - 1];
      const nativeText = cleanExtractedText(existingPage?.text || '');
      const nonWhitespaceCount = nativeText.replace(/\s/g, '').length;

      // Threshold: 40 characters of genuine content distinguishes digital text from scan artefacts
      if (nonWhitespaceCount >= 40) {
        processedPages.push({
          page: pageNum,
          method: 'native',
          text: nativeText,
          charCount: nativeText.length,
        });
        nativePagesCount++;
      } else if (ocrCallback) {
        console.log(`[PDFExtractor] Page ${pageNum} has insufficient native text (${nonWhitespaceCount} chars). Invoking OCR...`);
        try {
          const pageOcr = await ocrCallback(buffer, pageNum);
          const cleanedPageOcr = cleanExtractedText(pageOcr);
          processedPages.push({
            page: pageNum,
            method: 'ocr',
            text: cleanedPageOcr || nativeText,
            charCount: (cleanedPageOcr || nativeText).length,
          });
          ocrPagesCount++;
        } catch (pageOcrErr) {
          console.warn(`[PDFExtractor] Page ${pageNum} OCR failed, keeping native text:`, pageOcrErr);
          processedPages.push({
            page: pageNum,
            method: 'native',
            text: nativeText,
            charCount: nativeText.length,
          });
          nativePagesCount++;
        }
      } else {
        processedPages.push({
          page: pageNum,
          method: 'native',
          text: nativeText,
          charCount: nativeText.length,
        });
        nativePagesCount++;
      }
    }
  }

  // If no pages were successfully processed, create fallback entry
  if (processedPages.length === 0) {
    processedPages.push({
      page: 1,
      method: 'native',
      text: '',
      charCount: 0,
    });
  }

  // Format combined text preserving exact page sequence
  const combinedText = processedPages
    .map((p) => `PAGE ${p.page}\n${p.text}`)
    .join('\n\n')
    .trim();

  // Build page references
  const pageReferences: { page: number; point: string }[] = [];
  processedPages.forEach((p) => {
    if (p.text) {
      const firstLine = p.text
        .split('\n')
        .find((l) => l.trim().length > 15 && !l.trim().startsWith('PAGE'));
      if (firstLine) {
        pageReferences.push({
          page: p.page,
          point: firstLine.slice(0, 100).trim(),
        });
      }
    }
  });

  return {
    text: combinedText,
    pageCount: processedPages.length,
    nativePagesCount,
    ocrPagesCount,
    isScanned: isScannedDocument,
    pages: processedPages,
    pageReferences,
  };
}

/**
 * Extracts text from PDF buffer using hybrid extractor.
 * Maintains backwards compatibility for existing call sites.
 */
export async function extractPdfText(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedPdfContent> {
  const result = await extractHybridPdfText(buffer, fileName);
  return {
    text: result.text,
    pageCount: result.pageCount,
    isScanned: result.isScanned,
    pageReferences: result.pageReferences,
  };
}
