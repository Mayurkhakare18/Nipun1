import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, RoleType, LearnerCompetency, GapAnalysisResult, IGOTCourse, NSSTAProgram } from '../types';
import { api, tokenStorage } from '../services/api';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { calculateNextPrioritySkill, PrioritySkillRecommendation } from '../utils/prioritySkill';

// ==========================================
// 1. Types & Database Schema
// ==========================================

const DEFAULT_OFFICER_BASELINE: UserProfile = {
  id: '',
  name: 'Official Officer',
  email: '',
  role: 'LEARNER',
  employeeId: '',
  ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
  department: 'National Statistical Office (NSO)',
  organization: 'Government of India',
  designation: 'Statistical Officer',
  currentRole: 'Statistical Officer',
  targetRole: 'Senior Statistical Officer / Lead Analyst',
  level: 11,
  cadre: 'Subordinate Statistical Service (SSS)',
  yearsOfExperience: 5,
  education: 'M.Sc. Statistics',
  specialization: 'Survey Data Analysis & Official Statistics',
  location: 'New Delhi',
  preferredLanguage: 'English / Hindi',
  previousRoles: [],
  currentProjects: [],
  technologiesUsed: ['Python', 'SQL', 'R'],
  trainingHours: 0,
  roleReadiness: 75,
  verifiedSkillsCount: 0,
  developingSkillsCount: 0,
};

const DEFAULT_COMPETENCIES: LearnerCompetency[] = [
  {
    competencyId: 'comp-tech-01',
    name: 'Python',
    category: 'TECHNICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 2,
    gap: 2,
    gapType: 'APPLICATION_GAP',
    confidence: 0.91,
    lastAssessed: '2026-08-14',
    targetDate: '2026-10-31',
    status: 'CRITICAL_GAP',
    evidence: {
      diagnosticScore: 48,
      practicalScore: 42,
      repeatedErrors: ['pandas DataFrame transformations', 'Complex index reshaping', 'Survey weights aggregation'],
      notes: 'Good understanding of basic variables and control flow; practical difficulty when cleaning dirty survey responses.',
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-tech-05',
    name: 'AI / ML',
    category: 'TECHNICAL_COMPETENCIES',
    requiredLevel: 3,
    currentLevel: 1,
    gap: 2,
    gapType: 'KNOWLEDGE_GAP',
    confidence: 0.84,
    lastAssessed: '2026-07-28',
    targetDate: '2026-12-15',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 40,
      practicalScore: 35,
      notes: 'Foundational awareness of ML concepts; needs exposure to automated survey imputation models.',
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-tech-02',
    name: 'Data Visualization',
    category: 'TECHNICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    confidence: 0.88,
    lastAssessed: '2026-08-02',
    targetDate: '2026-11-15',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 60,
      practicalScore: 50,
      repeatedErrors: ['Interactive chart callbacks', 'Geospatial choropleth layers'],
      notes: 'Requires structured hands-on practice with automated dashboard generation for statistical reports.',
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-stat-01',
    name: 'Survey Design',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    confidence: 0.95,
    lastAssessed: '2026-07-10',
    targetDate: '2026-12-31',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 78,
      practicalScore: 70,
      courseCompletions: ['NSSO Master Class on Questionnaire Design'],
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-stat-02',
    name: 'Sampling Methodology',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    confidence: 0.92,
    lastAssessed: '2026-06-20',
    targetDate: '2026-12-31',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 76,
      practicalScore: 72,
      courseCompletions: ['Probability Sampling Protocols'],
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-tech-04',
    name: 'SQL & Database Querying',
    category: 'TECHNICAL_COMPETENCIES',
    requiredLevel: 3,
    currentLevel: 2,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    confidence: 0.86,
    lastAssessed: '2026-07-15',
    targetDate: '2026-11-30',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 65,
      practicalScore: 58,
      repeatedErrors: ['Window functions', 'Complex subqueries'],
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-tech-06',
    name: 'GIS & Spatial Analytics',
    category: 'TECHNICAL_COMPETENCIES',
    requiredLevel: 2,
    currentLevel: 1,
    gap: 1,
    gapType: 'KNOWLEDGE_GAP',
    confidence: 0.82,
    lastAssessed: '2026-05-20',
    targetDate: '2026-12-31',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 50,
      practicalScore: 40,
      notes: 'Needs training on QGIS & Census boundary polygons.',
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-beh-01',
    name: 'Project Management & Team Leadership',
    category: 'BEHAVIOURAL_MANAGERIAL',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    confidence: 0.89,
    lastAssessed: '2026-06-10',
    targetDate: '2026-12-31',
    status: 'DEVELOPING',
    evidence: {
      diagnosticScore: 75,
      practicalScore: 70,
      notes: 'Field team supervisory experience progressing.',
    },
    trend: 'NEEDS_ATTENTION',
  },
  {
    competencyId: 'comp-stat-05',
    name: 'SDG Indicators',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 3,
    currentLevel: 3,
    gap: 0,
    confidence: 0.89,
    lastAssessed: '2026-05-18',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 84,
      courseCompletions: ['SDG National Indicator Framework Tier-1 & Tier-2'],
    },
    trend: 'STABLE',
  },
  {
    competencyId: 'comp-stat-06',
    name: 'Data Quality Frameworks',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 4,
    gap: 0,
    confidence: 0.94,
    lastAssessed: '2026-07-15',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 90,
      practicalScore: 92,
      courseCompletions: ['UN-NQAF Institutional Implementation'],
    },
    trend: 'IMPROVED',
  },
  {
    competencyId: 'comp-gov-01',
    name: 'Cybersecurity',
    category: 'DIGITAL_GOVERNANCE',
    requiredLevel: 3,
    currentLevel: 3,
    gap: 0,
    confidence: 0.90,
    lastAssessed: '2026-04-12',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 86,
      courseCompletions: ['Cert-In Information Security Baseline'],
    },
    trend: 'STABLE',
  },
  {
    competencyId: 'comp-gov-02',
    name: 'Data Privacy & DPDP Act',
    category: 'DIGITAL_GOVERNANCE',
    requiredLevel: 3,
    currentLevel: 3,
    gap: 0,
    confidence: 0.91,
    lastAssessed: '2026-06-11',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 88,
      courseCompletions: ['Digital Personal Data Protection Compliance'],
    },
    trend: 'STABLE',
  },
  {
    competencyId: 'comp-stat-03',
    name: 'National Accounts (SNA 2008)',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 4,
    currentLevel: 4,
    gap: 0,
    confidence: 0.94,
    lastAssessed: '2026-08-01',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 92,
      practicalScore: 88,
      courseCompletions: ['iGOT Advanced SNA 2008 Framework'],
    },
    trend: 'IMPROVED',
  },
  {
    competencyId: 'comp-stat-04',
    name: 'Index Numbers & Price Statistics',
    category: 'STATISTICAL_COMPETENCIES',
    requiredLevel: 3,
    currentLevel: 3,
    gap: 0,
    confidence: 0.90,
    lastAssessed: '2026-05-15',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 85,
      courseCompletions: ['CPI / IIP Compilation Standards'],
    },
    trend: 'STABLE',
  },
  {
    competencyId: 'comp-beh-02',
    name: 'Public Statistical Communication',
    category: 'BEHAVIOURAL_MANAGERIAL',
    requiredLevel: 3,
    currentLevel: 3,
    gap: 0,
    confidence: 0.88,
    lastAssessed: '2026-06-05',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: {
      diagnosticScore: 82,
      courseCompletions: ['Press Release & Dissemination Workshop'],
    },
    trend: 'STABLE',
  },
];

