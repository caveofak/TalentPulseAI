import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  FileText,
  Mail,
  Phone,
  Copy,
  Check,
  Award,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ParsedCandidate } from '../types';

interface CandidateDeepDiveProps {
  candidate: ParsedCandidate;
  onClose?: () => void;
}

export const CandidateDeepDive: React.FC<CandidateDeepDiveProps> = ({
  candidate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'missing' | 'evidence' | 'matched' | 'raw'>('verification');
  const [recruiterStatus, setRecruiterStatus] = useState<'pending' | 'shortlisted' | 'screened' | 'rejected'>('pending');
  const [copiedText, setCopiedText] = useState(false);

  const evalData = candidate.evaluation;
  if (!evalData) return null;

  const handleCopyNotes = () => {
    const summaryNotes = `CANDIDATE RECRUITER DOSSIER: ${candidate.candidateName}
Fit Score: ${evalData.fitScore}% (${evalData.matchTier})
Recommendation: ${evalData.recommendation}
Summary: ${evalData.summary}

KEY PHONE SCREEN PROBES:
${evalData.recruiterVerificationProbes?.map((p, i) => `${i + 1}. ${p.question}\n   Look for: ${p.expectedSignal}\n   Red flag: ${p.warningFlag}`).join('\n\n')}

CRITICAL MISSING SKILLS:
${evalData.missingSkills?.map((m) => `- ${m.skill} [${m.severity}]: ${m.notes}`).join('\n')}
`;
    navigator.clipboard.writeText(summaryNotes);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Strong Match':
        return 'bg-emerald-500 text-white';
      case 'Potential Match':
        return 'bg-blue-600 text-white';
      case 'Moderate Fit':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-rose-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">{candidate.candidateName}</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getTierColor(evalData.matchTier)}`}>
              {evalData.matchTier}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {evalData.seniorityAssessment} Level
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            {candidate.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {candidate.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {candidate.fileName} ({candidate.parseMethod})
            </span>
          </div>
        </div>

        {/* Fit Score & Recruiter Decision */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Neural Fit Score
            </div>
            <div className="font-mono text-3xl font-black text-emerald-400">
              {evalData.fitScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
          </div>

          <div className="border-l border-slate-800 pl-4 flex flex-col gap-1.5">
            <button
              onClick={handleCopyNotes}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Dossier!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Screen Notes
                </>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRecruiterStatus('shortlisted')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  recruiterStatus === 'shortlisted'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                }`}
              >
                ✓ Shortlist
              </button>
              <button
                onClick={() => setRecruiterStatus('rejected')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  recruiterStatus === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                }`}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Recommendation Callout */}
      <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold text-indigo-950 flex items-center gap-2">
            <span>Agent Recommendation: {evalData.recommendation}</span>
          </div>
          <p className="text-indigo-900/80 mt-0.5 leading-relaxed">
            {evalData.recommendationRationale}
          </p>
          <p className="text-slate-600 mt-1 italic">
            "{evalData.summary}"
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'verification'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          Phone Screen Verification Probes ({evalData.recruiterVerificationProbes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('missing')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'missing'
              ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Missing / Weak Skills ({evalData.missingSkills?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'evidence'
              ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Evidence Gaps & Risks ({evalData.evidenceGaps?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('matched')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'matched'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified Matched Skills ({evalData.matchedSkills?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'raw'
              ? 'border-slate-800 text-slate-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          Raw Resume Text
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-5 flex-1 min-h-[300px] overflow-y-auto">
        {/* TAB 1: Verification Probes */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 mb-2">
              The AI agent synthesized these targeted questions specifically based on ambiguous claims or missing depth in this candidate's resume:
            </div>
            {evalData.recruiterVerificationProbes?.map((probe, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <div className="font-bold text-slate-800 text-sm leading-snug">
                    {probe.question}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 mt-2">
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 text-xs">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      What a Strong Answer Sounds Like:
                    </div>
                    <p className="text-emerald-950/80 leading-relaxed font-sans">
                      {probe.expectedSignal}
                    </p>
                  </div>

                  <div className="bg-rose-50/80 border border-rose-200/80 rounded-lg p-2.5 text-xs">
                    <div className="font-bold text-rose-800 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Red Flag / Shallow Answer to Watch For:
                    </div>
                    <p className="text-rose-950/80 leading-relaxed font-sans">
                      {probe.warningFlag}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Missing Skills */}
        {activeTab === 'missing' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 mb-1">
              Required qualifications from the Job Description that are absent or poorly supported:
            </div>
            {evalData.missingSkills?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-rose-100 bg-rose-50/40 text-xs"
              >
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-900">{item.skill}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.severity === 'Critical'
                          ? 'bg-rose-600 text-white'
                          : item.severity === 'Moderate'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{item.notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Evidence Gaps */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 mb-1">
              Areas where claims exist without concrete scale, metrics, or verifiable outcomes:
            </div>
            {evalData.evidenceGaps?.map((gap, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/40 text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950">{gap.area}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      {gap.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{gap.gapDescription}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Matched Skills */}
        {activeTab === 'matched' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 mb-1">
              Verified skills confirmed with direct quotes and evidence from resume text:
            </div>
            {evalData.matchedSkills?.map((match, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950 text-sm">{match.skill}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Proficiency: {match.proficiency}
                  </span>
                </div>
                <div className="pl-6 text-slate-600 italic bg-white/70 p-2 rounded border border-emerald-100 font-mono text-[11px] mt-1">
                  "{match.evidence}"
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Raw Resume */}
        {activeTab === 'raw' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-text max-h-[400px] overflow-y-auto">
            {candidate.extractedText}
          </div>
        )}
      </div>
    </div>
  );
};
