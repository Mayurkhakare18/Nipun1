import {
  UserProfile,
  LearnerCompetency,
  GapAnalysisResult,
  UnifiedRecommendation,
} from '../types';

export interface PrioritySkillRecommendation {
  competencyId: string;
  competencyName: string;
  category: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  gapType: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  impactScore: number; // 0 - 100
  knowledgeGapScore: number;
  applicationGapScore: number;
  retentionRiskScore: number;
  confidence: number;
  aiDiagnosis: string;
  whyRecommended: string;
  targetRoleAlignment: string;
  estimatedCompletionDays: number;
  nextBestAction: {
    type: 'IGOT_COURSE' | 'NSSTA_WORKSHOP' | 'SIMULATION_LAB' | 'DIAGNOSTIC_QUIZ';
    title: string;
    provider: string;
    duration: string;
    badgeLabel: string;
    ctaLabel: string;
    payload?: any;
  };
  evidenceSummary: {
    diagnosticScore: number;
    practicalScore: number;
    repeatedErrors: string[];
    benchmarkStatus: string;
  };
}

/**
 * Domain Criticality Multipliers for Official MoSPI Statistical Operations
 */
const DOMAIN_CRITICALITY_WEIGHTS: Record<string, number> = {
  // Python & Data Science (Critical modernization driver)
  'python': 1.45,
  'python for official statistics': 1.45,
  'data visualization': 1.25,
  'sql': 1.30,
  
  // Core Statistical Frameworks (Statutory requirement)
  'survey methodology & sampling frame': 1.40,
  'survey methodology': 1.40,
  'national accounts (sna 2008)': 1.42,
  'price statistics & inflation modeling': 1.35,
  'statistical disclosure control': 1.38,
  'data quality frameworks & capi validation': 1.32,

  // Governance
  'data privacy & dpdp act': 1.20,
  'government budgeting & gfr 2017': 1.15,
};

/**
 * Calculates the next 'Priority Skill' for a user by analyzing their highest-impact competency gaps.
 * 
 * Evaluation Matrix:
 * 1. Gap Magnitude (Weight: 30%) - Higher difference between required and current levels.
 * 2. Application Gap Severity (Weight: 25%) - Prioritizes practical application deficits over purely theoretical.
 * 3. Domain Criticality (Weight: 25%) - Prioritizes foundational statistical tools (Python, SNA 2008, Survey Sampling).
 * 4. Role & Promotion Alignment (Weight: 10%) - Directly required for target cadre benchmarks.
 * 5. Retention Risk (Weight: 10%) - Time elapsed since last assessed.
 */
