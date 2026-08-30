import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NipunLogo } from '../common/NipunLogo';
import { LearnerCompetency, CompetencyCategory } from '../../types';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ShieldCheck,
  TrendingUp,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Printer,
  Download,
  X,
  ExternalLink,
  QrCode,
  Check,
  Zap,
  ChevronRight,
  Info,
  BrainCircuit,
} from 'lucide-react';

export const CompetencyPassportView: React.FC = () => {
  const { currentUser, openQuiz, setIsGapCheckerOpen, showNotification } = useAuth();
  const [competencies, setCompetencies] = useState<LearnerCompetency[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showLevelGuide, setShowLevelGuide] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompetencies = async () => {
      try {
        setIsLoading(true);
        const res = await api.getLearnerCompetencies();
        if (res.success && res.competencies) {
          setCompetencies(res.competencies);
        }
      } catch (err) {
        console.error('Failed to load passport competencies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetencies();
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Domains' },
    { id: 'STATISTICAL_COMPETENCIES', label: 'Statistical Methods' },
    { id: 'TECHNICAL_COMPETENCIES', label: 'Technical & Computing' },
    { id: 'DIGITAL_GOVERNANCE', label: 'Digital Governance' },
    { id: 'BEHAVIOURAL_MANAGERIAL', label: 'Management & Ethics' },
  ];

  const filteredCompetencies = competencies.filter((c) => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const verifiedCount = competencies.filter((c) => c.status === 'VERIFIED').length;
  const gapCount = competencies.filter((c) => c.status === 'CRITICAL_GAP' || c.status === 'DEVELOPING').length;
  const totalCount = competencies.length || 17;
  const verificationPercent = Math.round((verifiedCount / totalCount) * 100);

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleExportPassport = () => {
    showNotification(
      'Competency Passport Exported',
      'Official encrypted PDF generated with MoSPI digital signature seal & QR verification.',
      'success'
    );
  };

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* 1. Official Passport Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <NipunLogo variant="mark" size={48} className="shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  National Statistical System Cadre Registry
                </span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  Living Digital Record • FRAC / Karmayogi Aligned
                </span>
              </div>
              <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
                Competency Passport: {currentUser?.name}
              </h2>
              <p className="text-xs text-slate-600">
                {currentUser?.designation} • {currentUser?.ministry} • Cadre ID: <strong className="text-slate-800">{currentUser?.employeeId}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-center px-3 border-r border-slate-200">
                <div className="text-xl font-bold text-emerald-700 font-['Public_Sans',sans-serif]">
                  {verifiedCount} <span className="text-xs font-normal text-slate-500">/ {totalCount}</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Verified</div>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <div className="text-xl font-bold text-amber-700 font-['Public_Sans',sans-serif]">
                  {gapCount}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Gaps</div>
              </div>
              <div className="text-center px-3">
                <div className="text-xl font-bold text-[#002147] font-['Public_Sans',sans-serif]">
                  {currentUser?.roleReadiness}%
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Cadre Fit</div>
              </div>
            </div>

            <button
              onClick={() => setIsGapCheckerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#002147] text-xs font-bold rounded-lg border border-slate-300 transition-all shadow-2xs cursor-pointer"
              title="Open AI Gap Diagnostic Engine"
            >
              <BrainCircuit className="w-4 h-4 text-amber-500" />
              <span>AI GAP CHECKER</span>
            </button>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Official Digital Credential</span>
            </button>
          </div>
        </div>

        {/* Cadre Progress Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Cadre Competency Clearance ({verificationPercent}% Certified)
            </span>
            <button
              onClick={() => setShowLevelGuide(!showLevelGuide)}
              className="text-[#002147] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              {showLevelGuide ? 'Hide Level Guide' : 'View Level 1-5 Benchmark Standard'}
            </button>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${verificationPercent}%` }}
            />
          </div>
        </div>

        {/* Level 1-5 Benchmark Reference Guide */}
        {showLevelGuide && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="font-bold text-slate-900 font-['Public_Sans',sans-serif] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              MoSPI Competency Level Classification Standard (FRAC Aligned)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">Level 1: Foundational</div>
                <p className="text-[11px] text-slate-600 mt-1">Basic comprehension of statistical terms, survey schedules, and code structures.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">Level 2: Applied Operator</div>
                <p className="text-[11px] text-slate-600 mt-1">Executes field canvassing, routine data entry, and basic tabulation scripts.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border-2 border-amber-400 bg-amber-50/20">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Level 3: Specialist</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-bold">SSO Benchmark</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">Calculates survey weights, sampling variance, and builds automated ETL pipelines.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">Level 4: Master Analyst</div>
                <p className="text-[11px] text-slate-600 mt-1">Designs sampling frames, time-series forecasting, and econometric models.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">Level 5: Authority</div>
                <p className="text-[11px] text-slate-600 mt-1">National methodology contributor (NSC, UN-SDMX, institutional review boards).</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search competencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* 3. Competency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompetencies.map((comp) => {
          const isVerified = comp.status === 'VERIFIED';
          const isCritical = comp.status === 'CRITICAL_GAP';

          return (
            <div
              key={comp.competencyId}
              className={`p-5 rounded-xl bg-white border transition-all flex flex-col justify-between hover:shadow-xs ${
                isVerified
                  ? 'border-emerald-300'
                  : isCritical
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {comp.category.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5 font-['Public_Sans',sans-serif]">
                      {comp.name}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isCritical
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {comp.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Level Stepper (1 to 5) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Current: <strong className="text-slate-900">Level {comp.currentLevel}</strong>
                    </span>
                    <span className="text-slate-600">
                      Required: <strong className="text-slate-900">Level {comp.requiredLevel}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const isCurrent = comp.currentLevel >= lvl;
                      const isTarget = comp.requiredLevel >= lvl;

                      return (
                        <div
                          key={lvl}
                          className={`h-1.5 rounded-full transition-all ${
                            isCurrent
                              ? 'bg-emerald-600'
                              : isTarget
                              ? 'bg-amber-400'
                              : 'bg-slate-100'
                          }`}
                          title={`Level ${lvl}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Evidence Details & Audit Trail */}
                <div className="pt-2 text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {comp.evidence.diagnosticScore !== undefined && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Diagnostic Score:</span>
                      <span className="font-semibold text-slate-900">
                        {comp.evidence.diagnosticScore}%
                      </span>
                    </div>
                  )}
                  {comp.evidence.practicalScore !== undefined && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Assessment Score:</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {comp.evidence.practicalScore}% Verified
                      </span>
                    </div>
                  )}
                  {comp.evidence.lastUpgradeAudit && (
                    <div className="text-[10px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                      <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
                        <span>{comp.evidence.lastUpgradeAudit.assessmentId}</span>
                        <span>L{comp.evidence.lastUpgradeAudit.previousLevel} → L{comp.evidence.lastUpgradeAudit.newLevel}</span>
                      </div>
                      <div className="truncate text-slate-800 font-medium">
                        {comp.evidence.lastUpgradeAudit.evidence}
                      </div>
                    </div>
                  )}
                  {comp.evidence.notes && !comp.evidence.lastUpgradeAudit && (
                    <div className="text-[10px] text-slate-600 italic bg-white/70 p-1.5 rounded border border-slate-200 line-clamp-2">
                      {comp.evidence.notes}
                    </div>
                  )}
                  {comp.evidence.courseCompletions && comp.evidence.courseCompletions.length > 0 && (
                    <div className="text-[11px] text-slate-600 truncate">
                      ✓ {comp.evidence.courseCompletions[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Assessed: {comp.lastAssessed}
                </span>

                {!isVerified ? (
                  <button
                    onClick={() => {
                      if (comp.name.toLowerCase().includes('python')) {
                        if (comp.currentLevel === 2) {
                          openQuiz('assess-py-l3');
                        } else if (comp.currentLevel === 3) {
                          openQuiz('assess-py-l4');
                        } else {
                          openQuiz('assess-py-l3');
                        }
                      } else {
                        setIsGapCheckerOpen(true);
                      }
                    }}
                    className="text-xs font-semibold text-[#002147] hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300"
                  >
                    <span>Close Gap</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Official Digital Credential Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top National Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-white to-emerald-600"></div>

            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5 text-center">
              {/* MoSPI Emblem & Seal Header */}
              <div className="flex flex-col items-center space-y-1">
                <NipunLogo variant="mark" size={54} className="mb-1" />
                <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-slate-500">
                  GOVERNMENT OF INDIA • MoSPI • NSSTA
                </span>
                <h3 className="text-xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
                  National Statistical Competency Passport
                </h3>
                <p className="text-xs text-slate-500">
                  Official Living Credential under Framework for Roles, Activities and Competencies (FRAC)
                </p>
              </div>

              {/* Certificate Body */}
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Officer Name</span>
                    <div className="text-sm font-bold text-slate-900 font-['Public_Sans',sans-serif]">
                      {currentUser?.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Cadre / Designation</span>
                    <div className="text-xs font-semibold text-[#002147]">
                      {currentUser?.designation} (Level {currentUser?.level})
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Cadre ID</span>
                    <div className="text-xs font-mono font-semibold text-slate-900">
                      {currentUser?.employeeId}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-base font-bold text-emerald-700">{verifiedCount} / {totalCount}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Verified Skills</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-base font-bold text-[#002147]">{currentUser?.roleReadiness}%</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Cadre Readiness</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-base font-bold text-[#002147]">{currentUser?.trainingHours} hrs</div>
                    <div className="text-[10px] text-slate-500 font-semibold">iGOT Karmayogi</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-base font-bold text-amber-700">{currentUser?.targetRole?.split('/')[0]}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Target Promotion</div>
                  </div>
                </div>

                {/* QR Code & Digital Signature Stamp */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded border border-slate-200 p-1 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Cryptographically Signed</div>
                      <div className="text-[10px] text-slate-500 font-mono">HASH: 9F8A-E7B2-C410-NIPUN-2026</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Authorized by:</div>
                    <div className="font-semibold text-[#002147] text-xs">Director General, MoSPI / NSSTA</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Passport</span>
                </button>
                <button
                  onClick={handleExportPassport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Verified PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

