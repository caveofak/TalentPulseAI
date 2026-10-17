import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { ParsedCandidate } from '../types';

interface ResumeUploaderProps {
  candidates: ParsedCandidate[];
  onAddCandidates: (newCandidates: ParsedCandidate[]) => void;
  onRemoveCandidate: (id: string) => void;
  onClearAll: () => void;
  isLoadingSamples: boolean;
  onLoadSamples: () => void;
  isParsing: boolean;
  disabled?: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  candidates,
  onAddCandidates,
  onRemoveCandidate,
  onClearAll,
  isLoadingSamples,
  onLoadSamples,
  isParsing,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<ParsedCandidate | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('resumes', files[i]);
    }

    try {
      const response = await fetch('/api/parse-resumes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        onAddCandidates(data.candidates);
      }
    } catch (err: any) {
      console.error('Failed to parse resumes:', err);
      alert(`Error parsing resumes: ${err.message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <FolderPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Candidate Resumes</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {candidates.length} Loaded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Drag-and-drop PDF & DOCX binary files for text extraction via <code>pdf-parse</code> & <code>mammoth</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSamples}
            disabled={disabled || isLoadingSamples}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {isLoadingSamples ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCheck className="w-3.5 h-3.5" />
            )}
            Load 3 Sample Resumes
          </button>

          {candidates.length > 0 && !disabled && (
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center mb-4 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 bg-slate-50/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
          {isParsing ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          ) : (
            <UploadCloud className="w-5 h-5" />
          )}
        </div>
        <p className="text-xs font-semibold text-slate-700">
          Drop candidate PDF / DOCX files here, or <span className="text-indigo-600 underline">browse files</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Supports multi-file batch upload (PDF parsed with <code>pdf-parse</code>, Word documents with <code>mammoth</code>)
        </p>
      </div>

      {/* Candidate List Queue */}
      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2">
        {candidates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No candidate resumes uploaded yet.
            <div className="mt-1">
              Click <span className="text-indigo-600 font-medium">"Load 3 Sample Resumes"</span> above for a quick demonstration!
            </div>
          </div>
        ) : (
          candidates.map((cand, index) => (
            <div
              key={cand.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded bg-indigo-100/60 text-indigo-700 flex items-center justify-center shrink-0">
                  {cand.fileName.endsWith('.pdf') ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : (
                    <FileCode className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 truncate">
                      {cand.candidateName || cand.fileName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 text-slate-700 uppercase">
                      {cand.parseMethod}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                    <span>{Math.round(cand.fileSize / 1024)} KB</span>
                    <span>•</span>
                    <span>{cand.wordCount} words extracted</span>
                    {cand.email && (
                      <>
                        <span>•</span>
                        <span className="truncate text-slate-500">{cand.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setPreviewCandidate(cand)}
                  title="Preview Extracted Text"
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveCandidate(cand.id)}
                    title="Remove Resume"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raw Extracted Text Modal */}
      {previewCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Extracted Raw Text: {previewCandidate.candidateName}
                </h3>
                <p className="text-xs text-slate-500">
                  Extracted via <code>{previewCandidate.parseMethod}</code> ({previewCandidate.wordCount} words)
                </p>
              </div>
              <button
                onClick={() => setPreviewCandidate(null)}
                className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-700 bg-slate-50 whitespace-pre-wrap leading-relaxed select-text">
              {previewCandidate.extractedText || 'No text extracted.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
