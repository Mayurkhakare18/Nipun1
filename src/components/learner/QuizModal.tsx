import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { QuizAssessment, QuizAttemptResult } from '../../types';
import { QuizResultSummaryView } from './QuizResultSummaryView';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Bookmark,
  RefreshCw,
  BookOpen,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export const QuizModal: React.FC = () => {
  const {
    isQuizModalOpen,
    closeQuiz,
    activeQuizId,
    refreshUserData,
    showNotification,
  } = useAuth();

  const [assessment, setAssessment] = useState<QuizAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingFresh, setIsGeneratingFresh] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Assessment
  useEffect(() => {
    if (!isQuizModalOpen) return;

    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        setQuizResult(null);
        setCurrentQuestionIndex(0);

        const id = activeQuizId || 'assess-py-l3';
        const res = await api.getAssessmentById(id);
        if (res.success && res.assessment) {
          setAssessment(res.assessment);
          setSelectedAnswers(new Array(res.assessment.questions.length).fill(-1));
          setFlaggedQuestions(new Array(res.assessment.questions.length).fill(false));
          setTimeLeftSeconds(res.assessment.timeLimitMinutes * 60);
        }
      } catch (err) {
        console.error('Failed to load quiz:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [isQuizModalOpen, activeQuizId]);

  // Timer Countdown
  useEffect(() => {
    if (!isQuizModalOpen || quizResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizModalOpen, quizResult, timeLeftSeconds]);

  const handleSelectOption = (optionIndex: number) => {
    if (quizResult) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const toggleFlagQuestion = () => {
    const newFlags = [...flaggedQuestions];
    newFlags[currentQuestionIndex] = !newFlags[currentQuestionIndex];
    setFlaggedQuestions(newFlags);
  };

  const handleGenerateFreshQuestions = async (targetComp?: string) => {
    try {
      setIsGeneratingFresh(true);
      const comp = targetComp || assessment?.competency || 'Python';
      const res = await api.generateFreshAssessment({
        competency: comp,
        difficulty: 'Medium',
        questionCount: 4,
      });

      if (res.success && res.assessment) {
        setAssessment(res.assessment);
        setSelectedAnswers(new Array(res.assessment.questions.length).fill(-1));
        setFlaggedQuestions(new Array(res.assessment.questions.length).fill(false));
        setTimeLeftSeconds(res.assessment.timeLimitMinutes * 60);
        setCurrentQuestionIndex(0);
        setQuizResult(null);

        showNotification(
          'Fresh Assessment Generated',
          `Generated ${res.assessment.questions.length} brand new AI questions for ${comp}.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to generate fresh questions:', err);
    } finally {
      setIsGeneratingFresh(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessment || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const timeSpent = Math.max(15, (assessment.timeLimitMinutes * 60) - timeLeftSeconds);
      
      const res = await api.submitAssessment(assessment.id, selectedAnswers, timeSpent, assessment);

      if (res && res.result) {
        setQuizResult(res.result);

        if (res.result.scorePercentage >= (assessment.passingScore || 70)) {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch (cErr) {
            // Non-blocking confetti failure fallback
          }

          showNotification(
            'Competency Level Elevated!',
            `You passed with ${res.result.scorePercentage}%. Verified in National Competency Passport!`,
            'success'
          );
        } else {
          showNotification(
            'Assessment Completed',
            `Score: ${res.result.scorePercentage}%. Passing required: ${assessment.passingScore || 70}%. Review recommendations and retry.`,
            'warning'
          );
        }

        // Non-blocking background sync so result view is shown without delay
        refreshUserData().catch((syncErr) => console.warn('Background user refresh notice:', syncErr));
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isQuizModalOpen) return null;

  const currentQ = assessment?.questions[currentQuestionIndex];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/60 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Top Bar - Clean Light Government Styling */}
          <div className="bg-[#f0f3ff] p-5 border-b border-[#c4c6cf]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#002147] text-[#fe9832] shadow-2xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#002147] text-white">
                    Diagnostic Exam
                  </span>
                  <span className="text-[10px] font-semibold text-[#002147]">
                    Domain: {assessment?.competency}
                  </span>
                </div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-[#000a1e] mt-0.5">
                  {assessment?.title || 'NIPUN Competency Assessment'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dynamic Fresh Question Generator Button */}
              <button
                onClick={() => handleGenerateFreshQuestions()}
                disabled={isGeneratingFresh || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#e4ebff] text-[#002147] border border-[#c4c6cf]/60 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Generate brand new AI questions on the fly"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#fe9832] ${isGeneratingFresh ? 'animate-spin' : ''}`} />
                <span>{isGeneratingFresh ? 'Generating Questions...' : '⚡ Generate Fresh Questions'}</span>
              </button>

              {!quizResult && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#c4c6cf]/60 text-[#002147] text-xs font-mono font-bold shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-[#fe9832]" />
                  <span>{formatTime(timeLeftSeconds)}</span>
                </div>
              )}
              <button
                onClick={closeQuiz}
                className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading || isGeneratingFresh ? (
            <div className="p-16 text-center text-sm text-[#44474e] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-xs text-[#002147]">Generating fresh adaptive questions from official statistical syllabus...</span>
            </div>
          ) : quizResult && assessment ? (
            /* Interactive Quiz Result Summary & Recommendation Engine */
            <QuizResultSummaryView
              quizResult={quizResult}
              assessment={assessment}
              selectedAnswers={selectedAnswers}
              flaggedQuestions={flaggedQuestions}
              onRetakeSet={() => {
                setQuizResult(null);
                setCurrentQuestionIndex(0);
                setSelectedAnswers(new Array(assessment.questions.length).fill(-1));
                setTimeLeftSeconds(assessment.timeLimitMinutes * 60);
              }}
              onGenerateFreshQuestions={() => handleGenerateFreshQuestions()}
              onClose={closeQuiz}
            />
          ) : (
            /* Active Test Interface */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Question Navigation Drawer */}
              <div className="w-full md:w-60 bg-[#f9f9ff] border-b md:border-b-0 md:border-r border-[#c4c6cf]/40 p-4 space-y-4 shrink-0">
                <div>
                  <h4 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider">
                    Question Navigator
                  </h4>
                  <p className="text-[11px] text-[#74777f] mt-0.5">
                    {selectedAnswers.filter((a) => a !== -1).length} of {assessment?.questions.length} Answered
                  </p>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
                  {assessment?.questions.map((_, idx) => {
                    const isAnswered = selectedAnswers[idx] !== -1;
                    const isCurrent = currentQuestionIndex === idx;
                    const isFlagged = flaggedQuestions[idx];

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-9 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'bg-[#002147] text-white shadow-xs'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-white text-[#44474e] border border-[#c4c6cf]/60 hover:bg-[#f0f3ff]'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        {isFlagged && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#fe9832] absolute top-1 right-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#c4c6cf]/30 space-y-1.5 text-[11px] text-[#74777f]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#002147]"></span>
                    <span>Current Item</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-white border border-[#c4c6cf]"></span>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>

              {/* Active Question View */}
              {currentQ && (
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                    {/* Header with Topic and Flag Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#fe9832] uppercase tracking-wider">
                          Question {currentQuestionIndex + 1} of {assessment?.questions.length}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40">
                          {currentQ.topic}
                        </span>
                        <span className="text-[10px] text-[#74777f]">
                          Difficulty: {currentQ.difficulty}
                        </span>
                      </div>

                      <button
                        onClick={toggleFlagQuestion}
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                          flaggedQuestions[currentQuestionIndex]
                            ? 'bg-[#fe9832]/20 border-[#fe9832] text-[#002147]'
                            : 'bg-white border-[#c4c6cf]/60 text-[#74777f] hover:text-[#002147]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{flaggedQuestions[currentQuestionIndex] ? 'Flagged' : 'Flag for Review'}</span>
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="p-5 rounded-2xl bg-[#f0f3ff]/70 border border-[#c4c6cf]/40">
                      <h4 className="text-sm sm:text-base font-bold text-[#000a1e] leading-relaxed">
                        {currentQ.question}
                      </h4>
                      {currentQ.sourceReference && (
                        <p className="text-[11px] text-[#74777f] mt-2 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#002147]" />
                          <span>Source: {currentQ.sourceReference}</span>
                        </p>
                      )}
                    </div>

                    {/* Choices Grid */}
                    <div className="space-y-3">
                      {currentQ.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                        const optionLetter = String.fromCharCode(65 + optIdx);

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                              isSelected
                                ? 'border-[#002147] bg-[#f0f3ff] shadow-xs'
                                : 'border-[#c4c6cf]/40 bg-white hover:border-[#002147]/40 hover:bg-[#f9f9ff]'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#002147] text-white'
                                  : 'bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40'
                              }`}
                            >
                              {optionLetter}
                            </div>
                            <span className={`text-xs sm:text-sm leading-relaxed ${isSelected ? 'font-bold text-[#000a1e]' : 'text-[#44474e]'}`}>
                              {option}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-6 mt-6 border-t border-[#c4c6cf]/30 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-[#c4c6cf]/60 hover:bg-[#f0f3ff] disabled:opacity-30 text-xs font-bold rounded-xl text-[#002147] transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {currentQuestionIndex < (assessment?.questions.length || 0) - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="flex items-center gap-1 px-5 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4 text-[#fe9832]" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#fe9832]" />
                        <span>{isSubmitting ? 'Evaluating...' : 'Submit Assessment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
