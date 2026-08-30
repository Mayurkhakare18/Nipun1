import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DocumentSummaryResult, QuizQuestion } from '../../types';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sample Official MoSPI Statistical Documents for instant testing
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
    setIsDocIntelligenceOpen,
    closeDocIntelligence,
    openQuiz,
    showNotification,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [targetCompetency, setTargetCompetency] = useState<string>('Official Statistics & Survey Methodology');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [summaryResult, setSummaryResult] = useState<DocumentSummaryResult | null>(null);
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
    // Validate file size limit (15MB serverless cap)
    if (file.size > 15 * 1024 * 1024) {
      showNotification('File Too Large', 'File exceeds 15MB serverless size limit. Please select a smaller document.', 'warning');
      return;
    }

    setSelectedFile(file);
    setDocumentTitle(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawContent = (event.target?.result as string) || '';

      if (file.name.toLowerCase().endsWith('.pdf')) {
        // PDF text extraction: Extract printable text chunks from PDF streams
        const textMatches = rawContent.match(/\(([^()]+)\)\s*T[jJ]/g) || rawContent.match(/BT[\s\S]*?ET/g);
        let extractedText = '';
        if (textMatches && textMatches.length > 0) {
          extractedText = textMatches.map((m) => m.replace(/[^a-zA-Z0-9\s.,;:()\-]/g, ' ')).join(' ');
        } else {
          // Fallback: clean raw ASCII printable characters
          extractedText = rawContent.replace(/[^\x20-\x7E\s]/g, ' ');
        }

        // Filter readable words
        const readableWords = extractedText
          .replace(/\s+/g, ' ')
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 2 && /^[a-zA-Z0-9_-]+$/.test(w));

        if (readableWords.length >= 15) {
          setDocumentText(readableWords.join(' '));
        } else {
          // Mark as empty text so scanned/unreadable PDF is rejected
          setDocumentText('');
        }
      } else {
        // Plain text / JSON / CSV
        setDocumentText(rawContent);
      }
    };

    reader.onerror = () => {
      setDocumentText('');
    };

    reader.readAsText(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_MOSPI_DOCUMENTS[0]) => {
    setSelectedFile(null);
    setDocumentTitle(preset.fileName);
    setDocumentText(preset.excerpt);
    setTargetCompetency(preset.competency);
  };

  const handleProcessDocument = async () => {
    if (!documentText.trim()) {
      showNotification('Extraction Failed', 'Text could not be extracted from this PDF.', 'warning');
      return;
    }

    setIsProcessing(true);
    setSummaryResult(null);

    try {
      const res = await api.summarizeAndGenerateFromDocument({
        fileName: documentTitle || 'MoSPI_Document.pdf',
        fileContent: documentText,
        competency: targetCompetency,
        difficulty,
        questionCount,
      });

      if (res.success && res.summary) {
        setSummaryResult(res.summary);
        showNotification(
          'Document Analyzed & Questions Generated',
          `Generated executive summary and ${res.summary.generatedQuestions.length} multiple choice questions.`,
          'success'
        );
      } else {
        showNotification('Extraction Warning', res.message || 'Text could not be extracted from this PDF.', 'warning');
      }
    } catch (err) {
      console.error('Failed to summarize document:', err);
      showNotification('Error', 'Failed to process document. Please try again.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunchAssessment = () => {
    if (summaryResult && summaryResult.generatedQuestions.length > 0) {
      closeDocIntelligence();
      openQuiz(targetCompetency);
    }
  };

  const handleCopySummary = () => {
    if (summaryResult) {
      const text = `=== MoSPI Statistical Document Intelligence Summary ===
Document: ${summaryResult.fileName}
Target Competency: ${targetCompetency}

EXECUTIVE SUMMARY:
${summaryResult.executiveSummary}

KEY METHODOLOGICAL POINTS:
${summaryResult.keyMethodologicalPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

CADRE IMPLICATIONS:
${summaryResult.cadreImplications}

GENERATED QUESTIONS COUNT: ${summaryResult.generatedQuestions.length}`;

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
  };

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
          <div className="bg-[#002147] text-white p-6 flex items-start justify-between relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fe9832] text-[#000a1e]">
                  AI DOCUMENT INTELLIGENCE
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                  PDF Summarizer &amp; Question Generator
                </span>
              </div>
              <h2 className="text-xl font-bold font-['Public_Sans',sans-serif]">
                Statistical Document Summarizer &amp; Question Generator
              </h2>
              <p className="text-xs text-white/80 max-w-xl">
                Upload official MoSPI reports, survey manuals, or technical notes to instantly extract executive takeaways and generate schema-validated diagnostic questions.
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
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
            {!summaryResult && (
              <>
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-[#c4c6cf]/40 pb-3">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-[#002147] text-white shadow-xs'
                        : 'bg-[#f0f3ff] text-[#002147] hover:bg-[#e4ebff]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom PDF / File</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preset')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'preset'
                        ? 'bg-[#002147] text-white shadow-xs'
                        : 'bg-[#f0f3ff] text-[#002147] hover:bg-[#e4ebff]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Select Official MoSPI Publication</span>
                  </button>
                </div>

                {/* TAB 1: FILE UPLOADER */}
                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#c4c6cf] hover:border-[#002147] bg-[#f9f9ff] hover:bg-[#f0f3ff] rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                        accept=".pdf,.txt,.docx,.json,.csv"
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#002147] flex items-center justify-center mx-auto shadow-xs border border-[#c4c6cf]/40">
                        <Upload className="w-6 h-6 text-[#fe9832]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#000a1e]">
                          {selectedFile ? selectedFile.name : 'Click to select or drag & drop PDF / text document'}
                        </p>
                        <p className="text-xs text-[#74777f] mt-1">
                          Supported formats: .pdf, .txt, .docx, .json, .csv (Max 15MB)
                        </p>
                      </div>
                      {selectedFile && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>File Ready ({Math.round(selectedFile.size / 1024)} KB)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: PRESET PUBLICATIONS */}
                {activeTab === 'preset' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#74777f]">
                      Choose an official MoSPI statistical report or technical manual for instant analysis:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRESET_MOSPI_DOCUMENTS.map((doc) => {
                        const isSelected = documentTitle === doc.fileName;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => handleSelectPreset(doc)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#002147] text-white border-[#002147] shadow-sm'
                                : 'bg-white text-[#111c2d] border-[#c4c6cf]/50 hover:border-[#002147]/40 hover:bg-[#f9f9ff]'
                            }`}
                          >
                            <div className="space-y-1">
                              <span
                                className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                  isSelected
                                    ? 'bg-[#fe9832] text-[#000a1e]'
                                    : 'bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40'
                                }`}
                              >
                                {doc.competency}
                              </span>
                              <h4 className="text-xs font-bold leading-snug line-clamp-2">{doc.title}</h4>
                            </div>
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected ? 'text-white/70' : 'text-[#74777f]'
                              }`}
                            >
                              {doc.fileName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Configuration Bar */}
                <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Competency Field */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#002147]">Target Competency:</label>
                    <input
                      type="text"
                      value={targetCompetency}
                      onChange={(e) => setTargetCompetency(e.target.value)}
                      placeholder="e.g. Survey Methodology"
                      className="w-full px-3 py-1.5 bg-white border border-[#c4c6cf]/60 rounded-xl text-xs text-[#000a1e] focus:outline-none focus:border-[#002147]"
                    />
                  </div>

                  {/* Difficulty Selector */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#002147]">Assessment Difficulty:</label>
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

            {/* PROCESSING LOADER */}
            {isProcessing && (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f0f3ff] text-[#002147] flex items-center justify-center mx-auto animate-spin">
                  <RotateCw className="w-8 h-8 text-[#fe9832]" />
                </div>
                <h3 className="text-lg font-bold text-[#000a1e] font-['Public_Sans',sans-serif]">
                  Analyzing Statistical Document &amp; Generating Assessment...
                </h3>
                <p className="text-xs text-[#44474e] max-w-md mx-auto">
                  Extracting methodological formulas, synthesizing executive summary, and formulating {questionCount} multiple choice questions strictly grounded in the text.
                </p>
              </div>
            )}

            {/* RESULTS VIEW */}
            {summaryResult && !isProcessing && (
              <div className="space-y-6">
                {/* Result Header Banner */}
                <div className="p-5 rounded-2xl bg-[#002147] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#fe9832]" />
                      <span className="text-xs font-bold text-[#fe9832] font-mono">
                        {summaryResult.fileName} ({summaryResult.fileSizeFormatted})
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-['Public_Sans',sans-serif]">
                      MoSPI Statistical Document Intelligence Report
                    </h3>
                  </div>

                  <button
                    onClick={handleCopySummary}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Copied to Clipboard' : 'Copy Full Summary'}</span>
                  </button>
                </div>

                {/* 1. Executive Summary */}
                <div className="p-5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 space-y-2">
                  <h4 className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fe9832]" />
                    <span>Executive Methodological Synthesis</span>
                  </h4>
                  <p className="text-xs text-[#111c2d] leading-relaxed whitespace-pre-line">
                    {summaryResult.executiveSummary}
                  </p>
                </div>

                {/* 2. Key Methodological Points & Standards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Key Methodological Takeaways</span>
                    </h4>
                    <ul className="text-xs text-[#44474e] space-y-2 list-disc pl-4 marker:text-[#002147]">
                      {summaryResult.keyMethodologicalPoints.map((pt, idx) => (
                        <li key={idx} className="leading-relaxed">{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-[#000a1e] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#002147]" />
                      <span>Cadre Implications &amp; Formulas</span>
                    </h4>
                    <p className="text-xs text-[#44474e] leading-relaxed">
                      {summaryResult.cadreImplications}
                    </p>
                    {summaryResult.extractedFormulasOrStandards && summaryResult.extractedFormulasOrStandards.length > 0 && (
                      <div className="pt-2 border-t border-[#c4c6cf]/30 space-y-1.5">
                        <span className="text-[10px] font-bold text-[#002147] uppercase tracking-wider">
                          Extracted Standards / Formulas:
                        </span>
                        {summaryResult.extractedFormulasOrStandards.map((form, fIdx) => (
                          <div key={fIdx} className="p-2 rounded-lg bg-[#f0f3ff] text-[11px] font-mono text-[#002147] border border-[#c4c6cf]/30">
                            {form}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Generated Multiple Choice Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#000a1e] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#fe9832]" />
                      <span>Generated AI Diagnostic Assessment ({summaryResult.generatedQuestions.length} Questions)</span>
                    </h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Validated Grounding
                    </span>
                  </div>

                  <div className="space-y-3">
                    {summaryResult.generatedQuestions.map((q, qIdx) => (
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
          <div className="bg-[#f9f9ff] border-t border-[#c4c6cf]/40 p-5 flex items-center justify-between gap-3">
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
                  <span>{isProcessing ? 'Processing...' : 'Summarize & Generate Questions'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSummaryResult(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#002147] hover:bg-[#f0f3ff] rounded-xl transition-colors cursor-pointer"
                >
                  Analyze Another Document
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleLaunchAssessment}
                    className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-[#fe9832]" />
                    <span>Take Timed Assessment Now</span>
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
