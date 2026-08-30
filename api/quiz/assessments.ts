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
    const assessments = db.state.assessments || [];
    return res.status(200).json(assessments);
  } catch (err: any) {
    console.error('[API_QUIZ_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'QUIZ_FETCH_FAILED',
      message: err?.message || String(err),
    });
  }
}
