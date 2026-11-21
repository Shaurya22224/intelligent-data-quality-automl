import React, { useMemo } from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles
} from 'lucide-react';
import { AutoMLTrainResponse, SingleModelResult } from '../../api/types';

export const ModelLeaderboard: React.FC<{ result: AutoMLTrainResponse }> = ({ result }) => {
  const isClassification = result.task_type === 'classification';

  // Defensively sort models by rank before rendering
  // Successful models sorted by rank (1, 2, 3...), followed by skipped/failed models
  const sortedModels: SingleModelResult[] = useMemo(() => {
    return [...result.models].sort((a, b) => {
      const aSuccess = a.status === 'success';
      const bSuccess = b.status === 'success';
      if (aSuccess && !bSuccess) return -1;
      if (!aSuccess && bSuccess) return 1;

      const aRank = typeof a.rank === 'number' && a.rank > 0 ? a.rank : 9999;
      const bRank = typeof b.rank === 'number' && b.rank > 0 ? b.rank : 9999;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return 0;
    });
  }, [result.models]);

  const getRankBadge = (rank?: number | null, isBest?: boolean) => {
    if (isBest || rank === 1) {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 whitespace-nowrap">
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>#1 Best</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/30 whitespace-nowrap">
          #2 Rank
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/30 whitespace-nowrap">
          #3 Rank
        </span>
      );
    }
    if (typeof rank === 'number' && rank > 3) {
      return (
        <span className="inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 text-slate-400 font-mono whitespace-nowrap">
          #{rank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center text-xs font-medium px-2 py-0.5 text-slate-500 font-mono whitespace-nowrap">
        —
      </span>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AutoML Leaderboard & Model Rankings</h3>
            <p className="text-xs text-slate-400">
              Ranked by <strong className="text-indigo-300">{isClassification ? 'Weighted F1-Score' : 'R² Determination Score'}</strong> on test set
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap">
            {result.models.length} Models Evaluated
          </span>
        </div>
      </div>

      {/* Horizontally scrollable responsive table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold select-none">
              <th className="py-3 px-4 text-center min-w-[105px] whitespace-nowrap">Rank</th>
              <th className="py-3 px-4 text-left min-w-[220px] whitespace-nowrap">Algorithm Name</th>
              <th className="py-3 px-4 text-left min-w-[130px] whitespace-nowrap">Family</th>
              {isClassification ? (
                <>
                  <th className="py-3 px-4 text-right min-w-[110px] whitespace-nowrap text-indigo-300 font-bold">F1-Score (W)</th>
                  <th className="py-3 px-4 text-right min-w-[95px] whitespace-nowrap">Accuracy</th>
                  <th className="py-3 px-4 text-right min-w-[95px] whitespace-nowrap">Precision</th>
                  <th className="py-3 px-4 text-right min-w-[95px] whitespace-nowrap">Recall</th>
                  <th className="py-3 px-4 text-right min-w-[95px] whitespace-nowrap">Macro F1</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-4 text-right min-w-[110px] whitespace-nowrap text-purple-300 font-bold">R² Score</th>
                  <th className="py-3 px-4 text-right min-w-[100px] whitespace-nowrap">RMSE</th>
                  <th className="py-3 px-4 text-right min-w-[100px] whitespace-nowrap">MAE</th>
                  <th className="py-3 px-4 text-right min-w-[100px] whitespace-nowrap">MSE</th>
                </>
              )}
              <th className="py-3 px-4 text-right min-w-[120px] whitespace-nowrap">Training Time</th>
              <th className="py-3 px-4 text-center min-w-[100px] whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {sortedModels.map((m) => {
              const isBest = m.is_best;
              return (
                <tr 
                  key={m.model_key} 
                  className={`transition-colors ${
                    isBest 
                      ? 'bg-indigo-950/25 hover:bg-indigo-950/35' 
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {getRankBadge(m.rank, isBest)}
                  </td>
                  <td className="py-3 px-4 font-sans whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{m.model_name}</span>
                      {isBest && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-[10px]">
                      {m.algorithm_family}
                    </span>
                  </td>

                  {m.status === 'skipped' ? (
                    <td colSpan={isClassification ? 5 : 4} className="py-3 px-4 text-amber-400/90 font-sans text-xs italic">
                      Skipped: {m.skip_reason}
                    </td>
                  ) : isClassification ? (
                    <>
                      <td className="py-3 px-4 text-right font-bold text-indigo-300 text-xs whitespace-nowrap">
                        {m.metrics.f1_score !== undefined && m.metrics.f1_score !== null ? m.metrics.f1_score.toFixed(4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 whitespace-nowrap">
                        {m.metrics.accuracy !== undefined && m.metrics.accuracy !== null ? `${(m.metrics.accuracy * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {m.metrics.precision !== undefined && m.metrics.precision !== null ? m.metrics.precision.toFixed(4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {m.metrics.recall !== undefined && m.metrics.recall !== null ? m.metrics.recall.toFixed(4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {m.metrics.macro_f1 !== undefined && m.metrics.macro_f1 !== null ? m.metrics.macro_f1.toFixed(4) : '-'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-right font-bold text-purple-300 text-xs whitespace-nowrap">
                        {m.metrics.r2_score !== undefined && m.metrics.r2_score !== null ? m.metrics.r2_score.toFixed(4) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 whitespace-nowrap">
                        {m.metrics.rmse !== undefined && m.metrics.rmse !== null ? m.metrics.rmse.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {m.metrics.mae !== undefined && m.metrics.mae !== null ? m.metrics.mae.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {m.metrics.mse !== undefined && m.metrics.mse !== null ? m.metrics.mse.toLocaleString() : '-'}
                      </td>
                    </>
                  )}

                  <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                    <span className="inline-flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      {m.training_time_seconds.toFixed(3)}s
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {m.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        Trained
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        <AlertOctagon className="w-3 h-3 shrink-0" />
                        Skipped
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
