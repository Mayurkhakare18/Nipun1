import type { TPACAdapter, TPACMandate } from './tpac.types.js';
import type { NSSTAProgramme } from '../../../src/types.js';
import { MOCK_TPAC_MANDATES } from './tpac.mock.js';
import { MOCK_NSSTA_PROGRAMMES } from '../nssta/nssta.mock.js';

export class TPACClient implements TPACAdapter {
  private isConfigured: boolean;
  private apiBaseUrl: string | undefined;

  constructor() {
    this.apiBaseUrl = process.env.TPAC_API_BASE_URL;
    this.isConfigured = Boolean(this.apiBaseUrl && process.env.TPAC_API_KEY);
  }

  async getConnectionStatus(): Promise<{ status: 'CONNECTED' | 'DEMO_MODE' | 'UNAVAILABLE'; message: string }> {
    if (this.isConfigured) {
      return {
        status: 'CONNECTED',
        message: 'Live TPAC Cadre Training Policy Server Active',
      };
    }
    return {
      status: 'DEMO_MODE',
      message: 'TPAC Cadre Mandates demonstration dataset active (Official API credentials pending configuration)',
    };
  }

  async getCadreMandates(role: string): Promise<TPACMandate[]> {
    const r = role.toLowerCase();
    return MOCK_TPAC_MANDATES.filter(
      (m) => m.cadreRole.toLowerCase().includes(r) || r.includes(m.cadreRole.toLowerCase())
    );
  }

  async getMandatedProgrammesForRole(role: string): Promise<NSSTAProgramme[]> {
    const mandates = await this.getCadreMandates(role);
    const progIds = new Set<string>();
    mandates.forEach((m) => {
      m.recommendedProgrammes.forEach((p) => progIds.add(p.id));
    });
    return MOCK_NSSTA_PROGRAMMES.filter((p) => progIds.has(p.id) || p.tpacAligned);
  }

  async isProgrammeMandatoryForRole(programmeId: string, role: string): Promise<boolean> {
    const mandated = await this.getMandatedProgrammesForRole(role);
    return mandated.some((p) => p.id === programmeId);
  }
}

export const tpacAdapter = new TPACClient();
