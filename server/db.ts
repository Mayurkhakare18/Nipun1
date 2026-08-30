import crypto from 'crypto';
import type {
  UserProfile,
  Competency,
  LearnerCompetency,
  GapAnalysisResult,
  LearningPath,
  QuizAssessment,
  UploadedDocument,
  AdminWorkforceMetrics,
  CompetencyUpgradeRecord,
} from '../src/types.js';

export interface UserCredential {
  userId: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
}

export interface DatabaseState {
  users: Record<string, UserProfile>;
  userCredentials: Record<string, UserCredential>;
  sessions: Record<string, UserSession>;
  competencies: Competency[];
  learnerCompetencies: Record<string, LearnerCompetency[]>;
  gapAnalysis: Record<string, GapAnalysisResult[]>;
  learningPaths: Record<string, LearningPath>;
  assessments: QuizAssessment[];
  uploadedDocuments: UploadedDocument[];
  auditLogs: { id: string; timestamp: string; user: string; action: string; details: string }[];
  competencyUpgradeAudits: Record<string, CompetencyUpgradeRecord[]>;
  notifications: { id: string; userId: string; title: string; message: string; timestamp: string; read: boolean }[];
  workforceMetrics: AdminWorkforceMetrics;
}

export const INITIAL_COMPETENCIES: Competency[] = [
  // Statistical Competencies
  { id: 'comp-stat-01', name: 'Survey Design', category: 'STATISTICAL_COMPETENCIES', description: 'Design of multi-stage stratified sampling and survey questionnaires.', weight: 1.2 },
  { id: 'comp-stat-02', name: 'Sampling Methodology', category: 'STATISTICAL_COMPETENCIES', description: 'Probability proportional to size (PPS), cluster sampling and variance estimation.', weight: 1.3 },
  { id: 'comp-stat-03', name: 'National Accounts', category: 'STATISTICAL_COMPETENCIES', description: 'SNA 2008 framework, GDP compilation, supply-use tables and GVA.', weight: 1.1 },
  { id: 'comp-stat-04', name: 'Price Statistics', category: 'STATISTICAL_COMPETENCIES', description: 'CPI, WPI index formulation, Laspeyres vs Tornqvist indexes.', weight: 1.0 },
  { id: 'comp-stat-05', name: 'SDG Indicators', category: 'STATISTICAL_COMPETENCIES', description: 'National Indicator Framework (NIF) metadata compilation & tier tracking.', weight: 1.0 },
  { id: 'comp-stat-06', name: 'Data Quality Frameworks', category: 'STATISTICAL_COMPETENCIES', description: 'DQAF, UN-NQAF accuracy, timeliness, comparability and integrity metrics.', weight: 1.2 },
  { id: 'comp-stat-07', name: 'Statistical Dissemination', category: 'STATISTICAL_COMPETENCIES', description: 'Open data protocols, microdata anonymization, metadata standards.', weight: 1.0 },

  // Technical Competencies
  { id: 'comp-tech-01', name: 'Python', category: 'TECHNICAL_COMPETENCIES', description: 'Data structures, pandas, NumPy, automated cleaning scripts and statistical modeling.', weight: 1.4 },
  { id: 'comp-tech-02', name: 'Data Visualization', category: 'TECHNICAL_COMPETENCIES', description: 'Dashboarding, PowerBI, Matplotlib/Seaborn, statistical charts for policy makers.', weight: 1.2 },
  { id: 'comp-tech-03', name: 'R', category: 'TECHNICAL_COMPETENCIES', description: 'Statistical testing, regression analysis, survey package for complex designs.', weight: 1.1 },
  { id: 'comp-tech-04', name: 'SQL & Database Querying', category: 'TECHNICAL_COMPETENCIES', description: 'Relational database schema querying, aggregations, data warehouse extraction.', weight: 1.1 },
  { id: 'comp-tech-05', name: 'AI / ML', category: 'TECHNICAL_COMPETENCIES', description: 'Machine learning for statistical imputation, anomaly detection and NLP categorization.', weight: 1.0 },
  { id: 'comp-tech-06', name: 'GIS & Spatial Analytics', category: 'TECHNICAL_COMPETENCIES', description: 'Geospatial mapping of census and sample survey enumeration blocks.', weight: 0.9 },
  { id: 'comp-tech-07', name: 'Big Data Analytics', category: 'TECHNICAL_COMPETENCIES', description: 'Handling high-frequency administrative datasets and GST/EPFO analytics.', weight: 1.0 },

  // Digital Governance
  { id: 'comp-gov-01', name: 'Cybersecurity', category: 'DIGITAL_GOVERNANCE', description: 'Data protection, threat posture, safe data transfer and network hygiene.', weight: 1.0 },
  { id: 'comp-gov-02', name: 'Data Privacy & DPDP Act', category: 'DIGITAL_GOVERNANCE', description: 'Compliance with Digital Personal Data Protection Act and consent frameworks.', weight: 1.1 },
  { id: 'comp-gov-03', name: 'Digital Public Infrastructure', category: 'DIGITAL_GOVERNANCE', description: 'Aadhaar authentication, DigiLocker integration and UPI ecosystem data.', weight: 0.9 },

  // Behavioural / Managerial
  { id: 'comp-beh-01', name: 'Leadership & Team Management', category: 'BEHAVIOURAL_MANAGERIAL', description: 'Field team coordination, enumerator motivation and project leadership.', weight: 1.0 },
  { id: 'comp-beh-02', name: 'Public Communication', category: 'BEHAVIOURAL_MANAGERIAL', description: 'Briefing senior policy makers and disseminating statistical findings clearly.', weight: 1.0 },
  { id: 'comp-beh-03', name: 'Ethics in Official Statistics', category: 'BEHAVIOURAL_MANAGERIAL', description: 'Fundamental Principles of Official Statistics (UN-FPOS) and neutrality.', weight: 1.2 },
];

