import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NipunLogo } from '../common/NipunLogo';
import {
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  BookOpen,
  Code,
  Award,
  BrainCircuit,
  HelpCircle,
  Play,
  Users,
  Check,
  Zap,
  Download,
  Info,
  ChevronRight,
  FileSpreadsheet,
  BarChart3,
  Flame,
  Clock,
  ShieldCheck,
  Cpu,
  RefreshCw,
  ExternalLink,
  Laptop,
  Compass,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    activeLearner,
    competencies,
    gaps,
    setActiveTab,
    setIsDemoSelectorOpen,
    setIsProfileWizardOpen,
    setIsAIGapCheckerOpen,
    setIsAIMentorOpen,
    setIsPracticeLabOpen,
    openQuiz,
    switchUserRole,
    exportPassportReport,
    openAuthModal,
    launchWorkspace,
    requireAuth,
  } = useAuth();

  const [activeStage, setActiveStage] = useState(1);
  const totalStages = 6;

  // 18-second animated loop progression (3 seconds per stage)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev >= totalStages ? 1 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [totalStages]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Find priority Python gap or fallback
  const pythonGap = gaps.find((g) => g.competencyName.toLowerCase().includes('python')) || gaps[0];
  const pythonCompetency = competencies.find((c) => c.name.toLowerCase().includes('python'));
  const verifiedCount = competencies.filter((c) => c.currentLevel >= c.requiredLevel).length || 14;
  const developingCount = competencies.filter((c) => c.currentLevel < c.requiredLevel).length || 3;

  return (
    <div className="bg-background text-on-surface font-body-md antialiased overflow-x-hidden pt-[112px]">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-container text-on-primary px-4 py-2 z-50 rounded-[12px]"
        href="#main-content"
      >
        Skip to main content
      </a>

      {/* Government Utility Strip */}
      <div className="fixed top-0 left-0 w-full z-50 h-8 bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-full flex justify-between items-center text-xs text-on-surface-variant font-medium">
          <span className="font-semibold text-primary-container tracking-tight truncate mr-2">
            Government of India • Ministry of Statistics and Programme Implementation
          </span>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
            {currentUser && isAuthenticated ? (
              <>
                <span
                  className="hidden sm:inline hover:underline cursor-pointer"
                  onClick={() => setIsDemoSelectorOpen(true)}
                >
                  Role: <strong className="font-semibold text-on-surface">{currentUser?.role || 'Learner'}</strong> ({currentUser?.name})
                </span>
                <button
                  onClick={() => setIsDemoSelectorOpen(true)}
                  className="text-xs text-primary-container font-semibold hover:underline cursor-pointer"
                >
                  Switch Role
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="text-xs text-primary-container font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Officer Sign In</span>
              </button>
            )}
            <span className="text-outline-variant hidden sm:inline">|</span>
            <span className="text-on-surface-variant hidden sm:inline">Accessibility</span>
            <span className="text-outline-variant">|</span>
            <span className="text-on-surface-variant">English</span>
          </div>
        </div>
      </div>

      {/* TopNavBar */}
      <header className="fixed top-8 left-0 right-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <NipunLogo variant="horizontal" size="md" />
          </div>

          {/* Right-aligned Navigation Links and Actions */}
          <div className="flex items-center gap-4 lg:gap-8 ml-auto shrink-0">
            <nav className="hidden md:flex gap-6 lg:gap-8 items-center">
              <a
                className="text-sm font-bold text-primary-container border-b-2 border-primary-container pb-0.5 transition-all duration-200 focus:outline-none"
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('main-content');
                }}
              >
                About
              </a>
              <a
                className="text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container rounded-md px-1"
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }}
              >
                How It Works
              </a>
              <a
                className="text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container rounded-md px-1"
                href="#for-institutions"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('for-institutions');
                }}
              >
                For Institutions
              </a>
              <button
                onClick={() => launchWorkspace('dashboard')}
                className="text-sm font-bold text-primary-container hover:opacity-80 transition-opacity duration-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Platform Hub →</span>
              </button>
            </nav>

            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                onClick={() => openAuthModal('signin')}
                className="text-xs sm:text-sm font-bold text-primary-container hidden sm:inline-flex items-center justify-center hover:bg-surface-container-low px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer border border-outline-variant"
              >
                Officer Sign In
              </button>
              <button
                onClick={() => launchWorkspace('dashboard')}
                className="bg-primary-container text-on-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-opacity-90 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Explore Platform →</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full outline-none" id="main-content" tabIndex={-1}>
        {/* Unified Hero & Competency Intelligence Section */}
        <section className="relative bg-background min-h-[90vh] flex items-center overflow-hidden w-full pt-16 md:pt-0">
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              alt="National Statistical Office Data Workshop"
              className="w-full h-full object-cover object-center opacity-70 transition-opacity duration-700"
              src="/hero-bg.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = '/Gemini_Generated_Image_5xgc0x5xgc0x5xgc.png';
                }
              }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-surface-container/35"></div>
          </div>
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10 py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="flex flex-col gap-6 relative lg:col-span-8 mx-auto">
                {/* Technical Details / Competency Indicators */}
                <div className="absolute -top-12 left-0 flex gap-4 opacity-70">
                  <div className="flex items-center gap-2 bg-surface-container/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-outline-variant/50">
                    <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                    <span className="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
                      Live Analysis Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-outline-variant/50 hidden md:flex">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">radar</span>
                    <span className="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
                      Role Mapping: {activeLearner.designationShort || 'SSO'}
                    </span>
                  </div>
                </div>
                <h1 className="text-on-background drop-shadow-sm text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                  Learning that<br />understands<br />what you<br />need next.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  An AI-powered competency platform that identifies skill gaps, personalizes learning, and measures whether training actually improves job readiness. Every learning signal helps NIPUN refine your path.
                </p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-primary-container text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-background cursor-pointer font-bold"
                  >
                    Official Registration →
                  </button>
                  <button
                    onClick={() => launchWorkspace('dashboard')}
                    className="bg-surface-container-lowest border border-outline-variant text-on-background font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-surface-container-low transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-background cursor-pointer font-bold flex items-center gap-2"
                  >
                    <span>Explore All Platform Functions</span>
                    <span className="text-xs text-primary-container">→</span>
                  </button>
                </div>
                <div className="flex gap-6 mt-8 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Role-Based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Evidence-Based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Verified Competency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Competency Visualization */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-lowest border-b border-outline-variant">
          <div className="max-w-[1440px] mx-auto">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Start with your role.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">NIPUN automatically maps the competencies required for your specific designation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative">
              <div className="hidden md:block absolute top-8 left-1/6 right-1/6 w-2/3 h-px border-t border-dashed border-outline-variant z-0"></div>
              
              {/* Card 1: Target Role */}
              <div className="flex flex-col gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl relative z-10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-surface-container text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">1. Target Role</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background">{activeLearner.designation || 'Senior Statistical Officer'}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Level {activeLearner.payLevel || '11'} • {activeLearner.department || 'Ministry of Statistics'}</p>
              </div>

              {/* Card 2: Required Competencies */}
              <div className="flex flex-col gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl relative z-10 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-surface-container text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  </div>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">2. Required Competencies</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md text-on-background">Statistics</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded-lg text-primary-container">L4</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md text-on-background">Survey Methodology</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded-lg text-primary-container">L3</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md text-on-background">Python</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded-lg text-primary-container">L3</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md text-on-background">Data Visualization</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded-lg text-primary-container">L4</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-body-md text-body-md text-on-background">AI/ML</span>
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded-lg text-primary-container">L2</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Current Capability */}
              <div className="flex flex-col gap-4 bg-surface-container-lowest p-6 border border-outline-variant rounded-xl relative z-10 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-secondary-container">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/10 text-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                  </div>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-secondary-container">3. Current Capability</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-background">
                      <span>Statistics</span>
                      <span>L3 / L4</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-primary-container"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-label-sm font-label-sm mb-1 text-on-background">
                      <span>Survey Methodology</span>
                      <span>L3 / L3</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-primary-container"></div>
                    </div>
                  </div>
                  <div className="p-1 -m-1 rounded-lg">
                    <div className="flex justify-between text-label-sm font-label-sm mb-1 text-secondary-container">
                      <span className="font-bold flex items-center gap-1">Python <span className="material-symbols-outlined text-[13px]">analytics</span></span>
                      <span>{pythonCompetency ? `L${pythonCompetency.currentLevel} / L${pythonCompetency.requiredLevel}` : 'L2 / L3'} (Gap)</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
                      <div className="w-2/3 h-full bg-primary-container"></div>
                      <div className="w-1/3 h-full bg-secondary-container"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2.5: How NIPUN Works (Dynamic Visualization Diagram) */}
        <section id="how-it-works" className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-low border-b border-outline-variant overflow-hidden overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Your learning journey, intelligently adapted.</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">See how the NIPUN Competency Intelligence loop continuously refines your professional capabilities.</p>
          </div>
          <div className="w-full overflow-x-auto pb-8 custom-scrollbar max-w-[1200px] mx-auto bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm p-8">
            <div className="min-w-[960px] max-w-[960px] mx-auto relative hidden xl:block min-h-[500px]">
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ minHeight: '500px' }}>
                <path className="flow-line stroke-outline-variant/50" d="M 60,250 C 85,250 85,250 110,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-outline-variant/50" d="M 210,250 C 230,250 230,250 250,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-secondary-container/60" d="M 340,250 C 360,250 360,250 380,250" fill="none" strokeWidth="2.5"></path>
                <path className="flow-line stroke-primary-container/40" d="M 500,250 C 540,250 540,150 580,150" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-primary-container/40" d="M 500,250 C 540,250 540,250 580,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-primary-container/40" d="M 500,250 C 540,250 540,350 580,350" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-primary-container/40" d="M 680,150 C 710,150 710,250 740,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-primary-container/40" d="M 680,250 C 710,250 710,250 740,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-primary-container/40" d="M 680,350 C 710,350 710,250 740,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-green-500/50" d="M 820,250 C 840,250 840,250 860,250" fill="none" strokeWidth="2"></path>
                <path className="flow-line stroke-outline-variant/60" d="M 900,300 C 900,450 60,450 60,300" fill="none" strokeWidth="2"></path>
              </svg>
              {/* Nodes */}
              <div className="relative z-10 w-full h-[500px]">
                {/* 1. Role */}
                <div className="absolute left-0 top-[210px] w-24 select-none">
                  <div className={`border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 1 ? 'border-primary-container bg-primary-container text-on-primary scale-105' : 'bg-surface-container-lowest border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${activeStage === 1 ? 'text-on-primary' : 'text-primary-container'}`}>person</span>
                    <div className={`font-label-sm text-[11px] font-bold uppercase tracking-wide ${activeStage === 1 ? 'text-on-primary' : 'text-on-background'}`}>Role</div>
                  </div>
                </div>

                {/* 2. Required Competencies */}
                <div className="absolute left-[110px] top-[210px] w-32 select-none">
                  <div className={`border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 2 ? 'border-primary-container bg-primary-container text-on-primary scale-105' : 'bg-surface-container-lowest border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${activeStage === 2 ? 'text-on-primary' : 'text-primary-container'}`}>list_alt</span>
                    <div className={`font-label-sm text-[11px] font-bold uppercase tracking-wide ${activeStage === 2 ? 'text-on-primary' : 'text-on-background'}`}>Competencies</div>
                  </div>
                </div>

                {/* 3. Diagnostic */}
                <div className="absolute left-[250px] top-[210px] w-28 select-none">
                  <div className={`border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 3 ? 'border-primary-container bg-primary-container text-on-primary scale-105' : 'bg-surface-container-lowest border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${activeStage === 3 ? 'text-on-primary' : 'text-primary-container'}`}>query_stats</span>
                    <div className={`font-label-sm text-[11px] font-bold uppercase tracking-wide ${activeStage === 3 ? 'text-on-primary' : 'text-on-background'}`}>Diagnostic</div>
                  </div>
                </div>

                {/* 4. AI Gap Checker */}
                <div className="absolute left-[380px] top-[170px] w-48 select-none">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-container rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                    <div className={`bg-gradient-to-br from-primary-container to-inverse-surface border border-primary-container/20 rounded-3xl p-8 shadow-xl text-center relative z-10 transition-all ${activeStage === 4 ? 'ring-2 ring-secondary-container scale-105' : ''}`}>
                      <span className="material-symbols-outlined text-secondary-container text-5xl mb-3 drop-shadow-md">hub</span>
                      <div className="font-label-md text-sm font-bold text-on-primary uppercase tracking-wider">AI Gap Checker</div>
                    </div>
                  </div>
                </div>

                {/* 5. Branches (Vertically Stacked) */}
                <div className="absolute left-[580px] top-[110px] w-32 select-none">
                  <div className={`bg-surface-container-lowest border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 5 ? 'border-primary-container ring-1 ring-primary-container/50' : 'border-outline-variant'}`}>
                    <span className="material-symbols-outlined text-primary-container mb-2">psychology</span>
                    <div className="font-label-sm text-[11px] font-bold text-on-background uppercase tracking-wide">Root Cause</div>
                  </div>
                </div>
                <div className="absolute left-[580px] top-[210px] w-32 select-none">
                  <div className={`bg-surface-container-low border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 5 ? 'border-primary-container ring-1 ring-primary-container/50' : 'border-primary-container/20'}`}>
                    <span className="material-symbols-outlined text-primary-container mb-2">route</span>
                    <div className="font-label-sm text-[11px] font-bold text-primary-container uppercase tracking-wide">Custom Path</div>
                  </div>
                </div>
                <div className="absolute left-[580px] top-[310px] w-32 select-none">
                  <div className={`bg-surface-container-lowest border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 5 ? 'border-primary-container ring-1 ring-primary-container/50' : 'border-outline-variant'}`}>
                    <span className="material-symbols-outlined text-primary-container mb-2">model_training</span>
                    <div className="font-label-sm text-[11px] font-bold text-on-background uppercase tracking-wide">Practice</div>
                  </div>
                </div>

                {/* 6. Assess (Convergence Point) */}
                <div className="absolute left-[740px] top-[210px] w-28 select-none">
                  <div className={`bg-surface-container-lowest border rounded-2xl p-4 shadow-sm text-center transition-all ${activeStage === 6 ? 'border-primary-container bg-primary-container text-on-primary scale-105' : 'border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${activeStage === 6 ? 'text-on-primary' : 'text-primary-container'}`}>rule</span>
                    <div className={`font-label-sm text-[11px] font-bold uppercase tracking-wide ${activeStage === 6 ? 'text-on-primary' : 'text-on-background'}`}>Assess</div>
                  </div>
                </div>

                {/* 7. Verified Competency */}
                <div className="absolute left-[860px] top-[180px] w-40 select-none">
                  <div className="bg-green-50/50 border border-green-200 rounded-3xl p-5 shadow-sm text-center backdrop-blur-sm">
                    <span className="material-symbols-outlined text-green-600 text-3xl mb-2">verified</span>
                    <div className="font-label-sm text-[12px] font-bold text-green-800 uppercase tracking-wide">Verified Competency</div>
                    <div className="text-[10px] text-green-700 mt-2 font-medium">Role Readiness Achieved</div>
                  </div>
                </div>

                {/* Re-assess Label */}
                <div className="absolute left-[380px] top-[430px] bg-surface-container-lowest px-6 py-2.5 rounded-full border border-outline-variant/60 text-xs font-bold text-on-surface-variant flex items-center gap-2 shadow-sm select-none">
                  <span className="material-symbols-outlined text-[16px] animate-spin">cycle</span>
                  Continuous Loop: Re-assess → Adapt → Improve (Stage {activeStage}/{totalStages})
                </div>
              </div>
            </div>

            {/* Mobile Vertical View */}
            <div className="xl:hidden flex flex-col items-center gap-6 max-w-md mx-auto relative px-4">
              <div className="w-1 h-full absolute left-1/2 -translate-x-1/2 bg-outline-variant/30 top-0 bottom-0 z-0"></div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 w-full text-center relative z-10 flex flex-col items-center shadow-sm">
                <div className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2 py-1 rounded mb-2">01</div>
                <span className="material-symbols-outlined text-primary-container mb-1">person</span>
                <div className="font-label-md font-bold text-on-background uppercase">Role &amp; Competencies</div>
                <p className="text-xs text-on-surface-variant mt-2">Defines structural position and required skills.</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 w-full text-center relative z-10 flex flex-col items-center shadow-sm">
                <div className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2 py-1 rounded mb-2">02</div>
                <span className="material-symbols-outlined text-primary-container mb-1">query_stats</span>
                <div className="font-label-md font-bold text-on-background uppercase">Diagnostic Assessment</div>
              </div>
              <div className="bg-gradient-to-br from-primary-container to-inverse-surface border border-primary-container/20 rounded-2xl p-6 text-center relative z-10 flex flex-col items-center shadow-lg w-full">
                <span className="material-symbols-outlined text-secondary-container text-4xl mb-2 relative z-10">hub</span>
                <div className="font-headline-md text-lg font-bold text-on-primary uppercase relative z-10 tracking-wider">AI Gap Checker</div>
                <p className="text-xs text-on-primary/80 mt-2 relative z-10">Identifies precise gaps and root causes.</p>
              </div>
              <div className="bg-surface-container-low border border-primary-container/20 rounded-xl p-4 w-full text-center relative z-10 flex flex-col items-center shadow-sm">
                <div className="bg-primary-container/10 text-primary-container text-xs font-bold px-2 py-1 rounded mb-2">04</div>
                <span className="material-symbols-outlined text-primary-container mb-1">route</span>
                <div className="font-label-md font-bold text-primary-container uppercase">Personalized Path</div>
                <p className="text-xs text-on-surface-variant mt-2">Custom learning and practice modules.</p>
              </div>
              <div className="bg-green-50/80 border border-green-200 rounded-xl p-4 w-full text-center relative z-10 flex flex-col items-center shadow-sm">
                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mb-2">05</div>
                <span className="material-symbols-outlined text-green-600 mb-1">verified</span>
                <div className="font-label-md font-bold text-green-800 uppercase">Verified Readiness</div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-full px-6 py-3 mt-4 text-center relative z-10 flex items-center justify-center gap-2 font-bold text-sm text-on-surface-variant shadow-sm w-full select-none">
                <span className="material-symbols-outlined">cycle</span>
                Continuous Re-assessment Cycle
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: AI Gap Analysis */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-lowest">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <h2 className="font-headline-lg text-headline-lg text-on-background">Find the gaps that matter.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Our AI engine goes beyond simple skill matching. It analyzes performance data, previous training, and assessment results to pinpoint exact competency deficiencies and their root causes.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-lg overflow-hidden flex flex-col relative">
                {/* UI Window Controls */}
                <div className="bg-surface-container-low border-b border-outline-variant/60 px-4 py-3 flex gap-4 items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                  </div>
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest mx-auto flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">analytics</span>
                    NIPUN Platform Feature • AI Diagnostic Engine
                  </span>
                  <div className="w-12"></div>
                </div>
                <div className="p-6 md:p-8 flex flex-col gap-6 bg-background">
                  <div className="border border-outline-variant/50 rounded-xl p-5 bg-surface-container-lowest shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-headline-md text-xl text-on-background font-bold mb-1">
                          {pythonGap ? pythonGap.competencyName : 'Python for Official Statistics'}
                        </h4>
                        <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
                          Role: {activeLearner.designation || 'Senior Statistical Officer'} | Target: Level {pythonGap?.requiredLevel || 3} | Current: Level {pythonGap?.currentLevel || 2}
                        </p>
                      </div>
                      <span className="bg-error-container/50 text-on-error-container border border-error-container font-label-sm text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span> High Priority Gap
                      </span>
                    </div>
                    <div className="mb-6">
                      <span className="font-label-sm text-[11px] text-on-surface-variant block mb-3 uppercase tracking-wider font-bold">Evidence Base (Diagnostic Signals)</span>
                      <div className="flex flex-wrap gap-3">
                        <div className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/50 text-[11px] font-medium text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-primary-container">quiz</span> Diagnostic Assessment (48%)
                        </div>
                        <div className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/50 text-[11px] font-medium text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-primary-container">code</span> Practical Task (42%)
                        </div>
                        <div className="bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/50 text-[11px] font-medium text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-error">error</span> Repeated Errors (Functions, Data Handling)
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Knowledge Gap</span>
                          <span className="text-[11px] text-on-surface-variant font-bold">Low</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div className="w-1/4 h-full bg-primary-container rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Application Gap</span>
                          <span className="text-[11px] text-error font-bold">High</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-secondary-container rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Retention Risk</span>
                          <span className="text-[11px] text-on-surface-variant font-bold">Low</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div className="w-1/5 h-full bg-primary-container rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-l-2 border-outline-variant/50 pl-4 mb-4 py-1">
                      <span className="font-label-sm text-[11px] text-on-surface-variant block mb-1 uppercase tracking-wider font-bold">AI Diagnosis</span>
                      <p className="font-body-md text-[14px] text-on-background leading-relaxed">
                        {pythonGap?.explanation || 'Learner understands the basic concepts but struggles to apply Python effectively to real data tasks.'}
                      </p>
                    </div>
                    <div className="border-l-2 border-primary-container pl-4 bg-primary-container/5 py-3 pr-3 rounded-r-xl">
                      <span className="font-label-sm text-[11px] text-primary-container block mb-1 uppercase tracking-wider font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span> Why was this recommended?
                      </span>
                      <p className="font-body-md text-body-md text-on-background text-sm mb-2 font-medium">Confidence: {pythonGap ? `${Math.round(pythonGap.confidenceScore * 100)}%` : '91%'}</p>
                      <ul className="text-xs text-on-surface-variant list-disc pl-4 space-y-1.5 marker:text-primary-container/50">
                        <li>Syntax comprehension is high in multiple-choice formats.</li>
                        <li>Fails to complete practical coding assessments involving pandas.</li>
                        <li>Time taken on data cleaning tasks exceeds expected benchmarks.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Learning Path Sequence */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-lowest border-t border-outline-variant">
          <div className="max-w-[1440px] mx-auto text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-16">Learn exactly what your gap requires.</h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-12">
              <div className="flex flex-col items-center gap-4 w-48">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant shadow-sm hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-[28px]">menu_book</span>
                </div>
                <span className="font-label-sm text-[11px] tracking-widest uppercase font-bold text-on-surface-variant">Targeted Micro-learning</span>
              </div>
              <div className="hidden md:block w-12 h-px bg-outline-variant/50 border-t border-dashed"></div>
              <div className="flex flex-col items-center gap-4 w-48">
                <div className="w-16 h-16 rounded-2xl bg-primary-container/5 text-primary-container border border-primary-container/20 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[28px]">terminal</span>
                </div>
                <span className="font-label-sm text-[11px] tracking-widest uppercase font-bold text-primary-container">Hands-on Sandbox Practice</span>
              </div>
              <div className="hidden md:block w-12 h-px bg-outline-variant/50 border-t border-dashed"></div>
              <div className="flex flex-col items-center gap-4 w-48">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant shadow-sm hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
                </div>
                <span className="font-label-sm text-[11px] tracking-widest uppercase font-bold text-on-surface-variant">Live Evaluation</span>
              </div>
              <div className="hidden md:block w-12 h-px bg-outline-variant/50 border-t border-dashed"></div>
              <div className="flex flex-col items-center gap-4 w-48">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant shadow-sm hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-[28px]">update</span>
                </div>
                <span className="font-label-sm text-[11px] tracking-widest uppercase font-bold text-on-surface-variant">Adaptive Progression</span>
              </div>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              NIPUN connects directly to iGOT Karmayogi, NSSTA training modules, and real Indian statistical datasets so learning translates immediately to real-world capability.
            </p>
          </div>
        </section>


        {/* Section 6: Verified Capability */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-lowest border-t border-outline-variant">
          <div className="max-w-[1440px] mx-auto text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Verify true capability.</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              NIPUN evaluates learning through multi-dimensional assessments, measuring not just theoretical recall, but practical application on official statistical workloads.
            </p>
          </div>
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary-container mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">quiz</span>
              </div>
              <h4 className="font-headline-md text-base font-bold text-on-background mb-2">Diagnostic Quizzes</h4>
              <p className="text-xs text-on-surface-variant">Adaptive questioning calibrated to competency levels.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary-container mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">code</span>
              </div>
              <h4 className="font-headline-md text-base font-bold text-on-background mb-2">Coding Tasks</h4>
              <p className="text-xs text-on-surface-variant">Automated test runners for Python, R, and CSPro.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary-container mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">task</span>
              </div>
              <h4 className="font-headline-md text-base font-bold text-on-background mb-2">Survey Simulations</h4>
              <p className="text-xs text-on-surface-variant">Simulated fieldwork, validation, and tabulation workflows.</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <h4 className="font-headline-md text-base font-bold text-on-background mb-2">Competency Passport</h4>
              <p className="text-xs text-on-surface-variant">Verifiable digital credential recognized across GoI.</p>
            </div>
          </div>
        </section>

        {/* Section 7: For Institutions */}
        <section id="for-institutions" className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-low border-t border-outline-variant">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-primary-container font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                For Ministries &amp; Training Academies
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-background">
                Real-time capability analytics across your entire statistical workforce.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Empower MoSPI leadership, NSSTA faculty, and divisional heads with actionable data on skill gaps, training effectiveness, and role readiness.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  onClick={() => {
                    requireAuth(async () => {
                      await switchUserRole('TRAINER');
                      launchWorkspace('faculty-dashboard');
                    }, 'Please sign in to access the NSSTA Faculty & Trainer Studio.');
                  }}
                  className="bg-primary-container text-on-primary font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-opacity-90 transition-colors cursor-pointer"
                >
                  Trainer View →
                </button>
                <button
                  onClick={() => {
                    requireAuth(async () => {
                      await switchUserRole('ADMINISTRATOR');
                      launchWorkspace('analytics');
                    }, 'Please sign in to access MoSPI Leadership & Workforce Analytics.');
                  }}
                  className="bg-surface-container-lowest border border-outline-variant text-on-background font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Admin Analytics →
                </button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                  <span className="font-bold text-sm text-on-background">MoSPI Cadre Readiness Overview</span>
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold">+4.2% this quarter</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Indian Statistical Service (ISS) - Grade IV</span>
                      <span>88% Ready</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-primary-container"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Subordinate Statistical Service (SSS) - SSO</span>
                      <span>78% Ready</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="w-[78%] h-full bg-primary-container"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Field Operations Division (FOD) - Survey Staff</span>
                      <span>92% Ready</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-green-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-12 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <NipunLogo variant="horizontal" size="sm" />
          </div>
          <div className="text-xs text-on-surface-variant text-center md:text-right">
            © 2026 Ministry of Statistics &amp; Programme Implementation, Government of India.<br />
            Aligned with Mission Karmayogi &amp; National Training Policy.
          </div>
        </div>
      </footer>
    </div>
  );
};
