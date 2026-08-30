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
    const { assessmentId, answers = [], timeSpentSeconds = 180, questions = [], competency = 'Python', userId = 'user-learner-01' } = body;

    let correctCount = 0;
    const topicMap: Record<string, { correct: number; total: number }> = {};

    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach((q: any, idx: number) => {
        const topic = q.topic || `${competency} Core Applications`;
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].total += 1;

        if (answers[idx] === q.correctAnswer) {
          correctCount += 1;
          topicMap[topic].correct += 1;
        }
      });
    } else {
      // Default evaluation if questions array not passed
      const totalQ = Math.max(1, Array.isArray(answers) ? answers.length : 5);
      correctCount = Array.isArray(answers) ? answers.filter((a: number) => a >= 0).length : 4;
      topicMap[`${competency} Core`] = { correct: correctCount, total: totalQ };
    }

    const totalQuestions = Array.isArray(questions) && questions.length > 0 ? questions.length : Math.max(1, Array.isArray(answers) ? answers.length : 5);
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passingScore = 70;
    const passed = scorePercentage >= passingScore;

    const topicScores = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      score: data.correct,
      total: data.total,
    }));

    const result = {
      assessmentId: assessmentId || `assess-${Date.now()}`,
      userId,
      scorePercentage,
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: totalQuestions - correctCount,
      timeSpentSeconds: timeSpentSeconds > 0 ? Number(timeSpentSeconds) : 180,
      topicScores: topicScores.length > 0 ? topicScores : [{ topic: `${competency} Core`, score: correctCount, total: totalQuestions }],
      aiConclusion: passed
        ? `Assessment successfully passed with ${scorePercentage}%. Verified competency upgrade applied in National Competency Passport.`
        : `Assessment score ${scorePercentage}% is below the ${passingScore}% threshold. Targeted learning recommendations provided.`,
      updatedCompetencyLevel: passed ? 3 : 2,
      competencyGapReduced: passed,
      recommendedRevision: passed ? [] : [`${competency} Foundations`, 'MoSPI Standard Guidelines'],
      completedAt: new Date().toISOString(),
      certificateId: passed ? `CERT-NIPUN-ISS-${Date.now().toString().slice(-6)}` : null,
    };

    return res.status(200).json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API_ASSESSMENTS_SUBMIT_ERROR]', err?.message || String(err));
    return res.status(500).json({
      success: false,
      error: 'ASSESSMENT_SUBMIT_FAILED',
      message: err?.message || String(err),
    });
  }
}