export const INITIAL_USERS: Record<string, UserProfile> = {
  'user-learner-01': {
    id: 'user-learner-01',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@mospi.gov.in',
    role: 'LEARNER',
    employeeId: 'ISS-2019-7482',
    ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    department: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    division: 'Data Analytics & Survey Division',
    organization: 'Government of India',
    designation: 'Assistant Director (Statistics)',
    currentRole: 'Assistant Director (Statistics)',
    targetRole: 'Deputy Director (Statistics)',
    level: 11,
    cadre: 'Indian Statistical Service (ISS)',
    yearsOfExperience: 7,
    education: 'M.Sc. Statistics',
    specialization: 'Survey Data Analysis & Statistical Reporting',
    location: 'New Delhi',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Senior Statistical Officer', 'Statistical Investigator'],
    currentProjects: ['Survey Data Analysis & Statistical Reporting', 'PLFS Annual Statistical Review'],
    technologiesUsed: ['Python', 'SQL', 'R', 'CSPro', 'Stata'],
    trainingHours: 48,
    roleReadiness: 82,
    verifiedSkillsCount: 14,
    developingSkillsCount: 3,
  },
  'user-trainer-01': {
    id: 'user-trainer-01',
    name: 'Dr. Rajesh Verma',
    email: 'rajesh.verma@mospi.gov.in',
    role: 'TRAINER',
    employeeId: 'NSSTA-FAC-104',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'National Statistical Systems Training Academy (NSSTA)',
    organization: 'Government of India',
    designation: 'Senior Director & Academic Faculty',
    currentRole: 'Senior Director & Academic Faculty',
    targetRole: 'Director General (Training)',
    level: 13,
    cadre: 'Indian Statistical Service (ISS)',
    yearsOfExperience: 18,
    education: 'Ph.D. in Statistical Computing (ISI Kolkata)',
    specialization: 'Advanced Survey Methodology & Computational Statistics',
    location: 'Greater Noida, UP',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Director (ISS Cadre)', 'Joint Director (Training)'],
    currentProjects: ['ISS Induction 2026 Curriculum', 'TPAC Modernization Framework'],
    technologiesUsed: ['Python', 'R', 'LaTeX', 'iGOT Platform Admin'],
    trainingHours: 140,
    roleReadiness: 96,
    verifiedSkillsCount: 22,
    developingSkillsCount: 0,
  },
  'user-admin-01': {
    id: 'user-admin-01',
    name: 'Vikram Sen',
    email: 'vikram.sen@mospi.gov.in',
    role: 'ADMINISTRATOR',
    employeeId: 'IAS-2012-4819',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'Capacity Building & Training Division',
    organization: 'Government of India',
    designation: 'Joint Secretary / Capacity Building Nodal Officer',
    currentRole: 'Joint Secretary / Capacity Building Nodal Officer',
    targetRole: 'Additional Secretary',
    level: 14,
    cadre: 'Central Secretariat / MoSPI',
    yearsOfExperience: 22,
    education: 'Master of Public Policy (LKYSPP) & B.Tech',
    specialization: 'Digital Governance & Human Capital Development',
    location: 'New Delhi',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Director (Administration)', 'Deputy Secretary (Policy)'],
    currentProjects: ['Mission Karmayogi MoSPI Implementation', 'NSSTA Greater Noida Expansion'],
    technologiesUsed: ['e-Office', 'SPARROW', 'iGOT Org Portal', 'STATVIA Analytics'],
    trainingHours: 60,
    roleReadiness: 94,
    verifiedSkillsCount: 19,
    developingSkillsCount: 1,
  },
  'user-trainer-alias': {
    id: 'user-trainer-alias',
    name: 'Dr. Rajeshwar Rao',
    email: 'r.rao@nssta.gov.in',
    role: 'TRAINER',
    employeeId: 'NSSTA-FAC-104',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'National Statistical Systems Training Academy (NSSTA)',
    organization: 'Government of India',
    designation: 'Senior Director & Academic Faculty',
    currentRole: 'Senior Director & Academic Faculty',
    targetRole: 'Director General (Training)',
    level: 13,
    cadre: 'Indian Statistical Service (ISS)',
    yearsOfExperience: 18,
    education: 'Ph.D. in Statistical Computing (ISI Kolkata)',
    specialization: 'Advanced Survey Methodology & Computational Statistics',
    location: 'Greater Noida, UP',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Director (ISS Cadre)', 'Joint Director (Training)'],
    currentProjects: ['ISS Induction 2026 Curriculum', 'TPAC Modernization Framework'],
    technologiesUsed: ['Python', 'R', 'LaTeX', 'iGOT Platform Admin'],
    trainingHours: 140,
    roleReadiness: 96,
    verifiedSkillsCount: 22,
    developingSkillsCount: 0,
  },
  'user-admin-alias': {
    id: 'user-admin-alias',
    name: 'Sanjay Deshmukh',
    email: 'sanjay.deshmukh@nic.in',
    role: 'ADMINISTRATOR',
    employeeId: 'IAS-2012-4819',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'Capacity Building & Training Division',
    organization: 'Government of India',
    designation: 'Joint Secretary / Capacity Building Nodal Officer',
    currentRole: 'Joint Secretary / Capacity Building Nodal Officer',
    targetRole: 'Additional Secretary',
    level: 14,
    cadre: 'Central Secretariat / MoSPI',
    yearsOfExperience: 22,
    education: 'Master of Public Policy (LKYSPP) & B.Tech',
    specialization: 'Digital Governance & Human Capital Development',
    location: 'New Delhi',
    preferredLanguage: 'English / Hindi',
    previousRoles: ['Director (Administration)', 'Deputy Secretary (Policy)'],
    currentProjects: ['Mission Karmayogi MoSPI Implementation', 'NSSTA Greater Noida Expansion'],
    technologiesUsed: ['e-Office', 'SPARROW', 'iGOT Org Portal', 'STATVIA Analytics'],
    trainingHours: 60,
    roleReadiness: 94,
    verifiedSkillsCount: 19,
    developingSkillsCount: 1,
  },
};

export const INITIAL_LEARNER_COMPETENCIES: LearnerCompetency[] = [
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
    evidence: { diagnosticScore: 78, practicalScore: 70, courseCompletions: ['NSSO Master Class on Questionnaire Design'] },
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
    evidence: { diagnosticScore: 76, practicalScore: 72, courseCompletions: ['Probability Sampling Protocols'] },
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
    evidence: { diagnosticScore: 65, practicalScore: 58, repeatedErrors: ['Window functions', 'Complex subqueries'] },
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
    evidence: { diagnosticScore: 50, practicalScore: 40, notes: 'Needs training on QGIS & Census boundary polygons.' },
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
    evidence: { diagnosticScore: 75, practicalScore: 70, notes: 'Field team supervisory experience progressing.' },
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
    evidence: { diagnosticScore: 84, courseCompletions: ['SDG National Indicator Framework Tier-1 & Tier-2'] },
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
    evidence: { diagnosticScore: 90, practicalScore: 92, courseCompletions: ['UN-NQAF Institutional Implementation'] },
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
    evidence: { diagnosticScore: 86, courseCompletions: ['Cert-In Information Security Baseline'] },
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
    evidence: { diagnosticScore: 88, practicalScore: 84, courseCompletions: ['DPDP Act 2023 for Statistical Microdata'] },
    trend: 'IMPROVED',
  },
  {
    competencyId: 'comp-beh-03',
    name: 'Ethics in Official Statistics',
    category: 'BEHAVIOURAL_MANAGERIAL',
    requiredLevel: 4,
    currentLevel: 4,
    gap: 0,
    confidence: 0.96,
    lastAssessed: '2026-03-10',
    targetDate: '2026-12-31',
    status: 'VERIFIED',
    evidence: { diagnosticScore: 94, courseCompletions: ['UN Fundamental Principles of Official Statistics'] },
    trend: 'STABLE',
  },
];

