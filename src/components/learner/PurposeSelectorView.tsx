import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  BrainCircuit,
  Compass,
  Award,
  Layers,
  ShieldCheck,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export interface CapacityPurpose {
  id: string;
  title: string;
  category: string;
  description: string;
  targetRole: string;
  estimatedDuration: string;
  targetCompetencies: string[];
  recommendedTrack: string;
  badge: string;
}

export const PURPOSE_OPTIONS: CapacityPurpose[] = [
  {
    id: 'promotion-progression',
    title: 'Cadre Promotion & Career Progression (JSO → SSO / SSO → Director)',
    category: 'Cadre Benchmark',
    description: 'Fulfill mandatory TPAC/NSSTA competency thresholds required for senior gazetted postings and Departmental Promotion Committees (DPC).',
    targetRole: 'Senior Statistical Officer / Assistant Director',
    estimatedDuration: '4 Weeks Accelerated',
    targetCompetencies: ['Python', 'Survey Methodology', 'National Accounts (SNA 2008)', 'Official Data Governance'],
    recommendedTrack: 'Executive Statistical Cadre Readiness Pathway',
    badge: 'High Priority',
  },
  {
    id: 'survey-operations',
    title: 'Survey Sampling & Household Field Operations (PLFS / NSSO / ASI)',
    category: 'Field Operations',
    description: 'Master multi-stage stratified sampling, CAPI digital data collection, multiplier weight calibration, and non-sampling error minimization.',
    targetRole: 'Field Survey Supervisor / Microdata Analyst',
    estimatedDuration: '3 Weeks',
    targetCompetencies: ['Survey Methodology', 'Sampling Frame Allocation', 'Data Cleaning & Validation', 'Python'],
    recommendedTrack: 'NSSO Household Survey & Microdata Processing Track',
    badge: 'Operational',
  },
  {
    id: 'national-accounts',
    title: 'National Accounts Modernization & Macroeconomic Aggregates (SNA 2008)',
    category: 'Economic Statistics',
    description: 'Master supply-use tables, chain-volume index calculation, informal sector estimation, and gross value added (GVA) deflator mechanics.',
    targetRole: 'National Accounts Officer / Macroeconomist',
    estimatedDuration: '4 Weeks',
    targetCompetencies: ['National Accounts (SNA 2008)', 'Macroeconomic Aggregates', 'Index Construction', 'Data Governance'],
    recommendedTrack: 'CSO National Accounts Division (NAD) Specialization',
    badge: 'Specialized',
  },
  {
    id: 'price-indices',
    title: 'Price Statistics, CPI Revision & Hedonic Quality Adjustments',
    category: 'Price Analytics',
    description: 'Learn modern scanner data handling, web-scraped price indices, hedonic regression modeling, and base year rebasing methodologies.',
    targetRole: 'Price Statistics Analyst',
    estimatedDuration: '2 Weeks',
    targetCompetencies: ['Price Indices & Inflation Modeling', 'Data Visualization', 'Python', 'Statistical Disclosure Control'],
    recommendedTrack: 'MoSPI Price Statistics & Index of Industrial Production Track',
    badge: 'Technical',
  },
  {
    id: 'data-science-computing',
    title: 'Modern Statistical Computing, Python/Pandas & Automated Tabulation',
    category: 'Applied Tech',
    description: 'Transition from legacy manual spreadsheets to reproducible Python scripts, automated outlier imputation, and interactive dashboarding.',
    targetRole: 'Statistical Data Scientist / Lead Analyst',
    estimatedDuration: '3 Weeks',
    targetCompetencies: ['Python', 'Data Visualization', 'Data Imputation & Grouping', 'Automated Reporting'],
    recommendedTrack: 'Applied Data Science & Modern Computing for MoSPI',
    badge: 'In-Demand',
  },
  {
    id: 'data-privacy-sdc',
    title: 'Statistical Disclosure Control (SDC) & Open Microdata Dissemination',
    category: 'Data Governance',
    description: 'Apply k-anonymity, l-diversity, and microaggregation protocols to protect citizen confidentiality under NDSAP and DPDP Act.',
    targetRole: 'Data Dissemination Officer / Quality Auditor',
    estimatedDuration: '2 Weeks',
    targetCompetencies: ['Statistical Disclosure Control', 'Data Governance', 'Microdata Anonymization'],
    recommendedTrack: 'Open Microdata Dissemination & Privacy Standards',
    badge: 'Compliance',
  },
];

