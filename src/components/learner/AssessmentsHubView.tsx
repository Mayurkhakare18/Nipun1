import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GapAnalysisResult, LearnerCompetency } from '../../types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  Zap,
  Layers,
  HelpCircle,
  BarChart2,
  BrainCircuit,
} from 'lucide-react';

export const AssessmentsHubView: React.FC = () => {
  const {
    currentUser,
    competencies,
    openQuiz,
    openReassessment,
    openDocIntelligence,
    setIsLabModalOpen,
    setIsGapCheckerOpen,
  } = useAuth();

  const [gaps, setGaps] = useState<GapAnalysisResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DIAGNOSTIC' | 'REASSESSMENT' | 'DOCUMENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGaps = async () => {
      try {
        setIsLoading(true);
        const res = await api.getLearnerGaps();
        if (res.success && res.gaps) {
          setGaps(res.gaps);
        }
      } catch (err) {
        console.error('Failed to load assessment gaps:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGaps();
  }, []);

  const assessmentItems = [
    {
      id: 'diag-python',
      title: 'Python for Statistical Computing — Baseline Diagnostic',
      type: 'DIAGNOSTIC',
      competency: 'Python Functions',
      cadreLevel: 'Level 2 → Level 3',
      duration: '15 Mins',
      questionsCount: 5,
      status: 'AVAILABLE',
      score: 82,
      lastTaken: '24 Aug 2026',
      description: 'Pre-training empirical baseline evaluation testing data analysis functions, NumPy vectorization, and pandas DataFrame transformations.',
      primaryActionLabel: 'Start Assessment',
      action: () => openQuiz('Python Functions'),
      tag: 'Pre-Course Diagnostic',
      tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'reassess-python',
      title: 'Python Level 3 Competency Reassessment',
      type: 'REASSESSMENT',
      competency: 'Python for Statistical Computing',
      cadreLevel: 'Level 3 Verification',
      duration: '20 Mins',
      questionsCount: 8,
      status: 'AVAILABLE',
      score: null,
      lastTaken: null,
      description: 'Post-learning verification to validate skill gap closure and upgrade your MoSPI National Competency Passport to Level 3.',
      primaryActionLabel: 'Reassess Competency',
      action: openReassessment,
      tag: 'Post-Learning Verification',
      tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'diag-sampling',
      title: 'Survey Sampling & Estimation Diagnostic',
      type: 'DIAGNOSTIC',
      competency: 'Survey Sampling',
      cadreLevel: 'Level 3 → Level 4',
      duration: '20 Mins',
      questionsCount: 6,
      status: 'COMPLETED',
      score: 90,
      lastTaken: '18 Aug 2026',
      description: 'Stratified multi-stage sampling weights, FSU/USU frame allocations, and non-response adjustment methods.',
      primaryActionLabel: 'Retake Diagnostic',
      action: () => openQuiz('Survey Sampling'),
      tag: 'Pre-Course Diagnostic',
      tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'doc-intelligence',
      title: 'MoSPI Circular & Manual MCQ Generator',
      type: 'DOCUMENT',
      competency: 'Policy & Methodology Manuals',
      cadreLevel: 'All Levels',
      duration: 'Custom',
      questionsCount: 'Dynamic',
      status: 'AVAILABLE',
      score: null,
      lastTaken: null,
      description: 'Upload any official MoSPI survey instruction manual, NSSO round guidelines, or circular PDF to automatically generate interactive practice questions.',
      primaryActionLabel: 'Upload Manual & Start',
      action: openDocIntelligence,
      tag: 'Document Intelligence',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'lab-simulation',
      title: 'NSS & PLFS Microdata Practical Simulation Task',
      type: 'DIAGNOSTIC',
      competency: 'National Accounts Analysis',
      cadreLevel: 'Level 3 Practical',
      duration: '30 Mins',
      questionsCount: 'Interactive Code Lab',
      status: 'AVAILABLE',
      score: 75,
      lastTaken: '20 Aug 2026',
      description: 'Interactive browser sandbox: compute sampling weights, impute missing values, and calculate quarterly sectoral GDP estimates.',
      primaryActionLabel: 'Launch Practical Lab',
      action: () => setIsLabModalOpen(true),
      tag: 'Practical Simulation',
      tagColor: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  ];

  const filteredItems = assessmentItems.filter((item) => {
    const matchesFilter = activeFilter === 'ALL' || item.type === activeFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.competency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* 1. Official Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                MoSPI Unified Assessment Portal
              </span>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                FRAC Aligned • Pre &amp; Post Verification
              </span>
            </div>
            <h1 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              Assessments &amp; Competency Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Consolidated evaluation hub for pre-course diagnostic benchmarking, post-learning skill gap verification, and circular document-based assessments.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsGapCheckerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#002147] hover:bg-[#001833] text-white text-xs font-bold rounded-lg border border-[#fe9832]/40 transition-all shadow-xs cursor-pointer group"
              title="Open AI Gap Diagnostic Engine"
            >
              <BrainCircuit className="w-4 h-4 text-[#fe9832] group-hover:scale-110 transition-transform" />
              <span>AI GAP CHECKER</span>
            </button>

            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-center px-3 border-r border-slate-200">
                <div className="text-lg font-bold text-slate-900 font-['Public_Sans',sans-serif]">
                  82%
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Avg Score</div>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <div className="text-lg font-bold text-emerald-700 font-['Public_Sans',sans-serif]">
                  4
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Completed</div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-bold text-amber-700 font-['Public_Sans',sans-serif]">
                  1
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Pending Reassessment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Assessments ({assessmentItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('DIAGNOSTIC')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeFilter === 'DIAGNOSTIC'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diagnostics
            </button>
            <button
              onClick={() => setActiveFilter('REASSESSMENT')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeFilter === 'REASSESSMENT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reassessments
            </button>
            <button
              onClick={() => setActiveFilter('DOCUMENT')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeFilter === 'DOCUMENT'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document MCQs
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assessment by topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${item.tagColor}`}>
                  {item.tag}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.duration}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                <span>Target: <strong className="text-slate-700">{item.cadreLevel}</strong></span>
                <span>•</span>
                {item.score !== null ? (
                  <span>Score: <strong className="text-emerald-700">{item.score}%</strong></span>
                ) : (
                  <span className="text-amber-700 font-semibold">Not Attempted</span>
                )}
              </div>
            </div>

            {/* ONE Primary Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {item.lastTaken ? `Last taken: ${item.lastTaken}` : 'Ready to start'}
              </div>

              <button
                onClick={item.action}
                className="px-4 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>{item.primaryActionLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