export const INITIAL_GAP_ANALYSIS: GapAnalysisResult[] = [
  {
    competencyId: 'comp-tech-01',
    competencyName: 'Python',
    requiredLevel: 3,
    currentLevel: 2,
    gap: 1,
    gapType: 'APPLICATION_GAP',
    priority: 'HIGH',
    confidence: 0.91,
    knowledgeGapScore: 25,
    applicationGapScore: 75,
    retentionRiskScore: 20,
    aiDiagnosis: 'Learner understands the basic syntax and concepts but struggles to apply Python effectively to real survey data tasks and pandas transformations.',
    whyRecommended: [
      'Syntax comprehension is high in multiple-choice formats.',
      'Fails to complete practical coding assessments involving pandas.',
      'Time taken on data cleaning tasks exceeds expected benchmarks.',
    ],
    evidenceBase: {
      diagnosticAssessment: 48,
      practicalTask: 42,
      repeatedErrors: ['Functions & Scope', 'pandas DataFrame transformations', 'Survey weight calculation syntax'],
    },
  },
  {
    competencyId: 'comp-tech-02',
    competencyName: 'Data Visualization',
    requiredLevel: 4,
    currentLevel: 2,
    gap: 2,
    gapType: 'APPLICATION_GAP',
    priority: 'HIGH',
    confidence: 0.88,
    knowledgeGapScore: 35,
    applicationGapScore: 68,
    retentionRiskScore: 25,
    aiDiagnosis: 'Learner creates standard 2D bar charts accurately but requires hands-on training to build dynamic multi-filter dashboards for official survey releases.',
    whyRecommended: [
      'Target Level 4 requires automated dashboarding skills.',
      'Practical assessment revealed difficulty with geospatial visualization.',
      'Recommended iGOT PowerBI course and NSSTA visual design laboratory.',
    ],
    evidenceBase: {
      diagnosticAssessment: 60,
      practicalTask: 50,
      repeatedErrors: ['Geospatial coordinate projection', 'Dynamic cross-filtering'],
    },
  },
  {
    competencyId: 'comp-tech-05',
    competencyName: 'AI / ML',
    requiredLevel: 2,
    currentLevel: 1,
    gap: 1,
    gapType: 'KNOWLEDGE_GAP',
    priority: 'MEDIUM',
    confidence: 0.84,
    knowledgeGapScore: 65,
    applicationGapScore: 40,
    retentionRiskScore: 30,
    aiDiagnosis: 'Officer has limited conceptual grounding in supervised vs unsupervised learning and automated outlier detection pipelines.',
    whyRecommended: [
      'MoSPI Technology Modernization Roadmap 2026 mandates L2 AI/ML awareness.',
      'Foundational micro-course on iGOT will establish core vocabulary.',
    ],
    evidenceBase: {
      diagnosticAssessment: 40,
      practicalTask: 35,
      repeatedErrors: ['Supervised vs Unsupervised models', 'Evaluation metrics (ROC-AUC / F1-Score)'],
    },
  },
];

export const INITIAL_LEARNING_PATH: LearningPath = {
  id: 'path-sso-01',
  userId: 'user-learner-01',
  targetRole: 'Senior Statistical Officer',
  title: 'Senior Statistical Officer Competency Acceleration Path',
  progressPercentage: 67,
  createdAt: '2026-08-01T09:00:00Z',
  updatedAt: '2026-08-25T14:30:00Z',
  items: [
    {
      id: 'step-1',
      order: 1,
      title: 'Step 1: Baseline Diagnostic Assessment (Pre-Course Evaluation)',
      source: 'STATVIA Diagnostic',
      sourceType: 'DIAGNOSTIC',
      duration: '30 mins',
      competency: 'Python & Survey Statistics',
      reason: 'Establishes empirical baseline capability score across targeted statistical competency domains.',
      status: 'COMPLETED',
      score: 82,
    },
    {
      id: 'step-2',
      order: 2,
      title: 'Step 2: iGOT Course - Python Functions & Scope for Statistical Scripts',
      source: 'iGOT Karmayogi',
      sourceType: 'IGOT',
      duration: '15 mins',
      competency: 'Python',
      reason: 'Addresses syntax comprehension and modular function design for survey processing pipelines.',
      status: 'COMPLETED',
      score: 90,
      externalLink: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Python+Statistical+Functions',
    },
    {
      id: 'step-3',
      order: 3,
      title: 'Step 3: NSSTA 3-Day Residential - Advanced Statistical Computing',
      source: 'NSSTA Programme',
      sourceType: 'NSSTA',
      duration: '3 Days',
      competency: 'Python & Big Data',
      reason: 'Residential faculty-led deep dive at NSSTA Greater Noida campus for advanced statistical estimation.',
      status: 'IN_PROGRESS',
      externalLink: 'https://www.mospi.gov.in/national-statistical-systems-training-academy-nssta',
    },
    {
      id: 'step-4',
      order: 4,
      title: 'Step 4: Interactive Microdata Cleaning Simulation & Practice MCQs',
      source: 'STATVIA Lab',
      sourceType: 'PRACTICE',
      duration: '20 mins',
      competency: 'Python',
      reason: 'Hands-on sandbox to clean simulated PLFS survey errors and apply pandas imputation.',
      status: 'IN_PROGRESS',
    },
    {
      id: 'step-5',
      order: 5,
      title: 'Step 5: MoSPI Document Intelligence & PDF Guideline MCQs',
      source: 'Assessment',
      sourceType: 'QUIZ',
      duration: '15 mins',
      competency: 'Official Statistics',
      reason: 'Summarizes latest MoSPI statistical guidelines and generates targeted MCQ knowledge checks.',
      status: 'NOT_STARTED',
    },
    {
      id: 'step-6',
      order: 6,
      title: 'Step 6: Post-Learning Reassessment & Gap Closure Verification',
      source: 'Verification',
      sourceType: 'VERIFICATION',
      duration: '20 mins',
      competency: 'Python L3 Verification',
      reason: 'Empirically verifies gap closure, measures learning gain vs baseline, and elevates level in National Passport.',
      status: 'NOT_STARTED',
    },
  ],
};

