export type RoleType = 'LEARNER' | 'TRAINER' | 'ADMINISTRATOR';

export type CompetencyCategory =
  | 'STATISTICAL_COMPETENCIES'
  | 'TECHNICAL_COMPETENCIES'
  | 'DIGITAL_GOVERNANCE'
  | 'BEHAVIOURAL_MANAGERIAL';

export type CompetencyLevel = 1 | 2 | 3 | 4 | 5;

export type GapType =
  | 'KNOWLEDGE_GAP'
  | 'APPLICATION_GAP'
  | 'RETENTION_GAP'
  | 'EXPERIENCE_GAP'
  | 'BEHAVIOURAL_GAP'
  | 'TECHNICAL_GAP';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  employeeId: string;
  ministry: string;
  department: string;
  division?: string;
  organization: string;
  designation: string;
  currentRole: string;
  targetRole: string;
  level: number; // e.g. Level 11
  cadre: string; // e.g. SSS (Subordinate Statistical Service), ISS (Indian Statistical Service)
  yearsOfExperience: number;
  education: string;
  specialization: string;
  location: string;
  preferredLanguage: string;
  previousRoles: string[];
  currentProjects: string[];
  technologiesUsed: string[];
  trainingHours: number;
  roleReadiness: number; // e.g. 82%
  verifiedSkillsCount: number;
  developingSkillsCount: number;
}

export interface Competency {
  id: string;
  name: string;
  category: CompetencyCategory;
  description: string;
  weight: number;
}

