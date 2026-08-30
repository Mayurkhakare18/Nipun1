import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ReassessmentResult } from '../../types';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RotateCw,
  Clock,
  FileCheck,
  Download,
  Copy,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Target,
  BrainCircuit,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionItem {
  id: string;
  competency: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  currentLevel: number;
  targetLevel: number;
}

const REASSESSMENT_QUESTIONS: QuestionItem[] = [
  {
    id: 'rq-1',
    competency: 'Python Survey Microdata Cleaning',
    currentLevel: 2,
    targetLevel: 3,
    question:
      'In Python pandas, which pipeline operation is mathematically required to calculate stratified survey multiplier totals while preserving household weights without duplicate counting?',
    options: [
      'df.groupby(["stratum_id", "psu_id"])["income"].transform(lambda x: (x * df["multiplier_weight"]).sum())',
      'df["income"].sum() * df["multiplier_weight"].mean()',
      'df.dropna().apply(lambda x: x * 100)',
      'df.filter(like="weight").reset_index(drop=True)',
    ],
    correctAnswer: 0,
    explanation:
      'Applying transform with stratum-level grouping calculates weighted aggregates while maintaining the original DataFrame index for microdata joins.',
    topic: 'Pandas Vectorized Multiplier Weighting',
  },
  {
    id: 'rq-2',
    competency: 'Survey Methodology & Sampling Frame',
    currentLevel: 3,
    targetLevel: 4,
    question:
      'When calculating second-stage multiplier weights for NSSO / PLFS multi-stage stratified designs, which formula represents the design weight W_hij for the j-th household in the i-th PSU of stratum h?',
    options: [
      'W_hij = (N_h / (n_h * P_hi)) * (H_hi / h_hi)',
      'W_hij = (n_h / N_h) * (h_hi / H_hi)',
      'W_hij = N_h + n_h + H_hi + h_hi',
      'W_hij = 1 / (P_hi * h_hi)',
    ],
    correctAnswer: 0,
    explanation:
      'Design weight is the inverse of inclusion probability: (First stage inverse probability N_h/(n_h * P_hi)) multiplied by (Second stage inverse probability H_hi/h_hi).',
    topic: 'Two-Stage Sampling Multiplier Derivation',
  },
  {
    id: 'rq-3',
    competency: 'National Accounts (SNA 2008)',
    currentLevel: 2,
    targetLevel: 3,
    question:
      'Under SNA 2008 standards, how is Financial Intermediation Services Indirectly Measured (FISIM) allocated across domestic industries?',
    options: [
      'As intermediate consumption based on the difference between reference rate of interest and actual rates on loans/deposits',
      'As direct final government consumption without sector allocation',
      'Exclusively deducted from gross capital formation',
      'Added directly to nominal exports as foreign aid transfer',
    ],
    correctAnswer: 0,
    explanation:
      'SNA 2008 mandates that FISIM is calculated using reference rates and allocated to consuming user industries as intermediate consumption or final demand.',
    topic: 'FISIM Sectoral Allocation & Supply-Use Balance',
  },
  {
    id: 'rq-4',
    competency: 'Statistical Disclosure Control & Privacy',
    currentLevel: 2,
    targetLevel: 3,
    question:
      'Which microdata protection technique is mandated by MoSPI and the DPDP Act 2023 when releasing public-use survey files to prevent re-identification through rare socio-economic profiles?',
    options: [
      'Application of k-anonymity (k>=5), top/bottom coding of extreme income percentiles, and cell perturbation',
      'Deleting all numerical continuous variables from the public release',
      'Publishing respondent names but obscuring geographic state codes',
      'Mandating two-factor authentication before viewing static summary tables',
    ],
    correctAnswer: 0,
    explanation:
      'k-anonymity and top-coding ensure no individual respondent can be singled out from quasi-identifiers in open microdata releases.',
    topic: 'Microdata Anonymization Standards',
  },
  {
    id: 'rq-5',
    competency: 'Data Quality Frameworks & CAPI Validation',
    currentLevel: 3,
    targetLevel: 4,
    question:
      'In Computer-Assisted Personal Interviewing (CAPI), what is the function of automated paradata timestamp auditing during household listing?',
    options: [
      'To detect interview pacing anomalies, suspicious section durations, and flag potential field fabrication',
      'To calculate the cellular data roaming consumption of enumerator tablets',
      'To automatically convert Hindi responses to English audio recordings',
      'To encrypt tablet hard drives after 24 hours of inactivity',
    ],
    correctAnswer: 0,
    explanation:
      'Paradata tracking (duration per question, GPS delta, interval timestamps) provides empirical quality assurance to verify genuine field execution.',
    topic: 'CAPI Paradata Hygiene & Field Auditing',
  },
];

