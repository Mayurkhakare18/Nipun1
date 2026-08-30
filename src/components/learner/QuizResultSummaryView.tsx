import React, { useState } from 'react';
import { QuizAssessment, QuizAttemptResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  RotateCcw,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
  Target,
  ShieldCheck,
  Bookmark,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

interface QuizResultSummaryViewProps {
  quizResult: QuizAttemptResult;
  assessment: QuizAssessment;
  selectedAnswers: number[];
  flaggedQuestions: boolean[];
  onRetakeSet: () => void;
  onGenerateFreshQuestions: () => void;
  onClose: () => void;
}

export const QuizResultSummaryView: React.FC<QuizResultSummaryViewProps> = ({
  quizResult,
  assessment,
  selectedAnswers,
  flaggedQuestions,
  onRetakeSet,
  onGenerateFreshQuestions,
  onClose,
}) => {
  const {
    openReassessment,
    setActiveTab,
    setIsLabModalOpen,
    openDocIntelligence,
    showNotification,
  } = useAuth();

  const [activeTab, setActiveResultTab] = useState<'summary' | 'review' | 'roadmap'>('summary');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'flagged'>('all');

  const passingScore = assessment?.passingScore || 70;
  const isPassed = (quizResult?.scorePercentage ?? 0) >= passingScore;

  // Identify weak topics where score is less than total
  const weakTopics = (quizResult?.topicScores || []).filter((t) => t.score < (t.total || 1));

  // Format seconds to mm:ss
  const formatTime = (secs: number = 0) => {
    const validSecs = Math.max(0, secs || 0);
    const mins = Math.floor(validSecs / 60);
    const remainder = validSecs % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const avgTimePerQuestion = Math.round((quizResult?.timeSpentSeconds || 60) / Math.max(1, quizResult?.totalQuestions || 1));

  // Handler for Proceeding to Post-Learning Reassessment
  const handleProceedToReassessment = () => {
    onClose();
    setTimeout(() => {
      openReassessment();
      showNotification(
        'Step 5: Post-Learning Reassessment Launched',
        `Starting formal competency verification for ${assessment.competency}.`,
        'success'
      );
    }, 150);
  };

  // Handler for Navigating to Courses to Revisit Core Topics
  const handleRevisitCourses = () => {
    onClose();
    setTimeout(() => {
      setActiveTab('recommendations');
      showNotification(
        'Revisiting Core Courses',
        `Opened accredited iGOT & NSSTA curriculum for ${assessment.competency}.`,
        'info'
      );
    }, 150);
  };

  // Handler for Navigating to Passport
  const handleViewPassport = () => {
    onClose();
    setTimeout(() => {
      setActiveTab('passport');
    }, 150);
  };

  // Handler for Launching Survey Lab
  const handleLaunchLab = () => {
    onClose();
    setTimeout(() => {
      setIsLabModalOpen(true);
    }, 150);
  };

  // Handler for Launching MoSPI Doc Intelligence
  const handleLaunchDocAI = () => {
    onClose();
    setTimeout(() => {
      openDocIntelligence();
    }, 150);
  };

  // Filter questions for review
  const filteredQuestions = assessment.questions.map((q, idx) => ({
    question: q,
    index: idx,
    userAnswer: selectedAnswers[idx],
    isCorrect: selectedAnswers[idx] === q.correctAnswer,
    isFlagged: flaggedQuestions[idx] || false,
  })).filter((item) => {
    if (reviewFilter === 'incorrect') return !item.isCorrect;
    if (reviewFilter === 'correct') return item.isCorrect;
    if (reviewFilter === 'flagged') return item.isFlagged;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f9f9ff]">
      {/* Sub-header Navigation Tabs */}
      <div className="bg-white border-b border-[#c4c6cf]/40 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveResultTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-[#002147] text-white shadow-2xs'
                : 'text-[#44474e] hover:bg-[#f0f3ff] hover:text-[#002147]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fe9832]" />
            <span>Score &amp; Recommendation</span>
          </button>

          <button
            onClick={() => setActiveResultTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-[#002147] text-white shadow-2xs'
                : 'text-[#44474e] hover:bg-[#f0f3ff] hover:text-[#002147]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#fe9832]" />
            <span>
              Question Review ({quizResult.correctAnswersCount}/{quizResult.totalQuestions})
            </span>
          </button>

          <button
            onClick={() => setActiveResultTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-[#002147] text-white shadow-2xs'
                : 'text-[#44474e] hover:bg-[#f0f3ff] hover:text-[#002147]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#fe9832]" />
            <span>Lifecycle Roadmap</span>
          </button>
        </div>

        {/* Quick Top Result Status Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
          <span className="text-[#74777f]">Passing Benchmark:</span>
          <span className="px-2 py-0.5 rounded-lg bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40 font-mono">
            {passingScore}%
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
              isPassed
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isPassed ? 'Target Achieved' : 'Needs Practice'}
          </span>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
        {/* =========================================================
            TAB 1: SCORE & SMART RECOMMENDATION ENGINE
            ========================================================= */}
        {activeTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* 1. Hero Score & Performance Card */}
            <div
              className={`p-6 sm:p-7 rounded-3xl border-2 shadow-xs transition-all ${
                isPassed
                  ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-300'
                  : 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Radial/Badge Score Box */}
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shadow-md shrink-0 ${
                      isPassed ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    <span className="text-2xl font-black font-['Public_Sans',sans-serif] leading-none">
                      {quizResult.scorePercentage}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-1">
                      {isPassed ? 'PASSED' : 'REVIEW'}
                    </span>
                  </div>

                  {/* Score Title & Context */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#002147] text-white">
                        Domain: {assessment.competency}
                      </span>
                      <span className="text-xs text-[#74777f]">
                        Passing Target: <strong>{passingScore}%</strong>
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-['Public_Sans',sans-serif] text-[#000a1e]">
                      {isPassed
                        ? 'Mastery Level Demonstrated'
                        : 'Skill Revision Recommended'}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#44474e]">
                      {isPassed
                        ? `Congratulations! You answered ${quizResult.correctAnswersCount} of ${quizResult.totalQuestions} questions correctly, demonstrating strong competency.`
                        : `You scored ${quizResult.scorePercentage}% (${quizResult.correctAnswersCount}/${quizResult.totalQuestions} correct). Passing requires ${passingScore}%.`}
                    </p>
                  </div>
                </div>

                {/* Passport Elevation Box */}
                {quizResult.competencyGapReduced ? (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-center shadow-xs shrink-0 self-start md:self-auto">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Passport Elevation
                    </div>
                    <div className="text-base font-black text-[#002147] mt-0.5">
                      Level {quizResult.updatedCompetencyLevel} Verified
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Gap Closed Successfully
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 text-center shadow-xs shrink-0 self-start md:self-auto">
                    <div className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">
                      Current Passport Level
                    </div>
                    <div className="text-base font-black text-[#002147] mt-0.5">
                      Level {quizResult.updatedCompetencyLevel} (Developing)
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      Revisit Core Topics
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#c4c6cf]/30 text-xs">
                <div className="p-2.5 rounded-xl bg-white/80 border border-[#c4c6cf]/30">
                  <span className="text-[10px] text-[#74777f] uppercase font-bold">Accuracy</span>
                  <div className="font-bold text-[#000a1e] mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{quizResult.correctAnswersCount}/{quizResult.totalQuestions} Correct</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-[#c4c6cf]/30">
                  <span className="text-[10px] text-[#74777f] uppercase font-bold">Time Spent</span>
                  <div className="font-bold text-[#000a1e] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#002147]" />
                    <span>{formatTime(quizResult.timeSpentSeconds)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-[#c4c6cf]/30">
                  <span className="text-[10px] text-[#74777f] uppercase font-bold">Pace</span>
                  <div className="font-bold text-[#000a1e] mt-0.5 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#fe9832]" />
                    <span>~{avgTimePerQuestion}s / question</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-[#c4c6cf]/30">
                  <span className="text-[10px] text-[#74777f] uppercase font-bold">Status</span>
                  <div className="font-bold text-[#000a1e] mt-0.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-[#002147]" />
                    <span>{isPassed ? 'Ready for Step 5' : 'Needs Practice'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================
                2. SMART RECOMMENDATION ENGINE (PROCEED VS REVISIT)
                ========================================================= */}
            {isPassed ? (
              /* PROCEED TO POST-REASSESSMENT PATHWAY */
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#000a1e] via-[#001938] to-[#002147] text-white border-2 border-emerald-400/60 shadow-lg space-y-4 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-[#000a1e] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        <span>AI Recommendation: Proceed to Step 5</span>
                      </span>
                      <span className="text-xs text-emerald-300 font-semibold">
                        Benchmark Exceeded
                      </span>
                    </div>

                    <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/20 text-white">
                      Next Step: Post-Learning Reassessment
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-bold font-['Public_Sans',sans-serif] text-white">
                      Recommended Action: Proceed to Post-Learning Reassessment
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                      You have passed the learning quiz with a score of <strong>{quizResult.scorePercentage}%</strong>.
                      Your understanding of <strong>{assessment.competency}</strong> meets the MoSPI cadre standard.
                      Take the official <strong>Step 5: Post-Learning Reassessment</strong> now to measure your empirical learning gain vs baseline and certify Level 3 in your National Passport.
                    </p>
                  </div>

                  {/* Recommendation Actions Button Bar */}
                  <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={handleProceedToReassessment}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Proceed to Post-Learning Reassessment &rarr;</span>
                      </button>

                      <button
                        onClick={handleViewPassport}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-[#fe9832]" />
                        <span>View Competency Passport</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveResultTab('review')}
                      className="text-xs text-slate-300 hover:text-white underline text-center sm:text-right cursor-pointer"
                    >
                      Review Detailed Questions &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* REVISIT CORE TOPICS PATHWAY */
              <div className="p-6 sm:p-7 rounded-3xl bg-[#fff8f0] border-2 border-amber-300 shadow-md space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-[#000a1e] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                      <span>AI Recommendation: Revisit Core Topics</span>
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">
                      Passing Threshold: {passingScore}%
                    </span>
                  </div>

                  <span className="text-xs font-mono bg-white px-3 py-1 rounded-full border border-amber-200 text-[#002147]">
                    Target Deficits Identified
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold font-['Public_Sans',sans-serif] text-[#000a1e]">
                    Recommended Action: Revisit Deficit Topics Before Reassessment
                  </h3>
                  <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed">
                    Your score was <strong>{quizResult.scorePercentage}%</strong>. To avoid failing the official post-reassessment,
                    we strongly advise revising the following deficit topics and practicing in the survey sandbox first.
                  </p>
                </div>

                {/* Specific Weak Topics List */}
                {weakTopics.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      Identified Topics Requiring Revision:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {weakTopics.map((topic, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-[#000a1e]">{topic.topic}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-300">
                            {topic.score}/{topic.total} Score ({Math.round((topic.score / Math.max(1, topic.total)) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remedial Action Buttons Grid */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={handleRevisitCourses}
                    className="flex items-center justify-center gap-2 p-3 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#fe9832]" />
                    <span>Revisit iGOT Courses</span>
                  </button>

                  <button
                    onClick={handleLaunchLab}
                    className="flex items-center justify-center gap-2 p-3 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Practice in Survey Lab</span>
                  </button>

                  <button
                    onClick={onGenerateFreshQuestions}
                    className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/60 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#fe9832]" />
                    <span>⚡ Generate Fresh Quiz</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Topic Mastery Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-[#c4c6cf]/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#000a1e]">Topic-by-Topic Mastery Breakdown</h4>
                  <p className="text-xs text-[#74777f]">Empirical performance across syllabus domains</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#002147]">
                  {quizResult.topicScores.length} Tested Topics
                </span>
              </div>

              <div className="space-y-3">
                {quizResult.topicScores.map((t, idx) => {
                  const topicPercentage = Math.round((t.score / (t.total || 1)) * 100);
                  const isMastered = topicPercentage >= 70;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/30 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#000a1e]">{t.topic}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isMastered
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isMastered ? 'Mastered' : 'Needs Practice'}
                          </span>
                          <span className="font-mono font-bold text-[#002147]">
                            {t.score}/{t.total} ({topicPercentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#c4c6cf]/30 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isMastered ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${topicPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. AI Diagnostic Assessment Summary */}
            <div className="p-5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#002147]">
                <Sparkles className="w-4 h-4 text-[#fe9832]" />
                <span>AI Diagnostic Narrative &amp; Action Plan</span>
              </div>
              <p className="text-xs text-[#44474e] leading-relaxed">
                {quizResult.aiConclusion}
              </p>
            </div>

            {/* 5. Bottom Navigation Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onRetakeSet}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-[#002147] bg-white border border-[#c4c6cf]/60 hover:bg-[#f0f3ff] px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake This Set</span>
                </button>

                <button
                  onClick={onGenerateFreshQuestions}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-[#002147] bg-[#f0f3ff] hover:bg-[#e4ebff] border border-[#c4c6cf]/60 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#fe9832]" />
                  <span>Generate New Assessment</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            TAB 2: QUESTION-BY-QUESTION DETAILED REVIEW
            ========================================================= */}
        {activeTab === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#c4c6cf]/40">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#74777f]">Filter Questions:</span>
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-[#002147] text-white'
                      : 'bg-[#f0f3ff] text-[#44474e] hover:bg-[#e4ebff]'
                  }`}
                >
                  All ({assessment.questions.length})
                </button>

                <button
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'incorrect'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Incorrect ({quizResult.incorrectAnswersCount})
                </button>

                <button
                  onClick={() => setReviewFilter('correct')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  Correct ({quizResult.correctAnswersCount})
                </button>

                <button
                  onClick={() => setReviewFilter('flagged')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'flagged'
                      ? 'bg-[#fe9832] text-[#000a1e]'
                      : 'bg-[#f0f3ff] text-[#44474e] hover:bg-[#e4ebff]'
                  }`}
                >
                  Flagged ({flaggedQuestions.filter(Boolean).length})
                </button>
              </div>

              <span className="text-xs text-[#74777f]">
                Showing <strong>{filteredQuestions.length}</strong> questions
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((item) => {
                const { question, index, userAnswer, isCorrect, isFlagged } = item;

                return (
                  <div
                    key={index}
                    className={`p-6 rounded-3xl border-2 bg-white shadow-xs space-y-4 ${
                      isCorrect ? 'border-emerald-200' : 'border-amber-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                            isCorrect ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-[#000a1e]">
                          {question.topic}
                        </span>
                        <span className="text-[10px] text-[#74777f] px-2 py-0.5 rounded-md bg-[#f0f3ff] border border-[#c4c6cf]/40">
                          {question.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFlagged && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#fe9832] bg-[#fe9832]/10 px-2 py-0.5 rounded-md border border-[#fe9832]/30">
                            <Bookmark className="w-3 h-3 fill-current" />
                            Flagged
                          </span>
                        )}

                        <span
                          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="p-4 rounded-2xl bg-[#f0f3ff]/60 border border-[#c4c6cf]/30">
                      <p className="text-xs sm:text-sm font-bold text-[#000a1e] leading-relaxed">
                        {question.question}
                      </p>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                      {question.options.map((opt, optIdx) => {
                        const isUserChoice = userAnswer === optIdx;
                        const isTheCorrectAnswer = question.correctAnswer === optIdx;
                        const optionLetter = String.fromCharCode(65 + optIdx);

                        let optionStyle = 'border-[#c4c6cf]/30 bg-white text-[#44474e]';
                        if (isTheCorrectAnswer) {
                          optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isUserChoice && !isCorrect) {
                          optionStyle = 'border-amber-400 bg-amber-50 text-amber-950 font-semibold';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border-2 flex items-start justify-between gap-3 text-xs ${optionStyle}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isTheCorrectAnswer
                                    ? 'bg-emerald-600 text-white'
                                    : isUserChoice
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-[#f0f3ff] text-[#002147]'
                                }`}
                              >
                                {optionLetter}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUserChoice && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#002147] text-white">
                                  Your Choice
                                </span>
                              )}
                              {isTheCorrectAnswer && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#002147]">
                        <BookOpen className="w-3.5 h-3.5 text-[#fe9832]" />
                        <span>Methodological Rationale &amp; Citation:</span>
                      </div>
                      <p className="text-xs text-[#44474e] leading-relaxed">
                        {question.explanation}
                      </p>
                      {question.sourceReference && (
                        <p className="text-[11px] text-[#74777f] pt-1">
                          Source Reference: <strong>{question.sourceReference}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* =========================================================
            TAB 3: 6-STAGE CAPACITY BUILDING ROADMAP
            ========================================================= */}
        {activeTab === 'roadmap' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#c4c6cf]/40 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#002147] text-white">
                  Capacity Building Architecture
                </span>
                <h3 className="text-lg font-bold font-['Public_Sans',sans-serif] text-[#000a1e] mt-1">
                  Where You Stand in the 6-Stage Officer Lifecycle
                </h3>
                <p className="text-xs text-[#74777f]">
                  Progress through all stages sequentially to unlock Level 3/4 verified status in your National Passport.
                </p>
              </div>

              {/* 6 Step Interactive List */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">AI Skill Gap Diagnosis</h5>
                      <p className="text-[11px] text-[#74777f]">Cadre deficit identification against MoSPI benchmarks</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </span>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">Pre-Course Baseline Diagnostic</h5>
                      <p className="text-[11px] text-[#74777f]">Established pre-training capability score (82%)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </span>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">Accredited Courses (iGOT &amp; NSSTA)</h5>
                      <p className="text-[11px] text-[#74777f]">Python Functions &amp; Statistical Computing Modules</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </span>
                </div>

                {/* Step 4 (Current) */}
                <div className="p-4 rounded-2xl bg-[#fe9832]/10 border-2 border-[#fe9832] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#fe9832] text-[#000a1e] flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">Learning Quiz &amp; Practice MCQs</h5>
                      <p className="text-[11px] text-[#44474e]">
                        Completed attempt with <strong>{quizResult.scorePercentage}%</strong> score
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#002147] bg-white px-2.5 py-1 rounded-lg border border-[#c4c6cf]/40">
                    Attempt Completed
                  </span>
                </div>

                {/* Step 5 */}
                <div
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                    isPassed
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-[#f9f9ff] border-[#c4c6cf]/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isPassed ? 'bg-purple-700 text-white' : 'bg-[#c4c6cf] text-[#44474e]'
                      }`}
                    >
                      5
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">Post-Learning Reassessment</h5>
                      <p className="text-[11px] text-[#74777f]">
                        {isPassed
                          ? 'Empirical delta gain measurement & gap closure verification'
                          : 'Unlock by achieving >= 70% on learning quiz'}
                      </p>
                    </div>
                  </div>

                  {isPassed ? (
                    <button
                      onClick={handleProceedToReassessment}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Launch Step 5 &rarr;
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#74777f] font-semibold">
                      Locked (Revisit Topics)
                    </span>
                  )}
                </div>

                {/* Step 6 */}
                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/40 flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#c4c6cf] text-[#44474e] flex items-center justify-center font-bold text-xs">
                      6
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#000a1e]">National Competency Passport</h5>
                      <p className="text-[11px] text-[#74777f]">Official Level 3 certification badge &amp; MoSPI endorsement</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#74777f] font-semibold">Final Milestone</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
