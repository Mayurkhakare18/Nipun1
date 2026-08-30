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
  } catch {}

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message = body.message || '';

    let reply = `Namaste Officer Aarav Sharma. As your MoSPI STATVIA AI Mentorship Advisor, I have reviewed your competency profile for the Assistant Director (Statistics) role.

Your biggest current skill gap is **Python for Official Statistical Analysis** (Current: Level 2, Required: Level 4 for Deputy Director eligibility, Gap: 2 Levels).

### Recommended Next Steps:
1. **iGOT Karmayogi Course**: Complete *Python for Survey Data Processing & Pandas Aggregation* (12 Hours).
2. **Practical Lab**: Complete the *NSS Microdata Reshaping Simulation Lab* on STATVIA.
3. **Assessment**: Take the 5-question Python Reassessment Quiz to elevate your verified competency level to Level 3.`;

    if (message.toLowerCase().includes('learn next') || message.toLowerCase().includes('what should i learn')) {
      reply = `Based on your target role of **Deputy Director (Statistics)**, your priority learning sequence is:

1. **Python Data Processing (Priority #1)** — Focus on pandas DataFrame reshaping and weighted survey aggregations.
2. **AI / Machine Learning (Priority #2)** — Focus on automated non-response imputation models.
3. **Advanced Survey Design (Priority #3)** — Review NSS 78th Round Sampling & Estimation Handbook.`;
    }

    return res.status(200).json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API_ASSISTANT_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'ASSISTANT_FAILED',
      message: err?.message || String(err),
    });
  }
}
