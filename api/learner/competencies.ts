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

    const competencies = [
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
        lastAssessed: '2026-08-01',
        targetDate: '2026-11-15',
        status: 'DEVELOPING',
        evidence: {
          diagnosticScore: 72,
          practicalScore: 68,
          notes: 'Proficient with PowerBI; seeking advanced geospatial mapping integration with Python Plotly.',
        },
        trend: 'IMPROVING',
      },
      {
        competencyId: 'comp-stat-01',
        name: 'Survey Design',
        category: 'STATISTICAL_COMPETENCIES',
        requiredLevel: 4,
        currentLevel: 3,
        gap: 1,
        gapType: 'KNOWLEDGE_GAP',
        confidence: 0.94,
        lastAssessed: '2026-08-10',
        targetDate: '2026-09-30',
        status: 'DEVELOPING',
        evidence: {
          diagnosticScore: 78,
          practicalScore: 75,
          notes: 'Strong in two-stage sampling; needs advanced training on adaptive cluster sampling.',
        },
        trend: 'STABLE',
      },
      {
        competencyId: 'comp-stat-02',
        name: 'Sampling Methodology',
        category: 'STATISTICAL_COMPETENCIES',
        requiredLevel: 4,
        currentLevel: 4,
        gap: 0,
        gapType: 'STABLE',
        confidence: 0.96,
        lastAssessed: '2026-08-12',
        targetDate: '2027-01-01',
        status: 'VERIFIED',
        evidence: {
          diagnosticScore: 92,
          practicalScore: 90,
          notes: 'Demonstrated mastery in PPS sampling and weight adjustments for NSS 78th round.',
        },
        trend: 'IMPROVING',
      },
      {
        competencyId: 'comp-stat-03',
        name: 'National Accounts',
        category: 'STATISTICAL_COMPETENCIES',
        requiredLevel: 3,
        currentLevel: 3,
        gap: 0,
        gapType: 'STABLE',
        confidence: 0.92,
        lastAssessed: '2026-06-20',
        targetDate: '2027-01-01',
        status: 'VERIFIED',
        evidence: {
          diagnosticScore: 85,
          practicalScore: 84,
          notes: 'Fully conversant with SNA 2008 framework and GDP compilation methodologies.',
        },
        trend: 'STABLE',
      },
    ];

    return res.status(200).json(competencies);
  } catch (err: any) {
    console.error('[API_COMPETENCIES_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'COMPETENCIES_FETCH_FAILED',
      message: err?.message || String(err),
    });
  }
}
