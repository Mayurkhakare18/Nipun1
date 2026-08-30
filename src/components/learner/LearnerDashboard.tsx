import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GapAnalysisResult, LearningPath, UnifiedRecommendation } from '../../types';
import { calculateNextPrioritySkill, PrioritySkillRecommendation } from '../../utils/prioritySkill';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  BookOpen,
  Clock,
  TrendingUp,
  BrainCircuit,
  FileCheck,
  ChevronRight,
  Target,
  Zap,
  Check,
  Search,
  FileText,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Layers,
  Upload,
  LogOut,
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const {
    currentUser,
    competencies,
    prioritySkill: authPrioritySkill,
    setActiveTab,
    setIsGapCheckerOpen,
    openQuiz,
    setIsLabModalOpen,
    setIsAIMentorOpen,
    setIsProfileModalOpen,
    openIgotCourse,
    openReassessment,
    openDocIntelligence,
    showNotification,
    logout,
  } = useAuth();

  const [gaps, setGaps] = useState<GapAnalysisResult[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [recommendations, setRecommendations] = useState<UnifiedRecommendation[]>([]);
  const [activePrioritySkill, setActivePrioritySkill] = useState<PrioritySkillRecommendation | null>(authPrioritySkill);
  const [activeViewMode, setActiveViewMode] = useState<'gaps' | 'all'>('gaps');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [gapsResult, pathResult, recsResult] = await Promise.allSettled([
          api.getLearnerGaps(),
          api.getLearningPath(),
          api.getUnifiedRecommendations(),
        ]);

        if (!isMounted) return;

        let activeGaps = gaps;
        let activeRecs = recommendations;

        if (gapsResult.status === 'fulfilled' && gapsResult.value.success && gapsResult.value.gaps?.length) {
          activeGaps = gapsResult.value.gaps;
          setGaps(activeGaps);
        }
        if (recsResult.status === 'fulfilled' && recsResult.value.success && recsResult.value.recommendations?.length) {
          activeRecs = recsResult.value.recommendations;
          setRecommendations(activeRecs);
        }
        if (pathResult.status === 'fulfilled' && pathResult.value.success && pathResult.value.learningPath) {
          setLearningPath(pathResult.value.learningPath);
        }

        const computed = calculateNextPrioritySkill(
          currentUser,
          activeGaps,
          competencies,
          activeRecs
        );
        setActivePrioritySkill(computed || authPrioritySkill);
      } catch (err) {
        console.warn('Dashboard data fetch notification:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, competencies, authPrioritySkill]);

  const pSkill = activePrioritySkill || authPrioritySkill;

  // Determine the single next best action based on current state
  const getNextBestAction = () => {
    if (!gaps || gaps.length === 0) {
      return {
        title: 'All Target Competencies Verified',
        description: 'You have cleared all baseline competency gaps for your cadre benchmark.',
        ctaLabel: 'View Competency Passport',
        action: () => setActiveTab('competencies'),
        statusBadge: 'Cadre Benchmark Cleared',
      };
    }

    // Check if there is an in-progress or recommended step
    const currentStep = learningPath?.items.find((item) => item.status === 'IN_PROGRESS');
    if (currentStep) {
      return {
        title: `Continue: ${currentStep.title}`,
        description: currentStep.reason || `Currently active coursework in your official MoSPI capacity pathway.`,
        ctaLabel: 'Continue Learning',
        action: () => setActiveTab('learning-path'),
        statusBadge: 'Learning In Progress',
      };
    }

    // Default priority recommendation
    if (pSkill?.nextBestAction?.type === 'SIMULATION_LAB') {
      return {
        title: `Practical Task: ${pSkill.competencyName}`,
        description: pSkill.aiDiagnosis || 'Complete hands-on statistical simulation task to close application deficit.',
        ctaLabel: 'Launch Practical Lab',
        action: () => setIsLabModalOpen(true),
        statusBadge: 'Practical Simulation',
      };
    }

    if (pSkill?.nextBestAction?.type === 'REASSESSMENT') {
      return {
        title: `Verify Gap Closure: ${pSkill.competencyName}`,
        description: 'Validate post-learning mastery to elevate your official Competency Passport.',
        ctaLabel: 'Reassess Competency',
        action: openReassessment,
        statusBadge: 'Verification Ready',
      };
    }

    return {
      title: `Recommended Step: ${pSkill?.competencyName || 'Statistical Computing'}`,
      description: pSkill?.aiDiagnosis || 'Empirical diagnostic indicates an application gap for target role requirements.',
      ctaLabel: 'View Learning Path',
      action: () => setActiveTab('learning-path'),
      statusBadge: 'Next Best Action',
    };
  };

  const nextAction = getNextBestAction();

  // Filter competencies
  const filteredCompetencies = competencies.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredGaps = gaps.filter((g) =>
    g.competencyName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.gapType.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* 1. Official MoSPI Cadre Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                MoSPI National Statistical Cadre
              </span>
              <span className="font-mono text-xs text-slate-500">
                Cadre ID: <strong className="text-slate-800">{currentUser?.employeeId || 'MOSPI-2024-8842'}</strong>
              </span>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                FRAC Certified • Level {currentUser?.level || 2}
              </span>
            </div>

            <h1 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              {currentUser?.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600">
              {currentUser?.designation} • {currentUser?.ministry} • Base Station: Greater Noida (NSSTA Region)
            </p>
          </div>

          {/* Target Role & Profile Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <Target className="w-4 h-4 text-amber-600" />
              <span>Target: {currentUser?.targetRole?.split('/')[0] || 'Senior Statistical Officer'}</span>
            </button>

            <button
              onClick={() => setIsAIMentorOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span>AI Mentor</span>
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-200 transition-all cursor-pointer shadow-2xs"
              title="Sign out of your official session"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* YOUR COMPETENCY STATUS with Prominent [ AI GAP CHECKER ] Button */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                MoSPI FRAC Standards
              </span>
              <span className="text-xs text-slate-500">Cadre Benchmark Analysis</span>
            </div>
            <h2 className="text-lg font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              YOUR COMPETENCY STATUS
            </h2>
          </div>

          {/* THE SINGLE PROMINENT AI GAP CHECKER BUTTON */}
          <button
            onClick={() => setIsGapCheckerOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#002147] hover:bg-[#001833] text-white text-xs font-black rounded-xl shadow-xs transition-all border border-[#fe9832]/40 hover:shadow-md cursor-pointer group shrink-0"
            title="Analyze learner profile, diagnostic assessment results, and role requirements"
          >
            <BrainCircuit className="w-4 h-4 text-[#fe9832] group-hover:scale-110 transition-transform" />
            <span className="tracking-wide font-['Public_Sans',sans-serif]">AI GAP CHECKER</span>
          </button>
        </div>

        {/* 4 Core Quantitative Metrics */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Readiness</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+8% Q3</span>
            </div>
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 mt-1">
              {currentUser?.roleReadiness || 68}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Benchmark Target: 85%</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Skill Gaps</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Active</span>
            </div>
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-amber-700 mt-1">
              {gaps.length || 4}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Priority Competencies</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verified Skills</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-emerald-700 mt-1">
              {currentUser?.verifiedSkillsCount || 13} <span className="text-sm font-normal text-slate-500">/ 17</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Verified on Passport</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">iGOT / NSSTA Hours</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 mt-1">
              {currentUser?.trainingHours || 32} <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Accredited Learning</div>
          </div>
        </div>
      </div>

      {/* 2. THE SINGLE "NEXT BEST ACTION" CARD (What should I do next?) */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#000a1e] to-[#002147] text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {nextAction.statusBadge}
              </span>
              <span className="text-xs text-slate-300">
                Target Role Benchmark: <strong className="text-white">{currentUser?.targetRole || 'Senior Statistical Officer'}</strong>
              </span>
            </div>

            <h2 className="text-xl font-bold font-['Public_Sans',sans-serif] text-white">
              {nextAction.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {nextAction.description}
            </p>
          </div>

          {/* ONE Primary Button */}
          <div className="shrink-0">
            <button
              onClick={nextAction.action}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>{nextAction.ctaLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Actionable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Competency Gaps & Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                  Cadre Competency Status
                </h3>
                <p className="text-xs text-slate-500">
                  Benchmarked against MoSPI Standards for {currentUser?.targetRole?.split('/')[0] || 'Target Cadre'}
                </p>
              </div>

              {/* Clean Segmented Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  onClick={() => setActiveViewMode('gaps')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    activeViewMode === 'gaps'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Priority Gaps ({gaps.length})
                </button>
                <button
                  onClick={() => setActiveViewMode('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    activeViewMode === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Competencies ({competencies.length})
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search competencies by keyword or domain..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              />
            </div>

            {/* List of items with ONE clear action */}
            {activeViewMode === 'gaps' ? (
              <div className="space-y-3">
                {filteredGaps.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    No active gaps matching search criteria.
                  </div>
                ) : (
                  filteredGaps.map((gap) => (
                    <div
                      key={gap.competencyId}
                      className="p-4 rounded-lg bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {gap.competencyName}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            {gap.gapType.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-700 shrink-0">
                          Level {gap.currentLevel} → Level {gap.requiredLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {gap.aiDiagnosis}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Diagnostic Score: <strong className="text-slate-700">{gap.evidenceBase.diagnosticAssessment}%</strong></span>
                          <span>Practical Task: <strong className="text-slate-700">{gap.evidenceBase.practicalTask}%</strong></span>
                        </div>

                        <button
                          onClick={() => setActiveTab('learning-path')}
                          className="px-3 py-1.5 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-md transition-all cursor-pointer self-end sm:self-auto flex items-center gap-1"
                        >
                          <span>View Learning Path</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {filteredCompetencies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${comp.currentLevel >= comp.requiredLevel ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                      <span className="font-medium text-slate-900">{comp.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-500">
                        Level {comp.currentLevel} / {comp.requiredLevel}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        comp.currentLevel >= comp.requiredLevel
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {comp.currentLevel >= comp.requiredLevel ? 'Verified' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Active Roadmap & Practice Tools */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Learning Path */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                  Active Roadmap Progress
                </h3>
                <p className="text-xs text-slate-500">
                  {learningPath?.progressPercentage || 0}% Milestones Completed
                </p>
              </div>
              <button
                onClick={() => setActiveTab('learning-path')}
                className="text-xs font-semibold text-[#002147] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Full Pathway</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-[#002147] h-full rounded-full transition-all duration-500"
                style={{ width: `${learningPath?.progressPercentage || 0}%` }}
              />
            </div>

            <div className="space-y-2">
              {learningPath?.items.slice(0, 4).map((step, sIdx) => (
                <div
                  key={step.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        step.status === 'COMPLETED' || step.status === 'VERIFIED'
                          ? 'bg-emerald-600 text-white'
                          : step.status === 'IN_PROGRESS'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {step.status === 'COMPLETED' || step.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        sIdx + 1
                      )}
                    </div>
                    <span className="font-medium text-slate-800 truncate">
                      {step.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">
                    {step.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('learning-path')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue Learning Pathway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MoSPI PDF Document Intelligence & Practice */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 text-[#002147] border border-slate-200">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">MoSPI Circulars &amp; Manuals</h4>
                <p className="text-[11px] text-slate-500">
                  MCQ Generation from Official Methodologies
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload official MoSPI survey instruction manuals or circulars to practice diagnostic MCQs aligned with national statistical frameworks.
            </p>

            <button
              onClick={openDocIntelligence}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload MoSPI Manual / Circular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