const DEFAULT_GAPS: GapAnalysisResult[] = [
  {
    competencyId: 'comp-tech-01',
    competencyName: 'Python',
    requiredLevel: 4,
    currentLevel: 2,
    gap: 2,
    gapType: 'APPLICATION_GAP',
    priority: 'HIGH',
    confidence: 0.91,
    knowledgeGapScore: 25,
    applicationGapScore: 78,
    retentionRiskScore: 20,
    aiDiagnosis:
      'Learner demonstrates procedural syntax knowledge (48%) but experiences application breakdown during multi-stage survey microdata transformation, groupby aggregations, and donor-based imputation in pandas.',
    whyRecommended: [
      'Diagnostic assessment showed multiple-choice comprehension.',
      'Practical coding tasks revealed repeated errors with groupby transform vs apply.',
      'Target role requires automated microdata pipeline generation instead of manual spreadsheet aggregation.',
    ],
    evidenceBase: {
      diagnosticAssessment: 48,
      practicalTask: 42,
      repeatedErrors: ['pandas DataFrame transformations', 'Complex index reshaping', 'Survey weights aggregation'],
    },
  },
  {
    competencyId: 'comp-tech-05',
    competencyName: 'AI / ML',
    requiredLevel: 3,
    currentLevel: 1,
    gap: 2,
    gapType: 'KNOWLEDGE_GAP',
    priority: 'HIGH',
    confidence: 0.84,
    knowledgeGapScore: 68,
    applicationGapScore: 42,
    retentionRiskScore: 35,
    aiDiagnosis:
      'Officer has conceptual familiarity with predictive systems but requires structured training on machine learning classification pipelines and automated anomaly detection models in official statistical surveys.',
    whyRecommended: [
      'Identified as a critical emerging competency under TPAC Modernization Mandate 2026.',
      'Pre-requisite for automated data validation and outlier flags.',
    ],
    evidenceBase: {
      diagnosticAssessment: 40,
      practicalTask: 35,
      repeatedErrors: ['Model Evaluation Metrics', 'Feature Engineering'],
    },
  },
  {
    competencyId: 'comp-tech-02',
    competencyName: 'Data Visualization',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'MEDIUM',
    confidence: 0.88,
    knowledgeGapScore: 30,
    applicationGapScore: 65,
    retentionRiskScore: 18,
    aiDiagnosis:
      'Static charting capability is established, but interactive dashboard development, callback logic, and geospatial choropleth overlays require targeted practice.',
    whyRecommended: [
      'Strong in basic Matplotlib and Seaborn outputs.',
      'Needs training in interactive Plotly and MoSPI data dissemination templates.',
    ],
    evidenceBase: {
      diagnosticAssessment: 60,
      practicalTask: 50,
      repeatedErrors: ['Interactive chart callbacks', 'Geospatial choropleth layers'],
    },
  },
  {
    competencyId: 'comp-stat-01',
    competencyName: 'Survey Design',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'MEDIUM',
    confidence: 0.95,
    knowledgeGapScore: 22,
    applicationGapScore: 55,
    retentionRiskScore: 15,
    aiDiagnosis:
      'Solid command of questionnaire design; requires reinforcement in complex multi-round household survey schedules and computerized personal interview (CAPI) validation rule scripting.',
    whyRecommended: [
      'Essential core competency for Deputy Director (Statistics) role.',
      'High practical impact on national survey data quality.',
    ],
    evidenceBase: {
      diagnosticAssessment: 78,
      practicalTask: 70,
      repeatedErrors: ['CAPI logical check scripts', 'Skip pattern hierarchies'],
    },
  },
  {
    competencyId: 'comp-stat-02',
    competencyName: 'Sampling Methodology',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'MEDIUM',
    confidence: 0.92,
    knowledgeGapScore: 24,
    applicationGapScore: 58,
    retentionRiskScore: 14,
    aiDiagnosis:
      'Strong theoretical foundation in probability sampling; needs practical experience calculating complex multi-stage design effects and sample allocation weights.',
    whyRecommended: [
      'Core statistical discipline for NSSO survey rounds.',
      'Required for statistical rigor in official national indicators.',
    ],
    evidenceBase: {
      diagnosticAssessment: 76,
      practicalTask: 72,
      repeatedErrors: ['Design effect calculation', 'Sub-sample multiplier weighting'],
    },
  },
  {
    competencyId: 'comp-tech-04',
    competencyName: 'SQL & Database Querying',
    requiredLevel: 3,
    currentLevel: 2,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'MEDIUM',
    confidence: 0.86,
    knowledgeGapScore: 35,
    applicationGapScore: 62,
    retentionRiskScore: 22,
    aiDiagnosis:
      'Can construct basic SELECT queries and simple joins; requires training on advanced window functions, partitioned aggregations, and execution plan optimization on large survey databases.',
    whyRecommended: [
      'Necessary for querying the National Data Warehouse (NDW).',
      'Reduces data processing turnaround times.',
    ],
    evidenceBase: {
      diagnosticAssessment: 65,
      practicalTask: 58,
      repeatedErrors: ['Window functions', 'Complex subqueries'],
    },
  },
  {
    competencyId: 'comp-tech-06',
    competencyName: 'GIS & Spatial Analytics',
    requiredLevel: 2,
    currentLevel: 1,
    gap: 1,
    gapType: 'KNOWLEDGE_GAP',
    priority: 'LOW',
    confidence: 0.82,
    knowledgeGapScore: 50,
    applicationGapScore: 40,
    retentionRiskScore: 28,
    aiDiagnosis:
      'Foundational awareness of spatial coordinates; requires exposure to QGIS software, Census boundary shapefile merging, and thematic cartographic representations.',
    whyRecommended: [
      'Supports spatial data integration with economic census blocks.',
      'Modernizes survey report visual dissemination.',
    ],
    evidenceBase: {
      diagnosticAssessment: 50,
      practicalTask: 40,
      repeatedErrors: ['Coordinate Reference Systems (CRS)', 'Shapefile joins'],
    },
  },
  {
    competencyId: 'comp-beh-01',
    competencyName: 'Project Management & Team Leadership',
    requiredLevel: 4,
    currentLevel: 3,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'MEDIUM',
    confidence: 0.89,
    knowledgeGapScore: 25,
    applicationGapScore: 48,
    retentionRiskScore: 16,
    aiDiagnosis:
      'Competent in day-to-day administrative supervision; requires advanced training on milestone scheduling, multi-agency field team coordination, and TPAC capacity budget management.',
    whyRecommended: [
      'Key requirement for administrative promotion to Joint Director cadre.',
      'Enhances multi-divisional project turnaround times.',
    ],
    evidenceBase: {
      diagnosticAssessment: 75,
      practicalTask: 70,
      repeatedErrors: ['Risk mitigation matrices', 'Field resource allocation'],
    },
  },
];

