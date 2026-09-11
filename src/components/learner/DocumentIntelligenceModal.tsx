import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { QuizQuestion } from '../../types';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Layers,
  ArrowRight,
  Play,
  Download,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  RotateCw,
  Cpu,
  GraduationCap,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface StructuredDocumentSummaryState {
  documentTitle: string;
  executiveSummary: string;
  keyConcepts: string[];
  importantPoints: Array<{ page?: number; point: string }>;
  competenciesCovered: string[];
  practicalApplications: string[];
  importantDefinitions: Array<{ term: string; definition: string }>;
  keyTakeaways: string[];
  suggestedRevisionPoints: string[];
  suggestedAssessmentTopics: string[];
  generatedQuestions: QuizQuestion[];
  fileName: string;
  fileSizeFormatted: string;
  rawTextExcerpt?: string;
  pageCount?: number;
}

// Preset MoSPI Statistical Documents for reference/testing
const PRESET_MOSPI_DOCUMENTS = [
  {
    id: 'doc-plfs',
    title: 'Periodic Labour Force Survey (PLFS) Annual Report 2024-25 - Methodology & Sampling Frame',
    fileName: 'PLFS_Annual_Report_2024-25_Methodology.pdf',
    competency: 'Survey Methodology & Sampling Frame',
    excerpt: `The Periodic Labour Force Survey (PLFS) is designed to estimate key employment and unemployment indicators (Worker Population Ratio, Labour Force Participation Rate, Unemployment Rate) in both rural and urban areas. A rotational panel sampling design is used in urban areas where each selected household is visited four times with 25% rotation. Rural areas adopt a cross-sectional multi-stage stratified design where Census Villages act as Primary Sampling Units (PSUs) selected with Probability Proportional to Size (PPS) with replacement. Households within selected PSUs are stratified based on household members possessing educational attainments of secondary and above. Design multipliers W_hij are applied with non-response adjustment factors and calibrated to projected Census population figures.`,
  },
  {
    id: 'doc-sna',
    title: 'National Accounts Statistics: Gross Value Added & Supply-Use Table Compilation Manual (SNA 2008)',
    fileName: 'National_Accounts_SNA_2008_Compilation_Manual.pdf',
    competency: 'National Accounts (SNA 2008)',
    excerpt: `The National Accounts Division compiles Gross Value Added (GVA) at basic prices in conformity with the System of National Accounts (SNA 2008). GVA is derived as the difference between Gross Value of Output (GVO) and Intermediate Consumption (IC). For the manufacturing sector, double deflation is implemented using Wholesale Price Indices (WPI) for physical output and input commodity baskets. Financial Intermediation Services Indirectly Measured (FISIM) is calculated as the difference between interest rates on loans/deposits and the interbank reference rate, and is systematically allocated across consuming user sectors. Supply-Use Tables (SUT) are balanced using the RAS iterative proportional fitting algorithm.`,
  },
  {
    id: 'doc-sdc',
    title: 'MoSPI Microdata Dissemination Policy & Statistical Disclosure Control Standards (DPDP Act 2023)',
    fileName: 'MoSPI_Microdata_SDC_Guidelines_2026.pdf',
    competency: 'Statistical Disclosure Control & Privacy',
    excerpt: `To ensure maximum public research utility while strictly upholding respondent privacy under the Digital Personal Data Protection (DPDP) Act 2023 and the National Data Sharing & Accessibility Policy (NDSAP), all unit-level survey datasets must undergo automated Statistical Disclosure Control (SDC). Techniques include k-anonymity (k >= 5) on demographic quasi-identifiers (age, district code, religion, social group), top-coding of top 1% household consumption percentiles, microaggregation for continuous enterprise financials, and primary and secondary cell suppression on frequency tables with sample counts fewer than 5 observations.`,
  },
  {
    id: 'doc-cpi',
    title: 'Consumer Price Index (CPI) Technical Report: Scanner Data & Hedonic Quality Adjustments',
    fileName: 'CPI_Methodology_Hedonic_Regression_Note.pdf',
    competency: 'Price Statistics & Inflation Modeling',
    excerpt: `The Consumer Price Index (CPI) measures temporal changes in retail prices of a fixed basket of goods and services consumed by targeted population segments. In modernizing the price collection architecture, high-frequency digital scanner data and e-commerce price feeds are aggregated using the Jevons elementary aggregate formula. For electronics and durable goods subject to rapid technological turnover, hedonic quality adjustment regressions are fitted to isolate true price inflation from quality enhancements. Chain-weighted index linking is performed at annual intervals to minimize substitution bias.`,
  },
];

