import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UnifiedRecommendation, LearningCatalogueItem } from '../../types';
import { generateIGOTCourseUrl } from './IGOTCourseModal';
import { ResourceDetailModal } from './ResourceDetailModal';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Clock,
  Star,
  Users,
  Award,
  Layers,
  CheckCircle2,
  Calendar,
  MapPin,
  Play,
  ShieldCheck,
  ChevronRight,
  Search,
  Bookmark,
  BookmarkCheck,
  Filter,
  RefreshCw,
  Info,
  SlidersHorizontal,
  Target,
  ArrowRight,
  Database,
} from 'lucide-react';

export const UnifiedRecommendationsView: React.FC = () => {
  const { openQuiz, setIsLabModalOpen, showNotification, openIgotCourse, openNsstaProgram } = useAuth();
  
  // Tab states: Priority Recommendations vs Full Catalogue
  const [activeView, setActiveView] = useState<'RECOMMENDATIONS' | 'CATALOGUE'>('RECOMMENDATIONS');

  // Recommendations state
  const [recommendations, setRecommendations] = useState<UnifiedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [datasetNotice, setDatasetNotice] = useState<string>('Development Dataset');

  // Catalogue & Filter states
  const [catalogueItems, setCatalogueItems] = useState<LearningCatalogueItem[]>([]);
  const [isCatalogueLoading, setIsCatalogueLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Saved bookmark state
  const [savedCourses, setSavedCourses] = useState<Record<string, boolean>>({});

  // Detail Modal state
  const [selectedResourceForModal, setSelectedResourceForModal] = useState<LearningCatalogueItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const res = await api.getUnifiedRecommendations();
      if (res.success && res.recommendations) {
        setRecommendations(res.recommendations);
        if (res.datasetNotice) setDatasetNotice(res.datasetNotice);
      }
    } catch (err) {
      console.error('Failed to load unified recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogue = async () => {
    try {
      setIsCatalogueLoading(true);
      const res = await api.getCatalogue({
        source: selectedSource !== 'ALL' ? selectedSource : undefined,
        competency: selectedCompetency !== 'ALL' ? selectedCompetency : undefined,
        domain: selectedDomain !== 'ALL' ? selectedDomain : undefined,
        difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : undefined,
        duration: selectedDuration !== 'ALL' ? selectedDuration : undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        query: searchQuery.trim() || undefined,
      });
      if (res.success && res.items) {
        setCatalogueItems(res.items);
      }
    } catch (err) {
      console.error('Failed to load catalogue:', err);
    } finally {
      setIsCatalogueLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (activeView === 'CATALOGUE') {
      fetchCatalogue();
    }
  }, [
    activeView,
    selectedSource,
    selectedCompetency,
    selectedDomain,
    selectedDifficulty,
    selectedDuration,
    selectedRole,
    searchQuery,
  ]);

  const handleToggleBookmark = (courseId: string, title: string) => {
    const isCurrentlySaved = !!savedCourses[courseId];
    setSavedCourses((prev) => ({ ...prev, [courseId]: !isCurrentlySaved }));

    showNotification(
      isCurrentlySaved ? 'Course Removed' : 'Course Saved',
      `${title} has been ${isCurrentlySaved ? 'removed from' : 'added to'} your learning wishlist.`,
      isCurrentlySaved ? 'info' : 'success'
    );
  };

  const handleOpenDetailModal = (item: LearningCatalogueItem) => {
    setSelectedResourceForModal(item);
    setIsDetailModalOpen(true);
  };

  const handleActionFromModal = (resource: LearningCatalogueItem) => {
    setIsDetailModalOpen(false);
    if (resource.source === 'iGOT Karmayogi') {
      openIgotCourse({
        id: resource.id,
        title: resource.title,
        provider: 'iGOT Karmayogi / MoSPI',
        duration: resource.duration,
        rating: resource.rating || 4.8,
        enrolledCount: resource.enrolledCount || 1420,
        url: resource.url || generateIGOTCourseUrl({ course: { title: resource.title, competency: resource.competency } as any }),
      });
    } else if (resource.source === 'NSSTA / TPAC') {
      openNsstaProgram({
        id: resource.id,
        title: resource.title,
        category: 'Residential Workshop',
        duration: resource.duration,
        location: 'NSSTA Campus, Greater Noida',
        dates: '15-17 Sept 2026',
        competency: resource.competency,
        targetLevel: (resource.competencyLevel || 4) as any,
        seatsAvailable: 24,
        batchCode: 'NSSTA-2026-COHORT',
        description: resource.description,
        modulesCovered: resource.learningObjectives,
      });
    } else {
      if (resource.phase === 'ASSESSMENT' || resource.phase === 'REASSESSMENT' || resource.title.toLowerCase().includes('evaluation') || resource.title.toLowerCase().includes('assessment')) {
        openQuiz(resource.competency);
      } else {
        setIsLabModalOpen(true);
      }
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.competencyName.toLowerCase().includes(q) ||
      rec.gapLabel.toLowerCase().includes(q) ||
      rec.igotOption.title.toLowerCase().includes(q) ||
      rec.nsstaOption.title.toLowerCase().includes(q) ||
      (rec.explanation && rec.explanation.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              NIPUN Learning-Integration Layer
            </span>
            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              iGOT Karmayogi • NSSTA / TPAC • NIPUN Practical Learning
            </span>
            <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {datasetNotice}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
            Unified Learning Catalogue &amp; Gap Recommendations
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Directly connects diagnosed statistical competency gaps to accredited capacity-building modalities across digital courses, residential academy cohorts, and hands-on simulation sandboxes.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveView('RECOMMENDATIONS')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeView === 'RECOMMENDATIONS'
                ? 'bg-[#002147] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Priority Gaps ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveView('CATALOGUE')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeView === 'CATALOGUE'
                ? 'bg-[#002147] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unified Catalogue
          </button>
        </div>
      </div>

      {/* VIEW 1: PRIORITY RECOMMENDATIONS */}
      {activeView === 'RECOMMENDATIONS' && (
        <div className="space-y-6">
          {/* Quick Filter and Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All Modalities' },
                { id: 'IGOT', label: 'iGOT Karmayogi (Digital)' },
                { id: 'NSSTA', label: 'NSSTA / TPAC (Residential)' },
                { id: 'LAB', label: 'NIPUN Sandbox & Assessment' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSource(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSource === tab.id
                      ? 'bg-[#002147] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search priority recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Recommendations Cards */}
          <div className="space-y-5">
            {isLoading ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#002147] animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">Generating ranked recommendations from competency gaps...</p>
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-base text-slate-900 font-['Public_Sans',sans-serif]">No priority gaps or matches found</h3>
                <p className="text-xs text-slate-500">
                  {searchQuery.trim()
                    ? `No competency gap matches search "${searchQuery}".`
                    : 'All competencies meet target role thresholds.'}
                </p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-[#002147] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5"
                >
                  {/* Top: Target Competency, Gap Badge & Compact 'Why this recommendation?' Box */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Diagnosed Gap
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {rec.gapLabel}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Gap: {rec.gapSize || 1} Levels
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 font-['Public_Sans',sans-serif] mt-1">
                        {rec.competencyName}
                      </h3>
                    </div>

                    {/* Compact 'Why This Recommendation?' Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 max-w-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Target className="w-3.5 h-3.5 text-[#002147]" />
                        <span>Why This Recommendation?</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <div>
                          <strong className="text-slate-900">Skill Gap:</strong> {rec.explanation?.skillGap || `${rec.competencyName} L${rec.currentLevel} → L${rec.requiredLevel}`}
                        </div>
                        <div>
                          <strong className="text-slate-900">Role Relevance:</strong> {rec.explanation?.roleRelevance || 'Required for target cadre benchmark'}
                        </div>
                        <div>
                          <strong className="text-slate-900">Prerequisite:</strong> {rec.explanation?.prerequisite || 'Foundational literacy'}
                        </div>
                        <div>
                          <strong className="text-slate-900">Reason:</strong> {rec.explanation?.reason || rec.reason}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3-Pillar Options Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Option 1: iGOT Karmayogi Course */}
                    {(selectedSource === 'ALL' || selectedSource === 'IGOT') && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all group">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#002147]">
                              <BookOpen className="w-3.5 h-3.5 text-[#002147]" />
                              iGOT Karmayogi
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleBookmark(rec.igotOption.id, rec.igotOption.title)}
                                className="p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                                title="Bookmark Course"
                              >
                                {savedCourses[rec.igotOption.id] ? (
                                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                ) : (
                                  <Bookmark className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                Self-Paced
                              </span>
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-snug group-hover:text-[#002147] transition-colors font-['Public_Sans',sans-serif]">
                            {rec.igotOption.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Provider: <strong className="text-slate-700">{rec.igotOption.provider}</strong>
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" /> {rec.igotOption.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {rec.igotOption.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" /> {rec.igotOption.enrolledCount}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200 flex items-center gap-2">
                          <button
                            onClick={() => openIgotCourse(rec.igotOption)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-md transition-all shadow-xs cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Curriculum</span>
                          </button>
                          <button
                            onClick={() =>
                              handleOpenDetailModal({
                                id: rec.igotOption.id,
                                title: rec.igotOption.title,
                                source: 'iGOT Karmayogi',
                                competency: rec.competencyName,
                                domain: 'Technical Competencies',
                                difficulty: 'Intermediate',
                                duration: rec.igotOption.duration,
                                prerequisites: 'Basic statistical familiarity',
                                targetRole: 'Deputy Director (Statistics)',
                                description: rec.igotOption.recommendationReason || 'Official self-paced e-learning curriculum on iGOT Karmayogi.',
                                learningObjectives: [
                                  'Master official statistical workflows and standard data protocols',
                                  'Implement automated data manipulation and reporting',
                                ],
                                relevanceToGap: rec.explanation?.reason || rec.reason,
                                expectedImprovement: `Elevates ${rec.competencyName} from Level ${rec.currentLevel} towards Level ${rec.requiredLevel}.`,
                                isDemoData: true,
                                datasetNotice: 'Development Dataset',
                                rating: rec.igotOption.rating,
                                enrolledCount: rec.igotOption.enrolledCount,
                                url: rec.igotOption.url,
                              })
                            }
                            className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                            title="View Detailed Resource Syllabus"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Option 2: NSSTA / TPAC Academy Programme */}
                    {(selectedSource === 'ALL' || selectedSource === 'NSSTA') && (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all group">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#002147]">
                              <GraduationCap className="w-3.5 h-3.5 text-[#002147]" />
                              NSSTA / TPAC
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                              TPAC Aligned
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-snug group-hover:text-[#002147] transition-colors font-['Public_Sans',sans-serif]">
                            {rec.nsstaOption.title}
                          </h4>

                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[#002147]" />
                              <span><strong>Batch:</strong> {rec.nsstaOption.upcomingBatchDate} ({rec.nsstaOption.duration})</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>{rec.nsstaOption.mode}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200 flex items-center gap-2">
                          <button
                            onClick={() => {
                              const nsstaData = {
                                id: rec.nsstaOption.id || 'nssta-prog-301',
                                title: rec.nsstaOption.title,
                                category: rec.nsstaOption.category,
                                duration: rec.nsstaOption.duration,
                                location: 'NSSTA Campus, Greater Noida',
                                dates: rec.nsstaOption.upcomingBatchDate,
                                competency: rec.competencyName,
                                targetLevel: 4,
                                seatsAvailable: 24,
                                batchCode: 'NSSTA-2026-B3',
                                description: rec.reason,
                                modulesCovered: rec.nsstaOption.modulesCovered || [
                                  'Official Macroeconomic Aggregates & Supply Use Tables',
                                  'Survey Weight Calibration & Household Microdata Cleaning',
                                  'Data Dissemination & Policy Audit Standards',
                                ],
                              };
                              openNsstaProgram(nsstaData);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-[#002147] border border-slate-200 text-xs font-semibold rounded-md transition-all shadow-xs cursor-pointer"
                          >
                            <span>Nominate Batch</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenDetailModal({
                                id: rec.nsstaOption.id || 'nssta-prog-301',
                                title: rec.nsstaOption.title,
                                source: 'NSSTA / TPAC',
                                competency: rec.competencyName,
                                domain: 'Statistical Methodology',
                                difficulty: 'Advanced',
                                duration: rec.nsstaOption.duration,
                                prerequisites: rec.nsstaOption.eligibility || 'Serving statistical officers',
                                targetRole: rec.nsstaOption.targetCadre || 'Deputy Director (Statistics)',
                                description: rec.nsstaOption.description || rec.reason,
                                learningObjectives: rec.nsstaOption.modulesCovered || [
                                  'Institutional immersion at NSSTA Campus Greater Noida',
                                  'Advanced syndicate problem-solving sprints',
                                ],
                                relevanceToGap: rec.nsstaOption.recommendationReason || rec.reason,
                                expectedImprovement: `Prepares officer for Level 4 Master certification and senior cadre clearance.`,
                                isDemoData: true,
                                datasetNotice: 'Development Dataset',
                                mode: rec.nsstaOption.mode,
                              })
                            }
                            className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                            title="View Full Workshop Details"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Option 3: NIPUN Practical Learning & Diagnostic Hurdle */}
                    {(selectedSource === 'ALL' || selectedSource === 'LAB') && (
                      <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              NIPUN Practical Learning
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                              Interactive Lab
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-snug font-['Public_Sans',sans-serif]">
                            {rec.nipunPracticeOption?.title || `${rec.competencyName} Interactive Survey Lab & Sandbox`}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {rec.nipunPracticeOption?.scenario || 'Simulated microdata transformation, missing data imputation, and instant automated feedback.'}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-emerald-200 space-y-2">
                          <button
                            onClick={() => setIsLabModalOpen(true)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-all shadow-xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-amber-300" />
                            <span>Launch Code Sandbox Lab (45m)</span>
                          </button>

                          <button
                            onClick={() => openQuiz(rec.competencyName)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#002147] border border-slate-200 text-[11px] font-semibold rounded-md transition-all cursor-pointer"
                          >
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>Take Level Validation Quiz &rarr;</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: UNIFIED LEARNING CATALOGUE (INTELLIGENT SEARCH & FILTER) */}
      {activeView === 'CATALOGUE' && (
        <div className="space-y-6">
          {/* Intelligent Search & Filter Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalogue by title, competency, keyword, or learning objective..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showFilters || selectedCompetency !== 'ALL' || selectedDomain !== 'ALL' || selectedDifficulty !== 'ALL'
                      ? 'bg-[#002147] text-white border-[#002147]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters {selectedCompetency !== 'ALL' || selectedDomain !== 'ALL' ? '(Active)' : ''}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSource('ALL');
                    setSelectedCompetency('ALL');
                    setSelectedDomain('ALL');
                    setSelectedDifficulty('ALL');
                    setSelectedDuration('ALL');
                    setSelectedRole('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Expandable Filter Grid */}
            {showFilters && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fadeIn">
                {/* Source Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Source</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Sources</option>
                    <option value="iGOT">iGOT Karmayogi</option>
                    <option value="NSSTA">NSSTA / TPAC</option>
                    <option value="NIPUN">NIPUN Practical Learning</option>
                  </select>
                </div>

                {/* Competency Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Competency</label>
                  <select
                    value={selectedCompetency}
                    onChange={(e) => setSelectedCompetency(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Competencies</option>
                    <option value="Python">Python</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="Survey Methodology">Survey Methodology</option>
                    <option value="Data Visualization">Data Visualization</option>
                    <option value="National Accounts">National Accounts</option>
                    <option value="Cybersecurity">Cybersecurity / DPDP</option>
                  </select>
                </div>

                {/* Domain Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Domains</option>
                    <option value="Technical Competencies">Technical Competencies</option>
                    <option value="Statistical Methodology">Statistical Methodology</option>
                    <option value="Official Statistics">Official Statistics</option>
                    <option value="Digital Governance & Compliance">Governance & Compliance</option>
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                {/* Duration Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Duration</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Any Duration</option>
                    <option value="SHORT">&lt; 2 Hours</option>
                    <option value="MEDIUM">2 - 6 Hours</option>
                    <option value="LONG">Multi-Day Workshop</option>
                  </select>
                </div>

                {/* Target Role */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Target Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Cadres</option>
                    <option value="Deputy Director">Deputy Director</option>
                    <option value="Senior Statistical Officer">Senior Statistical Officer</option>
                    <option value="Assistant Director">Assistant Director</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Catalogue Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isCatalogueLoading ? (
              <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#002147] animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">Filtering learning resources across iGOT, NSSTA, and NIPUN...</p>
              </div>
            ) : catalogueItems.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <Database className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-base text-slate-900 font-['Public_Sans',sans-serif]">No catalogue resources found</h3>
                <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              catalogueItems.map((item) => {
                const isIgot = item.source === 'iGOT Karmayogi';
                const isNssta = item.source === 'NSSTA / TPAC';
                const isNipun = item.source === 'NIPUN Practical Learning';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Source & Difficulty Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isIgot
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : isNssta
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.source}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.difficulty}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => handleOpenDetailModal(item)}
                        className="font-bold text-sm text-slate-900 leading-snug group-hover:text-[#002147] transition-colors font-['Public_Sans',sans-serif] cursor-pointer line-clamp-2"
                      >
                        {item.title}
                      </h4>

                      {/* Domain & Duration */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" /> {item.competency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {item.duration}
                        </span>
                      </div>

                      {/* Description summary */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Target Role */}
                      <div className="text-[11px] text-slate-500 pt-1">
                        Cadre: <strong className="text-slate-700">{item.targetRole}</strong>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-all cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => handleActionFromModal(item)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-md transition-all shadow-xs cursor-pointer"
                      >
                        {isIgot ? (
                          <>
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Curriculum</span>
                          </>
                        ) : isNssta ? (
                          <>
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Nominate</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                            <span>Launch Lab</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reusable Resource Detail Modal */}
      <ResourceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        resource={selectedResourceForModal}
        onAction={handleActionFromModal}
      />
    </div>
  );
};
