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
    const { assessmentId, answers, competencyId, userId } = body;

    // Calculate score
    const totalQuestions = answers ? Object.keys(answers).length : 5;
    const correctCount = answers
      ? Object.entries(answers).filter(([qId, ans]) => {
          // q-py-1 correct is 1, q-py-2 correct is 2, q-py-3 correct is 1, q-py-4 correct is 1, q-py-5 correct is 2
          if (qId === 'q-py-1' && Number(ans) === 1) return true;
          if (qId === 'q-py-2' && Number(ans) === 2) return true;
          if (qId === 'q-py-3' && Number(ans) === 1) return true;
          if (qId === 'q-py-4' && Number(ans) === 1) return true;
          if (qId === 'q-py-5' && Number(ans) === 2) return true;
          return Number(ans) === 1 || Number(ans) === 0;
        }).length
      : 4;

    const scorePercentage = Math.round((correctCount / Math.max(totalQuestions, 1)) * 100);
    const passed = scorePercentage >= 70;

    const previousLevel = 2;
    const newLevel = passed ? 3 : 2;
    const elevated = newLevel > previousLevel;

    return res.status(200).json({
      success: true,
      result: {
        assessmentId: assessmentId || 'quiz-py-01',
        userId: userId || 'user-learner-01',
        totalQuestions,
        correctAnswers: correctCount,
        scorePercentage,
        passed,
        previousLevel,
        newLevel,
        elevated,
        competencyName: 'Python',
        competencyId: competencyId || 'comp-tech-01',
        timestamp: new Date().toISOString(),
        certificateId: elevated ? `CERT-NIPUN-ISS-${Date.now().toString().slice(-6)}` : null,
      },
    });
  } catch (err: any) {
    console.error('[API_REASSESSMENT_SUBMIT_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'SUBMISSION_FAILED',
      message: err?.message || String(err),
    });
  }
}
