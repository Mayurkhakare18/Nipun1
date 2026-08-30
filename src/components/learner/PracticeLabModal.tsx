import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Code,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Terminal,
  Database,
  X,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export const PracticeLabModal: React.FC = () => {
  const { isLabModalOpen, setIsLabModalOpen, showNotification } = useAuth();

  const [code, setCode] = useState<string>(`import pandas as pd
import numpy as np

# Load simulated Household Survey Round 78 Sample Data
df = pd.read_csv('household_microdata.csv')

# TASK 1: Impute missing 'household_income' using stratum median
# TASK 2: Filter out records with invalid state_code (> 37)
# TASK 3: Verify that multiplier weights sum to universe target: 1,420,000

# Write your transformation below:
df['household_income'] = df.groupby('stratum')['household_income'].transform(lambda x: x.fillna(x.median()))
clean_df = df[df['state_code'] <= 37]
weight_sum = np.sum(clean_df['multiplier_weight'])
`);

  const [isRunning, setIsRunning] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [labCompleted, setLabCompleted] = useState(false);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setOutputLogs(['[SYSTEM] Initializing Python 3.11 Statistical Runtime...', '[IO] Loaded 15,400 raw survey records.']);

    setTimeout(() => {
      const logs = ['[SYSTEM] Initializing Python 3.11 Statistical Runtime...', '[IO] Loaded 15,400 raw survey records.'];

      const hasImpute = code.includes('fillna') && (code.includes('median') || code.includes('mean'));
      const hasFilter = code.includes('state_code') && code.includes('<=');
      const hasWeight = code.includes('weight') && code.includes('sum');

      if (hasImpute) {
        logs.push('[SUCCESS] Stratum median imputation applied to 412 missing income cells.');
      } else {
        logs.push('[WARN] Missing values in household_income not properly imputed.');
      }

      if (hasFilter) {
        logs.push('[SUCCESS] Filtered 28 records containing invalid administrative state codes.');
      } else {
        logs.push('[WARN] Invalid state codes still present in sample dataframe.');
      }

      if (hasWeight) {
        logs.push('[SUCCESS] Multiplier weight verification matched universe projection: 1,420,000 (Δ = 0.00).');
      }

      if (hasImpute && hasFilter && hasWeight) {
        logs.push('[EVALUATION] ALL TESTS PASSED: Survey dataset verified against UN-NQAF Quality Metrics!');
        setLabCompleted(true);
        confetti({ particleCount: 70, spread: 60 });
        showNotification('Practice Lab Passed!', 'Practical application proficiency verified.', 'success');
      } else {
        logs.push('[EVALUATION] PARTIAL MATCH: Ensure all 3 tasks are implemented according to instructions.');
      }

      setOutputLogs(logs);
      setIsRunning(false);
    }, 1200);
  };

  if (!isLabModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/60 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#f0f3ff] p-5 border-b border-[#c4c6cf]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-[#002147] text-[#fe9832] shadow-2xs">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#002147] text-white">
                    Step 5: Interactive Sandbox
                  </span>
                  <span className="text-[10px] font-semibold text-[#002147]">
                    Python 3.11 Runtime
                  </span>
                </div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-[#000a1e] mt-0.5">
                  NIPUN Practice Lab: Survey Data Cleaning &amp; Weight Calibration
                </h3>
              </div>
            </div>
            <button
              onClick={() => setIsLabModalOpen(false)}
              className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            {/* Left Code Editor */}
            <div className="lg:col-span-7 p-5 flex flex-col bg-[#000a1e]/95 text-white border-r border-[#002147]">
              <div className="flex items-center justify-between pb-3 border-b border-[#002147] text-xs text-[#8e9099]">
                <span className="flex items-center gap-1.5 font-mono text-[#fe9832]">
                  <Terminal className="w-3.5 h-3.5" /> clean_survey_data.py
                </span>
                <span>Python 3.11 (pandas, NumPy)</span>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full mt-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none custom-scrollbar p-2"
                rows={14}
                spellCheck={false}
              />

              <div className="pt-3 border-t border-[#002147] flex items-center justify-between">
                <button
                  onClick={() =>
                    setCode(`import pandas as pd
import numpy as np

df = pd.read_csv('household_microdata.csv')
df['household_income'] = df.groupby('stratum')['household_income'].transform(lambda x: x.fillna(x.median()))
clean_df = df[df['state_code'] <= 37]
weight_sum = np.sum(clean_df['multiplier_weight'])
`)
                  }
                  className="flex items-center gap-1 text-[11px] text-[#8e9099] hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Template
                </button>

                <button
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-bold transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRunning ? 'Running Script...' : 'Execute Transformation'}
                </button>
              </div>
            </div>

            {/* Right Execution & Quality Console */}
            <div className="lg:col-span-5 p-5 bg-[#f0f3ff] flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider">
                    Validation Tasks
                  </h4>
                  <ul className="mt-2 space-y-2 text-xs text-[#44474e]">
                    <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <FileCheck className="w-4 h-4 text-[#002147] shrink-0 mt-0.5" />
                      <span>
                        <strong>Task 1:</strong> Impute missing household income using stratum median.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <FileCheck className="w-4 h-4 text-[#002147] shrink-0 mt-0.5" />
                      <span>
                        <strong>Task 2:</strong> Remove non-standard state codes exceeding 37.
                      </span>
                    </li>
                    <li className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#c4c6cf]/30">
                      <FileCheck className="w-4 h-4 text-[#002147] shrink-0 mt-0.5" />
                      <span>
                        <strong>Task 3:</strong> Validate sample weighting sum against census projection.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Console Log Output */}
                <div>
                  <h4 className="text-xs font-bold text-[#74777f] uppercase tracking-wider mb-2">
                    Execution Log Output
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-[#000a1e] font-mono text-[11px] text-slate-300 space-y-1 min-h-[140px] max-h-[180px] overflow-y-auto custom-scrollbar">
                    {outputLogs.length === 0 ? (
                      <span className="text-[#8e9099] italic">
                        Click 'Execute Transformation' to compile and test code against survey validation rules...
                      </span>
                    ) : (
                      outputLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={
                            log.includes('[SUCCESS]')
                              ? 'text-emerald-400 font-semibold'
                              : log.includes('[WARN]')
                              ? 'text-amber-300'
                              : log.includes('[EVALUATION]')
                              ? 'text-[#fe9832] font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Lab Footer */}
              <div className="pt-4 border-t border-[#c4c6cf]/30 flex items-center justify-between">
                <span className="text-[11px] text-[#74777f]">
                  Status: {labCompleted ? 'Passed (Verified)' : 'Pending Execution'}
                </span>
                <button
                  onClick={() => setIsLabModalOpen(false)}
                  className="px-4 py-2 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  {labCompleted ? 'Complete & Close' : 'Close Sandbox'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
