import { db } from '../../server/db';

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
    db.ensureSeeded();
    const userId = req.query.userId || 'user-learner-01';
    const competencies = db.state.learnerCompetencies[userId] || db.state.learnerCompetencies['user-learner-01'] || [];
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
