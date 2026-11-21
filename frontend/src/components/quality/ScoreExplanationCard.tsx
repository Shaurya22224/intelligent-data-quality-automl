import React from 'react';
import { MinusCircle, CheckCircle, Info } from 'lucide-react';
import { QualityScoreBreakdown } from '../../api/types';

export const ScoreExplanationCard: React.FC<{ breakdown: QualityScoreBreakdown }> = ({ breakdown }) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Score Deductions Audit</h3>
          <p className="text-xs text-slate-400">
            Transparent breakdown of points deducted from the 100-point quality benchmark
          </p>
        </div>
      </div>

      {breakdown.deductions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-300">Flawless Data Quality!</p>
          <p className="text-xs text-emerald-400/80 mt-1">
            No missing values, duplicates, outliers, or high-cardinality anomalies detected.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {breakdown.deductions.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">{item.reason}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.details}</p>
              </div>

              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold shrink-0 self-start sm:self-center">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>-{item.penalty.toFixed(1)} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