export const PurposeSelectorView: React.FC = () => {
  const { currentUser, setActiveTab, setIsAIGapCheckerOpen, showNotification, applyPurpose } = useAuth();
  
  const [selectedPurposeId, setSelectedPurposeId] = useState<string>('promotion-progression');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedPurpose = PURPOSE_OPTIONS.find((p) => p.id === selectedPurposeId) || PURPOSE_OPTIONS[0];

  const filteredPurposes = PURPOSE_OPTIONS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetCompetencies.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Cadre Benchmark', 'Field Operations', 'Economic Statistics', 'Price Analytics', 'Applied Tech', 'Data Governance'];

  const handleApplyPurposeAndProceed = async () => {
    setIsSaving(true);
    try {
      if (selectedPurpose) {
        const success = await applyPurpose({
          purposeId: selectedPurpose.id,
          title: selectedPurpose.title,
          targetRole: selectedPurpose.targetRole,
          targetCompetencies: selectedPurpose.targetCompetencies,
        });

        if (success) {
          showNotification(
            'Target Pathway Configured',
            `Calibrated requirements for ${selectedPurpose.title}. Opening AI Skill Gap Diagnostic...`,
            'success'
          );
          setTimeout(() => {
            setIsSaving(false);
            setActiveTab('dashboard');
            setIsAIGapCheckerOpen(true);
          }, 300);
        } else {
          setIsSaving(false);
        }
      }
    } catch (err) {
      setIsSaving(false);
      showNotification('Error', 'Could not apply learning objective', 'warning');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#0f172a]">
      {/* Step Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                Step 1 of 6: Capacity Purpose &amp; Objective
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Officer: {currentUser?.name}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              Select Capacity Building Purpose &amp; Specialization
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Define your primary administrative objective or target posting. NIPUN will automatically align your empirical gap prediction, iGOT Karmayogi tracks, and NSSTA residential nominations to this exact benchmark.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleApplyPurposeAndProceed}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#002147] hover:bg-[#001833] text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <span>{isSaving ? 'Configuring Pathway...' : 'Confirm & Predict Skill Gaps'}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* 6-Step Workflow Breadcrumb */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#002147] text-white font-semibold flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="truncate">Purpose Selection</span>
          </div>
          <div
            onClick={() => {
              setActiveTab('dashboard');
              setIsAIGapCheckerOpen(true);
            }}
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <span className="w-4 h-4 rounded bg-white text-slate-600 border border-slate-300 flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="truncate">Gap Predictor</span>
          </div>
          <div
            onClick={() => setActiveTab('recommendations')}
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <span className="w-4 h-4 rounded bg-white text-slate-600 border border-slate-300 flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="truncate">Accredited Courses</span>
          </div>
          <div
            onClick={() => setActiveTab('learning-path')}
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <span className="w-4 h-4 rounded bg-white text-slate-600 border border-slate-300 flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="truncate">ICBP Path</span>
          </div>
          <div
            onClick={() => setActiveTab('dashboard')}
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <span className="w-4 h-4 rounded bg-white text-slate-600 border border-slate-300 flex items-center justify-center text-[10px] font-bold">5</span>
            <span className="truncate">Simulation Labs</span>
          </div>
          <div
            onClick={() => setActiveTab('passport')}
            className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <span className="w-4 h-4 rounded bg-white text-slate-600 border border-slate-300 flex items-center justify-center text-[10px] font-bold">6</span>
            <span className="truncate">Cadre Passport</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#002147] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Purpose Domains' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search objectives or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Purpose Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPurposes.map((purpose) => {
          const isSelected = selectedPurposeId === purpose.id;
          return (
            <div
              key={purpose.id}
              onClick={() => setSelectedPurposeId(purpose.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 ${
                isSelected
                  ? 'bg-slate-50/80 border-[#002147] shadow-xs ring-1 ring-[#002147]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {purpose.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {purpose.badge}
                    </span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center ${
                        isSelected ? 'bg-[#002147] text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 font-['Public_Sans',sans-serif] leading-snug">
                  {purpose.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {purpose.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                  <p className="text-slate-600">
                    <strong className="text-slate-900 font-semibold">Target Post:</strong> {purpose.targetRole}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-900 font-semibold">Duration:</strong> {purpose.estimatedDuration}
                  </p>
                </div>

                {/* Target Competencies */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Core Competencies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {purpose.targetCompetencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {isSelected ? 'Active Purpose Selected' : 'Click to select this purpose'}
                </span>
                <span className="text-xs font-semibold text-[#002147] flex items-center gap-1">
                  Select <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Action Panel */}
      {selectedPurpose && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Selected Specialization Pathway
            </span>
            <h4 className="text-base font-bold text-slate-900 font-['Public_Sans',sans-serif]">
              {selectedPurpose.title}
            </h4>
            <p className="text-xs text-slate-600 max-w-2xl">
              Ready to calibrate empirical diagnostic analysis against the <strong>{selectedPurpose.targetRole}</strong> competency standard.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleApplyPurposeAndProceed}
              disabled={isSaving}
              className="w-full md:w-auto px-4 py-2.5 bg-[#002147] hover:bg-[#001833] text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSaving ? 'Processing...' : 'Proceed to Step 2: AI Skill Gap Diagnostic'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
