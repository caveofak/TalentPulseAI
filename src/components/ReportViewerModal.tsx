import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Printer,
  FileCode,
  FileText,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlReport: string;
  jobTitle: string;
  recipientEmail: string;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  isOpen,
  onClose,
  htmlReport,
  jobTitle,
  recipientEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  if (!isOpen) return null;

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recruiter-Dossier-${(jobTitle || 'Role').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEML = () => {
    const emlContent = `To: ${recipientEmail}
From: "TalentPulse AI Recruitment Agent" <recruiter-agent@talentpulse.ai>
Subject: 🎯 Recruiter Dossier: Candidate Evaluation Report for ${jobTitle || 'Role'}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${htmlReport}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recruiter-Dossier-${(jobTitle || 'Role').replace(/\s+/g, '_')}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlReport);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Recruiter-Ready HTML Executive Report</h3>
              <p className="text-xs text-slate-400">
                Self-contained HTML dossier synthesized for hiring managers and recruiters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-800 rounded-lg p-0.5 flex text-xs font-semibold mr-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rendered Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw HTML
              </button>
            </div>

            <button
              onClick={handleDownloadHTML}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> .html
            </button>

            <button
              onClick={handleDownloadEML}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> .eml
            </button>

            <button
              onClick={handleCopyCode}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handlePrint}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-100 p-0 overflow-hidden relative">
          {viewMode === 'preview' ? (
            <iframe
              srcDoc={htmlReport}
              title="Recruiter HTML Dossier"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <textarea
              readOnly
              value={htmlReport}
              className="w-full h-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-slate-200 border-0 focus:outline-none resize-none leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
};