export const INITIAL_ASSESSMENTS: QuizAssessment[] = [
  {
    id: 'assess-py-l3',
    title: 'Python for Survey Microdata & Imputation Assessment',
    description: '10-minute diagnostic quiz assessing pandas dataframes, outlier detection, and stratum weights calculations.',
    competency: 'Python',
    timeLimitMinutes: 10,
    passingScore: 70,
    questions: [
      {
        id: 'py-q1',
        question: 'In survey data processing with Python pandas, which method correctly replaces missing income observations with the stratum median value?',
        options: [
          "df.groupby('stratum')['income'].transform(lambda x: x.fillna(x.median()))",
          "df['income'].fillna(df['income'].mean(), inplace=False)",
          "df.dropna(subset=['income'])",
          "df.replace('NaN', 0)",
        ],
        correctAnswer: 0,
        explanation: 'Using groupby with transform calculates the median within each stratum subgroup without reducing DataFrame rows.',
        difficulty: 'Medium',
        competency: 'Python',
        topic: 'pandas Imputation',
        sourceReference: 'MoSPI Statistical Data Processing Guidelines',
      },
      {
        id: 'py-q2',
        question: 'When calibrating multiplier weights in a stratified two-stage sample, which NumPy check validates that the inflated sample matches total population projection?',
        options: [
          'np.isclose(np.sum(sample_weights), projected_population, rtol=1e-4)',
          'np.equal_matrices(sample_weights, projected_population)',
          'np.count_nonzero(sample_weights)',
          'np.check_census_alignment(sample_weights)',
        ],
        correctAnswer: 0,
        explanation: 'np.isclose allows numerical floating point tolerance validation when checking sample weighting sums against census projections.',
        difficulty: 'Hard',
        competency: 'Python',
        topic: 'Weight Verification',
        sourceReference: 'NSSO Sampling Estimation Manual',
      },
      {
        id: 'py-q3',
        question: 'What is the primary computational benefit of utilizing vectorized operations in pandas over Python for-loops when processing millions of census records?',
        options: [
          'Vectorized operations execute in compiled C routines using SIMD parallel CPU instructions',
          'Vectorized operations automatically eliminate missing values without warnings',
          'Vectorized code bypasses operating system memory safety locks',
          'Loops in Python consume zero RAM memory',
        ],
        correctAnswer: 0,
        explanation: 'pandas and NumPy vectorization delegates operations to optimized C/Fortran routines with SIMD instruction sets, delivering 50x-100x speedups.',
        difficulty: 'Medium',
        competency: 'Python',
        topic: 'Performance & Vectorization',
        sourceReference: 'Python High-Performance Statistical Handbook',
      },
      {
        id: 'py-q4',
        question: 'Which pandas function is most effective for reshaping high-frequency industrial price quotations from long format into wide cross-tabulation by commodity code?',
        options: [
          "df.pivot_table(index='month', columns='item_code', values='price', aggfunc='mean')",
          "df.concat(['month', 'item_code'])",
          'df.melt(id_vars="item_code")',
          'df.sort_values(by="price")',
        ],
        correctAnswer: 0,
        explanation: 'pivot_table aggregates duplicate quotations and reshapes long time series records into matrix format for index compilation.',
        difficulty: 'Medium',
        competency: 'Python',
        topic: 'Data Reshaping',
        sourceReference: 'Price Statistics Division MoSPI',
      },
    ],
  },
  {
    id: 'assess-py-l4',
    title: 'Advanced Python for Official Statistics & Complex Survey Pipelines (Level 4)',
    description: 'Level 4 master validation covering out-of-core computing (Dask/Polars), multi-stage Taylor linearisation variance estimation, and statistical disclosure control (SDC).',
    competency: 'Python',
    timeLimitMinutes: 15,
    passingScore: 70,
    questions: [
      {
        id: 'py-l4-q1',
        question: 'When processing large microdata datasets (exceeding memory RAM) in Python, which approach ensures out-of-core chunked processing without memory exhaustion?',
        options: [
          'Using Polars lazy execution or Dask DataFrame computation graphs with delayed task chunks',
          'Loading the complete 50GB CSV file directly using standard pd.read_csv() into a single variable',
          'Disabling the operating system virtual swap space',
          'Converting all numeric columns into nested string arrays',
        ],
        correctAnswer: 0,
        explanation: 'Dask and Polars lazy dataframes partition computation into directed acyclic graphs (DAGs) and stream chunked batches through CPU cores without exhausting system memory.',
        difficulty: 'Hard',
        competency: 'Python',
        topic: 'Out-of-Core Processing',
        sourceReference: 'MoSPI Big Data & Computational Statistics Standard',
      },
      {
        id: 'py-l4-q2',
        question: 'In complex survey data analysis in Python, how is the Taylor series linearisation variance estimated for non-linear domain estimators (like poverty headcounts or Gini ratios)?',
        options: [
          'By linearising the non-linear estimator via first-order partial derivatives and computing the variance of the linearised surrogate across primary sampling units (PSUs)',
          'By calculating the simple standard deviation of the raw sample assuming i.i.d. random sampling',
          'By multiplying the sample mean by the number of survey rounds',
          'By deleting all outlier weights without variance calculations',
        ],
        correctAnswer: 0,
        explanation: 'Taylor series linearisation approximates non-linear statistics with linear functions of sample totals, allowing standard cluster-stratum variance formulas to be applied.',
        difficulty: 'Hard',
        competency: 'Python',
        topic: 'Complex Survey Variance Estimation',
        sourceReference: 'UN-NQAF Survey Sampling Variance Guidelines',
      },
      {
        id: 'py-l4-q3',
        question: 'Which Statistical Disclosure Control (SDC) algorithm in Python protects public use microdata (PUM) against re-identification risk while preserving marginal tabulation totals?',
        options: [
          'Targeted record swapping with k-anonymity checks and micro-aggregation of continuous expenditure variables',
          'Replacing all numeric columns with random integers',
          'Multiplying all observations by a fixed constant factor of 100',
          'Encrypting the dataset with AES-256 and deleting the decryption key',
        ],
        correctAnswer: 0,
        explanation: 'Standard SDC protocols apply k-anonymity, l-diversity, and microaggregation / record swapping to prevent indirect identification of respondents.',
        difficulty: 'Hard',
        competency: 'Python',
        topic: 'Statistical Disclosure Control (SDC)',
        sourceReference: 'MoSPI Microdata Dissemination & Privacy Policy',
      },
      {
        id: 'py-l4-q4',
        question: 'In automated statistical pipelines, how should Python decorators be applied to profile execution bottlenecks across survey imputation modules?',
        options: [
          'Using functools.wraps with cProfile / time.perf_counter to log execution latency and memory allocation per stratum function',
          'Writing custom print statements after every single line of code',
          'Rerunning the entire pipeline 500 times in a synchronous loop',
          'Suppressing all Python warning messages and tracebacks',
        ],
        correctAnswer: 0,
        explanation: 'Using function decorators with cProfile and perf_counter allows modular, non-intrusive latency and memory profiling across enterprise survey pipelines.',
        difficulty: 'Medium',
        competency: 'Python',
        topic: 'Pipeline Profiling & Performance',
        sourceReference: 'Python High-Performance Statistical Handbook',
      },
    ],
  },
  {
    id: 'assess-national-accounts',
    title: 'National Accounts (SNA 2008) & GVA Deflators Diagnostic',
    description: 'Specialized assessment evaluating Supply-Use Tables (SUT), informal sector estimation, and FISIM calculation.',
    competency: 'National Accounts (SNA 2008)',
    timeLimitMinutes: 12,
    passingScore: 70,
    questions: [
      {
        id: 'na-q1',
        question: 'Under SNA 2008 recommendations, how should Financial Intermediation Services Indirectly Measured (FISIM) be allocated between sectors?',
        options: [
          'Allocated as intermediate consumption of user industries and final consumption of households/government based on loan/deposit balances',
          'Treated solely as a deduction from nominal Gross Domestic Product at factor cost',
          'Ignored in national accounting since financial services have no physical output',
          'Added completely to household disposable income without industry breakdown',
        ],
        correctAnswer: 0,
        explanation: 'SNA 2008 requires FISIM to be allocated to intermediate consumption of user industries and final consumption of households based on reference interest rates.',
        difficulty: 'Hard',
        competency: 'National Accounts (SNA 2008)',
        topic: 'FISIM Accounting',
        sourceReference: 'UN System of National Accounts 2008, Chapter 6',
      },
      {
        id: 'na-q2',
        question: 'In the compilation of Supply and Use Tables (SUT), what identity must hold for every commodity group at purchasers’ prices?',
        options: [
          'Total Domestic Output + Imports + Trade/Transport Margins + Net Taxes on Products = Intermediate Consumption + Final Use + Exports',
          'Total Gross Output = Total Value Added + Subsidies',
          'Gross Value Added = Total Exports - Total Imports',
          'Domestic Output = Total Net Capital Formation',
        ],
        correctAnswer: 0,
        explanation: 'The fundamental commodity balance in SUT requires total supply at purchasers prices to equal total use at purchasers prices across all product groups.',
        difficulty: 'Medium',
        competency: 'National Accounts (SNA 2008)',
        topic: 'Supply-Use Balancing',
        sourceReference: 'CSO National Accounts Compilation Manual',
      },
      {
        id: 'na-q3',
        question: 'When deflating nominal Gross Value Added (GVA) in manufacturing using the Double Deflation method, which deflators are applied?',
        options: [
          'Gross output is deflated by product output price index; intermediate inputs are deflated by input cost price index',
          'Gross output and intermediate inputs are both deflated only by the Headline Consumer Price Index (CPI)',
          'GVA is deflated directly by the GDP deflator without considering input costs',
          'Double deflation implies multiplying nominal output by the exchange rate',
        ],
        correctAnswer: 0,
        explanation: 'Double deflation separately deflates gross output by an appropriate output price index and intermediate consumption by an input price index.',
        difficulty: 'Hard',
        competency: 'National Accounts (SNA 2008)',
        topic: 'Double Deflation',
        sourceReference: 'National Accounts Division (NAD) MoSPI',
      },
    ],
  },
  {
    id: 'assess-survey-sampling',
    title: 'Survey Sampling Design & Field Multipliers Diagnostic',
    description: 'Assessment covering probability proportional to size (PPS), CAPI validation rules, and multiplier weighting.',
    competency: 'Survey Methodology',
    timeLimitMinutes: 12,
    passingScore: 70,
    questions: [
      {
        id: 'ss-q1',
        question: 'In a stratified two-stage sampling design for NSSO household surveys, what is the formula for the design multiplier weight for household j in stratum h, FSU i?',
        options: [
          'w_hij = (1 / P_hi) * (H_hi / h_hi), where P_hi is FSU selection probability and H_hi/h_hi is second-stage sampling fraction',
          'w_hij = Total Population / Total Sample Size',
          'w_hij = Stratum Variance / Sample Mean',
          'w_hij = Total Enumerators / Total Villages',
        ],
        correctAnswer: 0,
        explanation: 'The design weight is the inverse of the inclusion probability: (1 / P_hi) * (H_hi / h_hi).',
        difficulty: 'Hard',
        competency: 'Survey Methodology',
        topic: 'Multiplier Calibration',
        sourceReference: 'NSSO Sampling Design Handbook',
      },
      {
        id: 'ss-q2',
        question: 'What is the primary advantage of selecting First Stage Units (FSUs) with Probability Proportional to Size (PPS) rather than Simple Random Sampling (SRS)?',
        options: [
          'Substantially reduces sampling variance for aggregate estimates when larger units account for larger shares of survey variables',
          'Guarantees zero non-response error during field fieldwork',
          'Eliminates the requirement of maintaining an urban frame survey (UFS)',
          'Allows field investigators to skip household listing',
        ],
        correctAnswer: 0,
        explanation: 'PPS sampling assigns higher selection probabilities to larger clusters, leading to higher estimation precision and lower design effects.',
        difficulty: 'Medium',
        competency: 'Survey Methodology',
        topic: 'PPS Sampling',
        sourceReference: 'SDRD Survey Design Manual',
      },
      {
        id: 'ss-q3',
        question: 'During Computer Assisted Personal Interviewing (CAPI), which real-time logical check prevents inconsistent demographic reporting in household rosters?',
        options: [
          'Hard range check enforcing: Age of child <= (Age of mother - 15)',
          'Automated battery level monitoring on tablets',
          'GPS coordinate logging without timestamp',
          'Text capitalization script',
        ],
        correctAnswer: 0,
        explanation: 'Hard logical validation rules in CAPI software (like CSPro / Survey Solutions) prevent biologically impossible household relationships from being entered in the field.',
        difficulty: 'Easy',
        competency: 'Survey Methodology',
        topic: 'CAPI Validation',
        sourceReference: 'FOD Field Operations Division Guidelines',
      },
    ],
  },
  {
    id: 'assess-price-statistics',
    title: 'Price Statistics, CPI Rebasing & Hedonic Indexing Diagnostic',
    description: 'Evaluates scanner data integration, hedonic quality adjustments, and geometric aggregations.',
    competency: 'Price Statistics',
    timeLimitMinutes: 10,
    passingScore: 70,
    questions: [
      {
        id: 'ps-q1',
        question: 'Why does the Jevons elementary price index formula prevent the upward elementary substitution bias associated with the Carli arithmetic mean?',
        options: [
          'Jevons uses an unweighted geometric mean of price relatives, which satisfies the time-reversal property',
          'Jevons adds fixed 5% tax subsidies to base period prices',
          'Jevons uses maximum prices observed across all retail markets',
          'Jevons ignores commodity quality shifts completely',
        ],
        correctAnswer: 0,
        explanation: 'The Jevons index satisfies both time-reversal and circularity tests because geometric averaging prevents arithmetic upward drift.',
        difficulty: 'Medium',
        competency: 'Price Statistics',
        topic: 'Index Number Theory',
        sourceReference: 'ILO Consumer Price Index Manual',
      },
      {
        id: 'ps-q2',
        question: 'When a consumer electronics commodity experiences a major technological upgrade in the CPI basket, how does Hedonic Regression isolate pure price change?',
        options: [
          'Estimates shadow prices for product attributes (RAM, processor, screen) and subtracts the estimated value of quality improvements from the price differential',
          'Carries forward the old price indefinitely without adjusting for new specifications',
          'Drops the product category completely from the CPI calculation',
          'Doubles the weight of the old commodity in the index',
        ],
        correctAnswer: 0,
        explanation: 'Hedonic regression models price as a function of item characteristics, allowing statisticians to decouple quality improvements from pure inflationary price movements.',
        difficulty: 'Hard',
        competency: 'Price Statistics',
        topic: 'Hedonic Quality Adjustment',
        sourceReference: 'Price Statistics Division MoSPI',
      },
    ],
  },
  {
    id: 'assess-sdc-privacy',
    title: 'Statistical Disclosure Control (SDC) & DPDP Compliance Diagnostic',
    description: 'Evaluates microdata anonymization, k-anonymity, l-diversity, and cell suppression under DPDP Act.',
    competency: 'Statistical Disclosure Control',
    timeLimitMinutes: 10,
    passingScore: 70,
    questions: [
      {
        id: 'sdc-q1',
        question: 'In public release of PLFS or Census microdata, a dataset satisfies k-anonymity if:',
        options: [
          'Each combination of quasi-identifiers (e.g. Age, Gender, District, Caste) is shared by at least k distinct individuals in the dataset',
          'The dataset is encrypted with a k-bit RSA public key',
          'Exactly k variables are removed from the questionnaire',
          'The survey is conducted in at least k administrative districts',
        ],
        correctAnswer: 0,
        explanation: 'k-anonymity ensures that an individual cannot be uniquely distinguished from at least k-1 other individuals within the same quasi-identifier equivalence class.',
        difficulty: 'Medium',
        competency: 'Statistical Disclosure Control',
        topic: 'k-Anonymity',
        sourceReference: 'MoSPI Microdata Dissemination Policy & DPDP Act 2023',
      },
      {
        id: 'sdc-q2',
        question: 'In tabular data dissemination, why is secondary (complementary) cell suppression required alongside primary suppression of sensitive cells?',
        options: [
          'To prevent adversaries from calculating the exact value of the suppressed primary cell using row and column marginal totals',
          'To save storage space in published PDF reports',
          'To remove non-responding enterprises from the population register',
          'To conform with standard printer margin formats',
        ],
        correctAnswer: 0,
        explanation: 'Without complementary suppression, simple linear arithmetic on published row and column totals would reveal the suppressed primary cell value.',
        difficulty: 'Hard',
        competency: 'Statistical Disclosure Control',
        topic: 'Tabular Cell Suppression',
        sourceReference: 'UNECE Principles and Guidelines for Statistical Disclosure Control',
      },
    ],
  },
];

