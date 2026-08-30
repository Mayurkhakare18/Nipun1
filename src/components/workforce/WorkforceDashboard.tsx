import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WorkforceOverview } from '../../types';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  Building2,
  Filter,
  Download,
  Search,
  Sparkles,
  BarChart2,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

export const WorkforceDashboard: React.FC = () => {
  const { currentUser, showNotification } = useAuth();
  const [workforceData, setWorkforceData] = useState<WorkforceOverview | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedCadre, setSelectedCadre] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWorkforce = async () => {
      try {
        setIsLoading(true);
        const res = await api.getWorkforceOverview();
        if (res.success && res.workforce) {
          setWorkforceData(res.workforce);
        }
      } catch (err) {
        console.error('Failed to load workforce data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkforce();
  }, []);

  const handleExportReport = () => {
    showNotification(
      'Report Export Initiated',
      'Generating MoSPI Official Cadre Competency Audit Report (PDF)...',
      'info'
    );
  };

  const filteredDivisions = workforceData?.divisionBreakdown.filter((div) => {
    if (selectedDivision !== 'ALL' && div.division !== selectedDivision) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                MoSPI Executive Cadre Intelligence
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                ISS / SSS Cadre Registry
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              National Statistical Workforce Capability Dashboard
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Real-time macroscopic workforce readiness, critical competency gap diagnostics, and institutional training deployment metrics across all MoSPI Divisions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Cadre Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4 Macro Counters */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900">
              {workforceData?.totalOfficers.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-semibold">Total Cadre Strength</div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-emerald-700">
              {workforceData?.overallReadinessScore}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-semibold">System-Wide Readiness</div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-amber-700">
              {workforceData?.criticalGapCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-semibold">Critical Skill Deficits</div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-2xl font-bold font-['Public_Sans',sans-serif] text-[#002147]">
              {workforceData?.activeLearningHours.toLocaleString()} <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-semibold">iGOT Hours Logged</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-800">Cadre Filter:</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Divisions (FOD, NAD, ESD, CPD, DPD)</option>
            <option value="FOD">FOD (Field Operations Division)</option>
            <option value="NAD">NAD (National Accounts Division)</option>
            <option value="ESD">ESD (Economic Statistics Division)</option>
            <option value="CPD">CPD (Coordination &amp; Publication)</option>
            <option value="DPD">DPD (Data Processing Division)</option>
          </select>

          <select
            value={selectedCadre}
            onChange={(e) => setSelectedCadre(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Cadres (ISS &amp; SSS)</option>
            <option value="ISS">Indian Statistical Service (ISS)</option>
            <option value="SSS">Subordinate Statistical Service (SSS)</option>
          </select>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Competency Heatmap & Division Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* National Competency Heatmap */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                National Statistical Competency Readiness Heatmap
              </h3>
              <p className="text-xs text-slate-500">
                Readiness percentages across core statistical, computing, and governance domains
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {workforceData?.competencyHeatmap.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800">{item.competency}</span>
                    <span
                      className={`font-semibold ${
                        item.readinessScore >= 80
                          ? 'text-emerald-700'
                          : item.readinessScore >= 60
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {item.readinessScore}% ({item.officersWithGap} officers needing upskilling)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.readinessScore >= 80
                          ? 'bg-emerald-600'
                          : item.readinessScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.readinessScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Division Capability Matrix */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
              Division Capability &amp; Deployment Status
            </h3>

            <div className="space-y-2.5">
              {filteredDivisions?.map((div, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#002147]" />
                      <h4 className="font-bold text-xs text-slate-900">
                        {div.division}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        ({div.headcount} Officers)
                      </span>
                    </div>
                    <div className="text-xs text-amber-800 font-semibold mt-0.5">
                      Top Cadre Need: {div.topGap}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {div.avgReadiness}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        Readiness
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Strategic Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                Strategic Cadre Interventions
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-300 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">
                  Surge Training Priority
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  Python &amp; Survey Microdata Cleaning in FOD
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  640 Field Operations Division officers require immediate Level 2 to Level 3 upskilling ahead of the upcoming NSS 80th Round digital tablet rollout.
                </p>
                <button
                  onClick={() =>
                    showNotification(
                      'NSSTA Batch Mandate Dispatched',
                      'Mandated special 2-week residential batch for 250 FOD field supervisors.'
                    )
                  }
                  className="mt-1 text-xs font-semibold text-[#002147] hover:underline cursor-pointer"
                >
                  Schedule NSSTA Batch Mandate →
                </button>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                  Governance Compliance
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  UN-NQAF Data Quality Assurance Certification
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  92% of officers have completed the self-paced iGOT micro-course on National Quality Assurance Frameworks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
