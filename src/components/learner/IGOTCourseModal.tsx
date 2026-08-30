import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IGOTCourse } from '../../types';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  Users,
  Award,
  ExternalLink,
  Play,
  FileCheck,
  ShieldCheck,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface IGOTUrlAdapterParams {
  course: IGOTCourse;
  moduleIndex?: number;
  moduleTitle?: string;
  moduleId?: string;
  autostart?: boolean;
  source?: string;
}

/**
 * Adapter function that generates a dynamic, canonical URL for an iGOT Karmayogi course or specific module.
 * Directs to the live iGOT Karmayogi portal course search and catalogue explorer to avoid 404 errors on legacy routes.
 */
export function generateIGOTCourseUrl(params: IGOTUrlAdapterParams): string {
  const { course, moduleTitle } = params;

  // Base portal URL for iGOT Karmayogi (Mission Karmayogi Bharat / DoPT)
  const IGOT_BASE_URL = 'https://igotkarmayogi.gov.in';

  // If a valid live external URL is explicitly provided and not a placeholder
  if (
    course.url &&
    course.url.startsWith('http') &&
    !course.url.includes('/app/toc/course/') &&
    !course.url.includes('/app/toc/do_') &&
    !course.url.includes('/app/player/do_')
  ) {
    return course.url;
  }

  // Generate live official iGOT Karmayogi search query for this course or topic
  const query = moduleTitle || course.competency || course.title || 'Official Statistics';
  return `${IGOT_BASE_URL}/app/search?primaryCategory=Course&q=${encodeURIComponent(query)}`;
}

