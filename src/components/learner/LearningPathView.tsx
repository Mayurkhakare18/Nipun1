import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LearningPath, LearningPathItem, LearningCatalogueItem } from '../../types';
import { ResourceDetailModal } from './ResourceDetailModal';
import { UnifiedRecommendationsView } from './UnifiedRecommendationsView';
import {
  CheckCircle2,
  Clock,
  Play,
  Award,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  ExternalLink,
  FileCheck,
  BrainCircuit,
  FileText,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  AlertCircle,
  Layers,
  Search,
} from 'lucide-react';

export const LearningPathView: React.FC = () => {
  const {
    openQuiz,
    setIsLabModalOpen,
    showNotification,
    openIgotCourse,
    openNsstaProgram,
    openReassessment,
    openDocIntelligence,
    setActiveTab,
  } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'PATHWAY' | 'CATALOGUE'>('PATHWAY');
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedResourceForModal, setSelectedResourceForModal] = useState<LearningCatalogueItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const fetchPath = async () => {
    try {
      setIsLoading(true);
      const res = await api.getLearningPath();
      if (res.success && res.learningPath) {
        setLearningPath(res.learningPath);
      }
    } catch (err) {
      console.error('Failed to load learning path:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPath();
  }, []);

  const handleStepAction = async (item: LearningPathItem) => {
    if (item.sourceType === 'DIAGNOSTIC' || item.sourceType === 'QUIZ') {
      openQuiz(item.competency || 'Python');
    } else if (item.sourceType === 'PRACTICE') {
      setIsLabModalOpen(true);
    } else if (item.sourceType === 'IGOT') {
      openIgotCourse({
        id: item.id,
        title: item.title,
        provider: 'iGOT Karmayogi / MoSPI',
        duration: item.duration,
        rating: 4.8,
        enrolledCount: 1420,
        url:
          item.externalLink && !item.externalLink.includes('/app/toc/course/')
            ? item.externalLink
            : `https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=${encodeURIComponent(item.competency || item.title)}`,
      });
    } else if (item.sourceType === 'NSSTA') {
      openNsstaProgram({
        id: item.id,
        title: item.title,
        category: 'Residential Workshop',
        duration: item.duration,
        location: 'NSSTA Campus, Greater Noida',
        dates: '15-17 Sept 2026',
        competency: item.competency || item.title,
        targetLevel: 4,
        seatsAvailable: 20,
        batchCode: 'NSSTA-2026-COHORT',
        description: item.reason,
        modulesCovered: [
          'Advanced Sample Survey Design & Allocation Strategy',
          'Data Dissemination Standards & Metadata Documentation',
          'Microdata Anonymization & Confidentiality Protocols',
        ],
      });
    } else if (item.sourceType === 'VERIFICATION' || item.sourceType === 'REASSESSMENT') {
      openReassessment();
    }
  };

  const handleOpenModal = (item: LearningPathItem) => {
    setSelectedResourceForModal({
      id: item.id,
      title: item.title,
      source: item.source.includes('iGOT')
        ? 'iGOT Karmayogi'
        : item.source.includes('NSSTA')
        ? 'NSSTA / TPAC'
        : 'NIPUN Practical Learning',
      competency: item.competency,
      domain: 'Official Statistics & Data Science',
      difficulty: item.phase === 'ADVANCED' ? 'Advanced' : item.phase === 'FOUNDATION' ? 'Beginner' : 'Intermediate',
      duration: item.duration,
      prerequisites: item.prerequisites || 'Foundational literacy',
      targetRole: learningPath?.targetRole || 'Deputy Director (Statistics)',
      description: item.reason,
      learningObjectives: item.learningObjectives || [
        `Master sequential milestones for ${item.competency}`,
        'Complete practical exercises and validation checks',
      ],
      relevanceToGap: `Part of personalized pathway phase: ${item.phase || 'CAPACITY_BUILDING'}.`,
      expectedImprovement: item.expectedImprovement || `Elevates operational readiness in ${item.competency}.`,
      isDemoData: true,
      datasetNotice: 'Development Dataset',
      phase: item.phase,
    });
    setIsDetailModalOpen(true);
  };

  const handleMarkStepCompleted = async (item: LearningPathItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = item.sourceType === 'QUIZ' || item.sourceType === 'REASSESSMENT' ? 'VERIFIED' : 'COMPLETED';
      const res = await api.updateLearningPathStep(item.id, nextStatus as any);
      if (res.success && res.learningPath) {
        setLearningPath(res.learningPath);
        showNotification(
          'Module Marked Completed',
          `Completed "${item.title}". Status updated to Assessment Pending. Validated assessment required for competency level elevation.`,
          'info'
        );
      }
    } catch (err) {
      console.error('Failed to update step status:', err);
    }
  };

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveSubTab('PATHWAY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'PATHWAY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sequenced Roadmap (5 Stages)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('CATALOGUE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'CATALOGUE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#002147]" />
            <span>Unified Resource Catalogue &amp; Search</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {activeSubTab === 'PATHWAY' ? 'Stage-by-Stage Milestone Progress' : 'iGOT • NSSTA • NIPUN Unified Search'}
        </span>
      </div>

      {activeSubTab === 'CATALOGUE' ? (
        <UnifiedRecommendationsView />
      ) : (
        <>
          {/* ICBP Header */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                MoSPI Capacity Building Commission
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Target Cadre: {learningPath?.targetRole || 'Deputy Director (Statistics)'}
              </span>
              <span className="font-mono text-slate-500 text-xs">
                ICBP Ref: <strong>ICBP-MOSPI-2026-Q3</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              Personalized Capacity Building Pathway (ICBP)
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Official sequential capacity building track dynamically arranged into 5 stages: Foundation &rarr; Application &rarr; Advanced &rarr; Assessment &rarr; Reassessment.
            </p>
          </div>

          {/* Progress Widget */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4 shrink-0">
            <div>
              <div className="text-2xl font-bold text-[#002147] font-['Public_Sans',sans-serif]">
                {learningPath?.progressPercentage}%
              </div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Pathway Progress
              </div>
            </div>
            <div className="w-24 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#002147] h-full rounded-full transition-all duration-500"
                style={{ width: `${learningPath?.progressPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5-Stage Visual Stepper: FOUNDATION -> APPLICATION -> ADVANCED -> ASSESSMENT -> REASSESSMENT */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-blue-700 uppercase font-mono">Stage 1</span>
            <span className="text-xs font-bold">1. FOUNDATION</span>
            <span className="text-[10px] text-blue-700">iGOT E-Learning</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-emerald-700 uppercase font-mono">Stage 2</span>
            <span className="text-xs font-bold">2. APPLICATION</span>
            <span className="text-[10px] text-emerald-700">NIPUN Code Lab</span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-semibold flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-purple-700 uppercase font-mono">Stage 3</span>
            <span className="text-xs font-bold">3. ADVANCED</span>
            <span className="text-[10px] text-purple-700">NSSTA Academy</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-semibold flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-amber-800 uppercase font-mono">Stage 4</span>
            <span className="text-xs font-bold">4. ASSESSMENT</span>
            <span className="text-[10px] text-amber-800">Proctored Evaluation</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Stage 5</span>
            <span className="text-xs font-bold">5. REASSESSMENT</span>
            <span className="text-[10px] text-slate-500">Passport Clearance</span>
          </div>
        </div>
      </div>

      {/* Pathway Timeline Steps */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Public_Sans',sans-serif]">
              Sequential Progression Milestones
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Course completion marks learning progress. Passing validated assessment elevates competency level.
            </p>
          </div>

          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
            {learningPath?.items.length || 5} Milestones
          </span>
        </div>

        <div className="space-y-3">
          {learningPath?.items.map((item, idx) => {
            const isCompleted = item.status === 'COMPLETED';
            const isVerified = item.status === 'VERIFIED';
            const isInProgress = item.status === 'IN_PROGRESS';
            const isPendingAssessment = item.status === 'ASSESSMENT_PENDING';

            return (
              <div
                key={item.id}
                onClick={() => handleStepAction(item)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isVerified
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : isCompleted
                    ? 'border-slate-300 bg-slate-50'
                    : isInProgress
                    ? 'border-amber-400 bg-amber-50/40 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Step Number / Phase Badge */}
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                      isVerified
                        ? 'bg-emerald-700 text-white'
                        : isCompleted
                        ? 'bg-slate-800 text-white'
                        : isInProgress
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isVerified || isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                        {item.phase || item.source}
                      </span>
                      <span className="text-xs text-slate-500">
                        Duration: {item.duration}
                      </span>
                      {item.score && (
                        <span className="text-xs font-bold text-emerald-800">
                          Score: {item.score}%
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(item);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                    title="View Milestone Details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {!isCompleted && !isVerified && (
                    <button
                      onClick={(e) => handleMarkStepCompleted(item, e)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors"
                      title="Mark step completed (Updates progress without increasing competency level until assessment is passed)"
                    >
                      Mark Complete
                    </button>
                  )}

                  <span
                    className={`text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCompleted
                        ? 'bg-slate-200 text-slate-800'
                        : isPendingAssessment
                        ? 'bg-purple-100 text-purple-900'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone Verification: Post-Learning Reassessment Banner */}
        <div className="mt-6 p-6 rounded-xl bg-slate-900 text-white space-y-4 shadow-sm border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Stage 5 Milestone • Post-Course Evaluation
                </span>
                <span className="text-xs text-slate-400">
                  Validated Assessment Loop
                </span>
              </div>
              <h4 className="text-lg font-bold font-['Public_Sans',sans-serif]">
                Verify Coursework &amp; Endorse Passport Elevation
              </h4>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                After completing your accredited iGOT courses, NSSTA workshop cohorts, and interactive sandbox labs, launch the validated post-learning assessment to elevate your official competency level.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={openReassessment}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Validated Assessment</span>
              </button>

              <button
                onClick={() => setActiveTab('passport')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>View Competency Passport &rarr;</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>Passing Threshold: <strong className="text-emerald-400">&ge; 70%</strong></span>
              <span>•</span>
              <span>Rule: <strong className="text-amber-300">Assessment Evidence Required for Level Elevation</strong></span>
            </div>

            <button
              onClick={openDocIntelligence}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MoSPI Circulars &amp; PDF MCQ Practice &rarr;</span>
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Reusable Resource Detail Modal */}
      <ResourceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        resource={selectedResourceForModal}
        onAction={(res) => {
          setIsDetailModalOpen(false);
          const found = learningPath?.items.find((i) => i.id === res.id);
          if (found) handleStepAction(found);
        }}
      />
    </div>
  );
};
