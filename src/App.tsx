import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { OfficerWorkspace } from './components/workspace/OfficerWorkspace';
import { AuthModal } from './components/landing/AuthModal';
import { DemoSelectorModal } from './components/landing/DemoSelectorModal';
import { NotificationToast } from './components/common/NotificationToast';
import { QuizModal } from './components/learner/QuizModal';
import { PracticeLabModal } from './components/learner/PracticeLabModal';
import { AIGapCheckerModal } from './components/learner/AIGapCheckerModal';
import { AIMentorDrawer } from './components/learner/AIMentorDrawer';
import { ProfileWizardModal } from './components/learner/ProfileWizardModal';
import { IGOTCourseModal } from './components/learner/IGOTCourseModal';
import { NSSTACourseModal } from './components/learner/NSSTACourseModal';
import { ReassessmentModal } from './components/learner/ReassessmentModal';
import { DocumentIntelligenceModal } from './components/learner/DocumentIntelligenceModal';
import { Sparkles, MessageSquare } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeView, isAuthReady, setIsAIMentorOpen } = useAuth();

  // Show official loading state while authentication & session are restoring on startup
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9ff] text-[#111c2d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#000a1e] border-t-[#fe9832] rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#000a1e]">
            Verifying Officer Authentication Session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#111c2d] font-['Inter',sans-serif]">
      {activeView === 'landing' ? <LandingPage /> : <OfficerWorkspace />}
      
      {/* Floating AI Statistical Capacity Building Assistant Trigger (Active in Officer Workspace) */}
      {activeView === 'workspace' && (
        <button
          onClick={() => setIsAIMentorOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#002147] hover:bg-[#003366] text-white rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105 group"
          title="Open Statistical Capacity Building Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-[#fe9832] text-[#000a1e] flex items-center justify-center font-bold text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold font-['Public_Sans',sans-serif] tracking-wide pr-1">
            AI Statistical Mentor
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Global Modals, Drawers & Toasts */}
      <AuthModal />
      <DemoSelectorModal />
      <QuizModal />
      <PracticeLabModal />
      <AIGapCheckerModal />
      <AIMentorDrawer />
      <ProfileWizardModal />
      <IGOTCourseModal />
      <NSSTACourseModal />
      <ReassessmentModal />
      <DocumentIntelligenceModal />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
