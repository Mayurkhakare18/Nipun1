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

/**
 * Extracts text from PDF buffer using both v1 and v2 pdf-parse interfaces,
 * with pure-JS stream extraction fallback.
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

  const Parser = await getPdfParser();

  if (Parser) {
    try {
      if (typeof Parser === 'function' && !Parser.prototype?.getText) {
        const v1Data = await Parser(buffer);
        extractedRawText = v1Data.text || '';
        pageCount = v1Data.numpages || 1;
      } else if (typeof Parser === 'function' || Parser?.PDFParse) {
        const TargetClass = Parser.PDFParse || Parser;
        const parserInstance = new TargetClass({ data: buffer });
        try {
          const textRes = await parserInstance.getText();
          extractedRawText = textRes.text || '';
          pageCount = textRes.total || (Array.isArray(textRes.pages) ? textRes.pages.length : 1);
          if (Array.isArray(textRes.pages)) {
            pagesList = textRes.pages;
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

  // If pdf-parse failed or returned no text, run native stream extractor
  if (!extractedRawText || extractedRawText.trim().length === 0) {
    const nativeRes = extractPdfNatively(buffer);
    extractedRawText = nativeRes.text;
    pageCount = Math.max(pageCount, nativeRes.pageCount);
    if (pagesList.length === 0) {
      pagesList = nativeRes.pages;
    }
  }

  const cleanedText = cleanExtractedText(extractedRawText);

  // Scanned / Image-Only PDF Detection:
  // If fewer than 30 non-whitespace characters exist, the PDF is an image-only / scanned document.
  const isScanned = cleanedText.length < 30;

  // Build page reference index
  const pageReferences: { page: number; point: string }[] = [];
  if (pagesList.length > 0) {
    pagesList.forEach((p, idx) => {
      const pageNum = p.num || idx + 1;
      const firstLine = p.text
        ? cleanExtractedText(p.text)
            .split('\n')
            .find((l) => l.length > 15)
        : undefined;
      if (firstLine) {
        pageReferences.push({
          page: pageNum,
          point: firstLine.slice(0, 100).trim(),
        });
      }
    });
  } else if (!isScanned) {
    // Generate logical chunks for references
    const paragraphs = cleanedText.split('\n\n').filter((p) => p.length > 20);
    paragraphs.slice(0, 8).forEach((p, idx) => {
      pageReferences.push({
        page: Math.floor(idx / 2) + 1,
        point: p.slice(0, 90).trim(),
      });
    });
  }

  return {
    text: cleanedText,
    pageCount: Math.max(1, pageCount),
    isScanned,
    pageReferences,
  };
}