export const DocumentIntelligenceModal: React.FC = () => {
  const {
    isDocIntelligenceOpen,
    closeDocIntelligence,
    openQuiz,
    showNotification,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [targetCompetency, setTargetCompetency] = useState<string>('Official Statistics & Survey Methodology');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [pipelineState, setPipelineState] = useState<
    'IDLE' | 'UPLOADING' | 'EXTRACTING' | 'OCR_PROCESSING' | 'SUMMARIZING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<StructuredDocumentSummaryState | null>(null);
  const [extractionStats, setExtractionStats] = useState<{
    pageCount: number;
    nativePagesCount: number;
    ocrPagesCount: number;
    isScanned?: boolean;
  } | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isDocIntelligenceOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    setSummaryResult(null);
    setExtractionStats(null);

    // Validate file size limit (15MB serverless cap)
    if (file.size > 15 * 1024 * 1024) {
      showNotification('File Too Large', 'File exceeds 15MB limit. Please select a smaller document.', 'warning');
      return;
    }

    setSelectedFile(file);
    setDocumentTitle(file.name);

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    if (isPdf) {
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || '';
        const base64Content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setFileBase64(base64Content);
        setDocumentText(`[PDF Document: ${file.name} (${Math.round(file.size / 1024)} KB) - Ready for server extraction & Gemini summarization]`);
      };
      reader.onerror = () => {
        setFileBase64(null);
        setDocumentText('');
        setErrorMessage('Failed to read selected PDF file.');
        showNotification('File Read Error', 'Could not read selected PDF file.', 'warning');
      };
      reader.readAsDataURL(file);
    } else {
      setFileBase64(null);
      reader.onload = (event) => {
        const rawContent = (event.target?.result as string) || '';
        setDocumentText(rawContent);
      };
      reader.onerror = () => {
        setDocumentText('');
        setErrorMessage('Failed to read selected text file.');
        showNotification('File Read Error', 'Could not read selected text file.', 'warning');
      };
      reader.readAsText(file);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_MOSPI_DOCUMENTS[0]) => {
    setSelectedFile(null);
    setFileBase64(null);
    setErrorMessage(null);
    setExtractionStats(null);
    setDocumentTitle(preset.fileName);
    setDocumentText(preset.excerpt);
    setTargetCompetency(preset.competency);
  };

  const handleProcessDocument = async () => {
    if (!documentText.trim() && !fileBase64) {
      showNotification('Upload Missing', 'Please select or upload a document.', 'warning');
      return;
    }

    setErrorMessage(null);
    setSummaryResult(null);
    setExtractionStats(null);
    setPipelineState('UPLOADING');

    try {
      setPipelineState(fileBase64 ? 'EXTRACTING' : 'SUMMARIZING');

      const res = await api.summarizeAndGenerateFromDocument({
        fileName: documentTitle || 'MoSPI_Document.pdf',
        fileContent: fileBase64 ? undefined : documentText,
        fileBase64: fileBase64 || undefined,
        competency: targetCompetency,
        difficulty,
        questionCount,
      });

      if (res.success && res.summary) {
        setSummaryResult(res.summary);
        if ((res as any).extraction) {
          setExtractionStats((res as any).extraction);
        }
        setPipelineState('SUCCESS');
        showNotification(
          'Document Analyzed & Questions Generated',
          `Generated authoritative 10-section summary and ${res.summary.generatedQuestions?.length || 0} diagnostic questions.`,
          'success'
        );
      } else {
        const errText = (res as any).error || res.message || 'Could not analyze document.';
        setErrorMessage(errText);
        setPipelineState('ERROR');
        showNotification('Analysis Notice', errText, 'warning');
      }
    } catch (err: any) {
      console.error('Failed to summarize document:', err);
      const errText = err?.message || 'Failed to process document with Gemini AI.';
      setErrorMessage(errText);
      setPipelineState('ERROR');
      showNotification('Error', errText, 'warning');
    }
  };

  const handleLaunchAssessment = () => {
    if (summaryResult && summaryResult.generatedQuestions && summaryResult.generatedQuestions.length > 0) {
      closeDocIntelligence();
      openQuiz(targetCompetency);
    }
  };

  const handleCopySummary = () => {
    if (summaryResult) {
      const text = `=== MoSPI Statistical Document Intelligence Summary ===
Document: ${summaryResult.documentTitle || summaryResult.fileName}
File Name: ${summaryResult.fileName} (${summaryResult.fileSizeFormatted})
Target Competency: ${targetCompetency}

1. EXECUTIVE SUMMARY:
${summaryResult.executiveSummary}

2. KEY CONCEPTS:
${(summaryResult.keyConcepts || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}

3. IMPORTANT POINTS:
${(summaryResult.importantPoints || []).map((p, i) => `${i + 1}. [Page ${p.page || 1}] ${p.point}`).join('\n')}

4. COMPETENCIES COVERED:
${(summaryResult.competenciesCovered || []).join(', ')}

5. PRACTICAL APPLICATIONS:
${(summaryResult.practicalApplications || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}

6. KEY DEFINITIONS:
${(summaryResult.importantDefinitions || []).map((d) => `* ${d.term}: ${d.definition}`).join('\n')}

7. KEY TAKEAWAYS:
${(summaryResult.keyTakeaways || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}

8. SUGGESTED REVISION POINTS:
${(summaryResult.suggestedRevisionPoints || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

9. SUGGESTED ASSESSMENT TOPICS:
${(summaryResult.suggestedAssessmentTopics || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}

10. GENERATED QUESTIONS COUNT: ${summaryResult.generatedQuestions?.length || 0}`;

      navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  const handleClose = () => {
    closeDocIntelligence();
    setSummaryResult(null);
    setSelectedFile(null);
    setDocumentText('');
    setErrorMessage(null);
    setPipelineState('IDLE');
  };

  const isProcessing = pipelineState === 'UPLOADING' || pipelineState === 'EXTRACTING' || pipelineState === 'SUMMARIZING';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-4xl bg-white rounded-3xl border border-[#c4c6cf]/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-[#002147] text-white p-6 flex items-start justify-between relative overflow-hidden shrink-0">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fe9832] text-[#000a1e]">
                  AI DOCUMENT INTELLIGENCE
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                  Real PDF Text Extractor &amp; Gemini 3.5 Summarizer
                </span>
              </div>
              <h2 className="text-xl font-bold font-['Public_Sans',sans-serif]">
                Statistical Document Summarizer &amp; Question Generator
              </h2>
              <p className="text-xs text-white/80 max-w-xl">
                Upload genuine MoSPI statistical reports, survey manuals, or gazette notes. The server validates magic bytes, extracts authentic text, analyzes methodology via Gemini, and generates 10 structured sections with MCQs.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-0 w-64 h-64 bg-radial from-[#fe9832]/20 to-transparent blur-2xl pointer-events-none" />
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* ERROR / WARNING BANNER */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 flex items-start gap-3">
                <FileWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                    Document Processing Notice
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {errorMessage}
                  </p>
                  <div className="pt-2 text-[11px] text-amber-700 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/60">
                    💡 <strong>Guidance:</strong> NIPUN supports text PDFs, scanned/image-based PDFs, and mixed documents with automated hybrid OCR. Please ensure the document contains legible statistical reports or survey manuals.
                  </div>
                </div>
              </div>
            )}

            {/* CONFIGURATION & UPLOAD SECTION */}
            {!summaryResult && !isProcessing && (
              <>
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-[#c4c6cf]/30 pb-3">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'upload'
                        ? 'bg-[#002147] text-white shadow-xs'
                        : 'bg-[#f0f3ff] text-[#44474e] hover:bg-[#e4ebfc]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Genuine PDF Document</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('preset')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'preset'
                        ? 'bg-[#002147] text-white shadow-xs'
                        : 'bg-[#f0f3ff] text-[#44474e] hover:bg-[#e4ebfc]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official MoSPI Presets ({PRESET_MOSPI_DOCUMENTS.length})</span>
                  </button>
                </div>

                {/* Tab Content: Upload */}
                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#c4c6cf] hover:border-[#002147] p-8 rounded-2xl bg-[#f9f9ff] text-center space-y-3 cursor-pointer transition-all hover:bg-[#f0f3ff]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-[#f0f3ff] text-[#002147] flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-[#fe9832]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#000a1e]">
                          {selectedFile ? selectedFile.name : 'Click to upload or drag & drop genuine PDF file'}
                        </p>
                        <p className="text-[11px] text-[#74777f]">
                          Supports text-based PDF up to 15MB. Real magic byte validation (%PDF-) and scanned document detection enforced.
                        </p>
                      </div>
                      {selectedFile && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready for extraction: {Math.round(selectedFile.size / 1024)} KB</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Presets */}
                {activeTab === 'preset' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PRESET_MOSPI_DOCUMENTS.map((preset) => {
                      const isSelected = documentTitle === preset.fileName;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-[#f0f3ff] border-[#002147] shadow-xs'
                              : 'bg-white border-[#c4c6cf]/40 hover:border-[#002147]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#002147]/10 text-[#002147]">
                              {preset.competency}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#002147]" />}
                          </div>
                          <h4 className="font-bold text-[#000a1e] text-xs leading-snug line-clamp-2">
                            {preset.title}
                          </h4>
                          <p className="text-[11px] text-[#44474e] line-clamp-2">
                            {preset.excerpt}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Configuration Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/30">
                  {/* Competency Mapping */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#002147]">Target Competency:</label>
                    <select
                      value={targetCompetency}
                      onChange={(e) => setTargetCompetency(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs text-[#000a1e] focus:outline-none focus:border-[#002147]"
                    >
                      <option value="Official Statistics & Survey Methodology">Official Statistics &amp; Survey Methodology</option>
                      <option value="National Accounts (SNA 2008)">National Accounts (SNA 2008)</option>
                      <option value="Price Statistics & Inflation Modeling">Price Statistics &amp; Inflation Modeling</option>
                      <option value="Statistical Disclosure Control & Privacy">Statistical Disclosure Control &amp; Privacy</option>
                      <option value="Python Survey Microdata Cleaning">Python Survey Microdata Cleaning</option>
                    </select>
                  </div>

                  {/* Difficulty Selector */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#002147]">Question Difficulty:</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs text-[#000a1e] focus:outline-none focus:border-[#002147]"
                    >
                      <option value="Easy">Easy (Foundational)</option>
                      <option value="Medium">Medium (Applied Officer Level)</option>
                      <option value="Hard">Hard (Expert Methodological)</option>
                      <option value="Mixed">Mixed Calibration</option>
                    </select>
                  </div>

                  {/* Question Count Selector */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#002147]">Questions to Generate:</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs text-[#000a1e] focus:outline-none focus:border-[#002147]"
                    >
                      <option value={3}>3 Questions (Quick Diagnostic)</option>
                      <option value={5}>5 Questions (Standard Verification)</option>
                      <option value={8}>8 Questions (Comprehensive Paper)</option>
                      <option value={10}>10 Questions (Cadre Benchmark)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* PROCESSING PIPELINE LOADER */}
            {isProcessing && (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f0f3ff] text-[#002147] flex items-center justify-center mx-auto animate-spin">
                  <RotateCw className="w-8 h-8 text-[#fe9832]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#000a1e] font-['Public_Sans',sans-serif]">
                    {pipelineState === 'UPLOADING' && 'Uploading Document to Server...'}
                    {pipelineState === 'EXTRACTING' && 'Reading PDF & Extracting Text (Hybrid Native + OCR)...'}
                    {pipelineState === 'OCR_PROCESSING' && 'OCR Processing Scanned Pages...'}
                    {pipelineState === 'SUMMARIZING' && 'Gemini Generating 10-Section Summary & MCQs...'}
                  </h3>
                  <p className="text-xs text-[#44474e] max-w-md mx-auto">
                    {pipelineState === 'EXTRACTING' || pipelineState === 'OCR_PROCESSING'
                      ? 'Analyzing document pages: extracting digital character streams and executing multimodal OCR for scanned/image pages.'
                      : `Grounded AI analysis across official statistical standards, synthesizing 10 structured sections and ${questionCount} diagnostic MCQs.`}
                  </p>
                </div>
              </div>
            )}

            {/* STRUCTURED RESULTS VIEW (ALL 10 SECTIONS + QUESTIONS) */}
            {summaryResult && !isProcessing && (
              <div className="space-y-6">
                {/* Result Header Banner */}
                <div className="p-5 rounded-2xl bg-[#002147] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileCheck className="w-4 h-4 text-[#fe9832]" />
                      <span className="text-xs font-bold text-[#fe9832] font-mono">
                        {summaryResult.fileName} ({summaryResult.fileSizeFormatted})
                      </span>
                      {extractionStats && (
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                          {extractionStats.pageCount} pages processed — {extractionStats.nativePagesCount} text pages + {extractionStats.ocrPagesCount} OCR pages
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold font-['Public_Sans',sans-serif]">
                      {summaryResult.documentTitle || 'MoSPI Statistical Document Intelligence Report'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied' : 'Copy All 10 Sections'}</span>
                    </button>
                    <button
                      onClick={handleLaunchAssessment}
                      className="px-3.5 py-1.5 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Take Assessment</span>
                    </button>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <div className="p-5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 space-y-2">
                  <h4 className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fe9832]" />
                    <span>1. Executive Summary</span>
                  </h4>
                  <p className="text-xs text-[#111c2d] leading-relaxed whitespace-pre-line">
                    {summaryResult.executiveSummary}
                  </p>
                </div>

                {/* 2 & 3. Key Concepts & Important Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 2. Key Concepts */}
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#002147]" />
                      <span>2. Key Concepts</span>
                    </h4>
                    <ul className="text-xs text-[#44474e] space-y-1.5 list-disc pl-4 marker:text-[#002147]">
                      {(summaryResult.keyConcepts || []).map((concept, idx) => (
                        <li key={idx} className="leading-relaxed">{concept}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. Important Points with Page References */}
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>3. Important Points (Grounded Citations)</span>
                    </h4>
                    <ul className="text-xs text-[#44474e] space-y-2">
                      {(summaryResult.importantPoints || []).map((pt, idx) => (
                        <li key={idx} className="leading-relaxed flex items-start gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/30 shrink-0 mt-0.5">
                            Page {pt.page || 1}
                          </span>
                          <span>{pt.point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4 & 5. Competencies Covered & Practical Applications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 4. Competencies Covered */}
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#fe9832]" />
                      <span>4. Competencies / Topics Covered</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(summaryResult.competenciesCovered || []).map((comp, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#f0f3ff] text-[#002147] font-semibold text-xs border border-[#c4c6cf]/30">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5. Practical Applications */}
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#002147]" />
                      <span>5. Practical Applications</span>
                    </h4>
                    <ul className="text-xs text-[#44474e] space-y-1.5 list-disc pl-4 marker:text-[#002147]">
                      {(summaryResult.practicalApplications || []).map((app, idx) => (
                        <li key={idx} className="leading-relaxed">{app}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 6. Important Definitions */}
                {summaryResult.importantDefinitions && summaryResult.importantDefinitions.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#002147]" />
                      <span>6. Important Definitions</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {summaryResult.importantDefinitions.map((def, dIdx) => (
                        <div key={dIdx} className="p-3 rounded-xl bg-[#f9f9ff] border border-[#c4c6cf]/30 space-y-1">
                          <span className="font-bold text-[#002147] text-xs">{def.term}</span>
                          <p className="text-[11px] text-[#44474e] leading-relaxed">{def.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7, 8, 9. Key Takeaways, Revision Points & Assessment Topics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 7. Key Takeaways */}
                  <div className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-2 shadow-2xs">
                    <h5 className="font-bold text-[#000a1e] text-xs uppercase tracking-wider text-emerald-800">
                      7. Key Takeaways
                    </h5>
                    <ul className="text-[11px] text-[#44474e] space-y-1 list-disc pl-4 marker:text-emerald-600">
                      {(summaryResult.keyTakeaways || []).map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 8. Suggested Revision Points */}
                  <div className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-2 shadow-2xs">
                    <h5 className="font-bold text-[#000a1e] text-xs uppercase tracking-wider text-[#002147]">
                      8. Suggested Revision Points
                    </h5>
                    <ul className="text-[11px] text-[#44474e] space-y-1 list-disc pl-4 marker:text-[#002147]">
                      {(summaryResult.suggestedRevisionPoints || []).map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 9. Suggested Assessment Topics */}
                  <div className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-2 shadow-2xs">
                    <h5 className="font-bold text-[#000a1e] text-xs uppercase tracking-wider text-[#fe9832]">
                      9. Assessment Topics
                    </h5>
                    <ul className="text-[11px] text-[#44474e] space-y-1 list-disc pl-4 marker:text-[#fe9832]">
                      {(summaryResult.suggestedAssessmentTopics || []).map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 10. Generated Multiple Choice Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#000a1e] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#fe9832]" />
                      <span>10. Generated Assessment Questions ({summaryResult.generatedQuestions?.length || 0} Questions)</span>
                    </h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Strictly Grounded in Uploaded Text
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(summaryResult.generatedQuestions || []).map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/50 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#002147]">Question {qIdx + 1}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fe9832]/10 text-[#002147] border border-[#fe9832]/30">
                            {q.topic || targetCompetency}
                          </span>
                        </div>

                        <h5 className="text-xs sm:text-sm font-bold text-[#000a1e] leading-snug">
                          {q.question}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctAnswer;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                                    : 'bg-white text-[#44474e] border-[#c4c6cf]/40'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#f0f3ff] text-[#002147]'
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30 text-[11px] text-[#44474e] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Official Explanation:</strong> {q.explanation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-[#f9f9ff] border-t border-[#c4c6cf]/40 p-5 flex items-center justify-between gap-3 shrink-0">
            {!summaryResult ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessDocument}
                  disabled={isProcessing || !documentText.trim()}
                  className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#fe9832]" />
                  <span>
                    {isProcessing ? 'Processing Document...' : 'Extract & Generate 10-Section Intelligence'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSummaryResult(null);
                    setPipelineState('IDLE');
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer"
                >
                  Process Another Document
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLaunchAssessment}
                    className="px-6 py-2.5 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Launch Generated Assessment</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