export const INITIAL_WORKFORCE_METRICS: AdminWorkforceMetrics = {
  totalOfficials: 1840,
  averageRoleReadiness: 82.4,
  criticalGapsCount: 214,
  totalLearningHours: 4280.5,
  courseCompletionRate: 88.6,
  averageCompetencyImprovement: 24.8,
  topOrganizationalGaps: [
    {
      competency: 'Python for Statistical Computing',
      averageRequired: 3.4,
      averageCurrent: 2.2,
      gap: 1.2,
      officialsAffected: 385,
      priority: 'High',
    },
    {
      competency: 'Data Visualization & Dissemination',
      averageRequired: 3.6,
      averageCurrent: 2.5,
      gap: 1.1,
      officialsAffected: 312,
      priority: 'High',
    },
    {
      competency: 'AI / ML in Official Statistics',
      averageRequired: 2.5,
      averageCurrent: 1.4,
      gap: 1.1,
      officialsAffected: 440,
      priority: 'High',
    },
    {
      competency: 'Data Privacy & DPDP Compliance',
      averageRequired: 3.2,
      averageCurrent: 2.6,
      gap: 0.6,
      officialsAffected: 198,
      priority: 'Medium',
    },
    {
      competency: 'Big Data & Administrative Datasets',
      averageRequired: 3.0,
      averageCurrent: 2.3,
      gap: 0.7,
      officialsAffected: 230,
      priority: 'Medium',
    },
  ],
  departmentComparison: [
    { department: 'Survey Design & Research (SDRD)', officials: 420, readiness: 86, criticalGaps: 38 },
    { department: 'Field Operations Division (FOD)', officials: 780, readiness: 79, criticalGaps: 112 },
    { department: 'Data Processing Division (DPD)', officials: 340, readiness: 84, criticalGaps: 42 },
    { department: 'National Accounts Division (NAD)', officials: 180, readiness: 89, criticalGaps: 14 },
    { department: 'Economic Statistics Division (ESD)', officials: 120, readiness: 83, criticalGaps: 18 },
  ],
  trainingEffectiveness: [
    {
      competency: 'Python',
      preTrainingScore: 46,
      postTrainingScore: 84,
      improvementPoints: 38,
      gapClosedPercentage: 82,
      officialsTrained: 290,
    },
    {
      competency: 'Survey Sampling',
      preTrainingScore: 58,
      postTrainingScore: 89,
      improvementPoints: 31,
      gapClosedPercentage: 91,
      officialsTrained: 410,
    },
    {
      competency: 'Data Quality Framework (UN-NQAF)',
      preTrainingScore: 62,
      postTrainingScore: 92,
      improvementPoints: 30,
      gapClosedPercentage: 94,
      officialsTrained: 215,
    },
    {
      competency: 'Data Visualization',
      preTrainingScore: 51,
      postTrainingScore: 81,
      improvementPoints: 30,
      gapClosedPercentage: 76,
      officialsTrained: 260,
    },
  ],
  futureSkillForecast: [
    {
      skill: 'AI-Assisted Statistical Imputation & Quality Validation',
      demandLevel: 'High Priority',
      timeline: '2026-2027',
      rationale: 'Mandated by MoSPI Statistical Modernization Action Plan for real-time survey outlier detection.',
    },
    {
      skill: 'Big Data Ingestion from GST, UPI and EPFO Datasets',
      demandLevel: 'High Priority',
      timeline: '2026-2027',
      rationale: 'Essential for high-frequency economic indicator tracking and quarterly GDP flash estimates.',
    },
    {
      skill: 'Geospatial Grid Sampling & Satellite Image Validation',
      demandLevel: 'Medium Priority',
      timeline: '2027',
      rationale: 'Integration of remote sensing for crop yield estimation and urban cluster identification.',
    },
    {
      skill: 'Privacy-Preserving Computation & Synthetic Microdata',
      demandLevel: 'Medium Priority',
      timeline: '2027-2028',
      rationale: 'Required to release high-fidelity microdata for academic research compliant with DPDP Act.',
    },
  ],
};

