import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NipunLogo } from '../common/NipunLogo';
import {
  Sparkles,
  Layers,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  LogOut,
  FileText,
  Compass,
  TrendingUp,
  BookOpen,
  Award,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
  Search,
  CheckCircle2,
  Zap,
  BrainCircuit,
} from 'lucide-react';

interface GovHeaderProps {
  onOpenHowItWorks?: () => void;
  onOpenAbout?: () => void;
  onOpenInstitutions?: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = () => {
  const {
    currentUser,
    isAuthenticated,
    activeView,
    setActiveView,
    setIsDemoSelectorOpen,
    activeTab,
    setActiveTab,
    openAuthModal,
    launchWorkspace,
    logout,
    openDocIntelligence,
    openReassessment,
    setIsAIMentorOpen,
    setIsGapCheckerOpen,
    openQuiz,
    setIsLabModalOpen,
  } = useAuth();

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const quickNavItems = [
    { title: 'AI Gap Prediction', desc: 'Predictive cadre gap diagnosis', action: () => setIsGapCheckerOpen(true), icon: Sparkles },
    { title: 'Python Level 3 Quiz', desc: 'Pre/Post statistical assessment', action: () => openQuiz('Python Functions'), icon: Award },
    { title: 'Survey Simulation Lab', desc: 'NSS & PLFS field data sandbox', action: () => setIsLabModalOpen(true), icon: Zap },
    { title: 'PDF MoSPI Intelligence', desc: 'Extract questions from survey PDFs', action: () => openDocIntelligence(), icon: FileText },
    { title: 'Post-Learning Reassessment', desc: 'Verify skill gap closure & elevate passport', action: () => openReassessment(), icon: CheckCircle2 },
    { title: 'iGOT Karmayogi Courses', desc: 'Browse accredited digital courses', action: () => setActiveTab('recommendations'), icon: BookOpen },
  ];

  const filteredQuickNav = quickNavItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#c4c6cf]/40 transition-all shadow-xs">
      {/* Official Government Strip */}
      <div className="bg-[#000a1e] text-white text-[11px] h-8 px-4 sm:px-8 flex items-center justify-between tracking-wide select-none">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="text-[#8e9099] hidden sm:inline">|</span>
          <span className="text-[#c4c6cf] hidden sm:inline">Ministry of Statistics and Programme Implementation (MoSPI)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#c4c6cf]">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Cadre Sync: Live</span>
          </div>
          <span
            onClick={() => (currentUser && isAuthenticated ? setIsDemoSelectorOpen(true) : openAuthModal('signin'))}
            className="hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
          >
            NSSTA &bull; iGOT Partner Portal
          </span>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="w-full max-w-[1840px] mx-auto px-3 sm:px-4 lg:px-6 h-[72px] flex items-center justify-between">
        {/* Zone 1: Branding & Logo */}
        <div className="flex items-center shrink-0">
          <div
            onClick={() => {
              if (activeView === 'landing') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setActiveTab('dashboard');
              }
            }}
            className="flex items-center cursor-pointer group select-none py-1"
            title="NIPUN MoSPI National Platform"
          >
            <NipunLogo variant="horizontal" size="md" />
          </div>
        </div>

