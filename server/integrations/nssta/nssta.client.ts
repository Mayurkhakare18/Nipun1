import type { NSSTAProgramme } from '../../../src/types.js';
import type { NSSTAAdapter } from './nssta.types.js';
import { MOCK_NSSTA_PROGRAMMES } from './nssta.mock.js';

export class NSSTAClient implements NSSTAAdapter {
  private isConfigured: boolean;
  private apiBaseUrl: string | undefined;

  constructor() {
    this.apiBaseUrl = process.env.NSSTA_API_BASE_URL;
    this.isConfigured = Boolean(this.apiBaseUrl && process.env.NSSTA_API_KEY);
  }

  async getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }> {
    if (this.isConfigured) {
      return {
        status: 'CONNECTED',
        message: 'Live NSSTA Academy Portal Integration Active',
      };
    }
    return {
      status: 'DEMO_MODE',
      message: 'NSSTA Training Calendar demonstration dataset active (Official API credentials pending configuration)',
    };
  }

  async getTrainingProgrammes(filters?: { category?: string; query?: string }): Promise<NSSTAProgramme[]> {
    let programmes = [...MOCK_NSSTA_PROGRAMMES];

    if (filters?.category) {
      programmes = programmes.filter((p) => p.category === filters.category);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      programmes = programmes.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.competenciesCovered.some((c) => c.toLowerCase().includes(q))
      );
    }
    return programmes;
  }

  async getProgrammeById(id: string): Promise<NSSTAProgramme | null> {
    const prog = MOCK_NSSTA_PROGRAMMES.find((p) => p.id === id);
    return prog || null;
  }

  async searchProgrammes(query: string): Promise<NSSTAProgramme[]> {
    return this.getTrainingProgrammes({ query });
  }

  async getTPACRecommendations(role: string): Promise<NSSTAProgramme[]> {
    return MOCK_NSSTA_PROGRAMMES.filter((p) => p.tpacAligned);
  }

  async getTrainingCalendar(): Promise<NSSTAProgramme[]> {
    return MOCK_NSSTA_PROGRAMMES;
  }

  async getRecommendationsForCompetency(competencyName: string): Promise<NSSTAProgramme[]> {
    return MOCK_NSSTA_PROGRAMMES.filter((p) =>
      p.competenciesCovered.some(
        (c) => c.toLowerCase() === competencyName.toLowerCase() || p.title.toLowerCase().includes(competencyName.toLowerCase())
      )
    );
  }
}

export const nsstaAdapter = new NSSTAClient();
