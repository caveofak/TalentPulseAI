import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, FileText, Cpu, FileCheck, Mail, ArrowRight } from 'lucide-react';
import { StepState } from '../types';

interface StepProgressTrackerProps {
  steps: StepState[];
  currentStepId: number;
  overallProgress: number;
  activeLog?: string;
}

export const StepProgressTracker: React.FC<StepProgressTrackerProps> = ({
  steps,
  currentStepId,
  overallProgress,
  activeLog,
}) => {
  const getStepIcon = (id: number, status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'running') {
      return <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    }

    switch (id) {
      case 1:
        return <FileText className="w-5 h-5 text-slate-400" />;
      case 2:
        return <Cpu className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Cpu className="w-5 h-5 text-slate-400" />;
      case 4:
        return <FileCheck className="w-5 h-5 text-slate-400" />;
      case 5:
        return <Mail className="w-5 h-5 text-slate-400" />;
      default:
        return <span className="text-xs font-bold text-slate-400">{id}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-white">
      {/* Top Bar with overall completion */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {overallProgress > 0 && overallProgress < 100 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  overallProgress === 100
                    ? 'bg-emerald-500'
                    : overallProgress > 0
                    ? 'bg-indigo-500'
                    : 'bg-slate-500'
                }`}
              ></span>
            </span>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
              Autonomous Pipeline Execution
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-stage resume ingestion, neural analysis, and dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Progress:</span>
            <span className="ml-2 font-mono text-sm font-bold text-indigo-400">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 5-Step Horizontal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isDone = step.status === 'completed';
          const isRunning = step.status === 'running';

          return (
            <div
              key={step.id}
              className={`relative rounded-lg p-3 transition-all duration-200 border ${
                isRunning
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                  : isDone
                  ? 'bg-slate-800/80 border-emerald-500/40'
                  : 'bg-slate-800/30 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    isDone
                      ? 'bg-emerald-950/80 text-emerald-400'
                      : isRunning
                      ? 'bg-indigo-900 text-indigo-300'
                      : 'bg-slate-850 text-slate-500'
                  }`}
                >
                  {getStepIcon(step.id, step.status)}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-850 text-slate-400">
                  Step 0{step.id}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-100 truncate">{step.name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{step.subtitle}</div>

              {/* Progress bar per step */}
              <div className="w-full bg-slate-850 h-1 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-400'
                      : isRunning
                      ? 'bg-indigo-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${step.progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Activity Ticker */}
      {activeLog && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-indigo-300">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span className="text-slate-400">Event:</span>
          <span className="truncate">{activeLog}</span>
        </div>
      )}
    </div>
  );
};