// ==========================================
// 2. AuthContext Interface
// ==========================================

export interface AuthContextType {
  currentUser: UserProfile | null;
  activeLearner: UserProfile;
  competencies: LearnerCompetency[];
  gaps: GapAnalysisResult[];
  currentRole: RoleType;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  activeView: 'landing' | 'workspace' | 'reset-password';
  setActiveView: (view: 'landing' | 'workspace' | 'reset-password') => void;
  isRecoverySession: boolean;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean }>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchUserRole: (userId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  exportPassportReport: () => void;
  
  // Protected Navigation & Action Guard
  launchWorkspace: (tab?: string) => void;
  requireAuth: (actionCallback: () => void, promptMessage?: string) => boolean;

  // Real Email/Password & Firebase Auth Handlers
  login: (credentials: { email: string; password?: string }) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (userData: Partial<UserProfile> & { password?: string }) => Promise<boolean>;
  loginWithParichay: (role?: 'LEARNER' | 'TRAINER' | 'ADMINISTRATOR') => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  applyPurpose: (data: {
    purposeId: string;
    title: string;
    targetRole: string;
    targetCompetencies: string[];
  }) => Promise<boolean>;

  // Automated Priority Skill Intelligence
  prioritySkill: PrioritySkillRecommendation | null;
  calculatePrioritySkill: () => PrioritySkillRecommendation | null;

  // Modals & Drawers
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'register';
  setAuthModalTab: (tab: 'signin' | 'register') => void;
  openAuthModal: (tab?: 'signin' | 'register') => void;
  isDemoSelectorOpen: boolean;
  setIsDemoSelectorOpen: (open: boolean) => void;
  isGapCheckerOpen: boolean;
  setIsGapCheckerOpen: (open: boolean) => void;
  setIsAIGapCheckerOpen: (open: boolean) => void;
  isQuizModalOpen: boolean;
  setIsQuizModalOpen: (open: boolean) => void;
  activeQuizId: string | null;
  openQuiz: (quizId?: string) => void;
  closeQuiz: () => void;
  isLabModalOpen: boolean;
  setIsLabModalOpen: (open: boolean) => void;
  setIsPracticeLabOpen: (open: boolean) => void;
  isMentorDrawerOpen: boolean;
  setIsMentorDrawerOpen: (open: boolean) => void;
  setIsAIMentorOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsProfileWizardOpen: (open: boolean) => void;

  // Course Modals
  activeIgotCourse: IGOTCourse | null;
  openIgotCourse: (course: IGOTCourse) => void;
  closeIgotCourse: () => void;
  activeNsstaProgram: NSSTAProgram | null;
  openNsstaProgram: (program: NSSTAProgram) => void;
  closeNsstaProgram: () => void;

  // Post-Learning Reassessment & Document Intelligence Modals
  isReassessmentOpen: boolean;
  setIsReassessmentOpen: (open: boolean) => void;
  openReassessment: () => void;
  closeReassessment: () => void;
  isDocIntelligenceOpen: boolean;
  setIsDocIntelligenceOpen: (open: boolean) => void;
  openDocIntelligence: () => void;
  closeDocIntelligence: () => void;

  // Global Notification
  notification: { title: string; message: string; type?: 'success' | 'info' | 'warning' } | null;
  showNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// 5. AuthProvider Component
// ==========================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [competencies, setCompetencies] = useState<LearnerCompetency[]>(DEFAULT_COMPETENCIES);
  const [gaps, setGaps] = useState<GapAnalysisResult[]>(DEFAULT_GAPS);
  const [prioritySkill, setPrioritySkill] = useState<PrioritySkillRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'landing' | 'workspace' | 'reset-password'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const v = urlParams.get('view');
      if (v === 'workspace' || v === 'landing' || v === 'reset-password') return v;
    }
    return 'landing';
  });
  const [isRecoverySession, setIsRecoverySession] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Automated calculation of priority skill whenever competencies or gaps change
  const calculatePrioritySkill = useCallback(() => {
    if (!currentUser) return null;
    const computed = calculateNextPrioritySkill(currentUser, gaps, competencies);
    setPrioritySkill(computed);
    return computed;
  }, [currentUser, gaps, competencies]);

  useEffect(() => {
    calculatePrioritySkill();
  }, [calculatePrioritySkill]);

  // Pending protected route destination after auth
  const pendingTabRef = useRef<string | null>(null);

  // Helper to determine target tab after authentication or page refresh
  const resolveTargetTab = useCallback((): string => {
    let tab = pendingTabRef.current;
    if (!tab && typeof window !== 'undefined') {
      try {
        const savedPending = sessionStorage.getItem('nipun_pending_tab');
        if (savedPending) {
          tab = savedPending;
          sessionStorage.removeItem('nipun_pending_tab');
        }
        if (!tab) {
          const urlParams = new URLSearchParams(window.location.search);
          const qTab = urlParams.get('tab');
          if (qTab) tab = qTab;
        }
        if (!tab) {
          const savedActive = sessionStorage.getItem('nipun_active_tab');
          if (savedActive) tab = savedActive;
        }
      } catch {}
    }
    return tab || 'dashboard';
  }, []);

  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('nipun_active_tab', tab);
      } catch {}
    }
  }, []);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [isDemoSelectorOpen, setIsDemoSelectorOpen] = useState(false);
  const [isGapCheckerOpen, setIsGapCheckerOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isMentorDrawerOpen, setIsMentorDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeIgotCourse, setActiveIgotCourse] = useState<IGOTCourse | null>(null);
  const [activeNsstaProgram, setActiveNsstaProgram] = useState<NSSTAProgram | null>(null);
  const [isReassessmentOpen, setIsReassessmentOpen] = useState(false);
  const [isDocIntelligenceOpen, setIsDocIntelligenceOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ title: string; message: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  const showNotification = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ title, message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.title === title && curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const openAuthModal = useCallback((tab: 'signin' | 'register' = 'signin') => {
    setAuthModalTab(tab);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  // Protected action guard
  const requireAuth = useCallback((actionCallback: () => void, promptMessage?: string): boolean => {
    if (isLoading || !isAuthReady || !isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification(
        'Official Sign-In Required',
        promptMessage || 'Please sign in with your official MoSPI credentials to access this feature.',
        'warning'
      );
      return false;
    }
    actionCallback();
    return true;
  }, [isLoading, isAuthReady, isAuthenticated, currentUser, openAuthModal, showNotification]);

  // Protected Route Launcher
  const launchWorkspace = useCallback((tab: string = 'dashboard') => {
    if (isLoading || !isAuthReady) {
      pendingTabRef.current = tab;
      openAuthModal('signin');
      showNotification(
        'Authenticating Officer Session',
        'Please sign in with your official MoSPI credentials or Jan-Parichay SSO to enter the Officer Workspace.',
        'info'
      );
      return;
    }

    if (!isAuthenticated || !currentUser) {
      pendingTabRef.current = tab;
      openAuthModal('signin');
      showNotification(
        'Official Sign-In Required',
        'Please sign in with your official MoSPI credentials or Jan-Parichay SSO to enter the Officer Workspace.',
        'warning'
      );
      return;
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('nipun_active_tab', tab);
      } catch {}
    }
    setActiveView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isLoading, isAuthReady, isAuthenticated, currentUser, openAuthModal, showNotification]);

  // Sync state from active authenticated user
  const syncUserData = useCallback(async (user: UserProfile) => {
    const normalizedName = user.name?.trim() || (user as any).displayName?.trim() || user.email?.split('@')[0] || 'Official Officer';
    const normalizedUser: UserProfile = {
      ...user,
      name: normalizedName,
    };
    setCurrentUser(normalizedUser);
    setIsAuthenticated(true);

    try {
      const data = await api.getLearnerProfileCompetencies();
      if (data && data.competencies && data.competencies.length > 0) {
        setCompetencies(data.competencies);
        setGaps(data.gaps || []);
        return;
      }
    } catch {
      // Backend offline or first-time officer
    }

    setCompetencies(DEFAULT_COMPETENCIES);
    setGaps(DEFAULT_GAPS);
  }, []);

  // Initialize and validate active session on startup using Supabase Auth as single source of truth
  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Purge any obsolete mock / statvia tokens
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('statvia_auth_token');
          window.localStorage.removeItem('nipun_statistical_database_v3');
          for (let i = window.localStorage.length - 1; i >= 0; i--) {
            const key = window.localStorage.key(i);
            if (key && (key.startsWith('statvia_') || key.includes('statvia_token'))) {
              window.localStorage.removeItem(key);
            }
          }
        }
      } catch {
        // Ignore
      }

      // 1. Get real Supabase Auth session (handles both persisted session and fresh OAuth redirect tokens)
      let { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[AuthContext] Supabase getSession note:', error.message);
      }

      // If returning from OAuth redirect with hash or query, but getSession hasn't caught up yet,
      // poll briefly for Supabase to complete hash extraction
      if (!session && typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
        for (let attempt = 0; attempt < 8; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData?.session?.user) {
            session = retryData.session;
            break;
          }
        }
      }

      // Check for password recovery flow in URL
      const isRecovery =
        typeof window !== 'undefined' &&
        (window.location.hash.includes('type=recovery') ||
          window.location.hash.includes('recovery') ||
          window.location.search.includes('type=recovery'));

      if (isRecovery) {
        setIsRecoverySession(true);
        setActiveView('reset-password');
        if (session?.user) {
          tokenStorage.set(session.access_token);
          try {
            await supabase.realtime.setAuth(session.access_token);
          } catch (rtErr) {
            console.warn('[AuthContext] realtime setAuth notice:', rtErr);
          }
        }
        setIsAuthReady(true);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        tokenStorage.set(session.access_token);
        try {
          await supabase.realtime.setAuth(session.access_token);
        } catch (rtErr) {
          console.warn('[AuthContext] realtime setAuth notice:', rtErr);
        }
        const mappedUser = supabaseService.mapSessionUserToProfile(session.user);
        await syncUserData(mappedUser);

        // Automatically navigate authenticated user directly to workspace dashboard
        const targetTab = resolveTargetTab();
        pendingTabRef.current = null;
        setActiveTab(targetTab);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('nipun_active_tab', targetTab);
          } catch {}
        }
        setActiveView('workspace');

        // Clean URL if OAuth tokens or code were in the URL
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
          window.history.replaceState({}, document.title, window.location.pathname);
          showNotification('Google Authentication Verified', `Signed in as ${mappedUser.name} (${mappedUser.email})`);
        }
      } else {
        tokenStorage.clear();
        setCurrentUser(null);
        setIsAuthenticated(false);
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (urlParams?.get('view') === 'workspace') {
          setActiveView('workspace');
        } else {
          setActiveView('landing');
        }
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      tokenStorage.clear();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setActiveView('landing');
    } finally {
      setIsAuthReady(true);
      setIsLoading(false);
    }
  }, [syncUserData, resolveTargetTab, showNotification]);

  useEffect(() => {
    initSession();

    // 2. Subscribe to Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setActiveView('reset-password');
        if (session?.access_token) {
          tokenStorage.set(session.access_token);
          try {
            await supabase.realtime.setAuth(session.access_token);
          } catch (rtErr) {
            console.warn('[AuthContext] realtime setAuth notice:', rtErr);
          }
        }
        return;
      }

      if (event === 'SIGNED_IN') {
        if (session?.user) {
          tokenStorage.set(session.access_token);
          try {
            await supabase.realtime.setAuth(session.access_token);
          } catch (rtErr) {
            console.warn('[AuthContext] realtime setAuth notice:', rtErr);
          }
          const mappedUser = supabaseService.mapSessionUserToProfile(session.user);
          await syncUserData(mappedUser);

          // Automatically navigate to authenticated dashboard
          const targetTab = resolveTargetTab();
          pendingTabRef.current = null;
          setActiveTab(targetTab);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('nipun_active_tab', targetTab);
            } catch {}
          }
          setActiveView('workspace');

          if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          tokenStorage.set(session.access_token);
          try {
            await supabase.realtime.setAuth(session.access_token);
          } catch (rtErr) {
            console.warn('[AuthContext] realtime setAuth notice:', rtErr);
          }
          const mappedUser = supabaseService.mapSessionUserToProfile(session.user);
          await syncUserData(mappedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        tokenStorage.clear();
        try {
          await supabase.realtime.setAuth(null as any);
        } catch {}
        setCurrentUser(null);
        setIsAuthenticated(false);
        setActiveView('landing');
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('nipun_active_tab');
            sessionStorage.removeItem('nipun_pending_tab');
          } catch {}
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initSession, syncUserData, resolveTargetTab]);

  // Protected Modal Handlers
  const handleSetDemoSelectorOpen = useCallback((open: boolean) => {
    if (open && (!isAuthenticated || !currentUser)) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in with your official account.', 'warning');
      return;
    }
    setIsDemoSelectorOpen(open);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const handleSetGapCheckerOpen = useCallback((open: boolean) => {
    if (open && (!isAuthenticated || !currentUser)) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to run AI Gap Prediction.', 'warning');
      return;
    }
    setIsGapCheckerOpen(open);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const handleSetLabModalOpen = useCallback((open: boolean) => {
    if (open && (!isAuthenticated || !currentUser)) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to access the Interactive Practice Lab.', 'warning');
      return;
    }
    setIsLabModalOpen(open);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const handleSetMentorDrawerOpen = useCallback((open: boolean) => {
    if (open && (!isAuthenticated || !currentUser)) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to consult the AI Statistical Mentor.', 'warning');
      return;
    }
    setIsMentorDrawerOpen(open);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const handleSetProfileModalOpen = useCallback((open: boolean) => {
    if (open && (!isAuthenticated || !currentUser)) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to configure your career profile.', 'warning');
      return;
    }
    setIsProfileModalOpen(open);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const openReassessment = useCallback(() => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to take post-learning reassessments.', 'warning');
      return;
    }
    setIsReassessmentOpen(true);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const closeReassessment = useCallback(() => {
    setIsReassessmentOpen(false);
  }, []);

  const openDocIntelligence = useCallback(() => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to access MoSPI Document Intelligence.', 'warning');
      return;
    }
    setIsDocIntelligenceOpen(true);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const closeDocIntelligence = useCallback(() => {
    setIsDocIntelligenceOpen(false);
  }, []);

  const openQuiz = useCallback((quizId?: string) => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to take diagnostic assessments.', 'warning');
      return;
    }
    setActiveQuizId(quizId || 'assess-py-l3');
    setIsQuizModalOpen(true);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const closeQuiz = useCallback(() => {
    setIsQuizModalOpen(false);
    setActiveQuizId(null);
  }, []);

  const openIgotCourse = useCallback((course: IGOTCourse) => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to enroll in iGOT Karmayogi courses.', 'warning');
      return;
    }
    setActiveIgotCourse(course);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const closeIgotCourse = useCallback(() => {
    setActiveIgotCourse(null);
  }, []);

  const openNsstaProgram = useCallback((program: NSSTAProgram) => {
    if (!isAuthenticated || !currentUser) {
      openAuthModal('signin');
      showNotification('Official Sign-In Required', 'Please sign in to apply for NSSTA residential programs.', 'warning');
      return;
    }
    setActiveNsstaProgram(program);
  }, [isAuthenticated, currentUser, openAuthModal, showNotification]);

  const closeNsstaProgram = useCallback(() => {
    setActiveNsstaProgram(null);
  }, []);

  // Real Email & Password Login using Supabase Auth ONLY
  const login = async (credentials: { email: string; password?: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const email = credentials.email?.trim().toLowerCase();
      const password = credentials.password || '';

      if (!email || !password) {
        const msg = 'Official email and password are required.';
        setAuthError(msg);
        showNotification('Login Failed', msg, 'warning');
        return false;
      }

      // Direct Supabase Auth sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user || !data.session) {
        const errMsg = error?.message || 'Invalid credentials. Please check your official MoSPI email and password.';
        setAuthError(errMsg);
        showNotification('Authentication Failed', errMsg, 'warning');
        return false;
      }

      tokenStorage.set(data.session.access_token);
      try {
        await supabase.realtime.setAuth(data.session.access_token);
      } catch (rtErr) {
        console.warn('[AuthContext] realtime setAuth notice:', rtErr);
      }
      const user = supabaseService.mapSessionUserToProfile(data.user);

      // Ensure public.users and official_profiles record exists
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email,
          name: user.name,
          role: user.role,
          status: 'ACTIVE',
          auth_provider: 'SUPABASE_AUTH',
          updated_at: new Date().toISOString(),
        });
        await supabase.from('official_profiles').upsert({
          user_id: data.user.id,
          employee_id: user.employeeId,
          cadre: user.cadre,
          pay_level: user.level,
          years_of_experience: user.yearsOfExperience,
          preferred_language: user.preferredLanguage,
          updated_at: new Date().toISOString(),
        });
      } catch (syncErr) {
        console.warn('[SupabaseAuth] Non-blocking public.users sync notice:', syncErr);
      }

      await syncUserData(user);
      setIsAuthModalOpen(false);
      showNotification('Official Sign-In Verified', `Welcome back, ${user.name} (${user.designation})`);

      const targetTab = pendingTabRef.current || 'dashboard';
      pendingTabRef.current = null;
      launchWorkspace(targetTab);
      return true;
    } catch (err: any) {
      const errMsg = err?.message || 'Authentication failed. Please check your official credentials.';
      setAuthError(errMsg);
      showNotification('Authentication Failed', errMsg, 'warning');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Real Officer Registration using Supabase Auth ONLY
  const register = async (userData: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const trimmedName = userData.name?.trim() || '';
      const trimmedEmail = userData.email?.trim().toLowerCase() || '';
      const password = userData.password || '';

      if (!trimmedName || !trimmedEmail || !password) {
        const msg = 'Please provide official full name, email, and password.';
        setAuthError(msg);
        showNotification('Registration Error', msg, 'warning');
        return false;
      }

      if (password.length < 6) {
        const msg = 'Official password must be at least 6 characters in length.';
        setAuthError(msg);
        showNotification('Validation Error', msg, 'warning');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        const msg = 'Please enter a valid email address (e.g. officer@mospi.gov.in).';
        setAuthError(msg);
        showNotification('Validation Error', msg, 'warning');
        return false;
      }

      const role = userData.role || 'LEARNER';
      const designation = userData.designation || 'Statistical Officer';
      const cadre = userData.cadre || 'Subordinate Statistical Service (SSS)';
      const ministry = userData.ministry || 'Ministry of Statistics & Programme Implementation (MoSPI)';
      const department = userData.department || 'National Statistical Office (NSO)';
      const employeeId = userData.employeeId || `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`;

      // Register directly via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            full_name: trimmedName,
            role,
            designation,
            cadre,
            ministry,
            department,
            employeeId,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error('User record was not created in Supabase Auth');
      }

      // Link/create the corresponding public.users record
      try {
        await supabase.from('users').upsert({
          id: authUser.id,
          email: trimmedEmail,
          name: trimmedName,
          role,
          status: 'ACTIVE',
          auth_provider: 'SUPABASE_AUTH',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await supabase.from('official_profiles').upsert({
          user_id: authUser.id,
          employee_id: employeeId,
          cadre,
          pay_level: userData.level || 11,
          years_of_experience: userData.yearsOfExperience || 5,
          preferred_language: 'English / Hindi',
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        console.warn('[SupabaseAuth] public.users sync notice:', dbErr?.message || dbErr);
      }

      const user = supabaseService.mapSessionUserToProfile(authUser);

      if (data.session?.access_token) {
        tokenStorage.set(data.session.access_token);
        try {
          await supabase.realtime.setAuth(data.session.access_token);
        } catch (rtErr) {
          console.warn('[AuthContext] realtime setAuth notice:', rtErr);
        }
        await syncUserData(user);
        setIsAuthModalOpen(false);
        showNotification(
          'Registration Complete',
          `Welcome to NIPUN, ${user.name}. Your account credentials and official profile have been saved.`
        );
        const targetTab = pendingTabRef.current || 'dashboard';
        pendingTabRef.current = null;
        launchWorkspace(targetTab);
      } else {
        setIsAuthModalOpen(false);
        showNotification(
          'Registration Submitted',
          `Officer account created for ${user.email}. Please sign in with your password.`,
          'info'
        );
      }
      return true;
    } catch (err: any) {
      console.error('Registration processing error:', err);
      const errMsg = err?.message || 'Registration service error. Please try again.';
      setAuthError(errMsg);
      showNotification('Registration Failed', errMsg, 'warning');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase Google Sign-In Authentication (OAuth Flow)
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Persist pending destination across OAuth redirect
      if (pendingTabRef.current && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('nipun_pending_tab', pendingTabRef.current);
        } catch {}
      }

      const { user } = await supabaseService.signInWithGoogle();
      if (user) {
        await syncUserData(user);
        setIsAuthModalOpen(false);
        showNotification('Google Authentication Successful', `Welcome to NIPUN, ${user.name}.`, 'success');
        const targetTab = resolveTargetTab();
        pendingTabRef.current = null;
        setActiveTab(targetTab);
        setActiveView('workspace');
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('Google login error:', err);
      const errMsg = err?.message || 'Google authentication failed. Please try again.';
      setAuthError(errMsg);
      showNotification('Authentication Notice', errMsg, 'warning');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Parichay SSO Authentication
  const loginWithParichay = async (_role: 'LEARNER' | 'TRAINER' | 'ADMINISTRATOR' = 'LEARNER'): Promise<boolean> => {
    showNotification(
      'Jan-Parichay SSO Gateway',
      'Jan-Parichay Single Sign-On gateway integration requires production NIC federation. Please sign in with your official MoSPI credentials.',
      'info'
    );
    return false;
  };

  // Logout & Session Revocation
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      tokenStorage.clear();
      setCurrentUser(null);
      setIsAuthenticated(false);

      // Close all active modals & drawers
      setIsAuthModalOpen(false);
      setIsDemoSelectorOpen(false);
      setIsGapCheckerOpen(false);
      setIsQuizModalOpen(false);
      setIsLabModalOpen(false);
      setIsMentorDrawerOpen(false);
      setIsProfileModalOpen(false);
      setActiveIgotCourse(null);
      setActiveNsstaProgram(null);
      setActiveView('landing');
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('nipun_active_tab');
          sessionStorage.removeItem('nipun_pending_tab');
        } catch {}
      }
      showNotification('Session Ended', 'You have been securely signed out of the official statistical system.');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch User Profile / Role
  const switchUserRole = async (_target: string) => {
    if (currentUser) {
      showNotification('Role Information', `Active cadre role is '${currentUser.role}'. Role permissions are managed via Supabase Auth.`, 'info');
    } else {
      openAuthModal('signin');
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const updated: UserProfile = { ...currentUser, ...updates };
      setCurrentUser(updated);

      try {
        await api.updateProfile(updates);
      } catch {
        // Direct Supabase update fallback
        if (currentUser.id) {
          await supabase.from('users').update({ name: updates.name, role: updates.role }).eq('id', currentUser.id);
          await supabase.from('official_profiles').update({
            employee_id: updates.employeeId,
            cadre: updates.cadre,
            pay_level: updates.level,
            years_of_experience: updates.yearsOfExperience,
          }).eq('user_id', currentUser.id);
        }
      }

      showNotification('Profile Updated', 'Your target role and preferences have been updated.', 'success');
      return true;
    } catch (err: any) {
      showNotification('Update Failed', err?.message || 'Failed to update profile', 'warning');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Career Purpose
  const applyPurpose = async (data: {
    purposeId: string;
    title: string;
    targetRole: string;
    targetCompetencies: string[];
  }) => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const updated: UserProfile = { ...currentUser, targetRole: data.targetRole, specialization: data.title };
      setCurrentUser(updated);

      try {
        await api.applyPurpose(data);
      } catch {
        // Local fallback
      }
      showNotification('Career Objective Configured', `Target set to "${data.title}"`, 'success');
      return true;
    } catch (err: any) {
      showNotification('Error', err?.message || 'Failed to configure objective', 'warning');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Demo Database (Disabled in pure Supabase mode)
  const resetDemoData = async () => {
    showNotification('System Baseline', 'Official system is powered solely by Supabase Auth. Demo accounts have been deprecated.', 'info');
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await syncUserData(currentUser);
    }
  };

  const exportPassportReport = () => {
    if (!currentUser) {
      showNotification('Sign-In Required', 'Please sign in to export your Competency Passport.', 'warning');
      return;
    }
    const reportData = {
      title: 'NIPUN Official Competency Passport Audit',
      generatedAt: new Date().toISOString(),
      officer: currentUser,
      competencies,
      gaps,
      verificationAuthority: 'National Statistical Systems Training Academy (NSSTA) & MoSPI',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NIPUN_Competency_Passport_${currentUser.name.replace(/\s+/g, '_') || 'Officer'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Export Complete', 'Competency Passport Audit JSON downloaded successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeLearner: currentUser || ({ ...DEFAULT_OFFICER_BASELINE, id: '' } as UserProfile),
        competencies,
        gaps,
        currentRole: currentUser?.role || 'LEARNER',
        isLoading,
        isAuthenticated,
        isAuthReady,
        authError,
        clearAuthError,
        activeView,
        setActiveView,
        isRecoverySession,
        resetPassword: (email: string) => supabaseService.resetPasswordForEmail(email),
        updatePassword: (newPassword: string) => supabaseService.updatePassword(newPassword),
        activeTab,
        setActiveTab: handleSetActiveTab,
        switchUserRole,
        resetDemoData,
        refreshUserData,
        exportPassportReport,
        launchWorkspace,
        requireAuth,
        login,
        loginWithGoogle,
        register,
        loginWithParichay,
        logout,
        updateProfile,
        applyPurpose,
        prioritySkill,
        calculatePrioritySkill,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        isDemoSelectorOpen,
        setIsDemoSelectorOpen: handleSetDemoSelectorOpen,
        isGapCheckerOpen,
        setIsGapCheckerOpen: handleSetGapCheckerOpen,
        setIsAIGapCheckerOpen: handleSetGapCheckerOpen,
        isQuizModalOpen,
        setIsQuizModalOpen,
        activeQuizId,
        openQuiz,
        closeQuiz,
        isLabModalOpen,
        setIsLabModalOpen: handleSetLabModalOpen,
        setIsPracticeLabOpen: handleSetLabModalOpen,
        isMentorDrawerOpen,
        setIsMentorDrawerOpen: handleSetMentorDrawerOpen,
        setIsAIMentorOpen: handleSetMentorDrawerOpen,
        isProfileModalOpen,
        setIsProfileModalOpen: handleSetProfileModalOpen,
        setIsProfileWizardOpen: handleSetProfileModalOpen,
        activeIgotCourse,
        openIgotCourse,
        closeIgotCourse,
        activeNsstaProgram,
        openNsstaProgram,
        closeNsstaProgram,
        isReassessmentOpen,
        setIsReassessmentOpen,
        openReassessment,
        closeReassessment,
        isDocIntelligenceOpen,
        setIsDocIntelligenceOpen,
        openDocIntelligence,
        closeDocIntelligence,
        notification,
        showNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
