import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Loader2,
  FileText,
  Mail,
  Download,
  Eye,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ParsedCandidate,
  AIConfig,
  SMTPConfig,
  EmailDispatchResult,
  StepState,
  PipelineStepId,
} from './types';
import { Navbar } from './components/Navbar';
import { StepProgressTracker } from './components/StepProgressTracker';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResumeUploader } from './components/ResumeUploader';
import { CandidateMatrix } from './components/CandidateMatrix';
import { CandidateDeepDive } from './components/CandidateDeepDive';
import { SettingsModal } from './components/SettingsModal';
import { ReportViewerModal } from './components/ReportViewerModal';
import { EmailDeliveryStatus } from './components/EmailDeliveryStatus';
import { generateRecruiterHTMLReport } from './utils/htmlReportGenerator';

const INITIAL_STEPS: StepState[] = [
  {
    id: 1,
    name: 'Input Layer',
    subtitle: 'JD & Resume Intake',
    status: 'idle',
    progress: 0,
  },
  {
    id: 2,
    name: 'Binary Text Parsing',
    subtitle: 'pdf-parse & mammoth',
    status: 'idle',
    progress: 0,
  },
  {
    id: 3,
    name: 'AI Neural Mapping',
    subtitle: 'Qwen 2.5 Gap Analysis',
    status: 'idle',
    progress: 0,
  },
  {
    id: 4,
    name: 'Report Generation',
    subtitle: 'Recruiter HTML Dossier',
    status: 'idle',
    progress: 0,
  },
  {
    id: 5,
    name: 'Email Delivery',
    subtitle: 'Nodemailer Gmail Dispatch',
    status: 'idle',
    progress: 0,
  },
];

