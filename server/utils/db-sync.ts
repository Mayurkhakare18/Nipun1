import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import type { LearnerCompetency, GapAnalysisResult } from '../../src/types';

/**
 * Production database persistence utility to synchronize Express mutations
 * directly into Supabase PostgreSQL as the primary source of truth,
 * while keeping in-memory hot cache aligned for low latency.
 */

export async function persistAuditLog(
  serverSupabase: SupabaseClient,
  log: {
    id?: string;
    userId?: string;
    userName: string;
    action: string;
    details: string;
    ipAddress?: string;
  }
) {
  const logId = log.id || `log-${Date.now()}`;
  const now = new Date().toISOString();

  // 1. Maintain in-memory cache
  db.state.auditLogs.unshift({
    id: logId,
    timestamp: now,
    user: log.userName,
    action: log.action,
    details: log.details,
  });

  // 2. Persist to PostgreSQL
  const { error } = await serverSupabase.from('audit_logs').insert({
    id: logId,
    user_id: log.userId || null,
    user_name: log.userName,
    action: log.action,
    details: log.details,
    ip_address: log.ipAddress || '127.0.0.1',
    created_at: now,
  });

  if (error) {
    console.error('[DBSync] audit_logs insert failed:', error.message);
    // Non-fatal for business logic but logged
  }
}

export async function persistAssessmentAttempt(
  serverSupabase: SupabaseClient,
  attempt: {
    id: string;
    assessmentId: string;
    userId: string;
    scorePercentage: number;
    totalQuestions: number;
    correctAnswersCount: number;
    incorrectAnswersCount: number;
    timeSpentSeconds: number;
    passed: boolean;
    topicScores: any;
    aiConclusion?: string;
    updatedCompetencyLevel?: number;
    gapReduced?: boolean;
    recommendedRevision?: any;
    completedAt?: string;
  }
) {
  // Ensure assessment exists in assessments table
  const { data: existingAssess } = await serverSupabase
    .from('assessments')
    .select('id')
    .eq('id', attempt.assessmentId)
    .maybeSingle();

  if (!existingAssess) {
    await serverSupabase.from('assessments').upsert({
      id: attempt.assessmentId,
      title: `Assessment (${attempt.assessmentId})`,
      competency_id: 'comp-tech-01',
      description: 'System-registered assessment attempt target',
      time_limit_minutes: 15,
      passing_score: 70,
      is_ai_generated: true,
      created_at: new Date().toISOString(),
    });
  }

  const { error } = await serverSupabase.from('assessment_attempts').insert({
    id: attempt.id,
    assessment_id: attempt.assessmentId,
    user_id: attempt.userId,
    score_percentage: attempt.scorePercentage,
    total_questions: attempt.totalQuestions,
    correct_answers_count: attempt.correctAnswersCount,
    incorrect_answers_count: attempt.incorrectAnswersCount,
    time_spent_seconds: attempt.timeSpentSeconds,
    passed: attempt.passed,
    topic_scores: attempt.topicScores || [],
    ai_conclusion: attempt.aiConclusion || 'Assessment attempt completed.',
    updated_competency_level: attempt.updatedCompetencyLevel || null,
    gap_reduced: attempt.gapReduced || false,
    recommended_revision: attempt.recommendedRevision || [],
    completed_at: attempt.completedAt || new Date().toISOString(),
  });

  if (error) {
    console.error('[DBSync] assessment_attempts insert failed:', error.message);
    throw new Error(`Failed to persist assessment attempt in PostgreSQL: ${error.message}`);
  }
}