export function calculateNextPrioritySkill(
  user: UserProfile | null,
  gaps: GapAnalysisResult[],
  competencies: LearnerCompetency[] = [],
  recommendations: UnifiedRecommendation[] = []
): PrioritySkillRecommendation | null {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  const scoredGaps = gaps.map((gap) => {
    const compMeta = competencies.find(
      (c) => c.competencyId === gap.competencyId || c.name.toLowerCase() === gap.competencyName.toLowerCase()
    );

    const normName = gap.competencyName.toLowerCase().trim();
    const domainMultiplier = DOMAIN_CRITICALITY_WEIGHTS[normName] || 1.1;

    const gapSize = Math.max(1, gap.gap || (gap.requiredLevel - gap.currentLevel));
    const appScore = gap.applicationGapScore || (100 - (gap.evidenceBase?.practicalTask || 45));
    const knowScore = gap.knowledgeGapScore || (100 - (gap.evidenceBase?.diagnosticAssessment || 55));
    const retScore = gap.retentionRiskScore || 25;

    // Composite impact calculation (0 - 100)
    const baseScore =
      (gapSize / 4) * 30 +
      (appScore / 100) * 25 +
      (knowScore / 100) * 15 +
      (retScore / 100) * 10 +
      (gap.priority === 'HIGH' ? 20 : gap.priority === 'MEDIUM' ? 10 : 5);

    const weightedImpact = Math.min(99, Math.round(baseScore * (domainMultiplier / 1.2)));

    // Urgency classification
    let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (weightedImpact >= 75 || gapSize >= 2 || gap.priority === 'HIGH') {
      urgency = 'HIGH';
    } else if (weightedImpact < 50 && gapSize === 1) {
      urgency = 'LOW';
    }

    // Match unified recommendation options
    const rec = recommendations.find(
      (r) => r.competencyName.toLowerCase() === gap.competencyName.toLowerCase()
    );

    // Determine optimal next-best action
    let nextBestAction: PrioritySkillRecommendation['nextBestAction'];
    if (gap.gapType === 'APPLICATION_GAP' || appScore > 50) {
      if (rec && (rec.nipunPracticeOption || rec.statviaPracticeOption)) {
        const practice = rec.nipunPracticeOption || rec.statviaPracticeOption!;
        nextBestAction = {
          type: 'SIMULATION_LAB',
          title: practice.title,
          provider: 'NIPUN Official Sandbox',
          duration: practice.duration,
          badgeLabel: 'Hands-on Code Lab',
          ctaLabel: 'Launch Practical Lab',
          payload: { competency: gap.competencyName },
        };
      } else {
        nextBestAction = {
          type: 'SIMULATION_LAB',
          title: `${gap.competencyName} Practical Data Cleaning & Analysis Lab`,
          provider: 'NIPUN Simulation Sandbox',
          duration: '20 mins',
          badgeLabel: 'Hands-on Code Lab',
          ctaLabel: 'Launch Practical Lab',
          payload: { competency: gap.competencyName },
        };
      }
    } else if (gap.gapType === 'KNOWLEDGE_GAP' && rec && rec.igotOption) {
      nextBestAction = {
        type: 'IGOT_COURSE',
        title: rec.igotOption.title,
        provider: rec.igotOption.provider || 'iGOT Karmayogi',
        duration: rec.igotOption.duration || '2h 30m',
        badgeLabel: 'iGOT Karmayogi Course',
        ctaLabel: 'Enroll on iGOT',
        payload: rec.igotOption,
      };
    } else {
      nextBestAction = {
        type: 'DIAGNOSTIC_QUIZ',
        title: `${gap.competencyName} AI Diagnostic Reassessment`,
        provider: 'NIPUN Diagnostic Engine',
        duration: '10 mins',
        badgeLabel: 'Adaptive Evaluation',
        ctaLabel: 'Start Evaluation',
        payload: { competency: gap.competencyName },
      };
    }

    const estimatedDays = gapSize * 4 + (urgency === 'HIGH' ? 3 : 5);

    const result: PrioritySkillRecommendation = {
      competencyId: gap.competencyId,
      competencyName: gap.competencyName,
      category: compMeta?.category || 'STATISTICAL_COMPETENCIES',
      currentLevel: gap.currentLevel,
      requiredLevel: gap.requiredLevel,
      gap: gapSize,
      gapType: gap.gapType,
      urgency,
      impactScore: weightedImpact,
      knowledgeGapScore: knowScore,
      applicationGapScore: appScore,
      retentionRiskScore: retScore,
      confidence: gap.confidence || 0.92,
      aiDiagnosis:
        gap.aiDiagnosis ||
        `Identified Level ${gap.currentLevel} → Level ${gap.requiredLevel} deficit in ${gap.competencyName}. Closing this will elevate overall role readiness.`,
      whyRecommended:
        (Array.isArray(gap.whyRecommended) ? gap.whyRecommended.join('. ') : gap.whyRecommended) ||
        `Directly addresses the ${gap.gapType.replace('_', ' ').toLowerCase()} required for ${user?.targetRole || 'lead statistical roles'}.`,
      targetRoleAlignment: `Direct requirement for ${user?.targetRole || 'Assistant Director / Lead Analyst'} benchmark.`,
      estimatedCompletionDays: estimatedDays,
      nextBestAction,
      evidenceSummary: {
        diagnosticScore: gap.evidenceBase?.diagnosticAssessment || 50,
        practicalScore: gap.evidenceBase?.practicalTask || 42,
        repeatedErrors: gap.evidenceBase?.repeatedErrors || ['Practical data transformation difficulty'],
        benchmarkStatus: gapSize >= 2 ? 'Sub-threshold Benchmark' : 'Approaching Proficiency',
      },
    };

    return result;
  });

  // Sort by impact score descending, then gap size descending
  scoredGaps.sort((a, b) => b.impactScore - a.impactScore || b.gap - a.gap);

  return scoredGaps[0] || null;
}

/**
 * Returns all competency gaps ranked by priority and impact.
 */
export function getRankedPrioritySkills(
  user: UserProfile | null,
  gaps: GapAnalysisResult[],
  competencies: LearnerCompetency[] = [],
  recommendations: UnifiedRecommendation[] = []
): PrioritySkillRecommendation[] {
  if (!gaps || gaps.length === 0) return [];

  const top = calculateNextPrioritySkill(user, gaps, competencies, recommendations);
  if (!top) return [];

  // Map and sort all
  const all = gaps.map((g) => {
    if (g.competencyId === top.competencyId) return top;
    // Single item calculation
    return calculateNextPrioritySkill(user, [g], competencies, recommendations)!;
  }).filter(Boolean);

  return all.sort((a, b) => b.impactScore - a.impactScore);
}
