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
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token: string | undefined;
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    }

    db.ensureSeeded();

    if (token) {
      const session = db.validateSession(token);
      if (session && db.state.users[session.userId]) {
        return res.status(200).json({
          authenticated: true,
          user: db.state.users[session.userId],
        });
      }
    }

    // Fallback to primary demo learner (Aarav Sharma)
    const aarav = db.state.users['user-learner-01'] || {
      id: 'user-learner-01',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@mospi.gov.in',
      role: 'LEARNER',
      employeeId: 'MOSPI-8842',
      ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
      department: 'National Statistical Office (NSO)',
      organization: 'MoSPI',
      designation: 'Assistant Director (Statistics)',
      currentRole: 'Assistant Director (Statistics)',
      targetRole: 'Deputy Director (Statistics)',
      level: 11,
      cadre: 'Indian Statistical Service (ISS)',
      yearsOfExperience: 6,
      education: 'M.Sc. Official Statistics & Survey Sampling',
      specialization: 'Survey Sampling & Data Architecture',
      location: 'New Delhi',
      preferredLanguage: 'English',
      previousRoles: ['Statistical Officer', 'Junior Statistical Officer'],
      currentProjects: ['National Sample Survey (NSS) Frame Optimization'],
      technologiesUsed: ['Python', 'R', 'CSPro', 'SQL', 'Stata'],
      trainingHours: 42,
      roleReadiness: 74,
      verifiedSkillsCount: 14,
      developingSkillsCount: 4,
    };

    return res.status(200).json({
      authenticated: true,
      user: aarav,
    });
  } catch (err: any) {
    console.error('[API_AUTH_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'AUTH_FETCH_FAILED',
      message: err?.message || String(err),
    });
  }
}
