import type { TPACMandate } from './tpac.types.js';
import { MOCK_NSSTA_PROGRAMMES } from '../nssta/nssta.mock.js';

export const MOCK_TPAC_MANDATES: TPACMandate[] = [
  {
    id: 'tpac-man-001',
    cadreRole: 'Deputy Director (Statistics)',
    competency: 'Python',
    mandatoryMinimumLevel: 4,
    recommendedProgrammes: [MOCK_NSSTA_PROGRAMMES[0]], // nssta-prog-301
    policyReference: 'TPAC Guideline 2026/ISS/Mandatory-Prog-301',
    validFrom: '2026-04-01',
  },
  {
    id: 'tpac-man-002',
    cadreRole: 'Deputy Director (Statistics)',
    competency: 'AI / ML',
    mandatoryMinimumLevel: 3,
    recommendedProgrammes: [MOCK_NSSTA_PROGRAMMES[3]], // nssta-prog-401
    policyReference: 'TPAC Emerging Tech Mandate 2026/AI-Gov-401',
    validFrom: '2026-06-01',
  },
  {
    id: 'tpac-man-003',
    cadreRole: 'Senior Statistical Officer',
    competency: 'Survey Methodology',
    mandatoryMinimumLevel: 4,
    recommendedProgrammes: [MOCK_NSSTA_PROGRAMMES[1]], // nssta-prog-102
    policyReference: 'TPAC Survey Sampling Standard 2025/NSS-102',
    validFrom: '2025-01-01',
  },
];
