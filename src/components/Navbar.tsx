import React from 'react';
import {
  Sparkles,
  Settings,
  Mail,
  Cpu,
  RefreshCw,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { AIConfig } from '../types';

interface NavbarProps {
  onOpenSettings: () => void;
  aiConfig: AIConfig;
  recipientEmail: string;
  onResetPipeline: () => void;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  aiConfig,
  recipientEmail,
  onResetPipeline,
  isProcessing,
}) => {
  const getProviderLabel = () => {
    if (aiConfig.apiKey && aiConfig.provider === 'qwen') {
      return aiConfig.model || 'Qwen 2.5 (Hosted)';
    }
    if (aiConfig.provider === 'gemini') {
      return 'Gemini 3.8 Flash';
    }
    return 'Qwen 2.5 (via Gemini Engine)';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                TalentPulse<span className="text-indigo-400 font-light">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Agent Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous Ingestion, Qwen 2.5 Requirement Mapping & Email Reporting
            </p>
          </div>
        </div>

        {/* Status Indicators & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active AI Model Badge */}
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors"
            title="Click to configure AI Engine & API Keys"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-white max-w-[140px] truncate">
              {getProviderLabel()}
            </span>
          </button>

          {/* Target Email indicator */}
          <button
            onClick={onOpenSettings}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors"
            title="Default Recipient Gmail"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Send To:</span>
            <span className="font-semibold text-white truncate max-w-[130px]">
              {recipientEmail || 'ak46652@gmail.com'}
            </span>
          </button>

          {/* Reset Pipeline */}
          <button
            onClick={onResetPipeline}
            disabled={isProcessing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Reset Pipeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings & Keys</span>
          </button>
        </div>
      </div>
    </header>
  );
};
