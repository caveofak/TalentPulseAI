import React, { useState } from 'react';
import {
  Trophy,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Filter,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ParsedCandidate } from '../types';

interface CandidateMatrixProps {
  candidates: ParsedCandidate[];
  onSelectCandidate: (candidate: ParsedCandidate) => void;
  selectedCandidateId?: string;
}

export const CandidateMatrix: React.FC<CandidateMatrixProps> = ({
  candidates,
  onSelectCandidate,
  selectedCandidateId,
}) => {
  const [filterTier, setFilterTier] = useState<string>('all');

  const evaluated = candidates.filter((c) => c.evaluation);
  const sorted = [...evaluated].sort(
    (a, b) => (b.evaluation?.fitScore || 0) - (a.evaluation?.fitScore || 0)
  );

  const filtered = sorted.filter((c) => {
    if (filterTier === 'all') return true;
    return c.evaluation?.matchTier === filterTier;
  });

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'Strong Match':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Potential Match':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Moderate Fit':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Executive Candidate Ranking Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Ranked automatically by Qwen 2.5 / Gemini requirement mapping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterTier === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({evaluated.length})
            </button>
            <button
              onClick={() => setFilterTier('Strong Match')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterTier === 'Strong Match'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Strong
            </button>
            <button
              onClick={() => setFilterTier('Potential Match')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterTier === 'Potential Match'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Potential
            </button>
            <button
              onClick={() => setFilterTier('Moderate Fit')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterTier === 'Moderate Fit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              Moderate
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Candidate Profile</th>
              <th className="py-3 px-4 text-center">Fit Score</th>
              <th className="py-3 px-4">Assessment Tier</th>
              <th className="py-3 px-4">Action Recommendation</th>
              <th className="py-3 px-4">Top Evidence Gap / Missing</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No evaluated candidates in this view.
                </td>
              </tr>
            ) : (
              filtered.map((candidate, idx) => {
                const evalData = candidate.evaluation!;
                const isSelected = candidate.id === selectedCandidateId;
                const topMissing =
                  evalData.missingSkills?.[0]?.skill ||
                  evalData.evidenceGaps?.[0]?.area ||
                  'No critical gaps';

                return (
                  <tr
                    key={candidate.id}
                    onClick={() => onSelectCandidate(candidate)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 hover:bg-indigo-50'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>

                    {/* Candidate */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-sm">
                        {candidate.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{candidate.email || candidate.fileName}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-medium">
                          {evalData.seniorityAssessment}
                        </span>
                      </div>
                    </td>

                    {/* Fit Score */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg border ${getScoreColor(
                          evalData.fitScore
                        )}`}
                      >
                        {evalData.fitScore}%
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getTierBadge(
                          evalData.matchTier
                        )}`}
                      >
                        {evalData.matchTier}
                      </span>
                    </td>

                    {/* Recommendation */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {evalData.recommendation}
                        </span>
                      </div>
                    </td>

                    {/* Top Gap */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span className="truncate max-w-[180px]">{topMissing}</span>
                      </div>
                    </td>

                    {/* Detail trigger */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Examine <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
