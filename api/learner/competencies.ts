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

  const competencies = [
    {
      competencyId: 'comp-tech-01',
      name: 'Python',
      category: 'TECHNICAL_COMPETENCIES',
      requiredLevel: 4,
      currentLevel: 2,
      gap: 2,
      status: 'CRITICAL_GAP',
    },
    {
      competencyId: 'comp-tech-05',
      name: 'AI / ML',
      category: 'TECHNICAL_COMPETENCIES',
      requiredLevel: 3,
      currentLevel: 1,
      gap: 2,
      status: 'DEVELOPING',
    },
  ];

  return res.status(200).json(competencies);
}