        {/* Zone 2: Primary Navigation Tabs (Desktop) */}
        <div className="hidden lg:flex items-center justify-center shrink-0">
          {activeView === 'landing' ? (
            <nav className="flex items-center gap-2 text-sm font-semibold text-[#44474e]">
              <a
                href="#about"
                className="h-10 px-4 inline-flex items-center rounded-xl hover:text-[#000a1e] hover:bg-[#f0f3ff] transition-colors"
              >
                About
              </a>
              <a
                href="#how-it-works"
                className="h-10 px-4 inline-flex items-center rounded-xl hover:text-[#000a1e] hover:bg-[#f0f3ff] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#for-institutions"
                className="h-10 px-4 inline-flex items-center rounded-xl hover:text-[#000a1e] hover:bg-[#f0f3ff] transition-colors"
              >
                iGOT &amp; NSSTA
              </a>
            </nav>
          ) : (
            <nav className="gov-nav-container inline-flex items-center bg-[#f0f3ff] rounded-2xl border border-[#c4c6cf]/40 shadow-xs">
              {currentUser?.role === 'LEARNER' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`gov-nav-pill ${
                      activeTab === 'dashboard'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('competencies')}
                    className={`gov-nav-pill ${
                      activeTab === 'competencies' || activeTab === 'passport'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span className="nav-long-text">My Competencies</span>
                    <span className="nav-short-text">Competencies</span>
                  </button>
                  <button
                    onClick={() => setIsGapCheckerOpen(true)}
                    className="gov-nav-pill text-[#44474e] hover:text-[#000a1e] hover:bg-white/60"
                  >
                    <Sparkles className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span className="nav-long-text">AI Gap Checker</span>
                    <span className="nav-short-text">Gap Checker</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('learning-path')}
                    className={`gov-nav-pill ${
                      activeTab === 'learning-path' || activeTab === 'recommendations'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span className="nav-long-text">Learning Path</span>
                    <span className="nav-short-text">Learning</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('assessments')}
                    className={`gov-nav-pill ${
                      activeTab === 'assessments'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Assessments</span>
                  </button>
                </>
              )}

              {currentUser?.role === 'TRAINER' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`gov-nav-pill ${
                      activeTab === 'dashboard'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz-generator')}
                    className={`gov-nav-pill ${
                      activeTab === 'quiz-generator'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Assessments</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`gov-nav-pill ${
                      activeTab === 'analytics'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Analytics</span>
                  </button>
                </>
              )}

              {currentUser?.role === 'ADMINISTRATOR' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`gov-nav-pill ${
                      activeTab === 'dashboard'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('workforce')}
                    className={`gov-nav-pill ${
                      activeTab === 'workforce'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Workforce</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('effectiveness')}
                    className={`gov-nav-pill ${
                      activeTab === 'effectiveness'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Analytics</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className={`gov-nav-pill ${
                      activeTab === 'integrations' || activeTab === 'framework'
                        ? 'bg-white text-[#000a1e] shadow-2xs border border-[#c4c6cf]/40'
                        : 'text-[#44474e] hover:text-[#000a1e] hover:bg-white/60'
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#fe9832] shrink-0" />
                    <span>Competency Framework</span>
                  </button>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Zone 3: Utility & Action Controls */}
        <div className="gov-actions-container flex items-center justify-end shrink-0">
          {/* Quick Search Trigger (in workspace) */}
          {activeView === 'workspace' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="gov-search-box h-10 px-3 bg-[#f0f3ff] hover:bg-[#e4ebff] text-[#44474e] rounded-xl text-xs font-medium border border-[#c4c6cf]/40 transition-all cursor-pointer shrink-0 shadow-2xs flex items-center justify-between"
              title="Quick Search (Ctrl + K)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-4 h-4 text-[#74777f] shrink-0" />
                <span className="truncate text-xs text-[#555964]">Search portal...</span>
              </div>
              <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-[#c4c6cf]/40 text-[#74777f] font-mono leading-none shrink-0">
                ⌘K
              </kbd>
            </button>
          )}

          {/* AI Assistant Direct Trigger in Workspace */}
          {activeView === 'workspace' && (
            <button
              onClick={() => setIsAIMentorOpen(true)}
              className="gov-action-btn bg-[#002147] hover:bg-[#000a1e] text-white font-bold shadow-xs"
              title="Open AI Statistical Assistant"
            >
              <Sparkles className="w-4 h-4 text-[#fe9832] shrink-0" />
              <span>AI Assistant</span>
            </button>
          )}

          {activeView === 'landing' ? (
            <>
              <button
                onClick={() => openAuthModal('signin')}
                className="hidden sm:inline-flex items-center gap-2 h-10 px-4 text-xs font-bold text-[#000a1e] bg-[#f0f3ff] hover:bg-[#e4ebff] border border-[#c4c6cf]/50 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#fe9832] shrink-0" />
                <span>Officer Sign In</span>
              </button>

              <button
                onClick={() => launchWorkspace('dashboard')}
                className="inline-flex items-center gap-2 h-10 px-5 text-xs font-bold text-white bg-[#000a1e] hover:bg-[#002147] rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>Launch Workspace</span>
                <ChevronRight className="w-4 h-4 text-[#fe9832] shrink-0" />
              </button>
            </>
          ) : (
            <>
              {/* Quick AI Tools Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="gov-action-btn bg-[#f0f3ff] hover:bg-[#e4ebff] text-[#002147] font-bold border border-[#c4c6cf]/40 shadow-2xs"
                  title="Quick AI & Verification Tools"
                >
                  <BrainCircuit className="w-4 h-4 text-[#fe9832] shrink-0" />
                  <span>Tools</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#74777f] shrink-0" />
                </button>

                {isToolsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsToolsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#c4c6cf]/40 p-2 z-50 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#74777f] border-b border-[#c4c6cf]/20">
                        AI Statistical Tools
                      </div>

                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          setIsGapCheckerOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-all text-left cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#fe9832]" />
                        <div>
                          <div className="font-bold">AI Gap Predictor</div>
                          <div className="text-[10px] text-[#74777f]">Cadre deficit diagnosis</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          openDocIntelligence();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-all text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-[#002147]" />
                        <div>
                          <div className="font-bold">PDF Question Gen</div>
                          <div className="text-[10px] text-[#74777f]">Extract from MoSPI reports</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          openReassessment();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-all text-left cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold">Post-Reassessment</div>
                          <div className="text-[10px] text-[#74777f]">Verify skill gap closure</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsToolsOpen(false);
                          setIsAIMentorOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-all text-left cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#fe9832]" />
                        <div>
                          <div className="font-bold">AI Statistical Mentor</div>
                          <div className="text-[10px] text-[#74777f]">Ask official cadre doubts</div>
                        </div>
                      </button>

                      <div className="pt-1 border-t border-[#c4c6cf]/30">
                        <button
                          onClick={() => {
                            setIsToolsOpen(false);
                            setActiveTab('purpose');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-all text-left cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-[#002147]" />
                          <div>
                            <div className="font-bold">Change Career Purpose</div>
                            <div className="text-[10px] text-[#74777f]">Select specialization track</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Role Switcher Pill */}
              <button
                onClick={() => setIsDemoSelectorOpen(true)}
                className="gov-action-btn text-[#002147] bg-[#f0f3ff] hover:bg-[#e4ebff] border border-[#c4c6cf]/50 font-bold shadow-2xs"
                title="Switch demo profile"
              >
                <UserCheck className="w-4 h-4 text-[#fe9832] shrink-0" />
                <span className="officer-name-text truncate max-w-[85px]">
                  {currentUser?.name?.split(' ')[0] || 'Aarav'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#002147] text-white font-mono leading-none shrink-0">
                  {currentUser?.role === 'LEARNER' ? 'Officer' : currentUser?.role}
                </span>
              </button>

              {/* Logout Button */}
              {isAuthenticated && (
                <button
                  onClick={() => logout()}
                  className="gov-action-btn font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-2xs"
                  title="Sign out of official session"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Logout</span>
                </button>
              )}

              {/* Return to Landing / Home */}
              <button
                onClick={() => setActiveView('landing')}
                className="gov-action-btn font-semibold text-[#44474e] hover:text-[#000a1e] hover:bg-[#f0f3ff] border border-[#c4c6cf]/40 shadow-2xs"
                title="Return to Portal Home"
              >
                <Compass className="w-4 h-4 text-[#74777f] shrink-0" />
                <span className="home-text">Home</span>
              </button>
            </>
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 text-[#000a1e] hover:bg-[#f0f3ff] rounded-xl transition-colors cursor-pointer shrink-0 border border-[#c4c6cf]/40"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#c4c6cf]/40 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {activeView === 'workspace' && currentUser?.role === 'LEARNER' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left ${
                  activeTab === 'dashboard' ? 'bg-[#002147] text-white' : 'bg-[#f0f3ff] text-[#002147]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#fe9832]" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('competencies');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left ${
                  activeTab === 'competencies' || activeTab === 'passport' ? 'bg-[#002147] text-white' : 'bg-[#f0f3ff] text-[#002147]'
                }`}
              >
                <Award className="w-4 h-4 text-[#fe9832]" />
                <span>My Competencies</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('learning-path');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left ${
                  activeTab === 'learning-path' ? 'bg-[#002147] text-white' : 'bg-[#f0f3ff] text-[#002147]'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-[#fe9832]" />
                <span>Learning Path</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('assessments');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left ${
                  activeTab === 'assessments' ? 'bg-[#002147] text-white' : 'bg-[#f0f3ff] text-[#002147]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#fe9832]" />
                <span>Assessments</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[#c4c6cf]/30 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsDemoSelectorOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-2.5 bg-[#f0f3ff] rounded-xl text-xs font-bold text-[#002147]"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#fe9832]" />
                <span>Switch Demo Role ({currentUser?.role})</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsAIMentorOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-2.5 bg-[#002147] text-white rounded-xl text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fe9832]" />
                <span>AI Statistical Mentor</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-between p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout / End Session</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Quick Command / Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#000a1e]/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/40 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#c4c6cf]/30 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#fe9832]" />
              <input
                type="text"
                autoFocus
                placeholder="Search competencies, tools, assessments, or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[#000a1e] focus:outline-none placeholder-[#74777f]"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-[#74777f] hover:text-[#000a1e] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#74777f]">
                Quick Jump Shortcuts
              </div>
              {filteredQuickNav.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      item.action();
                    }}
                    className="w-full p-2.5 rounded-2xl hover:bg-[#f0f3ff] transition-all flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#002147]/5 group-hover:bg-[#002147] text-[#002147] group-hover:text-[#fe9832] flex items-center justify-center transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#000a1e]">{item.title}</div>
                        <div className="text-[11px] text-[#74777f]">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#c4c6cf] group-hover:text-[#002147]" />
                  </button>
                );
              })}
            </div>
            <div className="p-3 bg-[#f9f9ff] border-t border-[#c4c6cf]/30 text-[11px] text-[#74777f] flex items-center justify-between">
              <span>Navigate with arrow keys or click</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#c4c6cf]/40 rounded text-[10px] font-mono">
                ESC to close
              </kbd>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


