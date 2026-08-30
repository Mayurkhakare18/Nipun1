import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GovHeader } from '../landing/GovHeader';
import { GovFooter } from '../landing/GovFooter';
import { PurposeSelectorView } from '../learner/PurposeSelectorView';
import { LearnerDashboard } from '../learner/LearnerDashboard';
import { CompetencyPassportView } from '../learner/CompetencyPassportView';
import { UnifiedRecommendationsView } from '../learner/UnifiedRecommendationsView';
import { LearningPathView } from '../learner/LearningPathView';
import { AssessmentsHubView } from '../learner/AssessmentsHubView';
import { TrainerDashboard } from '../trainer/TrainerDashboard';
import { WorkforceDashboard } from '../workforce/WorkforceDashboard';
import { IntegrationsDashboard } from '../integrations/IntegrationsDashboard';
import {
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Play,
  Compass,
  TrendingUp,
  BookOpen,
  Award,
} from 'lucide-react';

export const OfficerWorkspace: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isAuthReady,
    activeTab,
    setActiveTab,
    setActiveView,
    prioritySkill,
    setIsPracticeLabOpen,
    setIsAIMentorOpen,
    openQuiz,
    openAuthModal,
  } = useAuth();

  // Protected Route Guard: If user is not authenticated, display official security gate
  if (isAuthReady && (!isAuthenticated || !currentUser)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#111c2d]">
        <GovHeader />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#000a1e] text-[#fe9832] flex items-center justify-center shadow-lg mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#fe9832] mb-2 bg-[#fe9832]/10 px-3 py-1 rounded-full border border-[#fe9832]/20">
            Protected Government Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Public_Sans',sans-serif] text-[#000a1e] mb-3">
            Officer Authentication Required
          </h1>
          <p className="text-sm text-[#44474e] max-w-lg mb-8">
            Access to the MoSPI Officer Capacity Building Workspace, Competency Passport, and simulation labs requires verified officer authentication with official credentials or Parichay SSO.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => openAuthModal('signin')}
              className="px-6 py-3 bg-[#000a1e] hover:bg-[#002147] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#fe9832]" />
              <span>Officer Sign In</span>
            </button>
            <button
              onClick={() => setActiveView('landing')}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#000a1e] border border-[#c4c6cf] font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Portal Overview</span>
            </button>
          </div>
        </div>
        <GovFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#111c2d]">
      <GovHeader />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Subtle, Helpful Priority Next-Step Alert Banner (Only if learner has an active gap to close) */}
        {currentUser?.role === 'LEARNER' && prioritySkill && activeTab === 'dashboard' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#000a1e] to-[#002147] text-white border border-[#fe9832]/30 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-1.5 rounded-lg bg-[#fe9832] text-[#000a1e] shrink-0 font-bold">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="text-xs truncate">
                <span className="font-bold text-[#fe9832]">Recommended Priority Focus: </span>
                <span className="font-semibold text-white">{prioritySkill.competencyName}</span>
                <span className="text-[11px] text-white/70 ml-2 hidden md:inline">
                  (Level {prioritySkill.currentLevel} → {prioritySkill.requiredLevel} • Gap Impact: <strong>{prioritySkill.impactScore}/100</strong>)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (prioritySkill.nextBestAction.type === 'SIMULATION_LAB') {
                    setIsPracticeLabOpen(true);
                  } else if (prioritySkill.nextBestAction.type === 'IGOT_COURSE') {
                    setActiveTab('recommendations');
                  } else {
                    openQuiz(prioritySkill.competencyName);
                  }
                }}
                className="px-3.5 py-1.5 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{prioritySkill.nextBestAction.ctaLabel}</span>
              </button>
            </div>
          </div>
        )}

        {/* Render View according to current active tab */}
        {activeTab === 'purpose' && <PurposeSelectorView />}
        {activeTab === 'dashboard' && currentUser?.role === 'LEARNER' && <LearnerDashboard />}
        {(activeTab === 'competencies' || activeTab === 'passport') && <CompetencyPassportView />}
        {activeTab === 'learning-path' && <LearningPathView />}
        {activeTab === 'recommendations' && <UnifiedRecommendationsView />}
        {activeTab === 'assessments' && <AssessmentsHubView />}
        
        {/* Trainer Views */}
        {currentUser?.role === 'TRAINER' && (
          <TrainerDashboard />
        )}

        {/* Administrator Views */}
        {currentUser?.role === 'ADMINISTRATOR' && (
          <>
            {activeTab === 'framework' || activeTab === 'integrations' ? <IntegrationsDashboard /> : <WorkforceDashboard />}
          </>
        )}

        {/* Fallback to Dashboard if not recognized */}
        {!['purpose', 'dashboard', 'competencies', 'passport', 'recommendations', 'learning-path', 'assessments', 'authoring', 'quiz-generator', 'analytics', 'workforce', 'effectiveness', 'framework', 'integrations'].includes(activeTab) && (
          <LearnerDashboard />
        )}
      </main>

      {/* Floating AI Statistical Mentor Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAIMentorOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#002147] hover:bg-[#003366] text-white font-bold text-xs rounded-full shadow-lg border border-[#fe9832]/60 hover:shadow-xl transition-all cursor-pointer group"
          title="Open AI Statistical Mentor"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe9832] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fe9832]"></span>
          </span>
          <Sparkles className="w-4 h-4 text-[#fe9832]" />
          <span className="tracking-wide hidden sm:inline">AI Statistical Mentor</span>
        </button>
      </div>

      <GovFooter />
    </div>
  );
};