export async function persistAssessmentAnswers(
  serverSupabase: SupabaseClient,
  attemptId: string,
  assessmentId: string,
  questions: Array<{
    id?: string;
    question?: string;
    question_text?: string;
    options: string[];
    correctAnswer?: number;
    correct_answer_index?: number;
    explanation?: string;
    topic?: string;
    difficulty?: string;
  }>,
  answers: number[],
  timeSpentSeconds: number
) {
  if (!questions || questions.length === 0) return;

  const totalQ = questions.length;
  const timePerQ = Math.max(1, Math.round(timeSpentSeconds / totalQ));

  // 1. Ensure each question exists in assessment_questions to satisfy foreign key
  const questionRowsToEnsure: any[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qId = q.id || `${assessmentId}-q${i + 1}`;
    questionRowsToEnsure.push({
      id: qId,
      assessment_id: assessmentId,
      question_text: q.question || q.question_text || `Question ${i + 1}`,
      options: q.options || ['A', 'B', 'C', 'D'],
      correct_answer_index: q.correctAnswer !== undefined ? q.correctAnswer : (q.correct_answer_index || 0),
      explanation: q.explanation || 'Verified statistical answer.',
      topic: q.topic || 'General Statistics',
      difficulty: q.difficulty || 'Medium',
      order_index: i + 1,
    });
  }

  const { error: qUpsertErr } = await serverSupabase
    .from('assessment_questions')
    .upsert(questionRowsToEnsure, { onConflict: 'id' });

  if (qUpsertErr) {
    console.warn('[DBSync] assessment_questions ensure warning:', qUpsertErr.message);
  }

  // 2. Insert answers referencing attempt_id and question_id
  const answerRows = questions.map((q, idx) => {
    const qId = q.id || `${assessmentId}-q${idx + 1}`;
    const selected = answers[idx] !== undefined ? answers[idx] : -1;
    const correctIndex = q.correctAnswer !== undefined ? q.correctAnswer : (q.correct_answer_index || 0);
    const isCorrect = selected === correctIndex;

    return {
      id: `ans-${attemptId}-${idx + 1}`,
      attempt_id: attemptId,
      question_id: qId,
      selected_option_index: selected,
      is_correct: isCorrect,
      time_taken_seconds: timePerQ,
    };
  });

  const { error: ansErr } = await serverSupabase.from('assessment_answers').insert(answerRows);

  if (ansErr) {
    console.error('[DBSync] assessment_answers insert failed:', ansErr.message);
    throw new Error(`Failed to persist assessment answers in PostgreSQL: ${ansErr.message}`);
  }
}

