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

  const learningPath = {
    userId: 'user-learner-01',
    targetRole: 'Deputy Director (Statistics)',
    overallProgress: 42,
    stages: [
      {
        stageNumber: 1,
        title: 'Foundation & Core Tooling',
        status: 'IN_PROGRESS',
        items: [
          {
            id: 'item-01',
            title: 'Python for Official Statistical Analysis',
            provider: 'iGOT Karmayogi',
            type: 'ONLINE_COURSE',
            durationHours: 12,
            targetCompetency: 'Python',
            targetLevel: 3,
            status: 'COMPLETED',
            url: 'https://igotkarmayogi.gov.in/courses/python-stats-101',
          },
          {
            id: 'item-02',
            title: 'Advanced Survey Data Manipulation with Pandas',
            provider: 'STATVIA Interactive Lab',
            type: 'PRACTICAL_LAB',
            durationHours: 8,
            targetCompetency: 'Python',
            targetLevel: 4,
            status: 'IN_PROGRESS',
            url: '/simulation-lab',
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Advanced Statistical Methods & AI',
        status: 'PENDING',
        items: [
          {
            id: 'item-03',
            title: 'Machine Learning Applications in Official Statistics',
            provider: 'NSSTA Greater Noida',
            type: 'RESIDENTIAL_TRAINING',
            durationHours: 30,
            targetCompetency: 'AI / ML',
            targetLevel: 3,
            status: 'PENDING',
            url: 'https://nssta.gov.in/programmes/ml-official-stats-2026',
          },
          {
            id: 'item-04',
            title: 'Advanced Two-Stage Survey Sampling Methods',
            provider: 'MoSPI E-Learning Portal',
            type: 'SELF_PACED',
            durationHours: 16,
            targetCompetency: 'Survey Design',
            targetLevel: 4,
            status: 'PENDING',
            url: 'https://mospi.gov.in/elearning/survey-sampling-adv',
          },
        ],
      },
    ],
  };

  return res.status(200).json(learningPath);
}