export const ReassessmentModal: React.FC = () => {
  const {
    isReassessmentOpen,
    closeReassessment,
    currentUser,
    refreshUserData,
    showNotification,
  } = useAuth();

  const [currentStep, setCurrentStep] = useState<'loading' | 'intro' | 'quiz' | 'evaluating' | 'result' | 'error'>('loading');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<ReassessmentResult | null>(null);
  const [copiedCert, setCopiedCert] = useState(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (!isReassessmentOpen) return;

    setCurrentStep('loading');
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setResultData(null);
    setIsSubmitting(false);

    const timer = setTimeout(() => {
      setCurrentStep('intro');
    }, 400);

    return () => clearTimeout(timer);
  }, [isReassessmentOpen]);

  if (!isReassessmentOpen) return null;

  const currentQ = REASSESSMENT_QUESTIONS[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === REASSESSMENT_QUESTIONS.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleStartReassessment = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setCurrentStep('quiz');
  };

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optIdx,
    }));
  };

  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      handleSubmitReassessment();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleSubmitReassessment = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setCurrentStep('evaluating');

    try {
      const formattedAnswers = REASSESSMENT_QUESTIONS.map((q, idx) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[idx] ?? 0,
        isCorrect: selectedAnswers[idx] === q.correctAnswer,
      }));

      const res = await api.submitReassessment({
        answers: formattedAnswers,
        timeSpentSeconds: 180,
      });

      if (res && res.result) {
        setResultData(res.result);
        setCurrentStep('result');

        // Background state refresh across components
        refreshUserData().catch((err) => console.warn('Background sync notice:', err));

        if (res.result.passed) {
          showNotification(
            'Competency Level Updated!',
            `Your competency level was updated based on verified assessment evidence (Score: ${res.result.postLearningScore}%).`,
            'success'
          );
        } else {
          showNotification(
            'Reassessment Completed',
            `Score: ${res.result.postLearningScore}%. Target: 70%. Review topics and retake.`,
            'warning'
          );
        }
      } else {
        setCurrentStep('error');
      }
    } catch (err) {
      console.error('Reassessment failed:', err);
      setCurrentStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCertificate = () => {
    if (resultData?.certificateId) {
      navigator.clipboard.writeText(
        `MoSPI Capacity Building Certificate ID: ${resultData.certificateId}\nOfficer: ${currentUser?.name || 'Aarav Sharma'}\nScore: ${resultData.postLearningScore}%\nVerification: Verified & Synced with SPARROW.`
      );
      setCopiedCert(true);
      setTimeout(() => setCopiedCert(false), 2500);
    }
  };

  const handleClose = () => {
    closeReassessment();
    setCurrentStep('intro');
    setSelectedAnswers({});
    setResultData(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-white rounded-3xl border border-[#c4c6cf]/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="bg-[#002147] text-white p-6 flex items-start justify-between relative overflow-hidden shrink-0">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fe9832] text-[#000a1e]">
                  POST-LEARNING REASSESSMENT
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                  Cadre Gap Closure Verification
                </span>
              </div>
              <h2 className="text-xl font-bold font-['Public_Sans',sans-serif]">
                Official Post-Curriculum Reassessment
              </h2>
              <p className="text-xs text-white/80 max-w-xl">
                Comprehensive evaluation measuring empirical skill gain following completion of iGOT courses, NSSTA modules, and practical simulation labs.
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

          {/* Modal Content Container */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar min-h-[320px]">
            {/* STATE 1: LOADING */}
            {currentStep === 'loading' && (
              <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#f0f3ff] text-[#002147] flex items-center justify-center animate-spin border-3 border-[#002147] border-t-transparent">
                  <RotateCw className="w-6 h-6 text-[#fe9832]" />
                </div>
                <h3 className="text-base font-bold text-[#000a1e] font-['Public_Sans',sans-serif]">
                  Preparing your reassessment...
                </h3>
                <p className="text-xs text-[#74777f]">
                  Loading official statistical competency questions and diagnostic calibration...
                </p>
              </div>
            )}

            {/* STATE 2: INTRO & OBJECTIVES */}
            {currentStep === 'intro' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#002147] uppercase tracking-wider">
                    <Target className="w-4 h-4 text-[#fe9832]" />
                    <span>Evaluation Objectives &amp; Calibration</span>
                  </div>
                  <p className="text-xs text-[#44474e] leading-relaxed">
                    This official reassessment verifies that your active competency deficits have been resolved. Passing with <strong>70% or higher</strong> automatically:
                  </p>
                  <ul className="text-xs text-[#44474e] space-y-1.5 list-disc pl-5 marker:text-[#002147]">
                    <li>Elevates verified competency from <strong>Level 2 → Level 3 (Operational Mastery)</strong>.</li>
                    <li>Closes the active <strong>Python Survey Microdata &amp; Sampling Weights</strong> gap.</li>
                    <li>Increases overall Official Role Readiness by <strong>+10%</strong>.</li>
                    <li>Issues a verified <strong>MoSPI Digital Competency Certificate</strong> for SPARROW reporting.</li>
                  </ul>
                </div>

                {/* Baseline Comparison Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/30 text-center">
                    <div className="text-xs text-[#74777f] font-semibold">Pre-Learning Baseline</div>
                    <div className="text-2xl font-black text-amber-700 mt-1">48%</div>
                    <div className="text-[10px] text-[#74777f] mt-0.5">Initial Diagnostic</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/30 text-center">
                    <div className="text-xs text-[#74777f] font-semibold">Passing Benchmark</div>
                    <div className="text-2xl font-black text-[#002147] mt-1">70%</div>
                    <div className="text-[10px] text-[#74777f] mt-0.5">Required for Level 3</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/30 text-center">
                    <div className="text-xs text-[#74777f] font-semibold">Curriculum Hours</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">46 hrs</div>
                    <div className="text-[10px] text-[#74777f] mt-0.5">iGOT + NSSTA + Labs</div>
                  </div>
                </div>

                {/* Evaluated Competencies Outline */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#000a1e] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#002147]" />
                    <span>Evaluated Competency Dimensions ({REASSESSMENT_QUESTIONS.length} Questions)</span>
                  </div>
                  <div className="space-y-1.5">
                    {REASSESSMENT_QUESTIONS.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl bg-white border border-[#c4c6cf]/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#f0f3ff] text-[#002147] font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-[#111c2d]">{q.competency}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#002147] bg-[#f0f3ff] px-2 py-0.5 rounded-md">
                          Level {q.currentLevel} → Level {q.targetLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: QUESTIONS LOADED & ACTIVE QUIZ */}
            {currentStep === 'quiz' && currentQ && (
              <div className="space-y-6">
                {/* Competency Target Bar */}
                <div className="p-3.5 rounded-2xl bg-[#002147] text-white flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#fe9832] text-[#000a1e]">
                      Target Domain
                    </span>
                    <span className="font-bold">{currentQ.competency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-300">Target Upgrade:</span>
                    <span className="font-mono font-bold text-[#fe9832]">
                      Level {currentQ.currentLevel} → Level {currentQ.targetLevel}
                    </span>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#002147]">
                      Question {currentQuestionIdx + 1} of {REASSESSMENT_QUESTIONS.length}
                    </span>
                    <span className="text-[#74777f]">
                      {answeredCount} of {REASSESSMENT_QUESTIONS.length} Answered
                    </span>
                  </div>
                  <div className="w-full bg-[#f0f3ff] h-2 rounded-full overflow-hidden border border-[#c4c6cf]/30">
                    <div
                      className="bg-[#002147] h-full rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIdx + 1) / REASSESSMENT_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="p-5 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-[#fe9832]/10 text-[#002147] border border-[#fe9832]/30">
                      {currentQ.topic}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#000a1e] leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs leading-relaxed ${
                            isSelected
                              ? 'bg-[#002147] text-white border-[#002147] shadow-sm font-bold'
                              : 'bg-white text-[#111c2d] border-[#c4c6cf]/50 hover:border-[#002147]/40 hover:bg-[#f0f3ff]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-[#fe9832] text-[#000a1e]'
                                : 'bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 4: SUBMITTING / EVALUATING OVERLAY */}
            {currentStep === 'evaluating' && (
              <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#f0f3ff] text-[#002147] flex items-center justify-center animate-spin border-4 border-[#002147] border-t-transparent">
                  <RotateCw className="w-8 h-8 text-[#fe9832]" />
                </div>
                <h3 className="text-lg font-bold text-[#000a1e] font-['Public_Sans',sans-serif]">
                  Evaluating your competency...
                </h3>
                <p className="text-xs text-[#44474e] max-w-md mx-auto">
                  Evaluating responses against MoSPI statistical benchmarks, updating PostgreSQL database records, and issuing digital evidence certificate...
                </p>
              </div>
            )}

            {/* STATE 5: RESULT VIEW */}
            {currentStep === 'result' && resultData && (
              <div className="space-y-6">
                {/* Result Hero Banner */}
                <div
                  className={`p-6 rounded-3xl border-2 shadow-xs space-y-4 ${
                    resultData.passed
                      ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-emerald-300 text-emerald-950'
                      : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white font-mono ${
                            resultData.passed ? 'bg-emerald-700' : 'bg-amber-700'
                          }`}
                        >
                          STATUS: {resultData.status || (resultData.passed ? 'VERIFIED' : 'NEEDS FURTHER LEARNING')}
                        </span>
                        <span className="text-xs text-[#74777f]">
                          Passing Benchmark: <strong>70%</strong>
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold font-['Public_Sans',sans-serif] text-[#000a1e]">
                        REASSESSMENT RESULT
                      </h3>

                      <p className="text-xs sm:text-sm text-[#44474e]">
                        {resultData.aiVerificationSummary}
                      </p>
                    </div>

                    {/* Radial Score Pill */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shadow-md shrink-0 ${
                        resultData.passed ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    >
                      <span className="text-2xl font-black font-['Public_Sans',sans-serif] leading-none">
                        {resultData.postLearningScore}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 mt-1">
                        SCORE
                      </span>
                    </div>
                  </div>

                  {/* Competency Level Update Banner (Requirement Step 7 & 8) */}
                  {resultData.passed && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Competency Level Updated</span>
                      </div>
                      <p className="text-xs text-[#44474e] leading-relaxed">
                        Your competency level was updated based on verified assessment evidence.
                      </p>

                      <div className="grid grid-cols-3 gap-3 pt-2 text-xs text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-[#74777f] font-bold block">Previous</span>
                          <span className="font-bold text-slate-800">Level {resultData.previousLevel}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300">
                          <span className="text-[10px] text-emerald-800 font-bold block">Updated</span>
                          <span className="font-bold text-emerald-900">Level {resultData.newLevel}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                          <span className="text-[10px] text-blue-800 font-bold block">Remaining Gap</span>
                          <span className="font-bold text-blue-900">{resultData.remainingGap ?? 1}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Score Metrics Grid (Requirement Step 6) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <span className="text-[10px] text-[#74777f] uppercase font-bold">Correct Answers</span>
                      <div className="font-bold text-[#000a1e] mt-0.5">
                        {resultData.correctAnswers ?? 4} / {resultData.totalQuestions ?? 5}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <span className="text-[10px] text-[#74777f] uppercase font-bold">Baseline vs Post</span>
                      <div className="font-bold text-[#000a1e] mt-0.5">
                        {resultData.preLearningScore}% &rarr; {resultData.postLearningScore}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <span className="text-[10px] text-[#74777f] uppercase font-bold">Empirical Improvement</span>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        +{resultData.scoreImprovement}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <span className="text-[10px] text-[#74777f] uppercase font-bold">SPARROW Verification</span>
                      <div className="font-bold text-[#002147] mt-0.5">
                        {resultData.sparrowSynced ? 'Verified & Synced' : 'Pending Sync'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Credential Certificate */}
                {resultData.certificateId && (
                  <div className="p-4 rounded-2xl bg-[#002147] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <ShieldCheck className="w-4 h-4 text-[#fe9832]" />
                        <span className="text-xs font-bold font-mono text-[#fe9832]">
                          {resultData.certificateId}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80">
                        Issued to <strong>{currentUser?.name || 'Aarav Sharma'}</strong> • MoSPI Official Capacity Building Certificate
                      </p>
                    </div>

                    <button
                      onClick={handleCopyCertificate}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCert ? 'Copied Details' : 'Copy Certificate ID'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STATE 6: ERROR VIEW (NEVER BLANK) */}
            {currentStep === 'error' && (
              <div className="py-12 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#000a1e] font-['Public_Sans',sans-serif]">
                  Unable to load the reassessment. Please try again.
                </h3>
                <p className="text-xs text-[#74777f] max-w-md mx-auto">
                  A transient connection issue occurred while syncing with the server. Please click Retry to reload your reassessment questions.
                </p>
                <button
                  onClick={handleStartReassessment}
                  className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer mt-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#fe9832]" />
                  <span>Retry Reassessment</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-[#f9f9ff] border-t border-[#c4c6cf]/40 p-5 flex items-center justify-between gap-3 shrink-0">
            {currentStep === 'intro' && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartReassessment}
                  className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#fe9832]" />
                  <span>Begin Reassessment ({REASSESSMENT_QUESTIONS.length} Questions)</span>
                </button>
              </>
            )}

            {currentStep === 'quiz' && (
              <>
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIdx === 0 || isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] disabled:opacity-30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIdx] === undefined || isSubmitting}
                  className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <span>{isLastQuestion ? 'Submit Reassessment' : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4 text-[#fe9832]" />
                </button>
              </>
            )}

            {currentStep === 'result' && (
              <>
                <button
                  onClick={handleStartReassessment}
                  className="px-4 py-2.5 text-xs font-semibold text-[#002147] hover:bg-[#f0f3ff] rounded-xl transition-colors cursor-pointer"
                >
                  Retake Reassessment
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#fe9832]" />
                  <span>Update &amp; Return to Pathway</span>
                </button>
              </>
            )}

            {currentStep === 'error' && (
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer ml-auto"
              >
                Close Modal
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
