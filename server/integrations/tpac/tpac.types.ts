import type { NSSTAProgramme } from '../../../src/types.js';

export interface TPACMandate {
  id: string;
  cadreRole: string;
  competency: string;
  mandatoryMinimumLevel: number;
  recommendedProgrammes: NSSTAProgramme[];
  policyReference: string;
  validFrom: string;
}

export interface TPACAdapter {
  getCadreMandates(role: string): Promise<TPACMandate[]>;
  getMandatedProgrammesForRole(role: string): Promise<NSSTAProgramme[]>;
  isProgrammeMandatoryForRole(programmeId: string, role: string): Promise<boolean>;
  getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }>;
}