class InMemoryDatabase {
  public state: DatabaseState;

  public hashPassword(password: string, salt: string): string {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public createSession(userId: string): UserSession {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const payload = JSON.stringify({ userId, expiresAt, nonce: crypto.randomBytes(8).toString('hex') });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const secret = process.env.SESSION_SECRET || 'nipun-mospi-secret-key-2026-iss-nssta-statvia';
    const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const token = `statvia_sec_${payloadB64}.${signature}`;

    const session: UserSession = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    this.state.sessions[token] = session;
    return session;
  }

  public validateSession(token: string): UserSession | null {
    if (!token) return null;

    // 1. Check in-memory cache first if available
    const cached = this.state.sessions[token];
    if (cached) {
      if (Date.now() > cached.expiresAt) {
        delete this.state.sessions[token];
        return null;
      }
      return cached;
    }

    // 2. Cryptographically verify stateless HMAC token across serverless cold starts
    if (token.startsWith('statvia_sec_')) {
      const rest = token.substring('statvia_sec_'.length);
      const parts = rest.split('.');
      if (parts.length === 2) {
        const [payloadB64, signature] = parts;
        const secret = process.env.SESSION_SECRET || 'nipun-mospi-secret-key-2026-iss-nssta-statvia';
        const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
        
        // Constant-time comparison
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          try {
            const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
            if (data.userId && data.expiresAt && Date.now() < data.expiresAt) {
              const session: UserSession = {
                token,
                userId: data.userId,
                createdAt: new Date(data.expiresAt - 7 * 24 * 60 * 60 * 1000).toISOString(),
                expiresAt: data.expiresAt,
              };
              // Cache locally in this process instance
              this.state.sessions[token] = session;
              return session;
            }
          } catch {}
        }
      }
    }

    return null;
  }

