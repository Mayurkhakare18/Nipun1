import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NSSTAProgram } from '../../types';
import {
  X,
  Building2,
  Calendar,
  MapPin,
  Users,
  Award,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NSSTACourseModal: React.FC = () => {
  const {
    activeNsstaProgram,
    closeNsstaProgram,
    showNotification,
    refreshUserData,
  } = useAuth();

  const [isNominating, setIsNominating] = useState(false);

  if (!activeNsstaProgram) return null;

  const handleNominate = async () => {
    setIsNominating(true);
    try {
      showNotification(
        'Nomination Submitted',
        `Official nomination for ${activeNsstaProgram.title} sent to NSSTA Training Division & Cadre Controlling Authority.`
      );
      setTimeout(() => {
        setIsNominating(false);
        closeNsstaProgram();
      }, 1000);
    } catch (err) {
      setIsNominating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-3xl bg-white rounded-3xl border border-[#c4c6cf]/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#f0f3ff] border-b border-[#c4c6cf]/40 p-6 flex items-start justify-between">
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#002147] text-white">
                  NSSTA Residential Programme
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#fe9832]/10 text-[#002147] border border-[#fe9832]/30">
                  Target: {activeNsstaProgram.competency} (Level {activeNsstaProgram.targetLevel})
                </span>
                <span className="text-[10px] font-semibold text-[#74777f]">
                  Batch Code: {activeNsstaProgram.batchCode}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#000a1e] font-['Public_Sans',sans-serif] leading-snug">
                {activeNsstaProgram.title}
              </h2>
              <p className="text-xs text-[#44474e] flex items-center gap-2">
                <span>Location: <strong>{activeNsstaProgram.location}</strong></span>
                <span>•</span>
                <span>Category: {activeNsstaProgram.category}</span>
              </p>
            </div>
            <button
              onClick={closeNsstaProgram}
              className="p-2 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f9f9ff] px-6 py-3 border-b border-[#c4c6cf]/30 text-xs">
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Calendar className="w-4 h-4 text-[#002147]" />
              <span>{activeNsstaProgram.dates}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Clock className="w-4 h-4 text-[#002147]" />
              <span>{activeNsstaProgram.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Users className="w-4 h-4 text-[#002147]" />
              <span>{activeNsstaProgram.seatsAvailable} seats open</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#002147] font-semibold">
              <MapPin className="w-4 h-4 text-[#fe9832]" />
              <span>Greater Noida Campus</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Why Recommended */}
            <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#002147] flex items-center justify-center shrink-0 border border-[#c4c6cf]/30">
                <Sparkles className="w-4 h-4 text-[#fe9832]" />
              </div>
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-bold text-[#002147]">Intervention Rationale:</p>
                <p className="text-[#44474e]">{activeNsstaProgram.description}</p>
              </div>
            </div>

            {/* Curriculum Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#000a1e] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#002147]" />
                <span>Program Syllabus &amp; Lab Sessions</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeNsstaProgram.modulesCovered.map((mod, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#c4c6cf]/40 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#002147] text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#002147]">{mod}</h4>
                    </div>
                    <p className="text-[11px] text-[#74777f] pl-7">
                      Faculty guided practical session with live dataset exercises.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nomination Process Guidelines */}
            <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#c4c6cf]/40 space-y-2">
              <h4 className="text-xs font-bold text-[#002147] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#fe9832]" />
                <span>Nomination &amp; Deputation Workflow</span>
              </h4>
              <p className="text-[11px] text-[#44474e] leading-relaxed">
                Nominations for NSSTA residential programmes are routed through the MoSPI Training Division. Selected officers are provided on-campus residential accommodation, computing lab access, and official TA/DA clearance per Government of India rules.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#f9f9ff] border-t border-[#c4c6cf]/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-[#74777f]">
              Nomination Deadline: <strong>7 days before batch start</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={closeNsstaProgram}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleNominate}
                disabled={isNominating}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#fe9832] hover:bg-[#e07f20] text-[#000a1e] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isNominating ? 'Submitting Nomination...' : 'Submit Official Nomination'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