export async function persistLearnerCompetencies(
  serverSupabase: SupabaseClient,
  userId: string,
  competencies: LearnerCompetency[]
) {
  if (!competencies || competencies.length === 0) return;

  const rows = competencies.map((c) => ({
    id: `comp-${userId}-${c.competencyId}`,
    user_id: userId,
    competency_id: c.competencyId,
    current_level: c.currentLevel,
    required_level: c.requiredLevel,
    status: c.status,
    gap_type: c.gapType || 'KNOWLEDGE_GAP',
    confidence: c.confidence || 0.9,
    trend: c.trend || 'STABLE',
    last_assessed_at: c.lastAssessed ? new Date(c.lastAssessed).toISOString() : new Date().toISOString(),
    target_date: c.targetDate || '2026-12-31',
    diagnostic_score: c.evidence?.diagnosticScore || null,
    practical_score: c.evidence?.practicalScore || null,
    repeated_errors: c.evidence?.repeatedErrors || [],
    evaluator_notes: c.evidence?.notes || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await serverSupabase.from('learner_competencies').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.error('[DBSync] learner_competencies upsert failed:', error.message);
    throw new Error(`Failed to persist learner competencies in PostgreSQL: ${error.message}`);
  }
}

export async function persistSkillGaps(
  serverSupabase: SupabaseClient,
  userId: string,
  gaps: GapAnalysisResult[]
) {
  if (!gaps || gaps.length === 0) return;

  const rows = gaps.map((g) => ({
    id: `gap-${userId}-${g.competencyId}`,
    user_id: userId,
    competency_id: g.competencyId,
    required_level: g.requiredLevel,
    current_level: g.currentLevel,
    gap_magnitude: g.gap,
    gap_type: g.gapType,
    priority: g.priority,
    knowledge_gap_score: g.knowledgeGapScore,
    application_gap_score: g.applicationGapScore,
    retention_risk_score: g.retentionRiskScore,
    ai_diagnosis: g.aiDiagnosis,
    why_recommended: g.whyRecommended,
    status: 'OPEN',
    identified_at: new Date().toISOString(),
  }));

  const { error } = await serverSupabase.from('skill_gaps').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.error('[DBSync] skill_gaps upsert failed:', error.message);
    throw new Error(`Failed to persist skill gaps in PostgreSQL: ${error.message}`);
  }
}

export async function persistLearningPathAndProgress(
  serverSupabase: SupabaseClient,
  userId: string,
  path: {
    id: string;
    title: string;
    targetRole?: string;
    progressPercentage?: number;
    items?: Array<{
      id: string;
      title: string;
      provider?: string;
      sourceType?: string;
      duration?: string;
      status: string;
      score?: number;
      competency?: string;
    }>;
  }
) {
  const pathId = path.id || `path-${userId}`;

  // 1. Ensure learning_paths parent record exists first
  const { error: pathErr } = await serverSupabase.from('learning_paths').upsert(
    {
      id: pathId,
      user_id: userId,
      title: path.title || 'Personalized Career Competency Pathway',
      description: 'Official National Capacity Building Learning Pathway',
      target_role: path.targetRole || 'Deputy Director (Statistics)',
      progress_percentage: path.progressPercentage || 0,
      estimated_total_hours: 24.0,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (pathErr) {
    console.error('[DBSync] learning_paths upsert failed:', pathErr.message);
    throw new Error(`Failed to persist learning path parent record in PostgreSQL: ${pathErr.message}`);
  }

  // 2. If items are provided, upsert them into learning_progress
  if (path.items && path.items.length > 0) {
    const progressRows = path.items.map((item, idx) => ({
      id: `step-${item.id}`,
      path_id: pathId,
      step_number: idx + 1,
      title: item.title,
      provider: item.provider || (item as any).sourceType || 'iGOT Karmayogi',
      source_type: item.sourceType || 'COURSE',
      duration: item.duration || '2 hours',
      status: item.status || 'PENDING',
      score: item.score !== undefined ? item.score : null,
      competency_name: item.competency || null,
      completed_at: item.status === 'COMPLETED' || item.status === 'VERIFIED' ? new Date().toISOString() : null,
    }));

    const { error: progErr } = await serverSupabase.from('learning_progress').upsert(progressRows, {
      onConflict: 'id',
    });

    if (progErr) {
      console.error('[DBSync] learning_progress upsert failed:', progErr.message);
      throw new Error(`Failed to persist learning progress items in PostgreSQL: ${progErr.message}`);
    }
  }
}

export async function persistLearningProgress(
  serverSupabase: SupabaseClient,
  pathId: string,
  userId: string,
  item: {
    id: string;
    stepNumber?: number;
    title: string;
    provider?: string;
    sourceType?: string;
    duration?: string;
    status: string;
    score?: number;
    competency?: string;
  }
) {
  // Ensure learning_paths parent exists first
  const { data: existingPath } = await serverSupabase
    .from('learning_paths')
    .select('id')
    .eq('id', pathId)
    .maybeSingle();

  if (!existingPath) {
    await serverSupabase.from('learning_paths').upsert({
      id: pathId,
      user_id: userId,
      title: 'Personalized Career Competency Pathway',
      description: 'Official National Capacity Building Learning Pathway',
      target_role: 'Deputy Director (Statistics)',
      progress_percentage: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  }

  const { error } = await serverSupabase.from('learning_progress').upsert(
    {
      id: `step-${item.id}`,
      path_id: pathId,
      step_number: item.stepNumber || 1,
      title: item.title,
      provider: item.provider || 'iGOT Karmayogi',
      source_type: item.sourceType || 'COURSE',
      duration: item.duration || '2 hours',
      status: item.status,
      score: item.score !== undefined ? item.score : null,
      competency_name: item.competency || null,
      completed_at: item.status === 'COMPLETED' || item.status === 'VERIFIED' ? new Date().toISOString() : null,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[DBSync] learning_progress upsert failed:', error.message);
    throw new Error(`Failed to persist learning progress in PostgreSQL: ${error.message}`);
  }
}

export async function persistUploadedMaterial(
  serverSupabase: SupabaseClient,
  material: {
    id: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType?: string;
    purpose?: string;
    status?: string;
    extractedTopics?: string[];
    keySummary?: string;
    rawTextExcerpt?: string;
    generatedQuestionsCount?: number;
  }
) {
  if (material.userId) {
    try {
      const { data: userRow } = await serverSupabase
        .from('users')
        .select('id')
        .eq('id', material.userId)
        .maybeSingle();

      if (!userRow) {
        const memoryUser = db.state.users[material.userId] || Object.values(db.state.users).find((u) => u.id === material.userId);
        await serverSupabase.from('users').upsert(
          {
            id: material.userId,
            email: memoryUser?.email || `officer.${material.userId.slice(0, 8)}@mospi.gov.in`,
            name: memoryUser?.name || 'MoSPI Statistical Officer',
            role: memoryUser?.role || 'LEARNER',
            status: 'ACTIVE',
            auth_provider: 'SUPABASE_AUTH',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (userEnsureErr) {
      console.warn('[DBSync] Warning ensuring user before material insert:', userEnsureErr);
    }
  }

  const { error } = await serverSupabase.from('uploaded_learning_materials').insert({
    id: material.id,
    user_id: material.userId,
    file_name: material.fileName,
    file_size_bytes: material.fileSize,
    file_type: material.fileType || 'application/pdf',
    purpose: material.purpose || 'TRAINER_ASSESSMENT_GENERATION',
    status: material.status || 'PROCESSED',
    extracted_topics: material.extractedTopics || [],
    executive_summary: material.keySummary || '',
    raw_text_excerpt: material.rawTextExcerpt || '',
    generated_questions_count: material.generatedQuestionsCount || 0,
    uploaded_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[DBSync] uploaded_learning_materials insert failed:', error.message);
    throw new Error(`Failed to persist uploaded material in PostgreSQL: ${error.message}`);
  }
}
