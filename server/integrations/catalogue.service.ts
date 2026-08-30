import type { LearningCatalogueItem, LearningSource, UnifiedRecommendation, LearningPath, LearningPathItem, CompetencyLevel } from '../../src/types.ts';
import { MOCK_IGOT_COURSES } from './igot/igot.mock.ts';
import { MOCK_NSSTA_PROGRAMMES } from './nssta/nssta.mock.ts';
import { igotAdapter } from './igot/igot.client.ts';
import { nsstaAdapter } from './nssta/nssta.client.ts';
import { tpacAdapter } from './tpac/tpac.client.ts';

export const UNIFIED_CATALOGUE_DATASET: LearningCatalogueItem[] = [
  // ==========================================
  // SOURCE 1: iGOT Karmayogi
  // ==========================================
  {
    id: 'cat-igot-py-101',
    title: 'Python for Official Statistical Analysis & Data Processing',
    source: 'iGOT Karmayogi',
    competency: 'Python',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '2h 30m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Basic Python syntax and spreadsheet data manipulation',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Comprehensive digital course on modern Python workflows in official statistics. Covers Pandas vector manipulation, NumPy arrays, survey microdata aggregation, and automated error imputation.',
    learningObjectives: [
      'Master Pandas DataFrame operations for multi-stage survey microdata',
      'Implement deterministic and donor-based imputation techniques',
      'Calculate weighted statistical aggregates across stratified survey rounds',
      'Automate monthly statistical table generation according to MoSPI standards',
    ],
    relevanceToGap: 'Targets identified Python application gap by elevating skills from foundational syntax (L2) to survey analysis pipelines (L3/L4).',
    expectedImprovement: 'Elevates Python Competency from Level 2 to Level 3 / Level 4 operational mastery.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 1420,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Python+Statistical+Analysis',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-py-002',
    title: 'Fundamentals of Python Scripting for Civil Servants',
    source: 'iGOT Karmayogi',
    competency: 'Python',
    competencyLevel: 2,
    domain: 'Technical Competencies',
    difficulty: 'Beginner',
    duration: '1h 45m',
    durationCategory: 'SHORT',
    prerequisites: 'Basic computer literacy and spreadsheet familiarity',
    targetRole: 'Junior Statistical Officer',
    description: 'Entry-level practical orientation to computational thinking and Python scripting for government administrative workflows and statistical automation.',
    learningObjectives: [
      'Understand core Python data types, lists, dictionaries, and loops',
      'Automate routine CSV and Excel report parsing',
      'Write reusable utility functions for administrative file handling',
    ],
    relevanceToGap: 'Prerequisite foundation for officers starting or consolidating basic scripting skills.',
    expectedImprovement: 'Establishes Level 2 syntax and procedural scripting baseline.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.6,
    enrolledCount: 3840,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Python+Civil+Services',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-aiml-101',
    title: 'Introduction to Artificial Intelligence in Public Governance',
    source: 'iGOT Karmayogi',
    competency: 'AI / ML',
    competencyLevel: 2,
    domain: 'Technical Competencies',
    difficulty: 'Beginner',
    duration: '2h 15m',
    durationCategory: 'MEDIUM',
    prerequisites: 'General awareness of digital e-governance systems',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Foundational framework on responsible AI adoption, predictive modeling concepts, and LLM applications in public sector governance and statistical validation.',
    learningObjectives: [
      'Understand principles of machine learning classification and regression in governance',
      'Identify potential use-cases for automated anomaly detection in large statistical surveys',
      'Evaluate ethical AI, algorithmic bias, and privacy-preserving statistical disclosures',
    ],
    relevanceToGap: 'Bridges emerging technology gap for AI/ML adoption in official statistical releases.',
    expectedImprovement: 'Elevates AI/ML Competency from Level 1 to Level 2 conceptual readiness.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.5,
    enrolledCount: 4200,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Artificial+Intelligence+Governance',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-vis-201',
    title: 'Data Visualization & Dashboarding for Government Statistics',
    source: 'iGOT Karmayogi',
    competency: 'Data Visualization',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '3h 15m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Basic understanding of statistical charts and summary tables',
    targetRole: 'Assistant Director (Statistics)',
    description: 'Best practices for visual statistical dissemination. Covers interactive dashboarding, color-safe thematic choropleth maps, and official bulletin formatting.',
    learningObjectives: [
      'Design publication-ready charts using Matplotlib, Seaborn, and PowerBI',
      'Construct district-level choropleth thematic maps for NSSO indicators',
      'Build executive summary dashboards for ministry decision-makers',
    ],
    relevanceToGap: 'Directly addresses Data Visualization gap for official report publication.',
    expectedImprovement: 'Elevates Data Visualization Competency to Level 3 / Level 4 standard.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 2150,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Data+Visualization+Statistics',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-igot-surv-des-101',
    title: 'Questionnaire Design, Pilot Testing & Cognitive Interviewing',
    source: 'iGOT Karmayogi',
    competency: 'Survey Design',
    competencyLevel: 4,
    domain: 'Statistical Methodology',
    difficulty: 'Advanced',
    duration: '3h 00m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Foundational survey methodology',
    targetRole: 'Senior Statistical Officer',
    description: 'Guidelines on constructing unambiguous questionnaire items, skip pattern logic, and pre-testing protocols for socio-economic survey rounds.',
    learningObjectives: [
      'Structure bilingual survey instruments adhering to national definitions',
      'Conduct cognitive walkthroughs to minimize non-sampling response bias',
      'Calibrate CAPI instrument flow rules for field investigators',
    ],
    relevanceToGap: 'Directly addresses Level 4 Survey Design requirements for national rounds.',
    expectedImprovement: 'Elevates Survey Design Competency to Level 4 benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 1600,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Questionnaire+Survey+Design',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-samp-101',
    title: 'Probability Sampling, Stratification & Frame Optimization',
    source: 'iGOT Karmayogi',
    competency: 'Sampling Methodology',
    competencyLevel: 4,
    domain: 'Statistical Methodology',
    difficulty: 'Advanced',
    duration: '3h 45m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Basic probability and sample survey theory',
    targetRole: 'Senior Statistical Officer',
    description: 'In-depth modules on stratified two-stage sampling, cluster allocation, circular systematic sampling, and sample multiplier calculation.',
    learningObjectives: [
      'Calculate optimal sample allocation across rural and urban strata',
      'Derive second-stage multipliers with household substitution controls',
      'Evaluate design effects (DEFF) on socio-economic estimates',
    ],
    relevanceToGap: 'Bridges theoretical sampling to production survey execution.',
    expectedImprovement: 'Elevates Sampling Methodology to Level 4 competency benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 1850,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Sampling+Methodology',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-sql-101',
    title: 'Relational Database Management & SQL for Statistical Warehouses',
    source: 'iGOT Karmayogi',
    competency: 'SQL & Database Querying',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '2h 45m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Basic table querying and relational concepts',
    targetRole: 'Senior Statistical Officer',
    description: 'Comprehensive SQL query structuring for statistical databases. Covers complex joins, aggregations, window functions, and indexing.',
    learningObjectives: [
      'Write multi-table relational joins across national survey rounds',
      'Utilize analytical window functions (PARTITION BY, ROW_NUMBER)',
      'Optimize query execution plans on multi-million row Census tables',
    ],
    relevanceToGap: 'Closes operational SQL application gap for microdata extraction.',
    expectedImprovement: 'Elevates SQL & Database Querying Competency to Level 3 standard.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.7,
    enrolledCount: 2900,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=SQL+Database+Statistics',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-igot-gis-101',
    title: 'Geospatial Data Processing & QGIS for Cadastral Boundary Analysis',
    source: 'iGOT Karmayogi',
    competency: 'GIS & Spatial Analytics',
    competencyLevel: 2,
    domain: 'Technical Competencies',
    difficulty: 'Beginner',
    duration: '2h 10m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Familiarity with spatial coordinates and maps',
    targetRole: 'Senior Statistical Officer',
    description: 'Foundations of GIS in official statistics. Covers shapefiles, geo-referencing enumeration blocks, and thematic map composition.',
    learningObjectives: [
      'Load, clean, and project vector shapefiles in open-source QGIS',
      'Overlay survey enumeration blocks on Census boundary layers',
      'Generate spatial cluster maps for field survey monitoring',
    ],
    relevanceToGap: 'Bridges spatial analysis deficit for modern geo-statistical releases.',
    expectedImprovement: 'Elevates GIS & Spatial Analytics Competency to Level 2 baseline.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.6,
    enrolledCount: 1400,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=GIS+Spatial+Analytics',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },
  {
    id: 'cat-igot-pm-101',
    title: 'Project Management & Field Operations Supervision for Survey Heads',
    source: 'iGOT Karmayogi',
    competency: 'Project Management & Team Leadership',
    competencyLevel: 4,
    domain: 'Behavioural & Managerial Competencies',
    difficulty: 'Advanced',
    duration: '3h 30m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Experience in field team coordination',
    targetRole: 'Senior Statistical Officer',
    description: 'Advanced project management frameworks, timeline milestones, risk management, and field team leadership for nationwide statistical surveys.',
    learningObjectives: [
      'Construct Gantt charts and critical path milestones for survey rounds',
      'Manage multi-state field inspection rosters and budget allocations',
      'Lead cross-functional technical teams with proactive problem-solving',
    ],
    relevanceToGap: 'Essential for leading regional survey divisions and supervision.',
    expectedImprovement: 'Elevates Project Management & Team Leadership to Level 4 benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 2200,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Project+Management+Leadership',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-igot-sur-301',
    title: 'Socio-Economic Survey Design & Quality Audit Protocols',
    source: 'iGOT Karmayogi',
    competency: 'Survey Methodology',
    competencyLevel: 4,
    domain: 'Statistical Methodology',
    difficulty: 'Advanced',
    duration: '4h 00m',
    durationCategory: 'MEDIUM',
    prerequisites: 'Knowledge of sampling theory and NSSO survey schedules',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Rigorous course on nationwide socio-economic survey design, master sampling frame maintenance, non-sampling error reduction, and CAPI validation rules.',
    learningObjectives: [
      'Formulate multi-stage stratified sampling designs with probability proportional to size (PPS)',
      'Establish field audit inspection workflows and logical consistency check scripts',
      'Calculate sampling variance and design effects for official indicators',
    ],
    relevanceToGap: 'Addresses advanced Survey Methodology gap for leading large-scale surveys like PLFS/ASI.',
    expectedImprovement: 'Elevates Survey Methodology Competency to Level 4 benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.7,
    enrolledCount: 980,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Survey+Design+Methodology',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-igot-sec-101',
    title: 'Cybersecurity, DPDP Act & Data Privacy for Statistical Databases',
    source: 'iGOT Karmayogi',
    competency: 'Cybersecurity',
    competencyLevel: 3,
    domain: 'Digital Governance & Compliance',
    difficulty: 'Intermediate',
    duration: '1h 30m',
    durationCategory: 'SHORT',
    prerequisites: 'General awareness of IT systems and data management',
    targetRole: 'All Cadre Officers',
    description: 'Mandatory compliance course on the Digital Personal Data Protection (DPDP) Act 2023, Statistical Disclosure Control (SDC), and microdata anonymization.',
    learningObjectives: [
      'Apply k-anonymity and l-diversity algorithms to released microdata sets',
      'Understand statutory obligations of data fiduciaries under DPDP Act 2023',
      'Prevent re-identification risks in spatial and longitudinal socio-economic datasets',
    ],
    relevanceToGap: 'Crucial for microdata dissemination protocols and legal compliance.',
    expectedImprovement: 'Verifies Level 3 compliance in data privacy and cybersecurity protocols.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.6,
    enrolledCount: 5120,
    url: 'https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=Cybersecurity+Data+Privacy+DPDP',
    mode: 'Online Self-Paced (iGOT)',
    phase: 'FOUNDATION',
  },

  // ==========================================
  // SOURCE 2: NSSTA / TPAC
  // ==========================================
  {
    id: 'cat-nssta-prog-301',
    title: 'Advanced Statistical Computing, Big Data Analytics & Python in Official Statistics',
    source: 'NSSTA / TPAC',
    competency: 'Python',
    competencyLevel: 4,
    domain: 'Technical Competencies',
    difficulty: 'Advanced',
    duration: '3 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Minimum 2 years experience in statistical data processing or Level 2 Python certified',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Premier residential training programme at National Statistical Systems Training Academy (NSSTA), Greater Noida. Focuses on advanced statistical modeling, survey microdata pipelines, and high-performance computing in official statistics.',
    learningObjectives: [
      'Implement multi-core parallel survey weighting and imputation algorithms in Python',
      'Build end-to-end automated pipelines for PLFS and ASI statistical microdata',
      'Perform complex econometric modeling and variance estimation',
      'Collaborate with peers on real ministry dataset challenge sprints',
    ],
    relevanceToGap: 'Directly addresses practical application gap in Python and survey microdata processing as mandated by TPAC for ISS / SSS cadre advancement.',
    expectedImprovement: 'Elevates Python Competency to Level 4 Master practitioner level with institutional certification.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 420,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-prog-401',
    title: 'Executive Workshop on AI/ML Applications and Automated Data Validation in Governance',
    source: 'NSSTA / TPAC',
    competency: 'AI / ML',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '2 Days (Workshop)',
    durationCategory: 'LONG',
    prerequisites: 'Familiarity with statistical computing and official data repositories',
    targetRole: 'Deputy Director (Statistics)',
    description: 'TPAC-recommended intensive executive workshop covering machine learning pipelines for automated anomaly detection, NLP for survey classification, and generative AI in administrative reporting.',
    learningObjectives: [
      'Deploy supervised machine learning classifiers for automatic industry / occupation coding (NIC / NCO)',
      'Apply unsupervised clustering algorithms to detect fraudulent or outlier survey returns',
      'Formulate department-level AI governance roadmaps aligned with National Data Governance Framework',
    ],
    relevanceToGap: 'Essential TPAC priority for leadership roles managing modernized statistical data divisions.',
    expectedImprovement: 'Elevates AI/ML Competency to Level 3 applied operational proficiency.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 310,
    mode: 'Hybrid (NSSTA Campus + Virtual Syndicate)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-prog-102',
    title: 'Modern Survey Sampling Techniques, Frame Construction & Estimation Procedures',
    source: 'NSSTA / TPAC',
    competency: 'Survey Methodology',
    competencyLevel: 4,
    domain: 'Statistical Methodology',
    difficulty: 'Advanced',
    duration: '5 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Serving SSS / ISS officers involved in NSSO, PLFS, or ASI survey divisions',
    targetRole: 'Senior Statistical Officer',
    description: 'Hands-on institutional programme on probability sampling, dual-frame surveys, non-response adjustments, and small area estimation techniques.',
    learningObjectives: [
      'Master unequal probability sampling and Horvitz-Thompson estimators',
      'Construct and calibrate sample weights using auxiliary Census / administrative datasets',
      'Compute design-based confidence intervals and coefficient of variation (CV) thresholds',
    ],
    relevanceToGap: 'Recommended by TPAC to strengthen probability sampling and complex weight estimations.',
    expectedImprovement: 'Elevates Survey Methodology to Level 4 cadre benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 650,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-prog-204',
    title: 'National Accounts Statistics: Supply-Use Tables & Quarterly GDP Compilation',
    source: 'NSSTA / TPAC',
    competency: 'National Accounts',
    competencyLevel: 4,
    domain: 'Official Statistics',
    difficulty: 'Advanced',
    duration: '4 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Officers handling state domestic product (GSDP) or National Accounts aggregates',
    targetRole: 'Assistant Director (Statistics)',
    description: 'Specialized training on System of National Accounts (SNA 2008), gross value added (GVA) estimation, double deflation methods, and inter-industry linkages.',
    learningObjectives: [
      'Construct and balance Supply and Use Tables (SUT) for benchmark years',
      'Apply sequential deflation algorithms for quarterly GDP volume estimates',
      'Harmonize enterprise corporate filings (MCA-21) with national accounts aggregates',
    ],
    relevanceToGap: 'Core institutional immersion for officers stepping into National Accounts Division roles.',
    expectedImprovement: 'Elevates National Accounts Competency to Level 4 expert standard.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 280,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-vis-301',
    title: 'Visual Statistical Communication & Executive Dashboard Design',
    source: 'NSSTA / TPAC',
    competency: 'Data Visualization',
    competencyLevel: 4,
    domain: 'Technical Competencies',
    difficulty: 'Advanced',
    duration: '3 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Experience with statistical report compilation',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Residential workshop on high-impact visualization, MoSPI publication palettes, interactive infographics, and data dissemination platforms.',
    learningObjectives: [
      'Construct automated interactive dashboards for ministry leadership',
      'Design publication-grade thematic choropleths with Census boundary polygons',
      'Implement accessible and WCAG-compliant statistical charts',
    ],
    relevanceToGap: 'Directly addresses Level 4 Data Visualization operational mandate.',
    expectedImprovement: 'Elevates Data Visualization Competency to Level 4 benchmark.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 380,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-sql-301',
    title: 'Advanced Database Engineering & High-Throughput SQL for Survey Warehouses',
    source: 'NSSTA / TPAC',
    competency: 'SQL & Database Querying',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '3 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Basic SQL querying knowledge',
    targetRole: 'Senior Statistical Officer',
    description: 'Hands-on database architecture training at NSSTA labs. Optimize high-volume PLFS and ASI database partitions, design materialized views, and query microdata cubes.',
    learningObjectives: [
      'Configure indexed data warehouses for rapid socio-economic microdata queries',
      'Write optimized nested analytical queries and stored procedures',
      'Implement role-based database security and anonymization triggers',
    ],
    relevanceToGap: 'Bridges practical SQL database gap for official survey dissemination.',
    expectedImprovement: 'Elevates SQL & Database Querying Competency to Level 3 institutional standard.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.7,
    enrolledCount: 310,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-gis-201',
    title: 'Spatial Statistics, Remote Sensing & Geographic Information Systems in Official Statistics',
    source: 'NSSTA / TPAC',
    competency: 'GIS & Spatial Analytics',
    competencyLevel: 2,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '4 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Basic statistical background',
    targetRole: 'Senior Statistical Officer',
    description: 'TPAC-accredited programme linking spatial layers, satellite night-light data, and national sampling frames at NSSTA Greater Noida campus.',
    learningObjectives: [
      'Perform spatial point-pattern analysis and spatial autocorrelation (Moran I)',
      'Integrate GIS vector layers with nationwide survey sample clusters',
      'Publish interactive GIS atlas portals for national statistics',
    ],
    relevanceToGap: 'Addresses institutional GIS spatial analytics capability deficit.',
    expectedImprovement: 'Elevates GIS & Spatial Analytics Competency to Level 2 / Level 3.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 410,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },
  {
    id: 'cat-nssta-pm-401',
    title: 'Leadership Development & Large-Scale Survey Programme Management (TPAC Cadre)',
    source: 'NSSTA / TPAC',
    competency: 'Project Management & Team Leadership',
    competencyLevel: 4,
    domain: 'Behavioural & Managerial Competencies',
    difficulty: 'Advanced',
    duration: '5 Days (Residential)',
    durationCategory: 'LONG',
    prerequisites: 'Senior Statistical Officers and Assistant Directors',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Premier executive leadership module for senior statistical administrators. Covers crisis management in field operations, budget execution, and cross-cadre coordination.',
    learningObjectives: [
      'Deploy agile monitoring systems for nationwide multi-phase surveys',
      'Resolve field bottlenecks, resource constraints, and enumerator attrition',
      'Deliver executive briefings with strategic clarity and analytical precision',
    ],
    relevanceToGap: 'Mandatory TPAC pathway for leadership and division head promotion.',
    expectedImprovement: 'Elevates Project Management & Team Leadership to Level 4 Master level.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 520,
    mode: 'In-Person (NSSTA Campus, Greater Noida)',
    tpacAligned: true,
    phase: 'ADVANCED',
  },

  // ==========================================
  // SOURCE 3: NIPUN Practical Learning
  // ==========================================
  {
    id: 'cat-nipun-lab-py-01',
    title: 'Python Statistical Computing Sandbox: Survey Microdata & Weight Calibration',
    source: 'NIPUN Practical Learning',
    competency: 'Python',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '45 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Basic Python syntax & willingness to solve live coding scenarios',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Interactive browser-based sandbox simulation. Practice live Python vector transformations on simulated NSS household survey microdata, detect statistical outliers, and calibrate multistage multiplier weights with instant automated test validation.',
    learningObjectives: [
      'Clean noisy household microdata records in a secure browser environment',
      'Implement outlier rejection using interquartile range (IQR) and Z-score transforms',
      'Write multiplier weighting function: w_i = (N_h / n_h) * (1 / p_ij)',
      'Receive instant deterministic feedback on code accuracy and performance',
    ],
    relevanceToGap: 'Directly targets identified application gap with interactive, hands-on empirical coding exercises.',
    expectedImprovement: 'Transforms theoretical understanding into verified hands-on execution speed.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 1890,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-vis-01',
    title: 'NIPUN Interactive Lab: Statistical Dashboard & Choropleth Studio',
    source: 'NIPUN Practical Learning',
    competency: 'Data Visualization',
    competencyLevel: 4,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '35 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Basic charting concepts',
    targetRole: 'Senior Statistical Officer',
    description: 'Interactive studio to build live responsive data visualizers, multi-dimensional filters, and thematic maps using actual survey aggregate tables.',
    learningObjectives: [
      'Assemble responsive multi-series trend charts for consumer price indices',
      'Configure dynamic cross-filtering between state tables and bar graphs',
      'Export publication-ready vector SVG and PDF graphics',
    ],
    relevanceToGap: 'Provides hands-on interactive tool practice to bridge Data Visualization gap.',
    expectedImprovement: 'Demonstrates practical ability to build production-grade dashboards.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 1250,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-sql-01',
    title: 'NIPUN SQL Lab: Microdata Query Optimization & Window Functions',
    source: 'NIPUN Practical Learning',
    competency: 'SQL & Database Querying',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '30 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Basic SQL syntax',
    targetRole: 'Senior Statistical Officer',
    description: 'Live interactive SQL console executing queries against sample household survey databases. Practice analytical window functions and query optimization.',
    learningObjectives: [
      'Execute multi-stage joins across household and enterprise records',
      'Write rank, dense_rank, and cumulative expenditure window functions',
      'Verify query execution plans under 50ms benchmarks',
    ],
    relevanceToGap: 'Hands-on practical sandbox for SQL microdata aggregation.',
    expectedImprovement: 'Delivers verifiable practical evidence of SQL proficiency.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.7,
    enrolledCount: 1540,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-gis-01',
    title: 'NIPUN GIS Sandbox: Spatial Buffer & Cluster Analysis Studio',
    source: 'NIPUN Practical Learning',
    competency: 'GIS & Spatial Analytics',
    competencyLevel: 2,
    domain: 'Technical Competencies',
    difficulty: 'Beginner',
    duration: '30 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Basic spatial awareness',
    targetRole: 'Senior Statistical Officer',
    description: 'Browser-based spatial sandbox. Compute Euclidean distance buffers around primary sampling units, detect spatial outliers, and verify geo-coordinates.',
    learningObjectives: [
      'Perform spatial join operations between enumeration coordinates and district polygons',
      'Detect anomalous GPS coordinate recordings in field survey data',
      'Generate chloropleth spatial intensity maps',
    ],
    relevanceToGap: 'Practical simulation to close GIS & Spatial Analytics gap.',
    expectedImprovement: 'Delivers hands-on spatial problem solving capability.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.6,
    enrolledCount: 980,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-pm-01',
    title: 'NIPUN Simulation: Field Survey Incident & Resource Allocation Sandbox',
    source: 'NIPUN Practical Learning',
    competency: 'Project Management & Team Leadership',
    competencyLevel: 4,
    domain: 'Behavioural & Managerial Competencies',
    difficulty: 'Advanced',
    duration: '35 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Team management experience',
    targetRole: 'Senior Statistical Officer',
    description: 'Scenario-based management simulation. Resolve multi-district enumerator strikes, budget reallocation during floods, and tight press release schedules.',
    learningObjectives: [
      'Make critical resource reallocation decisions under time pressure',
      'Maintain field inspection quality audit standards during disruptions',
      'Evaluate trade-offs between survey timeliness and sampling variance',
    ],
    relevanceToGap: 'Simulated leadership practice for senior administrative roles.',
    expectedImprovement: 'Certifies practical leadership decision-making capability.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 890,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-aiml-01',
    title: 'NIPUN AI Sandbox: Machine Learning Imputation & Survey Anomaly Lab',
    source: 'NIPUN Practical Learning',
    competency: 'AI / ML',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '40 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Basic knowledge of Python or statistical algorithms',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Hands-on practical laboratory to configure and evaluate k-Nearest Neighbors (k-NN) and Random Forest imputation algorithms against cold-deck missing values in enterprise survey data.',
    learningObjectives: [
      'Compare predictive imputation accuracy against traditional stratum mean imputation',
      'Calculate root mean square error (RMSE) on imputed expenditure indicators',
      'Tune hyperparameters to prevent overfitting on small sample sizes',
    ],
    relevanceToGap: 'Provides practical lab experience required to bridge the AI/ML application deficit.',
    expectedImprovement: 'Delivers verifiable practical evidence of machine learning application.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.7,
    enrolledCount: 1120,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-lab-surv-01',
    title: 'Survey Methodology Simulation: CAPI Quality Rules & Sample Allocation',
    source: 'NIPUN Practical Learning',
    competency: 'Survey Methodology',
    competencyLevel: 3,
    domain: 'Statistical Methodology',
    difficulty: 'Intermediate',
    duration: '35 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Understanding of sample size calculations and survey schedules',
    targetRole: 'Senior Statistical Officer',
    description: 'Interactive simulation of field survey schedules. Configure skip patterns, range validation rules, and Neyman optimal sample allocation across rural/urban strata.',
    learningObjectives: [
      'Formulate logical validation rules to intercept field data entry errors in real-time',
      'Implement Neyman optimal sample size allocation formula for heterogeneous strata',
      'Simulate non-sampling error reduction scenarios',
    ],
    relevanceToGap: 'Bridges the gap between theoretical survey sampling and practical CAPI instrument design.',
    expectedImprovement: 'Demonstrates practical ability to design and validate national survey instruments.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.8,
    enrolledCount: 1450,
    mode: 'Interactive In-Browser Simulation (NIPUN Sandbox)',
    phase: 'APPLICATION',
  },
  {
    id: 'cat-nipun-eval-py-l3',
    title: 'Level 3 Validated Evaluation: Python for Survey Microdata & Imputation',
    source: 'NIPUN Practical Learning',
    competency: 'Python',
    competencyLevel: 3,
    domain: 'Technical Competencies',
    difficulty: 'Intermediate',
    duration: '15 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Completion of Python Foundation coursework or practical lab practice',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Authoritative diagnostic assessment. Evaluates vector transformation, multiplier weight calculations, and missing data imputation under timed conditions.',
    learningObjectives: [
      'Demonstrate deterministic competency mastery under timed evaluation',
      'Generate verifiable score evidence for National Competency Passport',
      'Qualify for Level 3 competency elevation',
    ],
    relevanceToGap: 'The mandatory validation hurdle required to upgrade Python competency from Level 2 to Level 3.',
    expectedImprovement: 'Formally elevates and verifies Python Level 3 in the Competency Passport upon score >= 70%.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 2300,
    mode: 'NIPUN Proctored Assessment Engine',
    phase: 'ASSESSMENT',
  },
  {
    id: 'cat-nipun-eval-py-l4',
    title: 'Level 4 Master Evaluation: Advanced Python for Official Statistics & Complex Pipelines',
    source: 'NIPUN Practical Learning',
    competency: 'Python',
    competencyLevel: 4,
    domain: 'Technical Competencies',
    difficulty: 'Advanced',
    duration: '20 mins',
    durationCategory: 'SHORT',
    prerequisites: 'Level 3 Python certification or equivalent senior data processing experience',
    targetRole: 'Deputy Director (Statistics)',
    description: 'Advanced assessment for senior officers. Tests parallel processing, complex survey variance estimation, statistical disclosure control, and high-throughput data pipelines.',
    learningObjectives: [
      'Validate mastery of multi-stage survey weighting and automated publication scripts',
      'Close remaining competency deficit for senior statistical cadre positions',
      'Achieve 100% role readiness benchmark',
    ],
    relevanceToGap: 'Final assessment hurdle to close the Python gap completely and achieve Level 4 certification.',
    expectedImprovement: 'Certifies Level 4 Master practitioner status with permanent passport evidence.',
    isDemoData: true,
    datasetNotice: 'Development Dataset',
    rating: 4.9,
    enrolledCount: 940,
    mode: 'NIPUN Proctored Assessment Engine',
    phase: 'REASSESSMENT',
  },
];

export class UnifiedCatalogueService {
  /**
   * Search and filter unified learning resources across iGOT, NSSTA, and NIPUN.
   */
  static searchAndFilter(filters?: {
    competency?: string;
    domain?: string;
    role?: string;
    difficulty?: string;
    source?: string;
    duration?: string;
    query?: string;
  }): { items: LearningCatalogueItem[]; total: number; notice: string } {
    let items = [...UNIFIED_CATALOGUE_DATASET];

    if (filters?.source && filters.source !== 'ALL') {
      const s = filters.source.toLowerCase();
      items = items.filter((item) => {
        if (s.includes('igot')) return item.source === 'iGOT Karmayogi';
        if (s.includes('nssta') || s.includes('tpac')) return item.source === 'NSSTA / TPAC';
        if (s.includes('nipun') || s.includes('lab') || s.includes('practical'))
          return item.source === 'NIPUN Practical Learning';
        return item.source.toLowerCase().includes(s);
      });
    }

    if (filters?.competency && filters.competency !== 'ALL') {
      const c = filters.competency.toLowerCase();
      items = items.filter(
        (item) => item.competency.toLowerCase() === c || item.title.toLowerCase().includes(c)
      );
    }

    if (filters?.domain && filters.domain !== 'ALL') {
      const d = filters.domain.toLowerCase();
      items = items.filter((item) => item.domain.toLowerCase().includes(d));
    }

    if (filters?.difficulty && filters.difficulty !== 'ALL') {
      const diff = filters.difficulty.toLowerCase();
      items = items.filter((item) => item.difficulty.toLowerCase() === diff);
    }

    if (filters?.role && filters.role !== 'ALL') {
      const r = filters.role.toLowerCase();
      items = items.filter(
        (item) =>
          item.targetRole.toLowerCase().includes(r) ||
          r.includes(item.targetRole.toLowerCase()) ||
          item.targetRole === 'All Cadre Officers'
      );
    }

    if (filters?.duration && filters.duration !== 'ALL') {
      const dur = filters.duration.toUpperCase();
      if (dur === 'SHORT') {
        items = items.filter((i) => i.durationCategory === 'SHORT' || i.duration.includes('min') || i.duration.includes('1h'));
      } else if (dur === 'MEDIUM') {
        items = items.filter((i) => i.durationCategory === 'MEDIUM' || i.duration.includes('2h') || i.duration.includes('3h') || i.duration.includes('4h'));
      } else if (dur === 'LONG') {
        items = items.filter((i) => i.durationCategory === 'LONG' || i.duration.includes('Day') || i.duration.includes('Week'));
      }
    }

    if (filters?.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.competency.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.prerequisites.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
      );
    }

    return {
      items,
      total: items.length,
      notice: 'Development Dataset — Demonstration catalogue across iGOT, NSSTA, and NIPUN',
    };
  }

  /**
   * Connects the catalogue directly to the competency gap engine.
   * For every priority gap:
   * Required Level → Current Level → Gap → Matching Resources → Rank Resources → Generate Recommendation
   */
  static generateRankedRecommendationsForGap(
    gap: {
      competencyId: string;
      competencyName: string;
      currentLevel: number;
      requiredLevel: number;
      gapType?: string;
      aiDiagnosis?: string;
      whyRecommended?: string | string[];
    },
    userRole: string = 'Deputy Director (Statistics)'
  ): UnifiedRecommendation {
    const compName = gap.competencyName;
    const gapSize = Math.max(1, gap.requiredLevel - gap.currentLevel);

    // 1. Match resources from all 3 sources
    const matching = UNIFIED_CATALOGUE_DATASET.filter(
      (item) =>
        item.competency.toLowerCase() === compName.toLowerCase() ||
        item.title.toLowerCase().includes(compName.toLowerCase())
    );

    // 2. Rank resources for this gap
    // Knowledge gap prioritizes iGOT foundation + assessment
    // Application gap prioritizes NIPUN Practical Sandbox + NSSTA Residential
    const ranked = [...matching].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prefer resources matching target level
      if (a.competencyLevel === gap.requiredLevel || a.competencyLevel === gap.currentLevel + 1) scoreA += 30;
      if (b.competencyLevel === gap.requiredLevel || b.competencyLevel === gap.currentLevel + 1) scoreB += 30;

      if (gap.gapType === 'APPLICATION_GAP') {
        if (a.source === 'NIPUN Practical Learning') scoreA += 25;
        if (a.source === 'NSSTA / TPAC') scoreA += 20;
        if (b.source === 'NIPUN Practical Learning') scoreB += 25;
        if (b.source === 'NSSTA / TPAC') scoreB += 20;
      } else {
        if (a.source === 'iGOT Karmayogi') scoreA += 25;
        if (b.source === 'iGOT Karmayogi') scoreB += 25;
      }

      return scoreB - scoreA;
    });

    // Extract top options for each source
    const topIgotItem = ranked.find((r) => r.source === 'iGOT Karmayogi') || matching.find((r) => r.source === 'iGOT Karmayogi');
    const topNsstaItem = ranked.find((r) => r.source === 'NSSTA / TPAC') || matching.find((r) => r.source === 'NSSTA / TPAC');
    const topNipunItem = ranked.find((r) => r.source === 'NIPUN Practical Learning' && r.phase === 'APPLICATION') || matching.find((r) => r.source === 'NIPUN Practical Learning');

    const igotOption = topIgotItem
      ? {
          id: topIgotItem.id,
          title: topIgotItem.title,
          provider: 'iGOT Karmayogi / MoSPI Training Cell',
          duration: topIgotItem.duration,
          competency: compName,
          competencyLevel: (topIgotItem.competencyLevel || gap.requiredLevel) as CompetencyLevel,
          category: topIgotItem.domain,
          difficulty: topIgotItem.difficulty,
          relevanceScore: 94,
          recommendationReason: topIgotItem.relevanceToGap,
          rating: topIgotItem.rating || 4.8,
          enrolledCount: topIgotItem.enrolledCount || 1420,
          url: topIgotItem.url,
          isDemoData: true,
        }
      : {
          id: `igot-${gap.competencyId}`,
          title: `${compName} Operational Toolkit for Official Statistics`,
          provider: 'iGOT Karmayogi',
          duration: '2h 30m',
          competency: compName,
          competencyLevel: gap.requiredLevel as CompetencyLevel,
          category: 'Technical Competencies',
          difficulty: 'Intermediate' as const,
          relevanceScore: 90,
          recommendationReason: `Designed to bridge Level ${gap.currentLevel} → Level ${gap.requiredLevel} ${compName} gap.`,
          rating: 4.8,
          enrolledCount: 1200,
          url: `https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=${encodeURIComponent(compName)}`,
          isDemoData: true,
        };

    const nsstaOption = topNsstaItem
      ? {
          id: topNsstaItem.id,
          title: topNsstaItem.title,
          category: 'ISS Refresher Training',
          duration: topNsstaItem.duration,
          mode: topNsstaItem.mode || 'In-Person (NSSTA Campus, Greater Noida)',
          targetCadre: topNsstaItem.targetRole,
          competenciesCovered: [compName],
          upcomingBatchDate: '15-17 Sept 2026',
          eligibility: topNsstaItem.prerequisites,
          tpacAligned: true,
          recommendationReason: topNsstaItem.relevanceToGap,
          isDemoData: true,
          location: 'NSSTA Campus, Greater Noida',
          description: topNsstaItem.description,
          modulesCovered: topNsstaItem.learningObjectives,
        }
      : {
          id: `nssta-${gap.competencyId}`,
          title: `Executive Workshop & Lab on ${compName}`,
          category: 'Demand Based Training',
          duration: '3 Days',
          mode: 'In-Person (NSSTA Campus, Greater Noida)',
          targetCadre: userRole,
          competenciesCovered: [compName],
          upcomingBatchDate: '15-17 Sept 2026',
          eligibility: 'Serving statistical officers',
          tpacAligned: true,
          recommendationReason: `Faculty-led institutional immersion for ${compName}.`,
          isDemoData: true,
        };

    const nipunPracticeOption = topNipunItem
      ? {
          id: topNipunItem.id,
          title: topNipunItem.title,
          duration: topNipunItem.duration,
          scenario: topNipunItem.description,
          description: topNipunItem.relevanceToGap,
          type: 'INTERACTIVE_LAB' as const,
          learningObjectives: topNipunItem.learningObjectives,
          prerequisites: topNipunItem.prerequisites,
        }
      : {
          id: `lab-${gap.competencyId}`,
          title: `${compName} Interactive Survey Lab & Sandbox`,
          duration: '20 mins',
          scenario: 'Simulated household microdata cleaning, outlier identification, and sample weight calibration.',
          description: 'Hands-on browser simulation with instantaneous syntax feedback and data validation.',
          type: 'INTERACTIVE_LAB' as const,
        };

    // Construct clean, compact "Why This Recommendation?" explanation
    const prereq = topIgotItem?.prerequisites || topNipunItem?.prerequisites || `Basic ${compName} fundamentals`;
    const reasonText =
      typeof gap.whyRecommended === 'string'
        ? gap.whyRecommended
        : Array.isArray(gap.whyRecommended)
        ? gap.whyRecommended.join('. ')
        : `Targets identified ${compName} ${gap.gapType ? gap.gapType.replace('_', ' ').toLowerCase() : 'application gap'}.`;

    return {
      id: `rec-${gap.competencyId}`,
      competencyName: compName,
      gapLabel: `Level ${gap.currentLevel} → Level ${gap.requiredLevel} (${gap.gapType ? gap.gapType.replace('_', ' ') : 'GAP'})`,
      currentLevel: gap.currentLevel,
      requiredLevel: gap.requiredLevel,
      gapSize,
      reason: gap.aiDiagnosis || `Identified Level ${gap.currentLevel} → Level ${gap.requiredLevel} deficit in ${compName}.`,
      explanation: {
        skillGap: `${compName} L${gap.currentLevel} → L${gap.requiredLevel}`,
        roleRelevance: `Required for ${userRole}`,
        prerequisite: prereq,
        reason: reasonText,
      },
      igotOption,
      nsstaOption,
      nipunPracticeOption,
      statviaPracticeOption: nipunPracticeOption,
      rankedResources: ranked,
      matchedSources: {
        igot: !!topIgotItem,
        nssta: !!topNsstaItem,
        nipun: !!topNipunItem,
      },
    };
  }

  /**
   * Automatically arranges recommended resources into 5 structured phases:
   * FOUNDATION → APPLICATION → ADVANCED → ASSESSMENT → REASSESSMENT
   * Dynamically tailored to the learner's priority gap and current level.
   */
  static generatePersonalizedPathway(
    userId: string,
    targetRole: string,
    priorityGaps: {
      competencyId: string;
      competencyName: string;
      currentLevel: number;
      requiredLevel: number;
      gapType?: string;
    }[]
  ): LearningPath {
    const topGap = priorityGaps[0] || {
      competencyId: 'comp-tech-python',
      competencyName: 'Python',
      currentLevel: 2,
      requiredLevel: 4,
      gapType: 'APPLICATION_GAP',
    };

    const compName = topGap.competencyName;
    const isPython = compName.toLowerCase().includes('python');
    const isAiml = compName.toLowerCase().includes('ai') || compName.toLowerCase().includes('ml');
    const isSurvey = compName.toLowerCase().includes('survey') || compName.toLowerCase().includes('sample');

    const items: LearningPathItem[] = [
      // 1. FOUNDATION Phase
      {
        id: `step-found-${topGap.competencyId}`,
        order: 1,
        title: isPython
          ? 'iGOT: Python for Official Statistical Analysis & Data Processing'
          : isAiml
          ? 'iGOT: Introduction to Artificial Intelligence in Public Governance'
          : isSurvey
          ? 'iGOT: Socio-Economic Survey Design & Quality Audit Protocols'
          : `iGOT: ${compName} Core Principles for Civil Servants`,
        source: 'iGOT Karmayogi',
        sourceType: 'IGOT',
        phase: 'FOUNDATION',
        duration: '2h 30m',
        competency: compName,
        reason: `Foundational conceptual mastery covering syntax, formulas, and official guidelines for ${compName}.`,
        status: 'IN_PROGRESS',
        prerequisites: `Basic computer literacy and spreadsheet familiarity`,
        learningObjectives: [
          `Understand fundamental ${compName} concepts and syntax`,
          'Review standard MoSPI data formats and validation rules',
        ],
        expectedImprovement: `Consolidates Level ${topGap.currentLevel} and prepares for practical application.`,
        externalLink: `https://igotkarmayogi.gov.in/app/search?primaryCategory=Course&q=${encodeURIComponent(compName)}`,
      },

      // 2. APPLICATION Phase
      {
        id: `step-app-${topGap.competencyId}`,
        order: 2,
        title: isPython
          ? 'NIPUN Sandbox: Survey Microdata Cleaning & Weight Calibration Lab'
          : isAiml
          ? 'NIPUN AI Sandbox: Machine Learning Imputation & Anomaly Lab'
          : `NIPUN Interactive Lab: ${compName} Simulation & Validation Sandbox`,
        source: 'NIPUN Practical Learning',
        sourceType: 'PRACTICE',
        phase: 'APPLICATION',
        duration: '45 mins',
        competency: compName,
        reason: `Interactive browser-based simulation to solve real statistical data processing scenarios with instant feedback.`,
        status: 'NOT_STARTED',
        prerequisites: `Completion of Foundation coursework or basic scripting proficiency`,
        learningObjectives: [
          'Apply data transformation functions to simulated microdata',
          'Identify statistical anomalies and execute automated imputation',
        ],
        expectedImprovement: `Builds empirical execution speed and eliminates repeated operational errors.`,
      },

      // 3. ADVANCED Phase
      {
        id: `step-adv-${topGap.competencyId}`,
        order: 3,
        title: isPython
          ? 'NSSTA: Advanced Statistical Computing & Python in Official Statistics'
          : isAiml
          ? 'NSSTA: Executive Workshop on AI/ML Applications in Governance'
          : `NSSTA: Advanced Workshop on ${compName} in Official Statistics`,
        source: 'NSSTA Programme',
        sourceType: 'NSSTA',
        phase: 'ADVANCED',
        duration: '3 Days (Residential)',
        competency: compName,
        reason: `TPAC-aligned institutional immersion at NSSTA Greater Noida campus covering advanced methodologies and peer collaboration.`,
        status: 'NOT_STARTED',
        prerequisites: `Minimum 2 years service or Level 2 certification`,
        learningObjectives: [
          'Participate in syndicate problem-solving sprints on national microdata',
          'Learn scalable architectures for high-throughput survey dissemination',
        ],
        expectedImprovement: `Prepares officer for senior technical leadership in ${targetRole}.`,
      },

      // 4. ASSESSMENT Phase
      {
        id: `step-assess-${topGap.competencyId}`,
        order: 4,
        title: isPython
          ? 'NIPUN Level 3 Assessment: Python for Survey Microdata & Imputation'
          : `NIPUN Level ${topGap.currentLevel + 1} Assessment: ${compName} Diagnostic Evaluation`,
        source: 'NIPUN Diagnostic',
        sourceType: 'QUIZ',
        phase: 'ASSESSMENT',
        duration: '15 mins',
        competency: compName,
        reason: `Timed proctored evaluation. Passing score (>= 70%) generates passport evidence and elevates competency level.`,
        status: 'NOT_STARTED',
        prerequisites: `Completion of Foundation and Application modules`,
        learningObjectives: [
          'Demonstrate objective mastery on timed statistical questions',
          'Elevate competency level upon passing threshold verification',
        ],
        expectedImprovement: `Formally elevates competency from Level ${topGap.currentLevel} → Level ${Math.min(topGap.requiredLevel, topGap.currentLevel + 1)}.`,
      },

      // 5. REASSESSMENT Phase
      {
        id: `step-reassess-${topGap.competencyId}`,
        order: 5,
        title: `NIPUN Level ${topGap.requiredLevel} Reassessment: ${compName} Master Certification`,
        source: 'Verification',
        sourceType: 'REASSESSMENT',
        phase: 'REASSESSMENT',
        duration: '20 mins',
        competency: compName,
        reason: `Final post-learning reassessment hurdle to close remaining gap, certify Level ${topGap.requiredLevel}, and achieve 100% role readiness.`,
        status: 'NOT_STARTED',
        prerequisites: `Passed Level ${topGap.currentLevel + 1} assessment`,
        learningObjectives: [
          'Verify complete gap closure and enduring retention',
          'Issue verifiable MoSPI National Competency Passport Certificate',
        ],
        expectedImprovement: `Permanently certifies Level ${topGap.requiredLevel} and marks competency as VERIFIED.`,
      },
    ];

    return {
      id: `path-${userId}`,
      userId,
      targetRole,
      title: `Individual Capacity Building Plan (ICBP) - ${compName} Accelerated Track`,
      progressPercentage: 20, // 1 in-progress out of 5
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