export interface RoleCompetency {
  roleId: string;
  competencyId: string;
  requiredLevel: CompetencyLevel;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LearnerCompetency {
  competencyId: string;
  name: string;
  category: CompetencyCategory;
  requiredLevel: CompetencyLevel;
  currentLevel: CompetencyLevel;
  gap: number;
  gapType?: GapType;
  confidence: number;
  lastAssessed: string;
  targetDate: string;
  status: 'VERIFIED' | 'DEVELOPING' | 'CRITICAL_GAP';
  evidence: {
    diagnosticScore?: number;
    practicalScore?: number;
    courseCompletions?: string[];
    repeatedErrors?: string[];
    notes?: string;
    lastUpgradeAudit?: CompetencyUpgradeRecord;
    [key: string]: any;
  };
  trend: 'IMPROVED' | 'STABLE' | 'NEEDS_ATTENTION';
}

export interface GapAnalysisResult {
  competencyId: string;
  competencyName: string;
  requiredLevel: CompetencyLevel;
  currentLevel: CompetencyLevel;
  gap: number;
  gapType: GapType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  knowledgeGapScore: number; // 0 to 100
  applicationGapScore: number; // 0 to 100
  retentionRiskScore: number; // 0 to 100
  aiDiagnosis: string;
  whyRecommended: string[];
  evidenceBase: {
    diagnosticAssessment: number;
    practicalTask: number;
    repeatedErrors: string[];
  };
}

export interface IGOTCourse {
  id: string;
  title: string;
  provider: string; // e.g., 'DoPT', 'MoSPI Training Cell', 'iGOT Digital'
  duration: string;
  competency: string;
  competencyLevel: CompetencyLevel;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  relevanceScore: number;
  recommendationReason: string;
  rating: number;
  enrolledCount: number;
  url?: string;
  thumbnail?: string;
  isDemoData: boolean;
}

export interface NSSTAProgramme {
  id: string;
  title: string;
  category:
    | 'ISS Probationary Training'
    | 'ISS Refresher Training'
    | 'JTS Induction Training'
    | 'State / UT Training'
    | 'Demand Based Training'
    | 'International Training'
    | 'TPAC Recommended'
    | string;
  duration: string; // e.g. '3 Days', '2 Weeks'
  mode?: 'In-Person (NSSTA Campus, Greater Noida)' | 'Virtual' | 'Hybrid' | string;
  targetCadre?: string;
  competenciesCovered?: string[];
  upcomingBatchDate?: string;
  eligibility?: string;
  tpacAligned?: boolean;
  recommendationReason?: string;
  isDemoData?: boolean;
  location?: string;
  dates?: string;
  competency?: string;
  targetLevel?: number;
  seatsAvailable?: number;
  batchCode?: string;
  description?: string;
  modulesCovered?: string[];
}

export type NSSTAProgram = NSSTAProgramme;

export type LearningSource = 'iGOT Karmayogi' | 'NSSTA / TPAC' | 'NIPUN Practical Learning';

export interface LearningCatalogueItem {
  id: string;
  title: string;
  source: LearningSource;
  competency: string;
  competencyLevel?: CompetencyLevel;
  domain: string; // e.g. 'Technical Competencies', 'Statistical Methodology', 'Official Statistics', 'Digital Governance & Compliance'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string; // e.g. '2h 30m', '3 Days', '45 mins'
  durationCategory?: 'SHORT' | 'MEDIUM' | 'LONG'; // <2h, 2-6h, >6h/multi-day
  prerequisites: string;
  targetRole: string;
  description: string;
  learningObjectives: string[];
  relevanceToGap: string;
  expectedImprovement?: string;
  isDemoData: boolean; // Must be true for mock
  datasetNotice: string; // "Development Dataset"
  rating?: number;
  enrolledCount?: number;
  url?: string;
  mode?: string;
  tpacAligned?: boolean;
  phase?: 'FOUNDATION' | 'APPLICATION' | 'ADVANCED' | 'ASSESSMENT' | 'REASSESSMENT';
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ASSESSMENT_PENDING' | 'VERIFIED';
}

export interface RecommendationExplanation {
  skillGap: string; // e.g. "Python L2 → L4"
  roleRelevance: string; // e.g. "Required for Deputy Director (Statistics)"
  prerequisite: string; // e.g. "Basic Python & Spreadsheet data cleaning"
  reason: string; // e.g. "Targets identified Python application gap."
}

export interface UnifiedRecommendation {
  id: string;
  competencyName: string;
  gapLabel: string;
  currentLevel: number;
  requiredLevel: number;
  gapSize: number;
  reason: string;
  explanation: RecommendationExplanation;
  igotOption: IGOTCourse;
  nsstaOption: NSSTAProgramme;
  nipunPracticeOption?: {
    id: string;
    title: string;
    duration: string;
    scenario: string;
    description: string;
    type: 'SIMULATION' | 'INTERACTIVE_LAB' | 'CASE_STUDY';
    learningObjectives?: string[];
    prerequisites?: string;
  };
  statviaPracticeOption?: {
    id: string;
    title: string;
    duration: string;
    scenario: string;
    description: string;
    type: 'SIMULATION' | 'INTERACTIVE_LAB' | 'CASE_STUDY';
    learningObjectives?: string[];
    prerequisites?: string;
  };
  rankedResources?: LearningCatalogueItem[];
  matchedSources?: {
    igot: boolean;
    nssta: boolean;
    nipun: boolean;
  };
}

export interface LearningPathItem {
  id: string;
  order: number;
  title: string;
  source: 'NIPUN Diagnostic' | 'STATVIA Diagnostic' | 'iGOT Karmayogi' | 'NSSTA Programme' | 'NIPUN Lab' | 'STATVIA Lab' | 'Assessment' | 'Verification' | string;
  sourceType: 'DIAGNOSTIC' | 'IGOT' | 'NSSTA' | 'PRACTICE' | 'QUIZ' | 'VERIFICATION' | 'REASSESSMENT';
  phase?: 'FOUNDATION' | 'APPLICATION' | 'ADVANCED' | 'ASSESSMENT' | 'REASSESSMENT';
  duration: string;
  competency: string;
  reason: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ASSESSMENT_PENDING' | 'VERIFIED';
  score?: number;
  externalLink?: string;
  prerequisites?: string;
  learningObjectives?: string[];
  expectedImprovement?: string;
  catalogueItemId?: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  targetRole: string;
  title: string;
  progressPercentage: number;
  items: LearningPathItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index 0-3
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  competency: string;
  topic: string;
  sourceReference: string;
}

export interface QuizAssessment {
  id: string;
  title: string;
  description: string;
  competency: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  passingScore: number;
  isAiGenerated?: boolean;
}

export interface QuizAttemptResult {
  assessmentId: string;
  userId: string;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  timeSpentSeconds: number;
  topicScores: { topic: string; score: number; total: number }[];
  aiConclusion: string;
  updatedCompetencyLevel: CompetencyLevel;
  competencyGapReduced: boolean;
  recommendedRevision: string[];
  completedAt: string;
}

export interface DocumentSummaryResult {
  fileName: string;
  fileSizeFormatted: string;
  executiveSummary: string;
  keyMethodologicalPoints: string[];
  cadreImplications: string;
  targetCompetencies: string[];
  extractedFormulasOrStandards?: string[];
  generatedQuestions: QuizQuestion[];
  rawTextExcerpt?: string;
}

export interface ReassessmentResult {
  reassessmentId: string;
  userId: string;
  completedAt: string;
  preLearningScore: number;
  postLearningScore: number;
  scoreImprovement: number;
  passed: boolean;
  passingScore?: number;
  status?: string;
  previousLevel?: number;
  newLevel?: number;
  remainingGap?: number;
  previousOverallReadiness?: number;
  newOverallReadiness?: number;
  readinessImprovement?: number;
  sparrowSynced?: boolean;
  sparrowSyncTimestamp?: string;
  evaluatedCompetencies: {
    competencyId?: string;
    competencyName: string;
    previousLevel: number;
    newLevel: number;
    preScore: number;
    postScore: number;
    gapClosed: boolean;
  }[];
  certificateId: string;
  aiVerificationSummary: string;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  fileType?: string;
  uploadedBy?: string;
  uploadedAt: string;
  purpose?: 'TRAINER_ASSESSMENT_GENERATION' | 'LEARNING_MATERIAL';
  extractedTopics?: string[];
  keySummary?: string;
  status: 'PROCESSED' | 'PROCESSING' | 'ERROR';
  generatedQuestionsCount?: number;
  competency?: string;
}

export interface AIMentorMessage {
  id: string;
  sender: 'user' | 'mentor';
  content: string;
  timestamp: string;
  suggestedActions?: { label: string; actionType: string; payload?: any }[];
}

export interface AdminWorkforceMetrics {
  totalOfficials: number;
  averageRoleReadiness: number;
  criticalGapsCount: number;
  totalLearningHours: number;
  courseCompletionRate: number;
  averageCompetencyImprovement: number;
  topOrganizationalGaps: {
    competency: string;
    averageRequired: number;
    averageCurrent: number;
    gap: number;
    officialsAffected: number;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  departmentComparison: {
    department: string;
    officials: number;
    readiness: number;
    criticalGaps: number;
  }[];
  trainingEffectiveness: {
    competency: string;
    preTrainingScore: number;
    postTrainingScore: number;
    improvementPoints: number;
    gapClosedPercentage: number;
    officialsTrained: number;
  }[];
  futureSkillForecast: {
    skill: string;
    demandLevel: 'High Priority' | 'Medium Priority' | 'Emerging';
    timeline: string;
    rationale: string;
  }[];
}

export interface SystemIntegrationStatus {
  service: 'iGOT Karmayogi' | 'NSSTA Academy' | 'Gemini AI' | 'NIPUN Database' | 'STATVIA Database';
  status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE';
  endpoint: string;
  latencyMs: number;
  lastChecked: string;
  description: string;
}

export interface CompetencyUpgradeRecord {
  id: string;
  userId: string;
  competencyId: string;
  competencyName: string;
  previousLevel: CompetencyLevel;
  newLevel: CompetencyLevel;
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  passingScore: number;
  evidence: string;
  timestamp: string;
  verificationStatus: 'VERIFIED' | 'DEVELOPING' | 'IN_PROGRESS';
  recalculatedGap: number;
}

export interface WorkforceOverview {
  totalOfficers: number;
  overallReadinessScore: number;
  criticalGapCount: number;
  activeLearningHours: number;
  competencyHeatmap: {
    competency: string;
    readinessScore: number;
    officersWithGap: number;
  }[];
  divisionBreakdown: {
    division: string;
    headcount: number;
    avgReadiness: number;
    topGap: string;
  }[];
}

