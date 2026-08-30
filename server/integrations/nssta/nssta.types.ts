import type { NSSTAProgramme } from '../../../src/types.js';

export interface NSSTAAdapter {
  getTrainingProgrammes(filters?: { category?: string; query?: string }): Promise<NSSTAProgramme[]>;
  getProgrammeById(id: string): Promise<NSSTAProgramme | null>;
  searchProgrammes(query: string): Promise<NSSTAProgramme[]>;
  getTPACRecommendations(role: string): Promise<NSSTAProgramme[]>;
  getTrainingCalendar(): Promise<NSSTAProgramme[]>;
  getRecommendationsForCompetency(competencyName: string): Promise<NSSTAProgramme[]>;
  getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }>;
}
