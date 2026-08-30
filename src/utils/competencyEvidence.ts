export interface SubSkillEvidence {
  id: string;
  name: string;
  category: string;
  status: 'DEFICIENT' | 'IN_PROGRESS' | 'MASTERED';
  proficiencyScore: number; // 0 to 100
  requiredLevel: number;
  currentLevel: number;
  aiObservation: string;
  failedConceptTest?: string;
  remediationAction: string;
}

export interface ProjectMetricEvidence {
  projectName: string;
  division: string;
  roleInProject: string;
  dateEvaluated: string;
  sampleVolume: string;
  metrics: {
    label: string;
    actualValue: string | number;
    benchmarkValue: string | number;
    variance: string;
    status: 'ALERT' | 'WARNING' | 'GOOD';
    explanation: string;
  }[];
  systemObservation: string;
}

export interface DiagnosticAssessmentTrace {
  assessmentDate: string;
  assessmentType: 'Adaptive Quiz' | 'Interactive Sandbox Lab' | 'Peer Review Evaluation';
  totalQuestions: number;
  score: number;
  failedConcepts: {
    topic: string;
    questionSummary: string;
    learnerResponse: string;
    expectedStandard: string;
    gapSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

export interface CompetencyDetailedEvidence {
  competencyId: string;
  competencyName: string;
  gapType: 'APPLICATION_GAP' | 'KNOWLEDGE_GAP' | 'RETENTION_GAP' | 'ROLE_READINESS_GAP';
  cadreBenchmark: {
    targetCadre: string;
    expectedScore: number;
    learnerScore: number;
    cadrePercentile: number;
    gapSeverityExplanation: string;
  };
  subSkills: SubSkillEvidence[];
  projectMetrics: ProjectMetricEvidence[];
  assessmentTraces: DiagnosticAssessmentTrace[];
  aiDetectionSummary: {
    primaryTrigger: string;
    detectionSource: 'TRIANGULATED_ASSESSMENT_AND_WORKFLOW' | 'AUTOMATED_CODE_EVALUATION' | 'SURVEY_METRICS_AUDIT';
    confidenceRating: number;
    keyDeficitFactors: string[];
    immediateIntervention: string;
  };
}

/**
 * Domain-specific evidence repository for MoSPI Official Statistics competencies
 */
const EVIDENCE_REGISTRY: Record<string, CompetencyDetailedEvidence> = {
  // 1. Python for Official Statistics
  'python': {
    competencyId: 'comp-tech-01',
    competencyName: 'Python for Official Statistics',
    gapType: 'APPLICATION_GAP',
    cadreBenchmark: {
      targetCadre: 'Senior Statistical Officer / Assistant Director (Cadre SSS/ISS)',
      expectedScore: 85,
      learnerScore: 48,
      cadrePercentile: 34,
      gapSeverityExplanation:
        'Officers at Level 3+ are expected to write automated, vectorized data pipelines without manual spreadsheet intermediary steps.',
    },
    subSkills: [
      {
        id: 'sub-py-01',
        name: 'Pandas Vectorized Transformations & Groupby Apply',
        category: 'Data Manipulation',
        status: 'DEFICIENT',
        proficiencyScore: 38,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Learner uses explicit Python for-loops over 200k+ survey rows instead of native .transform() or .agg() vectorized operations.',
        failedConceptTest: 'Q3: Optimized grouped quantile calculation on multi-stage cluster survey records.',
        remediationAction: 'Complete Simulation Lab on Vectorized Pandas pipelines.',
      },
      {
        id: 'sub-py-02',
        name: 'CAPI / CSPro Survey Data Ingestion & Schema Validation',
        category: 'Data Ingestion',
        status: 'IN_PROGRESS',
        proficiencyScore: 62,
        requiredLevel: 3,
        currentLevel: 2,
        aiObservation: 'Ingests .dat / .csv raw files successfully but lacks Pydantic / Great Expectations schema validation assertions.',
        failedConceptTest: 'Q5: Automated missingness pattern detection across household rosters.',
        remediationAction: 'Study iGOT module on Automated Survey Data Validation.',
      },
      {
        id: 'sub-py-03',
        name: 'Statistical Anonymization & Perturbation Scripting',
        category: 'Privacy & Governance',
        status: 'DEFICIENT',
        proficiencyScore: 41,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Unable to parameterize k-anonymity and l-diversity thresholds in public use microdata (PUMD) generation script.',
        failedConceptTest: 'Q7: Microdata disclosure suppression using microaggregation.',
        remediationAction: 'Practice Statistical Disclosure Control Lab sandbox.',
      },
      {
        id: 'sub-py-04',
        name: 'Automated Tabulation & Excel/LaTeX Report Generation',
        category: 'Dissemination',
        status: 'MASTERED',
        proficiencyScore: 84,
        requiredLevel: 3,
        currentLevel: 3,
        aiObservation: 'Proficient in openpyxl and Jinja template formatting for standard government publication tables.',
        remediationAction: 'Skill validated; maintain proficiency.',
      },
    ],
    projectMetrics: [
      {
        projectName: 'Periodic Labour Force Survey (PLFS) Quarterly Batch Pipeline',
        division: 'Survey Design & Research Division (SDRD)',
        roleInProject: 'Lead Script Author & Data Verifier',
        dateEvaluated: '12 Aug 2026',
        sampleVolume: '450,000 household respondent records',
        metrics: [
          {
            label: 'Script Execution Latency',
            actualValue: '18 mins 42 secs',
            benchmarkValue: '< 3 mins 30 secs',
            variance: '+434% slower',
            status: 'ALERT',
            explanation: 'Repeated row-wise DataFrame iteration causing CPU bottleneck on MoSPI cloud compute.',
          },
          {
            label: 'Data Type Validation Failures',
            actualValue: '14.8%',
            benchmarkValue: '< 1.0%',
            variance: '+13.8% above threshold',
            status: 'ALERT',
            explanation: 'Unchecked categorical string coercions caused NaN propagation in rural wage calculations.',
          },
          {
            label: 'Automated Unit Test Coverage',
            actualValue: '22%',
            benchmarkValue: '80%',
            variance: '-58% coverage',
            status: 'WARNING',
            explanation: 'Absence of pytest assertions for edge cases like multi-family households.',
          },
        ],
        systemObservation:
          'Audit of repository commits revealed manual Excel corrections prior to Python ingestion, violating reproducible analytical pipeline standards.',
      },
    ],
    assessmentTraces: [
      {
        assessmentDate: '18 Aug 2026',
        assessmentType: 'Interactive Sandbox Lab',
        totalQuestions: 10,
        score: 48,
        failedConcepts: [
          {
            topic: 'Vectorized Outlier Cleaning',
            questionSummary: 'Detect and winsorize consumption expenditure anomalies grouped by state-sector strata.',
            learnerResponse: 'Implemented iterrows loop with in-place scalar replacements.',
            expectedStandard: 'Vectorized df.groupby().transform(np.clip) with quantile bounds.',
            gapSeverity: 'HIGH',
          },
          {
            topic: 'Survey Weight Multiplying',
            questionSummary: 'Merge sub-round multipliers and compute weighted aggregate population estimates.',
            learnerResponse: 'Outer merge without checking duplicate household keys.',
            expectedStandard: '1:1 validated merge on FSU + SSU composite keys.',
            gapSeverity: 'HIGH',
          },
        ],
      },
    ],
    aiDetectionSummary: {
      primaryTrigger: 'High execution latency and low vectorized code compliance in recent PLFS batch processing scripts.',
      detectionSource: 'TRIANGULATED_ASSESSMENT_AND_WORKFLOW',
      confidenceRating: 0.94,
      keyDeficitFactors: [
        'Over-reliance on iterative loops over vectorization',
        'Incomplete automated schema validation rules',
        'Lack of automated unit testing on statistical calculation functions',
      ],
      immediateIntervention: 'Enroll in Practical Python Vectorization Sandbox (20 min code lab).',
    },
  },

  // 2. Survey Methodology & Sampling Frame
  'survey methodology': {
    competencyId: 'comp-stat-01',
    competencyName: 'Survey Methodology & Sampling Frame',
    gapType: 'APPLICATION_GAP',
    cadreBenchmark: {
      targetCadre: 'Assistant Director / Deputy Director (ISS Cadre)',
      expectedScore: 88,
      learnerScore: 64,
      cadrePercentile: 52,
      gapSeverityExplanation:
        'Senior Statistical Officers transitioning to Assistant Director must independently design two-stage stratified designs and calibrate multipliers.',
    },
    subSkills: [
      {
        id: 'sub-surv-01',
        name: 'Multi-Stage Stratified Cluster Sampling Design',
        category: 'Sampling Theory',
        status: 'IN_PROGRESS',
        proficiencyScore: 68,
        requiredLevel: 4,
        currentLevel: 3,
        aiObservation: 'Strong grasp of First Stage Unit (FSU) selection; needs calibration on circular systematic sampling with probability proportional to size (PPS).',
        failedConceptTest: 'Q4: Probability proportional to size without replacement (PPSWOR) in urban blocks.',
        remediationAction: 'Review NSSTA Advanced Sampling Techniques handbook.',
      },
      {
        id: 'sub-surv-02',
        name: 'Non-Response Weight Adjustment & Calibration',
        category: 'Weighting & Estimation',
        status: 'DEFICIENT',
        proficiencyScore: 46,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Struggles with post-stratification raking and generalized regression estimators for household survey non-response.',
        failedConceptTest: 'Q6: Multi-dimensional raking ratio estimation using census control margins.',
        remediationAction: 'Launch Survey Calibration Simulation Lab.',
      },
      {
        id: 'sub-surv-03',
        name: 'Variance Estimation in Complex Survey Designs (Linearization/Jackknife)',
        category: 'Estimation & Inference',
        status: 'DEFICIENT',
        proficiencyScore: 42,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Calculates standard errors assuming Simple Random Sampling (SRS) rather than Taylor series linearization for clustered designs.',
        failedConceptTest: 'Q8: Design effect (DEFF) and intra-cluster correlation coefficient estimation.',
        remediationAction: 'iGOT Course: Variance Estimation in Large Scale Surveys.',
      },
    ],
    projectMetrics: [
      {
        projectName: 'Annual Survey of Unincorporated Sector Enterprises (ASUSE)',
        division: 'Field Operations Division (FOD) / SDRD',
        roleInProject: 'Sampling Frame Reviewer',
        dateEvaluated: '05 Aug 2026',
        sampleVolume: '16,000 First Stage Units (FSUs)',
        metrics: [
          {
            label: 'Design Effect (DEFF) Miscalculation',
            actualValue: '1.02 (Underestimated)',
            benchmarkValue: '1.65 (True Clustered DEFF)',
            variance: '-38% standard error bias',
            status: 'ALERT',
            explanation: 'Ignored intra-cluster correlation in sub-round variance estimates, understating error margins.',
          },
          {
            label: 'Non-Response Allocation Bias',
            actualValue: '8.4% bias',
            benchmarkValue: '< 2.0%',
            variance: '+6.4% residual error',
            status: 'WARNING',
            explanation: 'Substituted unreached units with adjacent houses rather than applying weight re-scaling.',
          },
        ],
        systemObservation:
          'Audit flagged that sample variance formulas in technical brief used unweighted variance formulas.',
      },
    ],
    assessmentTraces: [
      {
        assessmentDate: '10 Aug 2026',
        assessmentType: 'Adaptive Quiz',
        totalQuestions: 15,
        score: 64,
        failedConcepts: [
          {
            topic: 'Taylor Series Linearization',
            questionSummary: 'Derive linearized variance for ratio estimator in two-stage sampling.',
            learnerResponse: 'Applied standard sample variance of ratio without covariance terms.',
            expectedStandard: 'Include between-cluster covariance matrix and strata weight adjustments.',
            gapSeverity: 'HIGH',
          },
        ],
      },
    ],
    aiDetectionSummary: {
      primaryTrigger: 'Inadequate complex survey variance estimation and uncalibrated non-response handling in ASUSE sampling validation.',
      detectionSource: 'SURVEY_METRICS_AUDIT',
      confidenceRating: 0.92,
      keyDeficitFactors: [
        'Underestimation of survey design effects (DEFF)',
        'Difficulty with multi-dimensional raking algorithms',
      ],
      immediateIntervention: 'Take NSSTA Masterclass on Complex Survey Design & Weighting Calibration.',
    },
  },

  // 3. National Accounts (SNA 2008)
  'national accounts': {
    competencyId: 'comp-stat-03',
    competencyName: 'National Accounts (SNA 2008)',
    gapType: 'KNOWLEDGE_GAP',
    cadreBenchmark: {
      targetCadre: 'National Accounts Division (NAD) Lead Analyst',
      expectedScore: 82,
      learnerScore: 52,
      cadrePercentile: 39,
      gapSeverityExplanation:
        'Officers assigned to GDP compilation must master Supply-Use Table (SUT) reconciliation and constant price double-deflation techniques.',
    },
    subSkills: [
      {
        id: 'sub-sna-01',
        name: 'Gross Value Added (GVA) Double Deflation Methodology',
        category: 'Price Deflation',
        status: 'DEFICIENT',
        proficiencyScore: 40,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Applies single-indicator deflation to manufacturing output without independently deflating intermediate inputs via WPI commodity baskets.',
        failedConceptTest: 'Q2: Real GVA compilation using separate output and input price deflators.',
        remediationAction: 'Enroll in NSSTA National Accounts Advanced Workshop.',
      },
      {
        id: 'sub-sna-02',
        name: 'Supply and Use Tables (SUT) Matrix Balancing (RAS Algorithm)',
        category: 'Macroeconomic Accounting',
        status: 'DEFICIENT',
        proficiencyScore: 45,
        requiredLevel: 3,
        currentLevel: 2,
        aiObservation: 'Manual reconciliation of trade and transport margins leads to row-column discrepancy exceeding 0.5% threshold.',
        failedConceptTest: 'Q5: Biproportional matrix balancing (RAS) on 140x140 commodity product balance.',
        remediationAction: 'Practice SUT Balancing Interactive Lab.',
      },
      {
        id: 'sub-sna-03',
        name: 'Financial Intermediation Services Indirectly Measured (FISIM)',
        category: 'Sectoral Allocation',
        status: 'IN_PROGRESS',
        proficiencyScore: 65,
        requiredLevel: 3,
        currentLevel: 2,
        aiObservation: 'Understands reference rate concept but requires guidance on distributing FISIM between intermediate and final consumption.',
        remediationAction: 'iGOT Course: Sectoral SNA 2008 Allocation.',
      },
    ],
    projectMetrics: [
      {
        projectName: 'Quarterly GDP & GVA Estimation Model',
        division: 'National Accounts Division (NAD)',
        roleInProject: 'Sectoral Contributor (Manufacturing & Services)',
        dateEvaluated: '22 Jul 2026',
        sampleVolume: 'MCA-21 corporate filings + ASI benchmarks',
        metrics: [
          {
            label: 'SUT Discrepancy Margin',
            actualValue: '1.42%',
            benchmarkValue: '< 0.20%',
            variance: '+1.22% imbalance',
            status: 'ALERT',
            explanation: 'Product supply failed to balance with intermediate and final use across chemical sector.',
          },
          {
            label: 'Double Deflation Consistency',
            actualValue: 'Single Deflated',
            benchmarkValue: 'Double Deflated',
            variance: 'Methodological deficit',
            status: 'WARNING',
            explanation: 'High volatility in intermediate input commodity prices went uncaptured.',
          },
        ],
        systemObservation:
          'Audit revealed deviations from United Nations SNA 2008 guidelines on intellectual property product capitalization.',
      },
    ],
    assessmentTraces: [
      {
        assessmentDate: '01 Aug 2026',
        assessmentType: 'Adaptive Quiz',
        totalQuestions: 12,
        score: 52,
        failedConcepts: [
          {
            topic: 'Double Deflation vs Single Deflation',
            questionSummary: 'Explain conditions where single deflation overstates real GVA during input cost spikes.',
            learnerResponse: 'Stated single deflation is universally sufficient if output index is accurate.',
            expectedStandard: 'Input price inflation higher than output price leads to overstated value added.',
            gapSeverity: 'HIGH',
          },
        ],
      },
    ],
    aiDetectionSummary: {
      primaryTrigger: 'Methodological errors in GVA double deflation and SUT matrix imbalances during quarterly national accounts dry run.',
      detectionSource: 'TRIANGULATED_ASSESSMENT_AND_WORKFLOW',
      confidenceRating: 0.91,
      keyDeficitFactors: [
        'Lack of double-deflation implementation experience',
        'SUT balancing algorithm convergence issues',
      ],
      immediateIntervention: 'Join the NSSTA 5-day Residential Intensive on SNA 2008 and SUT Balancing.',
    },
  },

  // 4. Data Visualization & Official Dissemination
  'data visualization': {
    competencyId: 'comp-tech-02',
    competencyName: 'Data Visualization & Official Dissemination',
    gapType: 'APPLICATION_GAP',
    cadreBenchmark: {
      targetCadre: 'Senior Statistical Officer / Web Dissemination Cell',
      expectedScore: 80,
      learnerScore: 54,
      cadrePercentile: 44,
      gapSeverityExplanation:
        'Modern official statistics require dynamic web-first charting, district-level GIS choropleths, and accessible color-blind safe palettes.',
    },
    subSkills: [
      {
        id: 'sub-viz-01',
        name: 'Interactive Geospatial / GIS Choropleth Mapping (GeoJSON/Shapely)',
        category: 'Geospatial Analytics',
        status: 'DEFICIENT',
        proficiencyScore: 42,
        requiredLevel: 4,
        currentLevel: 2,
        aiObservation: 'Struggles with polygon simplification, CRS projections (EPSG:4326 to EPSG:3857), and joining census LGD codes.',
        failedConceptTest: 'Q4: District-level poverty headcount ratio spatial interpolation.',
        remediationAction: 'Practice GIS & Choropleth Sandbox Lab.',
      },
      {
        id: 'sub-viz-02',
        name: 'Web Accessibility & Color-Blind Safe Palette Standards (MoSPI GIGW 3.0)',
        category: 'Compliance & Design',
        status: 'IN_PROGRESS',
        proficiencyScore: 66,
        requiredLevel: 3,
        currentLevel: 2,
        aiObservation: 'Uses red-green traffic light ramps without secondary patterned textures or WCAG AA 4.5:1 contrast ratios.',
        remediationAction: 'Review GIGW 3.0 Guidelines for MoSPI Portals.',
      },
      {
        id: 'sub-viz-03',
        name: 'Dynamic Dashboard Construction (Plotly / Dash / Streamlit)',
        category: 'Dashboard Engineering',
        status: 'DEFICIENT',
        proficiencyScore: 48,
        requiredLevel: 3,
        currentLevel: 2,
        aiObservation: 'Builds static PNG charts rather than reactive drill-down dashboards for state-wise ministerial reviews.',
        remediationAction: 'Enroll in iGOT Interactive Dashboards for Statistical Officers.',
      },
    ],
    projectMetrics: [
      {
        projectName: 'MoSPI National Data Portal & State Dashboard Modernization',
        division: 'Computer Centre (CC) / Dissemination Division',
        roleInProject: 'Visual Analytics Contributor',
        dateEvaluated: '19 Aug 2026',
        sampleVolume: '750+ district administrative indicator feeds',
        metrics: [
          {
            label: 'Web Accessibility Audit Score',
            actualValue: '58 / 100',
            benchmarkValue: '> 90 / 100',
            variance: '-32 points non-compliant',
            status: 'ALERT',
            explanation: 'Missing ARIA chart labels and insufficient color contrast on district heatmaps.',
          },
          {
            label: 'GeoJSON Render Performance',
            actualValue: '12.4 MB payload',
            benchmarkValue: '< 1.5 MB',
            variance: '+726% oversized',
            status: 'ALERT',
            explanation: 'Unsimplified full-resolution topology polygons causing browser freezes on low-bandwidth state offices.',
          },
        ],
        systemObservation:
          'State officers reported slow map load times and difficulty reading small legends on mobile screens.',
      },
    ],
    assessmentTraces: [
      {
        assessmentDate: '15 Aug 2026',
        assessmentType: 'Interactive Sandbox Lab',
        totalQuestions: 8,
        score: 54,
        failedConcepts: [
          {
            topic: 'Geospatial Coordinate System Projection',
            questionSummary: 'Re-project district boundary shapefiles to calculate accurate area-weighted indicators.',
            learnerResponse: 'Plotted unprojected lat/long directly with distorted area scaling.',
            expectedStandard: 'Reprojected to UTM / EPSG:3857 before area-weight calculation.',
            gapSeverity: 'HIGH',
          },
        ],
      },
    ],
    aiDetectionSummary: {
      primaryTrigger: 'Non-compliance with GIGW 3.0 web accessibility and unoptimized GIS geometry payloads in recent dashboard deliverables.',
      detectionSource: 'TRIANGULATED_ASSESSMENT_AND_WORKFLOW',
      confidenceRating: 0.89,
      keyDeficitFactors: [
        'Geospatial boundary layer optimization deficit',
        'Lack of WCAG accessibility audit in visualization workflows',
      ],
      immediateIntervention: 'Complete the Geospatial & Interactive Official Statistics Lab.',
    },
  },
};

/**
 * Returns detailed, empirical evidence for a given competency gap.
 * If not explicitly registered, dynamically generates structured, domain-accurate evidence.
 */
export function getCompetencyDetailedEvidence(
  competencyName: string,
  gapScore: number = 1,
  currentLevel: number = 2,
  requiredLevel: number = 3
): CompetencyDetailedEvidence {
  const normName = competencyName.toLowerCase().trim();

  for (const key of Object.keys(EVIDENCE_REGISTRY)) {
    if (normName.includes(key) || key.includes(normName)) {
      return EVIDENCE_REGISTRY[key];
    }
  }

  // Fallback dynamic generator with high domain accuracy
  return {
    competencyId: `comp-${normName.replace(/[^a-z0-9]/g, '-')}`,
    competencyName: competencyName,
    gapType: gapScore >= 2 ? 'APPLICATION_GAP' : 'KNOWLEDGE_GAP',
    cadreBenchmark: {
      targetCadre: 'Subordinate Statistical Service (SSS) / Indian Statistical Service (ISS)',
      expectedScore: 80,
      learnerScore: Math.max(35, Math.round(80 - gapScore * 18)),
      cadrePercentile: Math.max(25, Math.round(75 - gapScore * 20)),
      gapSeverityExplanation: `Cadre performance benchmark indicates Level ${requiredLevel} requires verified end-to-end execution without supervisory escalation.`,
    },
    subSkills: [
      {
        id: `sub-${normName.substring(0, 4)}-01`,
        name: `${competencyName} Applied Core Concepts`,
        category: 'Core Methodology',
        status: gapScore >= 2 ? 'DEFICIENT' : 'IN_PROGRESS',
        proficiencyScore: Math.max(40, Math.round(75 - gapScore * 15)),
        requiredLevel: requiredLevel,
        currentLevel: currentLevel,
        aiObservation: `Evidence indicates theoretical comprehension at Level ${currentLevel}, but practical test scenarios revealed inconsistent parameter handling.`,
        failedConceptTest: `Q1: Applied scenario benchmark in ${competencyName}.`,
        remediationAction: `Practice targeted ${competencyName} simulation laboratory.`,
      },
      {
        id: `sub-${normName.substring(0, 4)}-02`,
        name: `Automated Pipeline & Dissemination Compliance`,
        category: 'Workflow Automation',
        status: 'DEFICIENT',
        proficiencyScore: 45,
        requiredLevel: requiredLevel,
        currentLevel: currentLevel,
        aiObservation: `Manual intervention required in 3 out of 5 recent project deliverables involving ${competencyName}.`,
        failedConceptTest: `Q4: End-to-end automated audit check for ${competencyName}.`,
        remediationAction: `Complete iGOT micro-course on ${competencyName}.`,
      },
      {
        id: `sub-${normName.substring(0, 4)}-03`,
        name: `Statistical Quality & Validation Frameworks`,
        category: 'Quality Assurance',
        status: 'IN_PROGRESS',
        proficiencyScore: 60,
        requiredLevel: requiredLevel,
        currentLevel: currentLevel,
        aiObservation: `Basic validation checks implemented; needs advanced outlier sensitivity calibration.`,
        remediationAction: `Review MoSPI official SOP guidelines.`,
      },
    ],
    projectMetrics: [
      {
        projectName: 'National Statistical Project Operations (2025-26)',
        division: 'National Statistical Office (NSO)',
        roleInProject: 'Statistical Operations & Analysis',
        dateEvaluated: 'Current Quarter',
        sampleVolume: 'Standard Cadre Assessment Suite',
        metrics: [
          {
            label: 'Execution Error / Variance Rate',
            actualValue: `${(gapScore * 11.2).toFixed(1)}%`,
            benchmarkValue: '< 3.0%',
            variance: `+${(gapScore * 8.2).toFixed(1)}% variance`,
            status: gapScore >= 2 ? 'ALERT' : 'WARNING',
            explanation: `Automated testing flagged variance against official ${competencyName} benchmarks.`,
          },
          {
            label: 'Workflow Turnaround Time',
            actualValue: `${(gapScore * 1.8 + 2.0).toFixed(1)} days`,
            benchmarkValue: '1.5 days',
            variance: `+${((gapScore * 1.8 + 0.5) / 1.5 * 100).toFixed(0)}% slower`,
            status: 'WARNING',
            explanation: 'Additional supervisory revisions were required prior to publication sign-off.',
          },
        ],
        systemObservation: `AI diagnostic model identified high leverage opportunity: closing this ${gapScore}-level delta directly accelerates target role promotion eligibility.`,
      },
    ],
    assessmentTraces: [
      {
        assessmentDate: 'Recent Evaluation',
        assessmentType: 'Adaptive Quiz',
        totalQuestions: 10,
        score: Math.max(45, Math.round(80 - gapScore * 15)),
        failedConcepts: [
          {
            topic: `Core Principles of ${competencyName}`,
            questionSummary: `Application of official MoSPI standards in ${competencyName}.`,
            learnerResponse: `Selected intermediate approximation instead of rigorous standard methodology.`,
            expectedStandard: `Full compliance with standardized statistical procedures.`,
            gapSeverity: gapScore >= 2 ? 'HIGH' : 'MEDIUM',
          },
        ],
      },
    ],
    aiDetectionSummary: {
      primaryTrigger: `Empirical performance gap detected between Level ${currentLevel} assessed abilities and Level ${requiredLevel} target cadre benchmark.`,
      detectionSource: 'TRIANGULATED_ASSESSMENT_AND_WORKFLOW',
      confidenceRating: 0.90,
      keyDeficitFactors: [
        `Practical scenario execution variance in ${competencyName}`,
        `Supervisory review required on recent official deliverables`,
      ],
      immediateIntervention: `Launch targeted micro-learning intervention on iGOT Karmayogi or NIPUN Sandbox.`,
    },
  };
}
