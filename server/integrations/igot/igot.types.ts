import type { IGOTCourse } from '../../../src/types';

export interface IGOTAdapter {
  getCourses(filters?: { competency?: string; query?: string; category?: string }): Promise<IGOTCourse[]>;
  getCourseById(id: string): Promise<IGOTCourse | null>;
  searchCourses(query: string): Promise<IGOTCourse[]>;
  getCourseProgress(userId: string): Promise<{ courseId: string; progress: number; completed: boolean }[]>;
  getEnrollmentStatus(userId: string, courseId: string): Promise<{ enrolled: boolean; enrolledDate?: string }>;
  getRecommendationsForCompetency(competencyName: string, targetLevel: number): Promise<IGOTCourse[]>;
  getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }>;
}
