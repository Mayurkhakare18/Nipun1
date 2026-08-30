import { api } from './api';
import {
  UserProfile,
  LearnerCompetency,
  GapAnalysisResult,
  Competency,
} from '../types';

export interface CompetencyProfileSummary {
  totalCompetencies: number;
  verifiedCount: number;
  criticalGapsCount: number;
  developingCount: number;
  overallRoleReadiness: number;
  knowledgeGapAvg: number;
  applicationGapAvg: number;
  lastAssessedDate: string;
  targetRole: string;
  specialization: string;
}

export interface DatabaseMetadata {
  source?: string;
  syncedAt?: string;
  authenticatedOfficerId?: string;
}

export interface LearnerProfileCompetencyResponse {
  success: boolean;
  profile: UserProfile;
  competencies: LearnerCompetency[];
  gaps: GapAnalysisResult[];
  summary: CompetencyProfileSummary;
  meta?: DatabaseMetadata;
  message?: string;
}

export interface RecalibrateGapsResponse {
  success: boolean;
  gaps: GapAnalysisResult[];
  competencies?: LearnerCompetency[];
  profile?: UserProfile;
  summary?: CompetencyProfileSummary;
  meta?: DatabaseMetadata;
  message?: string;
}

/**
 * Service layer for Learner Competencies, Evidence-based Gap Diagnostics,
 * and Database-driven Officer Profiling.
 */
class CompetencyService {
  /**
   * Fetches the real authenticated learner profile and enriched competency data from the database.
   */
  async getLearnerCompetencyProfile(): Promise<LearnerProfileCompetencyResponse> {
    try {
      const response = await api.getLearnerProfileCompetencies();
      if (response && response.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to fetch competency profile from database');
    } catch (error: any) {
      console.error('[CompetencyService] getLearnerCompetencyProfile error:', error);
      throw error;
    }
  }

  /**
   * Fetches current gap analysis results from the database for the active officer.
   */
  async getLearnerGaps(): Promise<GapAnalysisResult[]> {
    try {
      const response = await api.getLearnerGaps();
      if (response && response.success && response.gaps) {
        return response.gaps;
      }
      return [];
    } catch (error) {
      console.error('[CompetencyService] getLearnerGaps error:', error);
      return [];
    }
  }

  /**
   * Recalibrates empirical skill gaps against target standards using backend AI diagnostic models.
   */
  async recalibrateLearnerGaps(): Promise<RecalibrateGapsResponse> {
    try {
      const response = await api.runGapCheck();
      if (response && response.success) {
        return response;
      }
      throw new Error(response?.message || 'Failed to recalibrate learner gaps');
    } catch (error: any) {
      console.error('[CompetencyService] recalibrateLearnerGaps error:', error);
      throw error;
    }
  }

  /**
   * Retrieves all standardized MoSPI statistical framework competencies.
   */
  async getAllCompetencies(): Promise<Competency[]> {
    try {
      const response = await api.getCompetencies();
      if (response && response.success && response.competencies) {
        return response.competencies;
      }
      return [];
    } catch (error) {
      console.error('[CompetencyService] getAllCompetencies error:', error);
      return [];
    }
  }
}

export const competencyService = new CompetencyService();
