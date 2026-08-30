import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, GraduationCap, Shield, RotateCcw, X, Check, Building2, MapPin, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DemoSelectorModal: React.FC = () => {
  const {
    isDemoSelectorOpen,
    setIsDemoSelectorOpen,
    currentUser,
    switchUserRole,
    resetDemoData,
  } = useAuth();

  if (!isDemoSelectorOpen) return null;

  const personas = [
    {
      id: 'user-learner-01',
      role: 'LEARNER',
      name: 'Aarav Sharma',
      designation: 'Assistant Director (Statistics)',
      ministry: 'MoSPI - Data Analytics & Survey Division',
      cadre: 'Indian Statistical Service (ISS, Level 11)',
      icon: User,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Official learner profile targeting Deputy Director (Statistics). Highlights empirical Python & Statistical Computing gap detection, Competency Passport, unified iGOT + NSSTA recommendations, and dynamic reassessment.',
      highlightTag: 'Primary Demo Experience',
    },
    {
      id: 'user-trainer-01',
      role: 'TRAINER',
      name: 'Dr. Rajeshwar Rao',
      designation: 'Senior Director & Academic Faculty',
      ministry: 'National Statistical Systems Training Academy (NSSTA)',
      cadre: 'Indian Statistical Service (ISS, Level 13)',
      icon: GraduationCap,
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      description:
        'Faculty studio for document parsing (PDF/PPT/DOCX), AI multiple-choice question generation with difficulty controls, curriculum mapping, and cohort weak-competency diagnostics.',
      highlightTag: 'AI Curriculum Studio',
    },
    {
      id: 'user-admin-01',
      role: 'ADMINISTRATOR',
      name: 'Sanjay Deshmukh',
      designation: 'Joint Secretary / Capacity Building Nodal Officer',
      ministry: 'MoSPI - Capacity Building & Training Division',
      cadre: 'Central Secretariat / Nodal Officer (Level 14)',
      icon: Shield,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'Workforce-wide intelligence dashboard featuring department readiness comparisons, organizational skill gap heatmaps, pre vs. post training effectiveness metrics, and predictive skill forecasting.',
      highlightTag: 'Workforce Analytics',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/40 w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#f0f3ff] p-6 border-b border-[#c4c6cf]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#002147] text-[#fe9832] shadow-2xs">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-lg text-[#000a1e]">
                  Select Demo Profile / Role
                </h3>
                <p className="text-xs text-[#44474e]">
                  Switch between official government statistical personas or reset data
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDemoSelectorOpen(false)}
              className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Persona List */}
          <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {personas.map((p) => {
              const isSelected = currentUser?.id === p.id;
              const IconComp = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    switchUserRole(p.id);
                    setIsDemoSelectorOpen(false);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#002147] bg-[#f0f3ff]/70 shadow-sm'
                      : 'border-[#c4c6cf]/30 hover:border-[#002147]/50 hover:bg-[#f9f9ff]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-3 rounded-xl shrink-0 ${
                          isSelected
                            ? 'bg-[#002147] text-[#fe9832]'
                            : 'bg-[#f0f3ff] text-[#002147]'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#111c2d] text-base">
                            {p.name}
                          </h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${p.badgeColor}`}
                          >
                            {p.role}
                          </span>
                          <span className="text-[10px] font-semibold text-[#fe9832] bg-[#fe9832]/10 px-2 py-0.5 rounded-md border border-[#fe9832]/20">
                            {p.highlightTag}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#002147] mt-0.5">
                          {p.designation}
                        </p>
                        <p className="text-xs text-[#44474e] flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-[#74777f]" />
                          {p.ministry}
                        </p>
                        <p className="text-xs text-[#74777f] mt-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#002147] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#f0f3ff]/60 border-t border-[#c4c6cf]/30 flex items-center justify-between">
            <button
              onClick={async () => {
                await resetDemoData();
                setIsDemoSelectorOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#74777f] hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Dataset
            </button>
            <button
              onClick={() => setIsDemoSelectorOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#000a1e] hover:bg-[#002147] rounded-xl transition-all shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
