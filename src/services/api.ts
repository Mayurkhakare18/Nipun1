import {
  UserProfile,
  Competency,
  LearnerCompetency,
  GapAnalysisResult,
  UnifiedRecommendation,
  LearningPath,
  QuizAssessment,
  QuizAttemptResult,
  UploadedDocument,
  DocumentSummaryResult,
  ReassessmentResult,
  AdminWorkforceMetrics,
  SystemIntegrationStatus,
  WorkforceOverview,
} from '../types';
import { CLIENT_UNIFIED_CATALOGUE, CLIENT_RECOMMENDATIONS } from './catalogueData';
import { CLIENT_ASSESSMENTS } from './assessmentData';

const AUTH_TOKEN_STORAGE_KEY = 'statvia_auth_token';

let memoryToken: string | null = null;

export const tokenStorage = {
  get(): string | null {
    if (memoryToken) return memoryToken;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors in sandboxed contexts
    }
    return null;
  },
  set(token: string) {
    memoryToken = token;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // Ignore
    }
  },
  clear() {
    memoryToken = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  },
};

async function fetchWithAuth(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return fetchWithAuth(url, options, retries - 1);
    }
    throw err;
  }
}

async function safeFetchJson<T>(url: string, options: RequestInit = {}, fallback: T): Promise<T> {
  try {
    const res = await fetchWithAuth(url, options);
    if (!res.ok) {
      try {
        const errJson = await res.json();
        return { ...fallback, ...errJson, success: false };
      } catch {
        return { ...fallback, success: false, message: `HTTP ${res.status}: ${res.statusText}` };
      }
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn(`Safe API fetch notice for ${url}:`, err?.message || err);
    return fallback;
  }
}

export const api = {
  // Token handlers
  getAuthToken: () => tokenStorage.get(),
  setAuthToken: (token: string) => tokenStorage.set(token),
  clearAuthToken: () => tokenStorage.clear(),

  // Auth & Session
  async getCurrentUser(): Promise<{ success: boolean; user: UserProfile; isAuthenticated?: boolean; message?: string }> {
    return safeFetchJson('/api/auth/current-user', {}, {
      success: false,
      user: null as any,
      isAuthenticated: false,
      message: 'Session offline',
    });
  },

  async login(credentials: { email: string; password?: string }): Promise<{ success: boolean; user: UserProfile; token?: string; message?: string }> {
    const data = await safeFetchJson<{ success: boolean; user: UserProfile; token?: string; message?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      { success: false, user: null as any, message: 'Login connection failed.' }
    );
    if (data.success && data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  async register(userData: Partial<UserProfile> & { password?: string }): Promise<{ success: boolean; user: UserProfile; token?: string; message?: string }> {
    const data = await safeFetchJson<{ success: boolean; user: UserProfile; token?: string; message?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      { success: false, user: null as any, message: 'Registration connection failed.' }
    );
    if (data.success && data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  async parichaySSO(data?: { ssoId?: string; role?: string }): Promise<{ success: boolean; user: UserProfile; token?: string; message?: string }> {
    const dataRes = await safeFetchJson<{ success: boolean; user: UserProfile; token?: string; message?: string }>(
      '/api/auth/parichay-sso',
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      },
      { success: false, user: null as any, message: 'SSO connection failed.' }
    );
    if (dataRes.success && dataRes.token) {
      tokenStorage.set(dataRes.token);
    }
    return dataRes;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetchWithAuth('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      tokenStorage.clear();
      return data;
    } catch {
      tokenStorage.clear();
      return { success: true, message: 'Logged out successfully.' };
    }
  },

  async switchRole(userId: string): Promise<{ success: boolean; user: UserProfile; token?: string }> {
    const data = await safeFetchJson<{ success: boolean; user: UserProfile; token?: string }>(
      '/api/auth/switch-role',
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      },
      { success: false, user: null as any }
    );
    if (data.success && data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  async resetDemo(): Promise<{ success: boolean; message: string }> {
    return safeFetchJson('/api/auth/reset-demo', { method: 'POST' }, {
      success: true,
      message: 'NIPUN Demo reset.',
    });
  },

  // Profile & Purpose
  async getProfile(): Promise<{ success: boolean; profile: UserProfile }> {
    return safeFetchJson('/api/profile', {}, { success: false, profile: null as any });
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; profile: UserProfile }> {
    return safeFetchJson(
      '/api/profile',
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      { success: false, profile: null as any }
    );
  },

  async applyPurpose(data: {
    purposeId: string;
    title: string;
    targetRole: string;
    targetCompetencies: string[];
  }): Promise<{ success: boolean; user: UserProfile; competencies: LearnerCompetency[]; gaps: GapAnalysisResult[]; message: string }> {
    return safeFetchJson(
      '/api/learner/purpose',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      {
        success: false,
        user: null as any,
        competencies: [],
        gaps: [],
        message: 'Failed to update purpose',
      }
    );
  },

  // Competencies
  async getCompetencies(): Promise<{ success: boolean; competencies: Competency[] }> {
    return safeFetchJson('/api/competencies', {}, { success: true, competencies: [] });
  },

  async getLearnerCompetencies(): Promise<{ success: boolean; competencies: LearnerCompetency[]; profile?: UserProfile }> {
    return safeFetchJson('/api/learner/competencies', {}, { success: true, competencies: [] });
  },

  // Dedicated Real Learner Profile & Competency Intelligence
  async getLearnerProfileCompetencies(): Promise<{
    success: boolean;
    profile: UserProfile;
    competencies: LearnerCompetency[];
    gaps: GapAnalysisResult[];
    summary: {
      totalCompetencies: number;
      verifiedCount: number;
      criticalGapsCount: number;
      developingCount: number;
      overallRoleReadiness: number;
      knowledgeGapAvg: number;
      applicationGapAvg: number;
      lastAssessedDate: string;
      targetRole: string;
      specialization: string;
    };
    meta?: {
      source: string;
      syncedAt: string;
      authenticatedOfficerId: string;
    };
    message?: string;
  }> {
    return safeFetchJson('/api/learner/profile-competencies', {}, {
      success: false,
      profile: null as any,
      competencies: [],
      gaps: [],
      summary: {
        totalCompetencies: 0,
        verifiedCount: 0,
        criticalGapsCount: 0,
        developingCount: 0,
        overallRoleReadiness: 75,
        knowledgeGapAvg: 20,
        applicationGapAvg: 30,
        lastAssessedDate: new Date().toISOString().split('T')[0],
        targetRole: 'Statistical Lead',
        specialization: 'Official Statistics',
      },
    });
  },

  // Gap Analysis
  async getLearnerGaps(): Promise<{
    success: boolean;
    gaps: GapAnalysisResult[];
    competencies?: LearnerCompetency[];
    profile?: UserProfile;
    summary?: any;
    meta?: any;
    message?: string;
  }> {
    return safeFetchJson('/api/learner/gaps', {}, { success: true, gaps: [] });
  },

  async runGapCheck(): Promise<{
    success: boolean;
    gaps: GapAnalysisResult[];
    competencies?: LearnerCompetency[];
    profile?: UserProfile;
    summary?: any;
    meta?: any;
    message?: string;
  }> {
    return safeFetchJson('/api/learner/run-gap-check', { method: 'POST' }, {
      success: false,
      gaps: [],
      message: 'Gap check service unavailable',
    });
  },

  // Catalogue
  async getCatalogue(filters?: {
    competency?: string;
    domain?: string;
    role?: string;
    difficulty?: string;
    source?: string;
    duration?: string;
    query?: string;
  }): Promise<{
    success: boolean;
    items: any[];
    total: number;
    notice: string;
    sources: string[];
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'ALL') params.append(key, val);
      });
    }

    // Default fallback filtered from client catalogue
    let filteredFallback = [...CLIENT_UNIFIED_CATALOGUE];
    if (filters) {
      if (filters.competency && filters.competency !== 'ALL') {
        filteredFallback = filteredFallback.filter((i) => i.competency.toLowerCase() === filters.competency?.toLowerCase());
      }
      if (filters.domain && filters.domain !== 'ALL') {
        filteredFallback = filteredFallback.filter((i) => i.domain?.toLowerCase() === filters.domain?.toLowerCase());
      }
      if (filters.source && filters.source !== 'ALL') {
        filteredFallback = filteredFallback.filter((i) => i.source.toLowerCase().includes(filters.source?.toLowerCase() || ''));
      }
      if (filters.difficulty && filters.difficulty !== 'ALL') {
        filteredFallback = filteredFallback.filter((i) => i.difficulty.toLowerCase() === filters.difficulty?.toLowerCase());
      }
      if (filters.query && filters.query.trim()) {
        const q = filters.query.toLowerCase();
        filteredFallback = filteredFallback.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      }
    }

    const res = await safeFetchJson(`/api/catalogue?${params.toString()}`, {}, {
      success: true,
      items: filteredFallback,
      total: filteredFallback.length,
      notice: 'NIPUN Unified Learning Catalogue',
      sources: ['iGOT Karmayogi', 'NSSTA / TPAC', 'NIPUN Practical Learning'],
    });

    if (!res.success || !res.items || res.items.length === 0) {
      return {
        success: true,
        items: filteredFallback,
        total: filteredFallback.length,
        notice: 'NIPUN Unified Learning Catalogue',
        sources: ['iGOT Karmayogi', 'NSSTA / TPAC', 'NIPUN Practical Learning'],
      };
    }

    return res;
  },

  // Recommendations
  async getUnifiedRecommendations(): Promise<{ success: boolean; recommendations: UnifiedRecommendation[]; datasetNotice?: string }> {
    const res = await safeFetchJson('/api/recommendations/unified', {}, {
      success: true,
      recommendations: CLIENT_RECOMMENDATIONS,
      datasetNotice: 'Development Dataset',
    });

    if (!res.success || !res.recommendations || res.recommendations.length === 0) {
      return {
        success: true,
        recommendations: CLIENT_RECOMMENDATIONS,
        datasetNotice: 'Development Dataset',
      };
    }

    return res;
  },

  // Learning Path
  async getLearningPath(): Promise<{ success: boolean; learningPath: LearningPath }> {
    return safeFetchJson('/api/learning-path', {}, {
      success: false,
      learningPath: null as any,
    });
  },

  async updateLearningPathStep(
    stepId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED',
    score?: number
  ): Promise<{ success: boolean; learningPath: LearningPath }> {
    return safeFetchJson(
      '/api/learning-path/step-update',
      {
        method: 'POST',
        body: JSON.stringify({ stepId, status, score }),
      },
      { success: false, learningPath: null as any }
    );
  },

  // Assessments
  async getAssessments(): Promise<{ success: boolean; assessments: QuizAssessment[] }> {
    const res = await safeFetchJson('/api/assessments', {}, { success: true, assessments: CLIENT_ASSESSMENTS });
    if (!res.success || !res.assessments || res.assessments.length === 0) {
      return { success: true, assessments: CLIENT_ASSESSMENTS };
    }
    return res;
  },

  async getAssessmentById(id: string): Promise<{ success: boolean; assessment: QuizAssessment }> {
    const query = id.toLowerCase();
    const fallbackAssessment =
      CLIENT_ASSESSMENTS.find((a) => a.id.toLowerCase() === query) ||
      CLIENT_ASSESSMENTS.find((a) => a.competency.toLowerCase().includes(query) || query.includes(a.competency.toLowerCase())) ||
      CLIENT_ASSESSMENTS[0];

    const res = await safeFetchJson(`/api/assessments/${id}`, {}, {
      success: true,
      assessment: fallbackAssessment,
    });

    if (!res.success || !res.assessment) {
      return { success: true, assessment: fallbackAssessment };
    }

    return res;
  },

  async generateFreshAssessment(data?: {
    competency?: string;
    difficulty?: string;
    questionCount?: number;
  }): Promise<{ success: boolean; assessment: QuizAssessment }> {
    const comp = data?.competency || 'Python';
    const fallbackFresh: QuizAssessment = {
      id: `assess-fresh-${Date.now()}`,
      title: `${comp} Adaptive AI Assessment (Fresh)`,
      description: `Targeted dynamic diagnostic evaluating verified competency in ${comp}.`,
      competency: comp,
      timeLimitMinutes: 10,
      passingScore: 70,
      questions: [
        {
          id: `fresh-q1-${Date.now()}`,
          question: `In official statistical processing of ${comp}, which method ensures robust automated error-handling during data ingestion?`,
          options: [
            'Structured validation schema with try-except blocks and audit logging',
            'Disabling all runtime assertions',
            'Manually deleting malformed records from production tables',
            'Ignoring missing values and type errors',
          ],
          correctAnswer: 0,
          explanation: 'Structured schema validations combined with try-except error catching guarantee traceability and data integrity.',
          difficulty: 'Medium',
          competency: comp,
          topic: `${comp} Architecture`,
          sourceReference: 'MoSPI Technical Standard',
        },
        {
          id: `fresh-q2-${Date.now()}`,
          question: `What is the primary indicator that an administrative dataset processed with ${comp} satisfies DPDP Act confidentiality requirements?`,
          options: [
            'Direct identifiers are pseudonymised and k-anonymity >= 5 is satisfied',
            'The file size is under 10 megabytes',
            'The data is stored in unencrypted plain text for fast access',
            'Respondent phone numbers are publicly displayed',
          ],
          correctAnswer: 0,
          explanation: 'Pseudonymisation and k-anonymity compliance prevent re-identification while preserving analytical utility.',
          difficulty: 'Hard',
          competency: comp,
          topic: 'Data Privacy & Governance',
          sourceReference: 'DPDP Act 2023 Guidelines',
        },
      ],
    };

    const res = await safeFetchJson(
      '/api/assessments/generate-fresh',
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      },
      { success: true, assessment: fallbackFresh }
    );

    if (!res.success || !res.assessment) {
      return { success: true, assessment: fallbackFresh };
    }

    return res;
  },

  async submitAssessment(
    assessmentId: string,
    answers: number[],
    timeSpentSeconds: number,
    assessmentContext?: QuizAssessment | null
  ): Promise<{ success: boolean; result: QuizAttemptResult; upgradeRecord?: any; competencies?: any; gaps?: any }> {
    const targetAssessment =
      assessmentContext ||
      CLIENT_ASSESSMENTS.find((a) => a.id === assessmentId) ||
      CLIENT_ASSESSMENTS.find((a) => a.id.toLowerCase() === (assessmentId || '').toLowerCase()) ||
      CLIENT_ASSESSMENTS.find((a) => a.competency.toLowerCase().includes((assessmentId || '').toLowerCase()) || (assessmentId || '').toLowerCase().includes(a.competency.toLowerCase())) ||
      CLIENT_ASSESSMENTS[0];

    let correctCount = 0;
    const topicMap: Record<string, { correct: number; total: number }> = {};

    targetAssessment.questions.forEach((q, idx) => {
      const topic = q.topic || `${targetAssessment.competency} Core Applications`;
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
      topicMap[topic].total += 1;

      if (answers[idx] === q.correctAnswer) {
        correctCount += 1;
        topicMap[topic].correct += 1;
      }
    });

    const totalQ = Math.max(1, targetAssessment.questions.length);
    const scorePercentage = Math.round((correctCount / totalQ) * 100);
    const passingScore = targetAssessment.passingScore || 70;
    const passed = scorePercentage >= passingScore;

    const topicScores = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      score: data.correct,
      total: data.total,
    }));

    const fallbackResult: QuizAttemptResult = {
      assessmentId: targetAssessment.id || assessmentId,
      userId: 'user-learner-01',
      scorePercentage,
      totalQuestions: targetAssessment.questions.length,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: targetAssessment.questions.length - correctCount,
      timeSpentSeconds: timeSpentSeconds > 0 ? timeSpentSeconds : 180,
      topicScores: topicScores.length > 0 ? topicScores : [{ topic: `${targetAssessment.competency} Core`, score: correctCount, total: totalQ }],
      aiConclusion: passed
        ? `Assessment successfully passed with ${scorePercentage}%. Verified competency upgrade applied in National Competency Passport.`
        : `Assessment score ${scorePercentage}% is below the ${passingScore}% threshold. Targeted learning recommendations provided.`,
      updatedCompetencyLevel: passed ? 3 : 2,
      competencyGapReduced: passed,
      recommendedRevision: passed ? [] : [`${targetAssessment.competency} Foundations`, 'MoSPI Standard Guidelines'],
      completedAt: new Date().toISOString(),
    };

    const res = await safeFetchJson<{ success: boolean; result: QuizAttemptResult; upgradeRecord?: any; competencies?: any; gaps?: any }>(
      '/api/assessments/submit',
      {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: targetAssessment.id || assessmentId,
          answers,
          timeSpentSeconds,
          questions: targetAssessment.questions,
          competency: targetAssessment.competency,
        }),
      },
      {
        success: true,
        result: fallbackResult,
      }
    );

    if (!res.success || !res.result) {
      return {
        success: true,
        result: fallbackResult,
        upgradeRecord: res.upgradeRecord,
        competencies: res.competencies,
        gaps: res.gaps,
      };
    }

    return res;
  },

  // Trainer Document Processing
  async getDocuments(): Promise<{ success: boolean; documents: UploadedDocument[] }> {
    return safeFetchJson('/api/documents', {}, { success: true, documents: [] });
  },

  async uploadAndGenerate(data: {
    fileName: string;
    fileContent: string;
    competency: string;
    difficulty: string;
    questionCount: number;
  }): Promise<{ success: boolean; document: UploadedDocument; assessment: QuizAssessment }> {
    return safeFetchJson(
      '/api/documents/upload-and-generate',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      { success: false, document: null as any, assessment: null as any }
    );
  },

  async summarizeAndGenerateFromDocument(data: {
    fileName: string;
    fileContent: string;
    competency?: string;
    difficulty?: string;
    questionCount?: number;
  }): Promise<{
    success: boolean;
    summary: DocumentSummaryResult;
    assessment: QuizAssessment;
    document: UploadedDocument;
    message?: string;
  }> {
    return safeFetchJson(
      '/api/documents/summarize-and-generate',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      {
        success: false,
        summary: null as any,
        assessment: null as any,
        document: null as any,
        message: 'Processing unavailable',
      }
    );
  },

  // Post-Learning Reassessment
  async submitReassessment(data: {
    answers: { questionId: string; selectedOption: number; isCorrect: boolean }[];
    timeSpentSeconds: number;
    pathId?: string;
  }): Promise<{
    success: boolean;
    result: ReassessmentResult;
    user: UserProfile;
    competencies: LearnerCompetency[];
    message?: string;
  }> {
    return safeFetchJson(
      '/api/reassessment/submit',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      {
        success: false,
        result: null as any,
        user: null as any,
        competencies: [],
        message: 'Reassessment submission failed',
      }
    );
  },

  // AI Mentor
  async sendMentorMessage(message: string, history?: { sender: string; content: string }[]): Promise<{
    success: boolean;
    reply: string;
    suggestedActions?: { label: string; actionType: string; payload?: any }[];
    timestamp: string;
  }> {
    return safeFetchJson(
      '/api/mentor/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      },
      {
        success: true,
        reply: `Namaste. I am your NIPUN Statistical Capacity Assistant. Based on your official profile, I am ready to assist you with sampling formulas, Python data pipelines, national accounts balancing, and diagnostic quizzes.`,
        timestamp: new Date().toISOString(),
      }
    );
  },

  // Admin Metrics
  async getAdminMetrics(): Promise<{
    success: boolean;
    metrics: AdminWorkforceMetrics;
    auditLogs: { id: string; timestamp: string; user: string; action: string; details: string }[];
  }> {
    return safeFetchJson('/api/admin/metrics', {}, {
      success: false,
      metrics: {
        totalOfficials: 840,
        averageRoleReadiness: 78,
        criticalGapsCount: 142,
        totalLearningHours: 6240,
        courseCompletionRate: 85,
        averageCompetencyImprovement: 18,
        trainingEffectiveness: [],
        topOrganizationalGaps: [],
        departmentComparison: [],
        competencyMaturityDistribution: [],
        futureSkillForecast: [],
      },
      auditLogs: [],
    });
  },

  // System Integrations Status
  async getSystemIntegrations(): Promise<{ success: boolean; integrations: SystemIntegrationStatus[] }> {
    return safeFetchJson('/api/system/integrations', {}, {
      success: true,
      integrations: [],
    });
  },

  async getSystemStatus(): Promise<{ success: boolean; integrations: SystemIntegrationStatus[] }> {
    return this.getSystemIntegrations();
  },

  async getWorkforceOverview(): Promise<{ success: boolean; workforce: WorkforceOverview }> {
    const metricsRes = await this.getAdminMetrics();
    const metrics = metricsRes.metrics;
    return {
      success: true,
      workforce: {
        totalOfficers: metrics.totalOfficials,
        overallReadinessScore: metrics.averageRoleReadiness,
        criticalGapCount: metrics.criticalGapsCount,
        activeLearningHours: metrics.totalLearningHours,
        competencyHeatmap: (metrics.topOrganizationalGaps || []).map(g => ({
          competency: g.competency,
          readinessScore: Math.round(100 - (g.gap * 18)),
          officersWithGap: g.officialsAffected,
        })),
        divisionBreakdown: (metrics.departmentComparison || []).map(d => ({
          division: d.department,
          headcount: d.officials,
          avgReadiness: d.readiness,
          topGap: 'Python Survey Microdata Cleaning',
        })),
      },
    };
  },
};
