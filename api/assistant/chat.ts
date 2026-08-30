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

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message = (body.message || '').trim();
    const history = body.history || [];

    const lowerMsg = message.toLowerCase();

    // Default authenticated learner profile context (Aarav Sharma)
    const officerContext = {
      name: 'Aarav Sharma',
      designation: 'Assistant Director (Statistics)',
      targetRole: 'Deputy Director (Statistics)',
      cadre: 'Indian Statistical Service (ISS)',
      organization: 'MoSPI',
      department: 'National Statistical Office (NSO)',
      roleReadiness: 74,
      verifiedSkills: 14,
      developingSkills: 4,
      topGap: 'Python for Official Statistical Analysis (Level 2 → Level 4, Gap: 2 Levels)',
      secondGap: 'AI / Machine Learning for Imputation (Level 1 → Level 3, Gap: 2 Levels)',
      thirdGap: 'Survey Design & Two-Stage Sampling (Level 3 → Level 4, Gap: 1 Level)',
    };

    let reply = '';
    let suggestedActions: any[] = [];

    if (lowerMsg.includes('gap') || lowerMsg.includes('biggest') || lowerMsg.includes('skill gap')) {
      reply = `Namaste Officer ${officerContext.name}. As your MoSPI STATVIA AI Mentorship Advisor, I have reviewed your live competency profile for the **${officerContext.designation}** role.

Your biggest current skill gap is **Python for Official Statistical Analysis**:
- **Current Verified Level:** Level 2 (Foundational Data Processing)
- **Required Target Level:** Level 4 (Advanced Survey Data Manipulation & Pandas Optimization for ${officerContext.targetRole} eligibility)
- **Net Gap:** 2 Levels (Application Gap)

### Recommended Next Steps:
1. **iGOT Karmayogi Course**: Complete *Python for Survey Data Processing & Pandas Aggregation* (12 Hours).
2. **Practical Sandbox**: Complete the *NSS Microdata Reshaping Simulation Lab* on STATVIA.
3. **Assessment**: Take the 5-question Python Reassessment Quiz to elevate your verified competency level to Level 3.`;

      suggestedActions = [
        { label: 'Start 10-Min Assessment', actionType: 'START_QUIZ' },
        { label: 'Launch Survey Simulation Lab', actionType: 'LAUNCH_LAB' },
        { label: 'View Accredited iGOT Courses', actionType: 'VIEW_RECOMMENDATIONS' },
      ];
    } else if (lowerMsg.includes('learn next') || lowerMsg.includes('what should i learn') || lowerMsg.includes('learning path') || lowerMsg.includes('next step')) {
      reply = `Based on your target role of **${officerContext.targetRole}** and your current readiness score of **${officerContext.roleReadiness}%**, your priority learning sequence is:

1. **Python Data Processing (Priority #1)** — Focus on pandas DataFrame reshaping, weighted survey aggregations, and NSS microdata multiplier calculations.
2. **AI / Machine Learning (Priority #2)** — Focus on automated non-response imputation models and random forest classification for administrative data.
3. **Advanced Two-Stage Survey Design (Priority #3)** — Review NSS 78th Round Sampling & Estimation Handbook for First Stage Unit (FSU) selection routines.

Would you like to launch the diagnostic assessment for Python or explore accredited iGOT modules?`;

      suggestedActions = [
        { label: 'Start Python Diagnostic Quiz', actionType: 'START_QUIZ' },
        { label: 'Launch Simulation Lab', actionType: 'LAUNCH_LAB' },
        { label: 'View Competency Passport', actionType: 'VIEW_PASSPORT' },
      ];
    } else if (lowerMsg.includes('senior statistical officer') || lowerMsg.includes('sso') || lowerMsg.includes('qualify') || lowerMsg.includes('promotion')) {
      reply = `To qualify for promotion to **${officerContext.targetRole}**, the ISS Cadre Competency Framework mandates:

1. **Role Readiness Score >= 80%** (Your current score: ${officerContext.roleReadiness}%).
2. **Level 4 Competency in Python Data Processing** (Currently Level 2).
3. **Level 3 Competency in AI / ML Applications** (Currently Level 1).
4. **Completion of 40+ Accredited iGOT Training Hours** (Currently 42 Hours verified).

Closing your Python and AI/ML gaps will immediately elevate your role readiness to 84%.`;

      suggestedActions = [
        { label: 'Start Assessment Now', actionType: 'START_QUIZ' },
        { label: 'View Competency Passport', actionType: 'VIEW_PASSPORT' },
      ];
    } else {
      reply = `Namaste Officer ${officerContext.name}. I am your NIPUN Statistical Capacity Assistant.

Based on your official profile (${officerContext.designation}, ${officerContext.organization}):
- **Role Readiness:** ${officerContext.roleReadiness}% (${officerContext.verifiedSkills} verified skills)
- **Target Role:** ${officerContext.targetRole}
- **Primary Focus:** Closing your **Python Application Gap** (Level 2 → Level 4).

I can assist you with sampling formulas, pandas survey data pipelines, national accounts balancing (SNA 2008), or accredited iGOT course selection. What topic would you like to explore?`;

      suggestedActions = [
        { label: 'Why was this Python gap detected?', actionType: 'EXPLAIN_GAP' },
        { label: 'Start 10-Min Assessment', actionType: 'START_QUIZ' },
        { label: 'Launch Survey Simulation Lab', actionType: 'LAUNCH_LAB' },
      ];
    }

    return res.status(200).json({
      success: true,
      reply,
      suggestedActions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API_ASSISTANT_ERROR]', err?.message || String(err));
    return res.status(200).json({
      success: true,
      reply: `Namaste Officer Aarav Sharma. I am available to guide your statistical learning journey. Your current priority is elevating your Python data processing competency to Level 3 for Deputy Director eligibility.`,
      suggestedActions: [
        { label: 'Start 10-Min Assessment', actionType: 'START_QUIZ' },
        { label: 'Launch Survey Simulation Lab', actionType: 'LAUNCH_LAB' },
      ],
      timestamp: new Date().toISOString(),
    });
  }
}
