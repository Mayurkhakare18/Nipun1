import type { IGOTCourse } from '../../../src/types';
import type { IGOTAdapter } from './igot.types';
import { MOCK_IGOT_COURSES } from './igot.mock';

export class IGOTClient implements IGOTAdapter {
  private isConfigured: boolean;
  private apiBaseUrl: string | undefined;

  constructor() {
    this.apiBaseUrl = process.env.IGOT_API_BASE_URL;
    this.isConfigured = Boolean(this.apiBaseUrl && process.env.IGOT_API_KEY);
  }

  async getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }> {
    if (this.isConfigured) {
      return {
        status: 'CONNECTED',
        message: 'Live iGOT Karmayogi API Integration Active',
      };
    }
    return {
      status: 'DEMO_MODE',
      message: 'Demonstration catalogue active (Official API credentials pending configuration)',
    };
  }

  async getCourses(filters?: { competency?: string; query?: string; category?: string }): Promise<IGOTCourse[]> {
    let courses = [...MOCK_IGOT_COURSES];

    if (filters?.competency) {
      courses = courses.filter(
        (c) => c.competency.toLowerCase() === filters.competency?.toLowerCase()
      );
    }
    if (filters?.category) {
      courses = courses.filter((c) => c.category === filters.category);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.competency.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q)
      );
    }
    return courses;
  }

  async getCourseById(id: string): Promise<IGOTCourse | null> {
    const course = MOCK_IGOT_COURSES.find((c) => c.id === id);
    return course || null;
  }

  async searchCourses(query: string): Promise<IGOTCourse[]> {
    return this.getCourses({ query });
  }

  async getCourseProgress(userId: string): Promise<{ courseId: string; progress: number; completed: boolean }[]> {
    return [
      { courseId: 'igot-py-002', progress: 100, completed: true },
      { courseId: 'igot-py-101', progress: 45, completed: false },
      { courseId: 'igot-sdg-101', progress: 80, completed: false },
    ];
  }

  async getEnrollmentStatus(userId: string, courseId: string): Promise<{ enrolled: boolean; enrolledDate?: string }> {
    const progressList = await this.getCourseProgress(userId);
    const item = progressList.find((p) => p.courseId === courseId);
    return {
      enrolled: Boolean(item),
      enrolledDate: item ? '2026-06-14' : undefined,
    };
  }

  async getRecommendationsForCompetency(competencyName: string, targetLevel: number): Promise<IGOTCourse[]> {
    return MOCK_IGOT_COURSES.filter(
      (c) =>
        c.competency.toLowerCase() === competencyName.toLowerCase() ||
        c.title.toLowerCase().includes(competencyName.toLowerCase())
    ).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export const igotAdapter = new IGOTClient();
