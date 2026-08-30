import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UploadedDocument, QuizQuestion, QuizAssessment } from '../../types';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  GraduationCap,
  Layers,
  Edit,
  Trash2,
  Play,
  RotateCw,
  Users,
  BarChart3,
  Award,
} from 'lucide-react';

export const TrainerDashboard: React.FC = () => {
  const { currentUser, showNotification, openQuiz } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'questions' | 'cohort'>('upload');

  // Generation form
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [targetCompetency, setTargetCompetency] = useState('Survey Design');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated assessment state
  const [generatedAssessment, setGeneratedAssessment] = useState<QuizAssessment | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.getDocuments();
        if (res.success && res.documents) {
          setDocuments(res.documents);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    fetchDocs();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content || 'Official MoSPI Training Handbook on Survey Sampling and Estimation 2026.');
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!fileContent && !fileName) {
      // Use sample handbook text if none uploaded
      setFileName('MoSPI_NSSO_78th_Round_Sampling_Handbook.pdf');
      setFileContent(`The National Sample Survey (NSS) follows a stratified multi-stage design. The First Stage Units (FSUs) are Census villages in the rural sector and Urban Frame Survey (UFS) blocks in the urban sector. The Ultimate Stage Units (USUs) are households in both sectors. For estimation of aggregates, multiplier weights are calibrated against projected population totals. In household income analysis, stratum median imputation is recommended to prevent non-response bias without distorting sample variance.`);
    }

    try {
      setIsGenerating(true);
      const res = await api.uploadAndGenerate({
        fileName: fileName || 'MoSPI_NSSO_Sampling_Handbook.pdf',
        fileContent: fileContent || 'Stratified Multi-stage Sampling Guidelines',
        competency: targetCompetency,
        difficulty,
        questionCount,
      });

      if (res.success) {
        setGeneratedAssessment(res.assessment);
        setEditableQuestions(res.assessment.questions);
        setActiveTab('questions');
        const docsRes = await api.getDocuments();
        if (docsRes.success) setDocuments(docsRes.documents);

        showNotification(
          'AI Assessment Generated!',
          `Generated ${res.assessment.questions.length} questions from ${res.document.fileName}.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Error generating assessment:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    const updated = [...editableQuestions];
    (updated[qIndex] as any)[field] = value;
    setEditableQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...editableQuestions];
    updated[qIndex].options[optIndex] = text;
    setEditableQuestions(updated);
  };

  return (
    <div className="space-y-6 text-[#0f172a]">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                NSSTA Faculty Academic Workspace
              </span>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Senior Faculty: {currentUser?.name}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Public_Sans',sans-serif] text-slate-900 tracking-tight">
              Curriculum Authoring &amp; Assessment Engine
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Upload official MoSPI/NSSTA circulars, extract competency schema, generate validated diagnostic questions, and evaluate cadre performance distributions.
            </p>
          </div>

          {/* Sub-navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Extraction
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'questions' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Question Review ({editableQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('cohort')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cohort' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cohort Diagnostics
            </button>
          </div>
        </div>
      </div>

      {/* 1. DOCUMENT UPLOAD & GENERATION TAB */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                Syllabus &amp; Circular Question Generator
              </h3>
              <p className="text-xs text-slate-500">
                Ingest PDF, DOCX, or methodological notes to construct standardized FRAC-aligned diagnostic items.
              </p>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 text-center transition-colors bg-slate-50">
              <input
                type="file"
                id="docUpload"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.pptx,.txt"
                className="hidden"
              />
              <label htmlFor="docUpload" className="cursor-pointer space-y-2 block">
                <div className="w-10 h-10 rounded-lg bg-[#002147] text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {fileName ? fileName : 'Select or drop official circular / training notes'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Accepts PDF, DOCX, PPTX, TXT (up to 25MB)
                </div>
              </label>
            </div>

            {/* Custom Content Textarea */}
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Handbook Excerpt / Source Text
              </label>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="Or paste handbook excerpt, sampling design formula, or methodological circular here..."
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-400 resize-none custom-scrollbar"
                rows={4}
              />
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800">Target Competency</label>
                <select
                  value={targetCompetency}
                  onChange={(e) => setTargetCompetency(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Survey Design">Survey Design</option>
                  <option value="Sampling Methodology">Sampling Methodology</option>
                  <option value="Python">Python for Statistics</option>
                  <option value="Price Statistics">Price Statistics (CPI/WPI)</option>
                  <option value="National Accounts">National Accounts (SNA 2008)</option>
                  <option value="Data Quality Frameworks">Data Quality Frameworks</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800">Target Level / Depth</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Easy">Level 1-2 (Foundational)</option>
                  <option value="Medium">Level 3 (Specialist Benchmark)</option>
                  <option value="Hard">Level 4-5 (Authority)</option>
                  <option value="Mixed">Cadre Cross-Section</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800">Item Count</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#002147] hover:bg-[#001833] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-amber-400 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing Methodology & Generating Question Schema...' : 'Extract & Generate Question Schema'}</span>
            </button>
          </div>

          {/* Right Processed Documents Archive */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
                Registered Training Source Documents ({documents.length})
              </h3>

              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#002147] shrink-0" />
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {doc.fileName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {doc.keySummary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>{doc.generatedQuestionsCount} Generated Items</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUESTION EDITOR & PUBLISHER TAB */}
      {activeTab === 'questions' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Question Validation &amp; Cadre Deployment
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-['Public_Sans',sans-serif] mt-0.5">
                Assessment Item Bank: {targetCompetency}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  showNotification('Assessment Published', 'Assessment is now active for all officers in the SSS/ISS cohort.', 'success');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Publish Items to Cohort
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {editableQuestions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002147]">
                    Item {qIdx + 1} ({q.difficulty})
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Topic: {q.topic}
                  </span>
                </div>

                <textarea
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                  rows={2}
                />

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                        q.correctAnswer === oIdx
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctAnswer === oIdx}
                        onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                        className="text-[#002147] focus:ring-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">
                    Official Reference &amp; Methodological Explanation:
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COHORT ANALYTICS TAB */}
      {activeTab === 'cohort' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="font-['Public_Sans',sans-serif] font-bold text-base text-slate-900">
              NSSTA Induction &amp; Refresher Cadre Diagnostics
            </h3>
            <p className="text-xs text-slate-500">
              Competency gap distribution and post-training delta metrics across active cohorts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">Active Officers Enrolled</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-['Public_Sans',sans-serif]">128 Officers</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">SSS 2026 Batch 1</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">Primary Cadre Deficiency</div>
              <div className="text-2xl font-bold text-amber-700 mt-1 font-['Public_Sans',sans-serif]">Python ETL (L3)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Affects 64% of cohort</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">Post-Evaluation Elevation</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1 font-['Public_Sans',sans-serif]">+34.5%</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Post-Reassessment Benchmark</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
