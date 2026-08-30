import React from 'react';
import { LearningCatalogueItem } from '../../types';
import {
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  Star,
  Users,
  Award,
  Calendar,
  MapPin,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Tag,
  Target,
  FileText,
} from 'lucide-react';
import { generateIGOTCourseUrl } from './IGOTCourseModal';

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: LearningCatalogueItem | null;
  onAction?: (resource: LearningCatalogueItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  isOpen,
  onClose,
  resource,
  onAction,
}) => {
  if (!isOpen || !resource) return null;

  const isIgot = resource.source === 'iGOT Karmayogi';
  const isNssta = resource.source === 'NSSTA / TPAC';
  const isNipun = resource.source === 'NIPUN Practical Learning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-md border ${
                  isIgot
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : isNssta
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {resource.source}
              </span>
              <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {resource.domain}
              </span>
              <span className="font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                {resource.difficulty}
              </span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {resource.datasetNotice || 'Development Dataset'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-['Public_Sans',sans-serif]">
              {resource.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Top Quick Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Competency</div>
              <div className="font-bold text-slate-900 text-xs mt-0.5">{resource.competency}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Duration</div>
              <div className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {resource.duration}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Target Cadre</div>
              <div className="font-bold text-slate-900 text-xs mt-0.5 truncate" title={resource.targetRole}>
                {resource.targetRole}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Delivery Mode</div>
              <div className="font-bold text-slate-900 text-xs mt-0.5">
                {resource.mode || (isIgot ? 'Online Self-Paced' : isNssta ? 'In-Person (NSSTA)' : 'Interactive Lab')}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 font-['Public_Sans',sans-serif]">
              Overview &amp; Curriculum Description
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3.5 rounded-lg border border-slate-100">
              {resource.description}
            </p>
          </div>

          {/* Relevance to Gap (Why This Recommendation?) */}
          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Relevance to Learner's Priority Gap</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              {resource.relevanceToGap}
            </p>
            {resource.expectedImprovement && (
              <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-amber-800">
                <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><strong>Expected Competency Improvement:</strong> {resource.expectedImprovement}</span>
              </div>
            )}
          </div>

          {/* Prerequisites */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-slate-900 font-['Public_Sans',sans-serif] uppercase tracking-wider">
              Prerequisites &amp; Prior Knowledge
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
              {resource.prerequisites || 'None specified. Open for cadre capacity building.'}
            </div>
          </div>

          {/* Learning Objectives */}
          {resource.learningObjectives && resource.learningObjectives.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-slate-900 font-['Public_Sans',sans-serif] uppercase tracking-wider">
                Key Learning Objectives
              </h3>
              <ul className="space-y-2">
                {resource.learningObjectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Development Dataset Disclaimer */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Development Dataset Notice:</strong> This learning resource is provided from the local mock catalogue dataset for development and workflow testing.
            </span>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="text-xs text-slate-500">
            Resource ID: <code className="font-mono text-[10px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{resource.id}</code>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
            >
              Close
            </button>

            {onAction && (
              <button
                onClick={() => onAction(resource)}
                className="w-full sm:w-auto px-5 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isIgot ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Launch iGOT Curriculum</span>
                  </>
                ) : isNssta ? (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nominate for NSSTA Batch</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>Start Practical Lab / Quiz</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
