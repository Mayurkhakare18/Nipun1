export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-auth-token'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const gaps = [
      {
        competencyId: 'comp-tech-01',
        competencyName: 'Python',
        category: 'TECHNICAL_COMPETENCIES',
        requiredLevel: 4,
        currentLevel: 2,
        gap: 2,
        gapType: 'APPLICATION_GAP',
        priorityScore: 92,
        priorityRank: 1,
        impactOnTargetRole: 'HIGH',
        urgency: 'IMMEDIATE',
        recommendedAction: 'Complete iGOT Python Advanced Data Processing & Pandas Optimization lab.',
        status: 'ACTIVE_GAP',
      },
      {
        competencyId: 'comp-tech-05',
        competencyName: 'AI / ML',
        category: 'TECHNICAL_COMPETENCIES',
        requiredLevel: 3,
        currentLevel: 1,
        gap: 2,
        gapType: 'KNOWLEDGE_GAP',
        priorityScore: 88,
        priorityRank: 2,
        impactOnTargetRole: 'HIGH',
        urgency: 'IMMEDIATE',
        recommendedAction: 'Enroll in NSSTA Machine Learning for Official Statistics residential course.',
        status: 'ACTIVE_GAP',
      },
      {
        competencyId: 'comp-tech-02',
        competencyName: 'Data Visualization',
        category: 'TECHNICAL_COMPETENCIES',
        requiredLevel: 4,
        currentLevel: 3,
        gap: 1,
        gapType: 'APPLICATION_GAP',
        priorityScore: 78,
        priorityRank: 3,
        impactOnTargetRole: 'MEDIUM',
        urgency: 'SHORT_TERM',
        recommendedAction: 'Complete PowerBI Advanced Dashboarding & Plotly Integration module.',
        status: 'ACTIVE_GAP',
      },
      {
        competencyId: 'comp-stat-01',
        competencyName: 'Survey Design',
        category: 'STATISTICAL_COMPETENCIES',
        requiredLevel: 4,
        currentLevel: 3,
        gap: 1,
        gapType: 'KNOWLEDGE_GAP',
        priorityScore: 75,
        priorityRank: 4,
        impactOnTargetRole: 'HIGH',
        urgency: 'SHORT_TERM',
        recommendedAction: 'Review NSS 78th Round Sampling & Estimation Handbook.',
        status: 'ACTIVE_GAP',
      },
    ];

    return res.status(200).json(gaps);
  } catch (err: any) {
    console.error('[API_GAPS_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'GAPS_FETCH_FAILED',
      message: err?.message || String(err),
    });
  }
}