  public removeSession(token: string): void {
    if (token && this.state.sessions[token]) {
      delete this.state.sessions[token];
    }
  }

  public registerUserCredential(userId: string, email: string, password: string): UserCredential {
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(password, salt);
    const credential: UserCredential = {
      userId,
      email: email.trim().toLowerCase(),
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.state.userCredentials[email.trim().toLowerCase()] = credential;
    return credential;
  }

  public verifyCredentials(identifier: string, password: string): { success: boolean; user?: UserProfile; message?: string } {
    let normalized = identifier.trim().toLowerCase();
    
    // Support aliases between UI and DB
    if (normalized === 'rajesh.verma@mospi.gov.in') {
      normalized = 'r.rao@nssta.gov.in';
    } else if (normalized === 'vikram.sen@mospi.gov.in') {
      normalized = 'sanjay.deshmukh@nic.in';
    }

    // Check user profiles by email, full name, username prefix, or ID
    let matchedUser = Object.values(this.state.users).find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.name.toLowerCase() === normalized ||
        u.email.split('@')[0].toLowerCase() === normalized ||
        u.id.toLowerCase() === normalized ||
        (normalized === 'r.rao@nssta.gov.in' && u.role === 'TRAINER') ||
        (normalized === 'sanjay.deshmukh@nic.in' && u.role === 'ADMINISTRATOR')
    );

    const cred = matchedUser
      ? this.state.userCredentials[matchedUser.email.toLowerCase()] || this.state.userCredentials[normalized]
      : this.state.userCredentials[normalized];

    // If OTP verification mode
    if (password === 'OTP-VERIFIED') {
      if (!matchedUser) {
        // Auto-provision an official officer account for seamless OTP login
        const newId = `user-otp-${Date.now()}`;
        const namePart = identifier.includes('@') ? identifier.split('@')[0].replace(/[._-]/g, ' ') : identifier;
        const formattedName = namePart
          .split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ') || 'Statistical Officer';

        matchedUser = {
          id: newId,
          name: formattedName,
          email: identifier.includes('@') ? identifier.trim().toLowerCase() : `${normalized.replace(/\s+/g, '.')}@mospi.gov.in`,
          role: 'LEARNER',
          employeeId: `MOSPI-${Math.floor(1000 + Math.random() * 9000)}`,
          ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
          department: 'National Statistical Office (NSO)',
          organization: 'Government of India',
          designation: 'Senior Statistical Officer',
          currentRole: 'Senior Statistical Officer',
          targetRole: 'Assistant Director / Lead Analyst',
          level: 11,
          cadre: 'Subordinate Statistical Service (SSS)',
          yearsOfExperience: 4,
          education: 'M.Sc. Statistics',
          specialization: 'Survey Design & Official Statistics',
          location: 'New Delhi',
          preferredLanguage: 'English / Hindi',
          previousRoles: ['Junior Statistical Officer'],
          currentProjects: ['Statistical Data Architecture & Modernization'],
          technologiesUsed: ['Python', 'CSPro', 'Excel'],
          trainingHours: 0,
          roleReadiness: 78,
          verifiedSkillsCount: 12,
          developingSkillsCount: 3,
        };
        this.state.users[newId] = matchedUser;
        this.state.learnerCompetencies[newId] = (this.state.learnerCompetencies['user-learner-01'] || []).map((c) => ({ ...c }));
        this.state.gapAnalysis[newId] = (this.state.gapAnalysis['user-learner-01'] || []).map((g) => ({ ...g }));
      }
      return { success: true, user: matchedUser };
    }

    if (!matchedUser) {
      return { success: false, message: 'No registered officer found with this email or username. Please check the spelling or register an account.' };
    }

    const userEmail = matchedUser.email.toLowerCase();

    if (!cred) {
      // If user exists in default seeds with known default credentials
      const defaultPasses: Record<string, string[]> = {
        'aarav.sharma@mospi.gov.in': ['Learner@2026', 'password', 'learner'],
        'ananya.sharma@mospi.gov.in': ['Learner@2026', 'password', 'learner'],
        'rajesh.verma@mospi.gov.in': ['Trainer@2026', 'password', 'trainer'],
        'r.rao@nssta.gov.in': ['Trainer@2026', 'password', 'trainer'],
        'vikram.sen@mospi.gov.in': ['Admin@2026', 'password', 'admin'],
        'sanjay.deshmukh@nic.in': ['Admin@2026', 'password', 'admin'],
      };
      const allowed = defaultPasses[userEmail] || ['Learner@2026', 'Trainer@2026', 'Admin@2026', 'password'];
      if (allowed.includes(password) || ['Learner@2026', 'Trainer@2026', 'Admin@2026', 'password'].includes(password)) {
        // Auto-migrate credential
        this.registerUserCredential(matchedUser.id, userEmail, password);
        return { success: true, user: matchedUser };
      }
      return { success: false, message: 'Invalid password. Please check your official credentials.' };
    }

    const testHash = this.hashPassword(password, cred.salt);
    if (testHash !== cred.passwordHash) {
      // Also allow common default password for demo testing if needed
      if (['Learner@2026', 'Trainer@2026', 'Admin@2026', 'password'].includes(password)) {
        return { success: true, user: matchedUser };
      }
      return { success: false, message: 'Invalid password entered for this official account.' };
    }

    cred.lastLogin = new Date().toISOString();
    return { success: true, user: matchedUser };
  }

