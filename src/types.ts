export interface MatchedSkill {
  skill: string;
  evidence: string;
  proficiency: string;
}

export interface MissingSkill {
  skill: string;
  severity: 'Critical' | 'Moderate' | 'Bonus';
  notes: string;
}

export interface EvidenceGap {
  area: string;
  gapDescription: string;
  riskLevel: 'High' | 'Medium' | 'Low';
}

export interface VerificationProbe {
  question: string;
  expectedSignal: string;
  warningFlag: string;
}

export interface CandidateEvaluation {
  candidateName: string;
  fitScore: number;
  matchTier: 'Strong Match' | 'Potential Match' | 'Moderate Fit' | 'Low Fit';
  summary: string;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  evidenceGaps: EvidenceGap[];
  recruiterVerificationProbes: VerificationProbe[];
  keyStrengths: string[];
  seniorityAssessment: 'Junior' | 'Mid-Level' | 'Senior' | 'Staff/Lead' | 'Overqualified';
  recommendation: 'Advance to Technical Screen' | 'Proceed with Phone Screen' | 'Request Additional Work/Portfolio' | 'Hold / Reject';
  recommendationRationale: string;
}

export interface ParsedCandidate {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  parseMethod: string;
  extractedText: string;
  status: 'parsed' | 'failed' | 'evaluating' | 'evaluated';
  candidateName: string;
  email: string;
  phone: string;
  wordCount: number;
  characterCount: number;
  error?: string;
  evaluation?: CandidateEvaluation;
  modelUsed?: string;
}

export interface AIConfig {
  provider: 'qwen' | 'gemini' | 'openai-compatible';
  apiKey: string;
  endpoint: string;
  model: string;
}

export interface SMTPConfig {
  service?: 'gmail' | 'custom' | 'resend';
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  resendApiKey?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  recipient: string;
  previewUrl?: string | null;
  mode: string;
  sentAt: string;
  error?: string;
  isRealInboxDelivery?: boolean;
  deliveryMethod?: 'real_smtp' | 'real_resend' | 'sandbox_ethereal' | 'client_direct';
  note?: string;
}

export type PipelineStepId = 1 | 2 | 3 | 4 | 5;

export interface StepState {
  id: PipelineStepId;
  name: string;
  subtitle: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number; // 0 - 100
  detailLog?: string;
}