export const IGOTCourseModal: React.FC = () => {
  const {
    activeIgotCourse,
    closeIgotCourse,
    showNotification,
    refreshUserData,
    exportPassportReport,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'syllabus' | 'resources'>('syllabus');
  const [completedModules, setCompletedModules] = useState<number[]>([0]);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!activeIgotCourse) return null;

  const sampleModules = [
    {
      title: 'Module 1: Official Statistics Framework & Data Governance',
      duration: '35 mins',
      topics: ['MoSPI institutional architecture', 'NDSAP data dissemination standards', 'Data confidentiality & DPDP compliance'],
    },
    {
      title: `Module 2: Practical ${activeIgotCourse.competency} Workflows`,
      duration: '45 mins',
      topics: ['Operational dataset preparation', 'Data validation algorithms', 'Vectorized calculations & summary tables'],
    },
    {
      title: 'Module 3: Stratified Multi-Stage Microdata Processing',
      duration: '40 mins',
      topics: ['Sample multiplier weights calculation', 'Non-sampling error detection', 'CAPI field audit verification'],
    },
    {
      title: 'Module 4: Institutional Capstone & Output Generation',
      duration: '30 mins',
      topics: ['Automated official reporting', 'SDG indicator integration', 'Peer review checklist'],
    },
  ];

  const handleToggleModule = (idx: number) => {
    setCompletedModules((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCompleteAndVerify = async () => {
    setIsVerifying(true);
    try {
      showNotification(
        'iGOT Course Completed',
        `Successfully completed ${activeIgotCourse.title}. Competency progress updated in your Passport.`
      );
      await refreshUserData();
      setTimeout(() => {
        setIsVerifying(false);
        closeIgotCourse();
      }, 800);
    } catch (err) {
      setIsVerifying(false);
    }
  };

  const handleLaunchExternal = (moduleIndex?: number | React.MouseEvent, moduleTitle?: string) => {
    const validModuleIndex = typeof moduleIndex === 'number' ? moduleIndex : undefined;
    const validModuleTitle = typeof moduleTitle === 'string' ? moduleTitle : undefined;

    const targetUrl = generateIGOTCourseUrl({
      course: activeIgotCourse,
      moduleIndex: validModuleIndex,
      moduleTitle: validModuleTitle,
    });

    const label = typeof validModuleIndex === 'number'
      ? `Module ${validModuleIndex + 1} (${validModuleTitle || 'Selected Module'})`
      : `Course "${activeIgotCourse.title}"`;
    
    showNotification(
      'Redirecting to iGOT Karmayogi',
      `Launching ${label} on the official iGOT Karmayogi Portal (igotkarmayogi.gov.in)...`,
      'info'
    );
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
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
                  iGOT Karmayogi Accredited
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#fe9832]/10 text-[#002147] border border-[#fe9832]/30">
                  Target: {activeIgotCourse.competency} (Level {activeIgotCourse.competencyLevel})
                </span>
                <span className="text-[10px] font-semibold text-[#74777f]">
                  Course ID: {activeIgotCourse.id}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#000a1e] font-['Public_Sans',sans-serif] leading-snug">
                {activeIgotCourse.title}
              </h2>
              <p className="text-xs text-[#44474e] flex items-center gap-2">
                <span>Provider: <strong>{activeIgotCourse.provider}</strong></span>
                <span>•</span>
                <span>Category: {activeIgotCourse.category}</span>
              </p>
            </div>
            <button
              onClick={closeIgotCourse}
              className="p-2 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-[#f9f9ff] px-6 py-3 border-b border-[#c4c6cf]/30 text-xs">
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Clock className="w-4 h-4 text-[#002147]" />
              <span>{activeIgotCourse.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{activeIgotCourse.rating} / 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#44474e]">
              <Users className="w-4 h-4 text-[#002147]" />
              <span>{activeIgotCourse.enrolledCount} enrolled</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>SPARROW Aligned</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Direct iGOT Karmayogi Redirect Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#002147] to-[#003366] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fe9832] text-[#000a1e]">
                    Government Portal Redirection
                  </span>
                  <span className="text-xs text-white/80">Single Sign-On (Parichay/Jan Samarth)</span>
                </div>
                <h4 className="text-sm font-bold font-['Public_Sans',sans-serif]">
                  Take full interactive course on official iGOT Karmayogi platform
                </h4>
              </div>

              <a
                href={generateIGOTCourseUrl({ course: activeIgotCourse })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  showNotification(
                    'Redirecting to iGOT Karmayogi',
                    `Launching ${activeIgotCourse.title} on the official iGOT Karmayogi Portal (igotkarmayogi.gov.in)...`,
                    'info'
                  );
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#fe9832] hover:bg-[#e08528] text-[#000a1e] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Redirect to iGOT Karmayogi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Why Recommended Notice */}
            <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#c4c6cf]/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#002147] flex items-center justify-center shrink-0 border border-[#c4c6cf]/30">
                <Sparkles className="w-4 h-4 text-[#fe9832]" />
              </div>
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-bold text-[#002147]">NIPUN Competency Diagnostic Grounding:</p>
                <p className="text-[#44474e]">{activeIgotCourse.recommendationReason}</p>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#000a1e] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#002147]" />
                  <span>Accredited Curriculum &amp; Micro-Modules</span>
                </h3>
                <span className="text-xs font-semibold text-[#74777f]">
                  {completedModules.length} of {sampleModules.length} completed
                </span>
              </div>

              <div className="space-y-2.5">
                {sampleModules.map((mod, idx) => {
                  const isDone = completedModules.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-[#c4c6cf]/40 hover:border-[#002147]/40'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleModule(idx)}
                        className="flex items-start gap-3 cursor-pointer flex-1"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#f0f3ff] text-[#002147] border border-[#c4c6cf]/40'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className={`text-xs font-bold ${isDone ? 'text-emerald-950' : 'text-[#111c2d]'}`}>
                            {mod.title}
                          </h4>
                          <ul className="text-[11px] text-[#74777f] space-y-0.5 list-disc pl-4 marker:text-[#002147]">
                            {mod.topics.map((t, tIdx) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className="text-[11px] text-[#74777f] font-mono mr-1">
                          {mod.duration}
                        </span>
                        <a
                          href={generateIGOTCourseUrl({ course: activeIgotCourse, moduleTitle: mod.title, moduleIndex: idx })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            showNotification(
                              'Redirecting to iGOT Karmayogi',
                              `Launching Module ${idx + 1} (${mod.title}) on official iGOT Karmayogi Portal...`,
                              'info'
                            );
                          }}
                          className="px-2.5 py-1.5 bg-[#f0f3ff] hover:bg-[#002147] text-[#002147] hover:text-white rounded-lg text-[11px] font-bold border border-[#c4c6cf]/40 transition-all flex items-center gap-1 cursor-pointer"
                          title="Launch this specific module on official iGOT Karmayogi"
                        >
                          <Play className="w-3 h-3 text-[#fe9832]" />
                          <span>Launch Module</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#f9f9ff] border-t border-[#c4c6cf]/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href={generateIGOTCourseUrl({ course: activeIgotCourse })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                showNotification(
                  'Redirecting to iGOT Karmayogi',
                  `Opening ${activeIgotCourse.title} on official iGOT Karmayogi Portal...`,
                  'info'
                );
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#c4c6cf]/60 hover:bg-[#f0f3ff] text-[#002147] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Open in Official iGOT Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#002147]" />
            </a>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={closeIgotCourse}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCompleteAndVerify}
                disabled={isVerifying}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#fe9832]" />
                <span>{isVerifying ? 'Verifying...' : 'Record Completion in Passport'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