  constructor() {
    this.state = {
      users: { ...INITIAL_USERS },
      userCredentials: {},
      sessions: {},
      competencies: [...INITIAL_COMPETENCIES],
      learnerCompetencies: {
        'user-learner-01': [...INITIAL_LEARNER_COMPETENCIES],
      },
      gapAnalysis: {
        'user-learner-01': [...INITIAL_GAP_ANALYSIS],
      },
      learningPaths: {
        'user-learner-01': JSON.parse(JSON.stringify(INITIAL_LEARNING_PATH)),
      },
      assessments: [...INITIAL_ASSESSMENTS],
      uploadedDocuments: [
        {
          id: 'doc-001',
          fileName: 'NSSO_78th_Round_Sampling_and_Estimation_Handbook.pdf',
          fileSize: 2450000,
          fileType: 'application/pdf',
          uploadedBy: 'user-trainer-01',
          uploadedAt: '2026-08-10T11:00:00Z',
          purpose: 'TRAINER_ASSESSMENT_GENERATION',
          extractedTopics: ['Stratified Two-Stage Sampling', 'First Stage Units (FSUs)', 'Multiplier Estimation', 'Non-sampling Error Controls'],
          keySummary: 'Official training handbook detailing sampling methodology, frame maintenance and weight calibration for household survey rounds.',
          status: 'PROCESSED',
          generatedQuestionsCount: 8,
        },
      ],
      auditLogs: [
        { id: 'log-1', timestamp: '2026-08-25T10:00:00Z', user: 'Aarav Sharma (AD)', action: 'DIAGNOSTIC_COMPLETED', details: 'Completed baseline diagnostic assessment. Scored 82% overall.' },
        { id: 'log-2', timestamp: '2026-08-25T11:15:00Z', user: 'NIPUN AI Gap Engine', action: 'GAP_IDENTIFIED', details: 'Detected Python Application Gap (Level 2 → Level 4) with 0.91 confidence.' },
        { id: 'log-3', timestamp: '2026-08-25T12:00:00Z', user: 'NIPUN Recommendation Engine', action: 'UNIFIED_RECOMMENDATIONS_GENERATED', details: 'Linked iGOT course py-stat-301 & NSSTA residential batch prog-301.' },
      ],
      competencyUpgradeAudits: {},
      notifications: [
        { id: 'notif-1', userId: 'user-learner-01', title: 'Priority Competency Gap Identified', message: 'AI Gap Checker identified a Python application gap. A targeted learning pathway is ready.', timestamp: '2026-08-25T11:15:00Z', read: false },
        { id: 'notif-2', userId: 'user-learner-01', title: 'NSSTA Programme Recommended', message: 'TPAC-aligned 3-Day Residential Computing batch starts 15 Sept 2026.', timestamp: '2026-08-25T12:05:00Z', read: false },
      ],
      workforceMetrics: { ...INITIAL_WORKFORCE_METRICS },
    };

    // Seed default credentials for standard official demo accounts
    this.ensureSeeded();
  }

  /**
   * Idempotent seeding function to guarantee that the mandatory demo data for
   * Aarav Sharma (user-learner-01), competencies, priority gaps, learning path,
   * assessments and credentials exist. Safe across cold starts and container reboots.
   */
  public ensureSeeded(): void {
    if (!this.state) {
      this.state = {
        users: {},
        userCredentials: {},
        sessions: {},
        competencies: [],
        learnerCompetencies: {},
        gapAnalysis: {},
        learningPaths: {},
        assessments: [],
        uploadedDocuments: [],
        auditLogs: [],
        competencyUpgradeAudits: {},
        notifications: [],
        workforceMetrics: { ...INITIAL_WORKFORCE_METRICS },
      };
    }

    // 1. Ensure mandatory users
    if (!this.state.users || Object.keys(this.state.users).length === 0) {
      this.state.users = { ...INITIAL_USERS };
    } else if (!this.state.users['user-learner-01']) {
      this.state.users['user-learner-01'] = { ...INITIAL_USERS['user-learner-01'] };
    }

    // 2. Ensure official user credentials
    if (!this.state.userCredentials) {
      this.state.userCredentials = {};
    }
    const standardCreds = [
      { id: 'user-learner-01', email: 'aarav.sharma@mospi.gov.in', pass: 'Learner@2026' },
      { id: 'user-trainer-01', email: 'rajesh.verma@mospi.gov.in', pass: 'Trainer@2026' },
      { id: 'user-admin-01', email: 'vikram.sen@mospi.gov.in', pass: 'Admin@2026' },
      { id: 'user-learner-01', email: 'ananya.sharma@mospi.gov.in', pass: 'Learner@2026' },
      { id: 'user-trainer-alias', email: 'r.rao@nssta.gov.in', pass: 'Trainer@2026' },
      { id: 'user-admin-alias', email: 'sanjay.deshmukh@nic.in', pass: 'Admin@2026' },
    ];
    for (const c of standardCreds) {
      const normalized = c.email.toLowerCase();
      if (!this.state.userCredentials[normalized]) {
        this.registerUserCredential(c.id, normalized, c.pass);
      }
    }

    // 3. Ensure master competencies catalog (all 15+ competencies)
    if (!this.state.competencies || this.state.competencies.length === 0) {
      this.state.competencies = [...INITIAL_COMPETENCIES];
    }

    // 4. Ensure Aarav Sharma's current competencies
    if (!this.state.learnerCompetencies) {
      this.state.learnerCompetencies = {};
    }
    if (
      !this.state.learnerCompetencies['user-learner-01'] ||
      this.state.learnerCompetencies['user-learner-01'].length === 0
    ) {
      this.state.learnerCompetencies['user-learner-01'] = [...INITIAL_LEARNER_COMPETENCIES];
    }

    // 5. Ensure Aarav Sharma's mandatory priority gap analysis (8 active priority gaps)
    if (!this.state.gapAnalysis) {
      this.state.gapAnalysis = {};
    }
    if (
      !this.state.gapAnalysis['user-learner-01'] ||
      this.state.gapAnalysis['user-learner-01'].length === 0
    ) {
      this.state.gapAnalysis['user-learner-01'] = [...INITIAL_GAP_ANALYSIS];
    }

    // 6. Ensure Aarav Sharma's learning path
    if (!this.state.learningPaths) {
      this.state.learningPaths = {};
    }
    if (!this.state.learningPaths['user-learner-01']) {
      this.state.learningPaths['user-learner-01'] = JSON.parse(JSON.stringify(INITIAL_LEARNING_PATH));
    }

    // 7. Ensure standard diagnostic assessments
    if (!this.state.assessments || this.state.assessments.length === 0) {
      this.state.assessments = [...INITIAL_ASSESSMENTS];
    }

    // 8. Ensure workforce metrics
    if (!this.state.workforceMetrics || !this.state.workforceMetrics.departmentComparison) {
      this.state.workforceMetrics = { ...INITIAL_WORKFORCE_METRICS };
    }
  }

  public resetDemoData() {
    this.state.users = { ...INITIAL_USERS };
    this.state.userCredentials = {};
    this.state.sessions = {};
    this.registerUserCredential('user-learner-01', 'aarav.sharma@mospi.gov.in', 'Learner@2026');
    this.registerUserCredential('user-trainer-01', 'rajesh.verma@mospi.gov.in', 'Trainer@2026');
    this.registerUserCredential('user-admin-01', 'vikram.sen@mospi.gov.in', 'Admin@2026');
    this.registerUserCredential('user-learner-01', 'ananya.sharma@mospi.gov.in', 'Learner@2026');
    this.registerUserCredential('user-trainer-alias', 'r.rao@nssta.gov.in', 'Trainer@2026');
    this.registerUserCredential('user-admin-alias', 'sanjay.deshmukh@nic.in', 'Admin@2026');
    this.state.competencies = [...INITIAL_COMPETENCIES];
    this.state.learnerCompetencies['user-learner-01'] = [...INITIAL_LEARNER_COMPETENCIES];
    this.state.gapAnalysis['user-learner-01'] = [...INITIAL_GAP_ANALYSIS];
    this.state.learningPaths['user-learner-01'] = JSON.parse(JSON.stringify(INITIAL_LEARNING_PATH));
    this.state.assessments = [...INITIAL_ASSESSMENTS];
    this.state.competencyUpgradeAudits = {};
    this.state.workforceMetrics = { ...INITIAL_WORKFORCE_METRICS };
  }
}

export const db = new InMemoryDatabase();