export default function App() {
  // State for Job Description
  const [jobTitle, setJobTitle] = useState('Staff Full-Stack Software Engineer');
  const [jobDescription, setJobDescription] = useState(
    `Title: Staff Full-Stack Software Engineer
Department: Core Infrastructure & Applications
Location: San Francisco, CA / Remote

Required Qualifications & Skills:
- 7+ years of professional full-stack software engineering experience.
- Deep hands-on proficiency with TypeScript, modern React (React 18/19), and Node.js or Go.
- Proven track record running containerized microservices in production on Kubernetes and Docker.
- Strong relational database modeling with PostgreSQL and caching layers with Redis.
- Demonstrated experience designing asynchronous event pipelines (Kafka, RabbitMQ, or SQS).
- Track record writing comprehensive RFCs, leading system architecture, and mentoring engineers.`
  );

  // State for Candidates
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ParsedCandidate | null>(null);

  // Pipeline Execution State
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [currentStepId, setCurrentStepId] = useState<PipelineStepId>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeLog, setActiveLog] = useState<string>('Pipeline idle. Ready for input ingestion.');
  const [overallProgress, setOverallProgress] = useState(0);

  // Generated Report & Email
  const [generatedHTMLReport, setGeneratedHTMLReport] = useState<string>('');
  const [emailResult, setEmailResult] = useState<EmailDispatchResult | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [isParsingResumes, setIsParsingResumes] = useState(false);

  // Configuration (Default recipient is ak46652@gmail.com as specified)
  const [recipientEmail, setRecipientEmail] = useState('ak46652@gmail.com');
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    provider: 'qwen',
    apiKey: '',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen-2.5-72b-instruct:free',
  });
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: false,
  });

  // Calculate overall progress based on steps
  useEffect(() => {
    const totalStepWeight = steps.reduce((acc, step) => acc + step.progress, 0);
    setOverallProgress(totalStepWeight / 5);
  }, [steps]);

  // Update a specific step's progress and status
  const updateStep = (id: PipelineStepId, updates: Partial<StepState>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // 1-Click: Load realistic sample candidates from backend
  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    setActiveLog('Fetching pre-parsed sample resumes (PDF & DOCX)...');
    try {
      const response = await fetch('/api/sample-resumes');
      const data = await response.json();
      if (data.candidates) {
        setCandidates(data.candidates);
        updateStep(1, { status: 'completed', progress: 100 });
        updateStep(2, { status: 'completed', progress: 100 });
        setActiveLog(`Loaded ${data.candidates.length} candidate resumes (PDF & DOCX parsed).`);
      }
    } catch (err: any) {
      console.error('Failed to load samples:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleAddCandidates = (newCandidates: ParsedCandidate[]) => {
    setCandidates((prev) => [...prev, ...newCandidates]);
    updateStep(1, { status: 'completed', progress: 100 });
    updateStep(2, { status: 'completed', progress: 100 });
    setActiveLog(`Ingested ${newCandidates.length} new resumes via pdf-parse / mammoth.`);
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selectedCandidate?.id === id) setSelectedCandidate(null);
  };

  const handleClearCandidates = () => {
    setCandidates([]);
    setSelectedCandidate(null);
    setGeneratedHTMLReport('');
    setEmailResult(null);
    setSteps(INITIAL_STEPS);
    setActiveLog('Pipeline reset. Ingest new candidates or load samples to begin.');
  };

  // FULL PIPELINE ORCHESTRATION: Steps 1 -> 2 -> 3 -> 4 -> 5
  const runFullPipeline = async () => {
    if (!jobDescription.trim()) {
      alert('Please provide a Job Description before running the recruitment pipeline.');
      return;
    }
    if (candidates.length === 0) {
      alert('Please upload candidate PDF/DOCX resumes or click "Load 3 Sample Resumes".');
      return;
    }

    setIsProcessing(true);
    setEmailResult(null);

    try {
      // STEP 1: Input Layer Verification
      setCurrentStepId(1);
      updateStep(1, { status: 'running', progress: 50 });
      setActiveLog(`Step 1: Validating Job Description (${jobTitle}) and ${candidates.length} resumes...`);
      await new Promise((r) => setTimeout(r, 400));
      updateStep(1, { status: 'completed', progress: 100 });

      // STEP 2: Binary Text Parsing Verification
      setCurrentStepId(2);
      updateStep(2, { status: 'running', progress: 60 });
      setActiveLog(`Step 2: Confirming binary text extraction via pdf-parse & mammoth across ${candidates.length} resumes...`);
      await new Promise((r) => setTimeout(r, 500));
      updateStep(2, { status: 'completed', progress: 100 });

      // STEP 3: AI Processing (Qwen 2.5 / Gemini Neural Mapping)
      setCurrentStepId(3);
      updateStep(3, { status: 'running', progress: 10 });
      setActiveLog(`Step 3: Initializing AI Evaluation Engine (${aiConfig.model || 'Qwen 2.5'})...`);

      const evaluatedCandidates: ParsedCandidate[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const stepProgress = Math.round(((i + 1) / candidates.length) * 100);
        updateStep(3, {
          status: 'running',
          progress: stepProgress,
        });

        setActiveLog(
          `Step 3: Neural mapping candidate [${i + 1}/${candidates.length}] "${candidate.candidateName}" against requirements...`
        );

        try {
          const aiResponse = await fetch('/api/analyze-candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobDescription,
              candidate,
              aiConfig,
            }),
          });

          if (!aiResponse.ok) {
            const errJson = await aiResponse.json().catch(() => ({}));
            throw new Error(errJson.error || `HTTP ${aiResponse.status}`);
          }

          const aiData = await aiResponse.json();
          const updatedCandidate: ParsedCandidate = {
            ...candidate,
            evaluation: aiData.evaluation,
            modelUsed: aiData.modelUsed,
            status: 'evaluated',
          };

          evaluatedCandidates.push(updatedCandidate);

          // Update candidate in state as they finish for progressive live rendering!
          setCandidates((prev) =>
            prev.map((c) => (c.id === candidate.id ? updatedCandidate : c))
          );
        } catch (candidateErr: any) {
          console.error(`Error analyzing candidate ${candidate.candidateName}:`, candidateErr);
          evaluatedCandidates.push({
            ...candidate,
            status: 'failed',
            error: candidateErr.message,
          });
        }
      }

      updateStep(3, { status: 'completed', progress: 100 });
      setActiveLog('Step 3 completed: Requirements mapped, missing skills identified, phone-screen probes synthesized.');

      // STEP 4: Report Generation (Recruiter-Ready HTML Report)
      setCurrentStepId(4);
      updateStep(4, { status: 'running', progress: 40 });
      setActiveLog('Step 4: Compiling AI data into structured Recruiter-Ready HTML report & ranking matrix...');
      await new Promise((r) => setTimeout(r, 600));

      const finalHtmlReport = generateRecruiterHTMLReport(
        jobTitle,
        jobDescription,
        evaluatedCandidates
      );
      setGeneratedHTMLReport(finalHtmlReport);
      updateStep(4, { status: 'completed', progress: 100 });
      setActiveLog('Step 4 completed: HTML dossier synthesized with executive matrix and verification questions.');

      // Select top candidate automatically for display
      const topCandidate = [...evaluatedCandidates].sort(
        (a, b) => (b.evaluation?.fitScore || 0) - (a.evaluation?.fitScore || 0)
      )[0];
      if (topCandidate) setSelectedCandidate(topCandidate);

      // STEP 5: Email Delivery via Nodemailer
      setCurrentStepId(5);
      updateStep(5, { status: 'running', progress: 30 });
      setActiveLog(`Step 5: Packaging HTML dossier and triggering Nodemailer dispatch to ${recipientEmail}...`);

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          jobTitle,
          htmlReport: finalHtmlReport,
          smtpConfig:
            smtpConfig.host || smtpConfig.resendApiKey || smtpConfig.pass
              ? smtpConfig
              : undefined,
        }),
      });

      const emailData = await emailResponse.json();
      if (!emailResponse.ok) {
        throw new Error(emailData.error || 'Failed to dispatch email');
      }

      setEmailResult(emailData);
      updateStep(5, { status: 'completed', progress: 100 });
      setActiveLog(
        `✓ Step 5 completed: Dossier successfully dispatched to ${recipientEmail} via ${emailData.mode}!`
      );
    } catch (err: any) {
      console.error('Pipeline failed:', err);
      setActiveLog(`Pipeline error: ${err.message}`);
      updateStep(currentStepId, { status: 'error' });
      alert(`Pipeline execution error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-dispatch email to same or alternate recipient
  const handleResendEmail = async (customRecipient?: string) => {
    if (!generatedHTMLReport) return;
    const target = customRecipient || recipientEmail;
    setActiveLog(`Dispatching report to ${target}...`);

    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: target,
        jobTitle,
        htmlReport: generatedHTMLReport,
        candidateCount: candidates.length,
        smtpConfig:
          smtpConfig.host || smtpConfig.resendApiKey || smtpConfig.pass
            ? smtpConfig
            : undefined,
      }),
    });

    const emailData = await emailResponse.json();
    if (!emailResponse.ok) {
      throw new Error(emailData.error || 'Failed to dispatch email');
    }

    setEmailResult(emailData);
    setActiveLog(`✓ Re-dispatched email to ${target} via ${emailData.mode}!`);
  };

  const hasEvaluatedCandidates = candidates.some((c) => c.evaluation);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        aiConfig={aiConfig}
        recipientEmail={recipientEmail}
        onResetPipeline={handleClearCandidates}
        isProcessing={isProcessing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Visual Progress Stepper (Step 1 to 5 in Real Time) */}
        <StepProgressTracker
          steps={steps}
          currentStepId={currentStepId}
          overallProgress={overallProgress}
          activeLog={activeLog}
        />

        {/* Input Layer Grid (Job Description + Resume Uploader) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <JobDescriptionInput
            jobTitle={jobTitle}
            onJobTitleChange={setJobTitle}
            value={jobDescription}
            onChange={setJobDescription}
            disabled={isProcessing}
          />

          <ResumeUploader
            candidates={candidates}
            onAddCandidates={handleAddCandidates}
            onRemoveCandidate={handleRemoveCandidate}
            onClearAll={handleClearCandidates}
            isLoadingSamples={isLoadingSamples}
            onLoadSamples={handleLoadSamples}
            isParsing={isParsingResumes}
            disabled={isProcessing}
          />
        </div>

        {/* Launch Pipeline Banner */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-900/60 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Autonomous Recruiter Pipeline
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                5-Step Automated Flow
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Input Validation &rarr; Binary Parsing (<code>pdf-parse</code>/<code>mammoth</code>) &rarr;
              Qwen 2.5 Gap Analysis &rarr; Recruiter HTML Dossier &rarr; Nodemailer Gmail Dispatch
            </p>
          </div>

          <div className="flex items-center gap-3">
            {generatedHTMLReport && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                View Full HTML Report
              </button>
            )}

            <button
              type="button"
              disabled={isProcessing || candidates.length === 0 || !jobDescription.trim()}
              onClick={runFullPipeline}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                isProcessing
                  ? 'bg-indigo-800 text-indigo-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white shadow-indigo-600/30'
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Autonomous Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Launch Full AI Recruitment Pipeline
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Delivery Status Banner (Step 5 Live Confirmation) */}
        {emailResult && (
          <EmailDeliveryStatus
            emailResult={emailResult}
            onResendEmail={handleResendEmail}
            defaultRecipient={recipientEmail}
            jobTitle={jobTitle}
            htmlReport={generatedHTMLReport}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Recruiter-Ready Summary Dashboard & Ranking Matrix (Step 4 & Deep Dive) */}
        {hasEvaluatedCandidates && (
          <div className="space-y-6">
            {/* Executive Candidate Matrix */}
            <CandidateMatrix
              candidates={candidates}
              onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
              selectedCandidateId={selectedCandidate?.id}
            />

            {/* Individual Candidate Deep-Dive */}
            {selectedCandidate && selectedCandidate.evaluation && (
              <CandidateDeepDive
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
              />
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiConfig={aiConfig}
        onSaveAIConfig={setAIConfig}
        recipientEmail={recipientEmail}
        onSaveRecipientEmail={setRecipientEmail}
        smtpConfig={smtpConfig}
        onSaveSMTPConfig={setSMTPConfig}
      />

      {/* HTML Report Viewer Modal */}
      <ReportViewerModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        htmlReport={generatedHTMLReport}
        jobTitle={jobTitle}
        recipientEmail={recipientEmail}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        TalentPulse AI Recruitment Agent • Full-stack pipeline with pdf-parse, Qwen 2.5/3 neural routing, and automated Nodemailer reporting.
      </footer>
    </div>
  );
}
