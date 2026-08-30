export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-auth-token'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  } catch {}

  const assessments = [
    {
      id: 'quiz-py-01',
      title: 'Python for Survey Data Manipulation & Pandas',
      competencyName: 'Python',
      competencyId: 'comp-tech-01',
      targetLevel: 4,
      durationMinutes: 15,
      totalQuestions: 5,
      passPercentage: 70,
      questions: [
        {
          id: 'q-py-1',
          question: 'In MoSPI survey datasets with household multipliers, which pandas operation correctly calculates weighted mean income across rural/urban strata?',
          options: [
            'df.groupby("stratum")["income"].mean()',
            'df.groupby("stratum").apply(lambda x: (x["income"] * x["weight"]).sum() / x["weight"].sum())',
            'df["income"].weighted_mean(df["weight"])',
            'df.pivot_table(index="stratum", values="income", aggfunc="sum")',
          ],
          correctAnswer: 1,
          explanation: 'Weighted mean requires summing (income * weight) divided by total weights for each stratum.',
        },
        {
          id: 'q-py-2',
          question: 'Which method handles missing non-response flags in NSS survey microdata without altering zero-valued responses?',
          options: [
            'df.fillna(0)',
            'df.dropna(how="all")',
            'df["status"].replace({np.nan: "NON_RESPONSE"})',
            'df.interpolate()',
          ],
          correctAnswer: 2,
          explanation: 'Replacing NaN with explicit non-response string preserves valid zero values in numerical columns.',
        },
        {
          id: 'q-py-3',
          question: 'When merging FSU (First Stage Unit) level weights with SSU (Second Stage Unit) household schedules, which join type avoids dropping unmatched FSUs?',
          options: [
            'inner join',
            'left join',
            'cross join',
            'outer join with indicator',
          ],
          correctAnswer: 1,
          explanation: 'Left join preserves all FSU master records while matching household schedule rows.',
        },
        {
          id: 'q-py-4',
          question: 'What is the primary advantage of using category dtype for state/district codes in a 10M row NSS microdataset?',
          options: [
            'Prevents missing values',
            'Reduces memory footprint by 80% and accelerates groupby operations',
            'Automatically formats district names',
            'Enables multi-threading in pandas',
          ],
          correctAnswer: 1,
          explanation: 'Category dtype stores unique string codes as integer keys internally, dramatically reducing RAM usage.',
        },
        {
          id: 'q-py-5',
          question: 'Which syntax exports formatted statistical tables directly to official Excel workbooks preserving column widths?',
          options: [
            'df.to_excel("report.xlsx")',
            'df.to_csv("report.xlsx")',
            'pd.ExcelWriter("report.xlsx", engine="openpyxl")',
            'df.write_excel("report.xlsx")',
          ],
          correctAnswer: 2,
          explanation: 'pd.ExcelWriter with openpyxl engine allows custom column width and formatting adjustments.',
        },
      ],
    },
    {
      id: 'quiz-stat-01',
      title: 'Sampling Methodology & Stratified Two-Stage Design',
      competencyName: 'Survey Design',
      competencyId: 'comp-stat-01',
      targetLevel: 4,
      durationMinutes: 15,
      totalQuestions: 5,
      passPercentage: 75,
      questions: [
        {
          id: 'q-stat-1',
          question: 'In NSS two-stage stratified sampling, what constitutes the First Stage Unit (FSU) in rural areas?',
          options: [
            'Household',
            'Census Village / Block',
            'District',
            'Gram Panchayat',
          ],
          correctAnswer: 1,
          explanation: 'In rural sectors of NSS surveys, census villages or blocks serve as FSUs.',
        },
        {
          id: 'q-stat-2',
          question: 'What selection method is typically applied for selecting FSUs within a stratum to ensure probability proportional to size?',
          options: [
            'Simple Random Sampling without Replacement (SRSWOR)',
            'Probability Proportional to Size With Replacement (PPSWR)',
            'Systematic Cluster Sampling',
            'Convenience Sampling',
          ],
          correctAnswer: 1,
          explanation: 'PPSWR ensures larger villages/blocks have proportional probability of selection.',
        },
      ],
    },
  ];

  return res.status(200).json(assessments);
}
