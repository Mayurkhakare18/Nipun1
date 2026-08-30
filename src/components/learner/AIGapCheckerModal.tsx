import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { competencyService } from '../../services/competencyService';
import { GapAnalysisResult, LearnerCompetency, UserProfile } from '../../types';
import {
  getCompetencyDetailedEvidence,
  CompetencyDetailedEvidence,
} from '../../utils/competencyEvidence';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  RotateCw,
  X,
  Target,
  ArrowUpRight,
  Play,
  BookOpen,
  GraduationCap,
  TrendingDown,
  Layers,
  FileCheck2,
  Compass,
  ShieldCheck,
  Award,
  Activity,
  Filter,
  Database,
  Code2,
  BarChart3,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIGapCheckerModalProps {
  initialGaps?: GapAnalysisResult[];
  onSelectGap?: (gap: GapAnalysisResult) => void;
}

type EvidenceTab = 'SUB_SKILLS' | 'PROJECT_METRICS' | 'DIAGNOSTIC_TRACES' | 'OVERVIEW';

export const AIGapCheckerModal: React.FC<AIGapCheckerModalProps> = ({
  initialGaps,
}) => {
  const {
    isGapCheckerOpen,
    setIsGapCheckerOpen,
    currentUser,
    openQuiz,
    setActiveTab,
    setIsPracticeLabOpen,
    showNotification,
    refreshUserData,
    gaps: contextGaps,
  } = useAuth();

  const [gaps, setGaps] = useState<GapAnalysisResult[]>(initialGaps || contextGaps || []);
  const [competencies, setCompetencies] = useState<LearnerCompetency[]>([]);
  const [learnerProfile, setLearnerProfile] = useState<UserProfile | null>(currentUser || null);
  const [summaryMetrics, setSummaryMetrics] = useState<{
    totalCompetencies: number;
    verifiedCount: number;
    criticalGapsCount: number;
    developingCount: number;
    overallRoleReadiness: number;
    knowledgeGapAvg: number;
    applicationGapAvg: number;
    lastAssessedDate: string;
    targetRole: string;
    specialization: string;
  } | null>(null);
  const [databaseMeta, setDatabaseMeta] = useState<{
    source?: string;
    syncedAt?: string;
    authenticatedOfficerId?: string;
  } | null>(null);

  const [selectedGap, setSelectedGap] = useState<GapAnalysisResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'APPLICATION' | 'KNOWLEDGE' | 'HIGH_PRIORITY'>('ALL');
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<EvidenceTab>('SUB_SKILLS');
  const [subSkillFilter, setSubSkillFilter] = useState<'ALL' | 'DEFICIENT' | 'IN_PROGRESS' | 'MASTERED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);

  // Fetch real learner profile competency data via database-connected CompetencyService
  useEffect(() => {
    if (!isGapCheckerOpen) return;

    let isMounted = true;
    const fetchRealLearnerData = async () => {
      setIsLoading(true);
      try {
        const res = await competencyService.getLearnerCompetencyProfile();

        if (isMounted && res.success) {
          if (res.profile) setLearnerProfile(res.profile);
          if (res.competencies) setCompetencies(res.competencies);
          if (res.summary) setSummaryMetrics(res.summary);
          if (res.meta) setDatabaseMeta(res.meta);

          if (res.gaps && res.gaps.length > 0) {
            setGaps(res.gaps);
            setSelectedGap((prev) => {
              if (prev && res.gaps.some((g) => g.competencyId === prev.competencyId)) {
                return res.gaps.find((g) => g.competencyId === prev.competencyId) || res.gaps[0];
              }
              return res.gaps[0];
            });
          } else if (contextGaps && contextGaps.length > 0) {
            setGaps(contextGaps);
            setSelectedGap(contextGaps[0]);
          }
        }
      } catch (err) {
        console.error('[AIGapCheckerModal] Failed to load real profile competency data from database:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRealLearnerData();

    return () => {
      isMounted = false;
    };
  }, [isGapCheckerOpen, contextGaps]);

  const handleRunRecomputation = async () => {
    try {
      setIsRecomputing(true);
      const res = await competencyService.recalibrateLearnerGaps();
      if (res.success && res.gaps) {
        setGaps(res.gaps);
        if (res.competencies) setCompetencies(res.competencies);
        if (res.profile) setLearnerProfile(res.profile);
        if (res.summary) setSummaryMetrics(res.summary);
        if (res.meta) setDatabaseMeta(res.meta);

        setSelectedGap(res.gaps[0] || null);
        await refreshUserData();
        showNotification(
          'AI Gap Diagnostic Recalibrated',
          `Successfully recalibrated gap models from database across ${res.gaps.length} statistical competencies.`,
          'success'
        );
      }
    } catch (err) {
      console.error('[AIGapCheckerModal] Failed to recalibrate gap analysis from database:', err);
      showNotification('Analysis Error', 'Failed to recalculate skill gaps', 'warning');
    } finally {
      setIsRecomputing(false);
    }
  };

  if (!isGapCheckerOpen) return null;

  // Filter gaps based on active filter
  const filteredGaps = gaps.filter((g) => {
    if (activeFilter === 'APPLICATION') return g.gapType === 'APPLICATION_GAP';
    if (activeFilter === 'KNOWLEDGE') return g.gapType === 'KNOWLEDGE_GAP';
    if (activeFilter === 'HIGH_PRIORITY') return g.priority === 'HIGH' || g.gap >= 2;
    return true;
  });

  const current = selectedGap || filteredGaps[0] || gaps[0];
  const matchedComp = competencies.find((c) => c.competencyId === current?.competencyId);
  const activeUser = learnerProfile || currentUser;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/60 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#f0f3ff] p-5 sm:p-6 border-b border-[#c4c6cf]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#002147] text-[#fe9832] shadow-2xs shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#002147] text-white">
                    MoSPI AI Gap Diagnostic Engine
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fe9832]/20 text-[#000a1e] border border-[#fe9832]/30 flex items-center gap-1">
                    <Database className="w-3 h-3 text-[#b25e00]" />
                    Live Database Record
                  </span>
                  {activeUser?.cadre && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold">
                      {activeUser.cadre}
                    </span>
                  )}
                </div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-lg text-[#000a1e]">
                  {activeUser?.name || 'Officer'} &bull; {activeUser?.designation || 'Statistical Officer'}
                </h3>
                <div className="text-xs text-[#44474e] flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{activeUser?.department || 'National Statistical Office (NSO)'}</span>
                  {activeUser?.targetRole && (
                    <>
                      <span>&bull;</span>
                      <span className="font-semibold text-[#002147]">Target: {activeUser.targetRole}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <button
                onClick={handleRunRecomputation}
                disabled={isRecomputing || isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#e4ebff] text-[#002147] text-xs font-bold border border-[#c4c6cf]/60 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Re-run AI diagnostic model against database records"
              >
                <RotateCw className={`w-3.5 h-3.5 text-[#fe9832] ${isRecomputing ? 'animate-spin' : ''}`} />
                <span>{isRecomputing ? 'Diagnosing...' : 'Recalibrate Engine'}</span>
              </button>
              <button
                onClick={() => setIsGapCheckerOpen(false)}
                className="p-2 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Officer Statistical Summary Banner */}
          {summaryMetrics && (
            <div className="bg-[#000a1e] text-white px-6 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0 overflow-x-auto">
              <div className="flex items-center gap-6 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#fe9832]" />
                  <span className="text-slate-300">Overall Role Readiness:</span>
                  <span className="font-bold text-white text-sm">{summaryMetrics.overallRoleReadiness}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-slate-300">Critical Gaps (Δ≥2):</span>
                  <span className="font-bold text-rose-300">{summaryMetrics.criticalGapsCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Verified Competencies:</span>
                  <span className="font-bold text-emerald-300">
                    {summaryMetrics.verifiedCount} / {summaryMetrics.totalCompetencies}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap hidden md:block">
                Last Evaluated: {summaryMetrics.lastAssessedDate}
              </div>
            </div>
          )}

          {/* Main Body */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Gap Tabs */}
            <div className="md:col-span-5 bg-[#f0f3ff]/70 p-4 border-r border-[#c4c6cf]/30 space-y-3 overflow-y-auto custom-scrollbar flex flex-col">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'ALL'
                      ? 'bg-[#002147] text-white shadow-2xs'
                      : 'bg-white text-[#44474e] border border-[#c4c6cf]/40 hover:bg-slate-100'
                  }`}
                >
                  All Gaps ({gaps.length})
                </button>
                <button
                  onClick={() => setActiveFilter('HIGH_PRIORITY')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'HIGH_PRIORITY'
                      ? 'bg-rose-800 text-white shadow-2xs'
                      : 'bg-white text-[#44474e] border border-[#c4c6cf]/40 hover:bg-slate-100'
                  }`}
                >
                  High Priority
                </button>
                <button
                  onClick={() => setActiveFilter('APPLICATION')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'APPLICATION'
                      ? 'bg-[#fe9832] text-[#000a1e] shadow-2xs'
                      : 'bg-white text-[#44474e] border border-[#c4c6cf]/40 hover:bg-slate-100'
                  }`}
                >
                  Application Gaps
                </button>
                <button
                  onClick={() => setActiveFilter('KNOWLEDGE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'KNOWLEDGE'
                      ? 'bg-blue-800 text-white shadow-2xs'
                      : 'bg-white text-[#44474e] border border-[#c4c6cf]/40 hover:bg-slate-100'
                  }`}
                >
                  Knowledge
                </button>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-xs text-[#74777f] space-y-2 my-auto">
                  <RotateCw className="w-6 h-6 text-[#fe9832] animate-spin mx-auto" />
                  <p className="font-semibold text-[#000a1e]">Fetching real profile competencies from database...</p>
                  <p className="text-[11px]">Synchronizing triangulated assessment signals</p>
                </div>
              ) : filteredGaps.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#74777f] bg-white rounded-2xl border border-dashed border-[#c4c6cf] my-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-[#000a1e]">No Gaps In This Filter</p>
                  <p className="mt-1">All competencies in this category meet target standards.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGaps.map((g) => {
                    const isSelected = current?.competencyId === g.competencyId;
                    const isCritical = g.gap >= 2 || g.priority === 'HIGH';

                    return (
                      <div
                        key={g.competencyId}
                        onClick={() => setSelectedGap(g)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#002147] bg-white shadow-md'
                            : 'border-transparent bg-white/70 hover:bg-white hover:border-[#c4c6cf]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-[#111c2d] truncate">
                            {g.competencyName}
                          </h5>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : g.gapType === 'APPLICATION_GAP'
                                ? 'bg-[#fe9832]/15 text-[#b25e00] border border-[#fe9832]/30'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {g.gapType?.replace('_', ' ') || 'GAP'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#44474e] mt-2.5">
                          <span className="font-medium">
                            Current: L{g.currentLevel} → Target: L{g.requiredLevel}
                          </span>
                          <span className="font-bold text-[#002147]">
                            Δ {g.gap} Level ({Math.round(g.confidence * 100)}% Confidence)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Detailed Evidence Panel */}
            <div className="md:col-span-7 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
              {current ? (
                <>
                  {(() => {
                    const detailedEvidence = getCompetencyDetailedEvidence(
                      current.competencyName,
                      current.gap,
                      current.currentLevel,
                      current.requiredLevel
                    );

                    const deficientSubSkillsCount = detailedEvidence.subSkills.filter(
                      (s) => s.status === 'DEFICIENT'
                    ).length;
                    const projectAlertsCount = detailedEvidence.projectMetrics.reduce(
                      (acc, p) => acc + p.metrics.filter((m) => m.status === 'ALERT').length,
                      0
                    );

                    const filteredSubSkills = detailedEvidence.subSkills.filter((s) => {
                      if (subSkillFilter === 'DEFICIENT') return s.status === 'DEFICIENT';
                      if (subSkillFilter === 'IN_PROGRESS') return s.status === 'IN_PROGRESS';
                      if (subSkillFilter === 'MASTERED') return s.status === 'MASTERED';
                      return true;
                    });

                    return (
                      <div className="space-y-5">
                        {/* Title & Level Badge */}
                        <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#c4c6cf]/30">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#fe9832] flex items-center gap-1">
                                <BrainCircuit className="w-3.5 h-3.5 text-[#fe9832]" />
                                AI Evidence Diagnosis
                              </span>
                              {matchedComp?.category && (
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                  &bull; {matchedComp.category.replace('_', ' ')}
                                </span>
                              )}
                              <span
                                className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                                  current.gap >= 2 || current.priority === 'HIGH'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : current.gapType === 'APPLICATION_GAP'
                                    ? 'bg-[#fe9832]/15 text-[#b25e00] border border-[#fe9832]/30'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {current.gapType?.replace('_', ' ') || 'GAP'}
                              </span>
                            </div>
                            <h4 className="text-xl font-bold text-[#000a1e] font-['Public_Sans',sans-serif] mt-1">
                              {current.competencyName}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#002147] text-white">
                              Level {current.currentLevel} &rarr; Target {current.requiredLevel}
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                              Delta: &Delta; {current.gap} Level ({Math.round(current.confidence * 100)}% Conf.)
                            </div>
                          </div>
                        </div>

                        {/* Interactive Evidence Navigation Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#f0f3ff] rounded-2xl border border-[#c4c6cf]/40 overflow-x-auto">
                          <button
                            onClick={() => setActiveEvidenceTab('SUB_SKILLS')}
                            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              activeEvidenceTab === 'SUB_SKILLS'
                                ? 'bg-white text-[#000a1e] shadow-xs border border-[#c4c6cf]/30'
                                : 'text-[#44474e] hover:text-[#000a1e]'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-[#fe9832]" />
                            <span>Missing Sub-Skills</span>
                            {deficientSubSkillsCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                                {deficientSubSkillsCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => setActiveEvidenceTab('PROJECT_METRICS')}
                            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              activeEvidenceTab === 'PROJECT_METRICS'
                                ? 'bg-white text-[#000a1e] shadow-xs border border-[#c4c6cf]/30'
                                : 'text-[#44474e] hover:text-[#000a1e]'
                            }`}
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Project Telemetry</span>
                            {projectAlertsCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-[#000a1e] text-[10px] font-extrabold">
                                {projectAlertsCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => setActiveEvidenceTab('DIAGNOSTIC_TRACES')}
                            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              activeEvidenceTab === 'DIAGNOSTIC_TRACES'
                                ? 'bg-white text-[#000a1e] shadow-xs border border-[#c4c6cf]/30'
                                : 'text-[#44474e] hover:text-[#000a1e]'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Test Traces &amp; Errors</span>
                          </button>

                          <button
                            onClick={() => setActiveEvidenceTab('OVERVIEW')}
                            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              activeEvidenceTab === 'OVERVIEW'
                                ? 'bg-white text-[#000a1e] shadow-xs border border-[#c4c6cf]/30'
                                : 'text-[#44474e] hover:text-[#000a1e]'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#fe9832]" />
                            <span>AI Synthesis</span>
                          </button>
                        </div>

                        {/* TAB 1: SUB-SKILLS BREAKDOWN */}
                        {activeEvidenceTab === 'SUB_SKILLS' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#000a1e] flex items-center gap-1.5">
                                  <span>Evaluated Micro-Competencies</span>
                                  <span className="text-slate-400">({detailedEvidence.subSkills.length} Analyzed)</span>
                                </h5>
                                <p className="text-[11px] text-[#44474e]">
                                  Granular skill-level diagnostic evidence from recent MoSPI assessment sandboxes
                                </p>
                              </div>

                              {/* Sub-skill filters */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSubSkillFilter('ALL')}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    subSkillFilter === 'ALL'
                                      ? 'bg-[#002147] text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  All
                                </button>
                                <button
                                  onClick={() => setSubSkillFilter('DEFICIENT')}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    subSkillFilter === 'DEFICIENT'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
                                  }`}
                                >
                                  Deficient ({deficientSubSkillsCount})
                                </button>
                                <button
                                  onClick={() => setSubSkillFilter('IN_PROGRESS')}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    subSkillFilter === 'IN_PROGRESS'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-slate-100 text-amber-700 hover:bg-amber-50'
                                  }`}
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() => setSubSkillFilter('MASTERED')}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    subSkillFilter === 'MASTERED'
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  Mastered
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {filteredSubSkills.map((subSkill) => (
                                <div
                                  key={subSkill.id}
                                  className={`p-4 rounded-2xl border transition-all ${
                                    subSkill.status === 'DEFICIENT'
                                      ? 'bg-rose-50/40 border-rose-200/80'
                                      : subSkill.status === 'IN_PROGRESS'
                                      ? 'bg-amber-50/40 border-amber-200/80'
                                      : 'bg-emerald-50/30 border-emerald-200/80'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                            subSkill.status === 'DEFICIENT'
                                              ? 'bg-rose-600 text-white'
                                              : subSkill.status === 'IN_PROGRESS'
                                              ? 'bg-amber-500 text-[#000a1e]'
                                              : 'bg-emerald-600 text-white'
                                          }`}
                                        >
                                          {subSkill.status === 'DEFICIENT' && <AlertCircle className="w-2.5 h-2.5" />}
                                          {subSkill.status === 'IN_PROGRESS' && <Clock className="w-2.5 h-2.5" />}
                                          {subSkill.status === 'MASTERED' && <CheckCircle className="w-2.5 h-2.5" />}
                                          <span>{subSkill.status.replace('_', ' ')}</span>
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                          {subSkill.category}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#002147] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                          L{subSkill.currentLevel} &rarr; Req L{subSkill.requiredLevel}
                                        </span>
                                      </div>
                                      <h6 className="font-bold text-sm text-[#000a1e] mt-1.5 font-['Public_Sans',sans-serif]">
                                        {subSkill.name}
                                      </h6>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-bold font-mono text-[#002147]">
                                        {subSkill.proficiencyScore}%
                                      </div>
                                      <div className="text-[9px] text-slate-400">Proficiency</div>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        subSkill.status === 'DEFICIENT'
                                          ? 'bg-rose-500'
                                          : subSkill.status === 'IN_PROGRESS'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${subSkill.proficiencyScore}%` }}
                                    ></div>
                                  </div>

                                  {/* AI Observation */}
                                  <div className="mt-3 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 space-y-1.5">
                                    <div className="text-[11px] text-[#44474e] leading-relaxed">
                                      <strong className="text-[#000a1e]">AI Diagnosis: </strong>
                                      {subSkill.aiObservation}
                                    </div>

                                    {subSkill.failedConceptTest && (
                                      <div className="text-[10px] text-rose-800 bg-rose-100/60 px-2 py-1 rounded-md font-mono">
                                        <strong>Diagnostic Failure Trigger: </strong>
                                        {subSkill.failedConceptTest}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px]">
                                      <span className="text-slate-500 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                                        Targeted Remediation: <strong className="text-[#002147]">{subSkill.remediationAction}</strong>
                                      </span>
                                      {subSkill.status !== 'MASTERED' && (
                                        <button
                                          onClick={() => {
                                            setIsGapCheckerOpen(false);
                                            setIsPracticeLabOpen(true);
                                          }}
                                          className="text-[#fe9832] hover:text-[#b25e00] font-bold flex items-center gap-0.5 cursor-pointer underline"
                                        >
                                          Practice Now
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: PROJECT & PIPELINE TELEMETRY */}
                        {activeEvidenceTab === 'PROJECT_METRICS' && (
                          <div className="space-y-4">
                            {detailedEvidence.projectMetrics.map((proj, pIdx) => (
                              <div key={pIdx} className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/60 shadow-xs space-y-4">
                                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                      <span className="px-2 py-0.5 rounded-md bg-[#002147] text-white font-bold uppercase">
                                        Live MoSPI Pipeline Telemetry
                                      </span>
                                      <span className="text-slate-500 font-semibold">{proj.division}</span>
                                      <span>&bull;</span>
                                      <span className="text-slate-500">{proj.dateEvaluated}</span>
                                    </div>
                                    <h5 className="font-bold text-base text-[#000a1e] font-['Public_Sans',sans-serif] mt-1">
                                      {proj.projectName}
                                    </h5>
                                    <div className="text-xs text-[#44474e] mt-0.5">
                                      Role: <span className="font-semibold text-[#002147]">{proj.roleInProject}</span> &bull; Sample Volume: <span className="font-semibold">{proj.sampleVolume}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {proj.metrics.map((m, mIdx) => (
                                    <div
                                      key={mIdx}
                                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                                        m.status === 'ALERT'
                                          ? 'bg-rose-50/50 border-rose-200'
                                          : m.status === 'WARNING'
                                          ? 'bg-amber-50/50 border-amber-200'
                                          : 'bg-emerald-50/50 border-emerald-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-[#000a1e]">{m.label}</span>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-black uppercase ${
                                            m.status === 'ALERT'
                                              ? 'bg-rose-600 text-white'
                                              : m.status === 'WARNING'
                                              ? 'bg-amber-500 text-[#000a1e]'
                                              : 'bg-emerald-600 text-white'
                                          }`}
                                        >
                                          {m.variance}
                                        </span>
                                      </div>

                                      <div className="flex items-baseline justify-between text-xs pt-1">
                                        <div>
                                          <span className="text-slate-500 text-[10px]">Actual: </span>
                                          <strong className="text-[#002147] text-sm">{m.actualValue}</strong>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-slate-500 text-[10px]">Benchmark: </span>
                                          <span className="text-slate-700 font-semibold text-xs">{m.benchmarkValue}</span>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-[#44474e] leading-snug pt-1 border-t border-slate-200/60">
                                        {m.explanation}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                {/* System Observation */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#44474e] flex items-start gap-2">
                                  <Cpu className="w-4 h-4 text-[#002147] shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-[#000a1e]">Automated Repository &amp; Workflow Audit: </strong>
                                    {proj.systemObservation}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TAB 3: DIAGNOSTIC TEST TRACES */}
                        {activeEvidenceTab === 'DIAGNOSTIC_TRACES' && (
                          <div className="space-y-4">
                            {detailedEvidence.assessmentTraces.map((trace, tIdx) => (
                              <div key={tIdx} className="p-4 rounded-2xl bg-white border border-[#c4c6cf]/60 shadow-xs space-y-4">
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-[#002147] text-white">
                                      <FileCheck2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h6 className="font-bold text-sm text-[#000a1e] font-['Public_Sans',sans-serif]">
                                        {trace.assessmentType} Evaluation Log
                                      </h6>
                                      <span className="text-[11px] text-slate-500">
                                        Assessed on {trace.assessmentDate} &bull; {trace.totalQuestions} Questions Evaluated
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-base font-extrabold font-mono text-[#002147]">
                                      {trace.score}%
                                    </span>
                                    <div className="text-[10px] text-slate-400">Score Achieved</div>
                                  </div>
                                </div>

                                {/* Failed Concepts Log */}
                                <div className="space-y-3">
                                  <div className="text-xs font-bold uppercase tracking-wider text-[#000a1e]">
                                    Detailed Question Traces &amp; Misconceptions:
                                  </div>

                                  {trace.failedConcepts.map((item, cIdx) => (
                                    <div key={cIdx} className="p-3.5 rounded-xl bg-[#f0f3ff]/80 border border-slate-200 space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-[#000a1e]">
                                        <span className="flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                          {item.topic}
                                        </span>
                                        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                          {item.gapSeverity} Impact Gap
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-[#44474e] italic">
                                        &ldquo;{item.questionSummary}&rdquo;
                                      </p>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                                          <strong className="block text-[10px] uppercase font-bold text-rose-700">Learner Submitted:</strong>
                                          {item.learnerResponse}
                                        </div>
                                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                                          <strong className="block text-[10px] uppercase font-bold text-emerald-700">MoSPI Standard Expectation:</strong>
                                          {item.expectedStandard}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TAB 4: AI SYNTHESIS & CADRE BENCHMARK */}
                        {activeEvidenceTab === 'OVERVIEW' && (
                          <div className="space-y-4">
                            {/* AI Diagnosis Summary */}
                            <div className="p-4 rounded-2xl bg-[#fe9832]/10 border border-[#fe9832]/30 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#000a1e]">
                                <Sparkles className="w-4 h-4 text-[#fe9832]" />
                                AI Diagnostic Root-Cause Explanation
                              </div>
                              <p className="text-xs sm:text-sm text-[#44474e] leading-relaxed font-medium">
                                {current.aiDiagnosis}
                              </p>
                            </div>

                            {/* Cadre Benchmark Comparison */}
                            <div className="p-4 rounded-2xl bg-[#000a1e] text-white space-y-3 shadow-md">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#fe9832] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-[#fe9832]" />
                                  Cadre Standard Benchmark Analysis
                                </span>
                                <span className="text-[10px] text-slate-300">
                                  {detailedEvidence.cadreBenchmark.targetCadre}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <div className="text-[10px] text-slate-400">Required Benchmark</div>
                                  <div className="text-lg font-bold text-white mt-0.5">
                                    {detailedEvidence.cadreBenchmark.expectedScore}%
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <div className="text-[10px] text-slate-400">Officer Score</div>
                                  <div className="text-lg font-bold text-[#fe9832] mt-0.5">
                                    {detailedEvidence.cadreBenchmark.learnerScore}%
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <div className="text-[10px] text-slate-400">Cadre Percentile</div>
                                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                                    {detailedEvidence.cadreBenchmark.cadrePercentile}th
                                  </div>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-white/10">
                                {detailedEvidence.cadreBenchmark.gapSeverityExplanation}
                              </p>
                            </div>

                            {/* Evidence Scores Breakdown */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#74777f]">
                                  Triangulated Empirical Evidence
                                </h5>
                                <span className="text-[10px] text-[#74777f]">
                                  Assessment vs Applied Execution Signals
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/30">
                                  <div className="text-xs text-[#74777f]">Diagnostic Test Score</div>
                                  <div className="text-xl font-bold text-[#002147] mt-1">
                                    {current.evidenceBase?.diagnosticAssessment ?? matchedComp?.evidence?.diagnosticScore ?? 50}%
                                  </div>
                                  <div className="text-[10px] text-[#44474e] mt-0.5">
                                    Conceptual knowledge benchmark from DB
                                  </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/30">
                                  <div className="text-xs text-[#74777f]">Practical Scenario Score</div>
                                  <div className="text-xl font-bold text-[#fe9832] mt-1">
                                    {current.evidenceBase?.practicalTask ?? matchedComp?.evidence?.practicalScore ?? 45}%
                                  </div>
                                  <div className="text-[10px] text-[#44474e] mt-0.5">
                                    Applied workflow execution benchmark from DB
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Why Learning is Recommended */}
                            {current.whyRecommended && current.whyRecommended.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#74777f]">
                                  AI Recommendation Rationale
                                </h5>
                                <ul className="space-y-2">
                                  {current.whyRecommended.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-[#44474e]">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Immediate Learning Action Buttons */}
                        <div className="pt-4 border-t border-[#c4c6cf]/30 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              setIsGapCheckerOpen(false);
                              setIsPracticeLabOpen(true);
                            }}
                            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Launch Simulation Lab</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsGapCheckerOpen(false);
                              openQuiz(current.competencyName);
                            }}
                            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-[#fe9832]" />
                            <span>Take Assessment</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsGapCheckerOpen(false);
                              setActiveTab('recommendations');
                            }}
                            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f0f3ff] hover:bg-[#e4ebff] text-[#002147] text-xs font-bold rounded-xl border border-[#c4c6cf]/60 shadow-xs transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#fe9832]" />
                            <span>View Courses &amp; Pathway</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#74777f]">
                  No priority gaps currently recorded for this officer profile.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
