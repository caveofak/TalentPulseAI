import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Settings,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { EmailDispatchResult } from '../types';

interface EmailDeliveryStatusProps {
  emailResult: EmailDispatchResult | null;
  onResendEmail: (customRecipient?: string) => Promise<void>;
  defaultRecipient: string;
  jobTitle?: string;
  htmlReport?: string;
  onOpenSettings?: () => void;
}

export const EmailDeliveryStatus: React.FC<EmailDeliveryStatusProps> = ({
  emailResult,
  onResendEmail,
  defaultRecipient,
  jobTitle = 'Role',
  htmlReport = '',
  onOpenSettings,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [altRecipient, setAltRecipient] = useState('');
  const [showAltInput, setShowAltInput] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  if (!emailResult) return null;

  const targetEmail = emailResult.recipient || defaultRecipient || 'ak46652@gmail.com';

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendEmail(showAltInput && altRecipient ? altRecipient : undefined);
    } finally {
      setIsResending(false);
    }
  };

  const copyMessageId = () => {
    if (emailResult.messageId) {
      navigator.clipboard.writeText(emailResult.messageId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // 1-Click Client-Side Gmail Direct Trigger
  const handleOpenInGmail = () => {
    const subject = `🎯 Recruiter Dossier: Candidate Evaluation Report for ${jobTitle}`;
    const plainTextBody = `Hi Recruiter,

Here is your automated TalentPulse AI Candidate Evaluation Dossier for ${jobTitle}.

Please find the complete recruiter-ready ranking matrix, skill gap breakdown, and verification probes in the full report.

To view or print the full interactive visual report, please check your TalentPulse dashboard.`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      targetEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;

    window.open(gmailUrl, '_blank');
  };

  // Download .eml file configured for target email
  const handleDownloadEML = () => {
    const emlContent = `To: ${targetEmail}
From: "TalentPulse AI Recruitment Agent" <recruiter-agent@talentpulse.ai>
Subject: 🎯 Recruiter Dossier: Candidate Evaluation Report for ${jobTitle}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${htmlReport || '<h1>TalentPulse Recruiter Report</h1>'}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recruiter-Dossier-${jobTitle.replace(/\s+/g, '_')}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy HTML to clipboard for pasting into Gmail rich text editor
  const handleCopyReportHtml = () => {
    navigator.clipboard.writeText(htmlReport || '');
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border p-4 text-xs transition-all space-y-3 ${
        emailResult.isRealInboxDelivery
          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-md'
          : 'bg-indigo-950/40 border-indigo-500/40 text-slate-200 shadow-md'
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              emailResult.isRealInboxDelivery
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-indigo-600 text-white shadow-xs'
            }`}
          >
            {emailResult.isRealInboxDelivery ? (
              <Inbox className="w-5 h-5 text-white" />
            ) : (
              <Mail className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {emailResult.isRealInboxDelivery
                  ? '✓ Real Inbox Delivery Sent via Direct SMTP / API'
                  : 'Nodemailer Step 5 Completed (Sandbox Delivery)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {emailResult.mode}
              </span>
            </div>
            <div className="text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                Target: <strong className="text-white">{targetEmail}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(emailResult.sentAt).toLocaleTimeString()}
              </span>
              {emailResult.messageId && (
                <>
                  <span>•</span>
                  <button
                    onClick={copyMessageId}
                    className="font-mono text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                    title="Copy Nodemailer Message ID"
                  >
                    ID: {emailResult.messageId.substring(0, 16)}...
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Send via Gmail Client-side trigger */}
          <button
            type="button"
            onClick={handleOpenInGmail}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Open in Gmail Web with pre-filled candidate report"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>1-Click Send in Gmail</span>
          </button>

          {/* Download EML file for instant opening in Apple Mail / Outlook */}
          <button
            type="button"
            onClick={handleDownloadEML}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors flex items-center gap-1.5"
            title="Download .eml file (opens in any mail client)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open in Mail Client (.eml)</span>
          </button>

          {/* Copy Report HTML */}
          <button
            type="button"
            onClick={handleCopyReportHtml}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors flex items-center gap-1.5"
          >
            {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBody ? 'Copied HTML' : 'Copy HTML'}</span>
          </button>

          {/* Ethereal Mailbox preview if present */}
          {emailResult.previewUrl && (
            <a
              href={emailResult.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 text-white font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Test Mailbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={() => setShowAltInput(!showAltInput)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
          >
            {showAltInput ? 'Cancel' : 'Other Email'}
          </button>
        </div>
      </div>

      {/* Explanatory callout for real inbox delivery vs sandbox */}
      {!emailResult.isRealInboxDelivery && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span>
              <strong>Note on Real Gmail Inboxes:</strong> To deliver directly into your personal Gmail inbox (<strong>{targetEmail}</strong>) without opening webmail, click <strong>"1-Click Send in Gmail"</strong> above, or add your <strong>Gmail App Password</strong> in Settings.
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1 shrink-0 ml-auto"
            >
              <Settings className="w-3 h-3" />
              Configure Gmail App Password
            </button>
          )}
        </div>
      )}

      {/* Alternative Recipient Input drawer */}
      {showAltInput && (
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <input
            type="email"
            value={altRecipient}
            onChange={(e) => setAltRecipient(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            disabled={isResending || !altRecipient}
            onClick={handleResend}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-xs"
          >
            {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send Now
          </button>
        </div>
      )}
    </div>
  );
};
