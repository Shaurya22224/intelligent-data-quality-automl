import React from 'react';
import { AlertTriangle, GitCompare, Info } from 'lucide-react';
import { QualityReportResponse } from '../../api/types';

export const CorrelationHeatmap: React.FC<{ report: QualityReportResponse }> = ({ report }) => {
  const numericCols = report.numeric_columns || [];
  const matrix = report.correlation_matrix || {};
  const highPairs = report.highly_correlated_pairs || [];

  const getCellColor = (val: number) => {
    if (val === 1.0) return 'bg-indigo-600/80 text-white font-bold';
    if (val >= 0.8) return 'bg-indigo-500/60 text-indigo-100 font-bold';
    if (val >= 0.5) return 'bg-indigo-500/30 text-indigo-200';
    if (val >= 0.2) return 'bg-indigo-500/15 text-indigo-300';
    if (val <= -0.8) return 'bg-rose-500/60 text-rose-100 font-bold';
    if (val <= -0.5) return 'bg-rose-500/30 text-rose-200';
    if (val <= -0.2) return 'bg-rose-500/15 text-rose-300';
    return 'bg-slate-900/40 text-slate-400';
  };

  if (numericCols.length < 2) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
        <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        At least 2 numeric columns are required to calculate a Pearson correlation matrix.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white">Pearson Correlation Matrix</h3>
          <p className="text-xs text-slate-400">
            Linear inter-feature relationships and multicollinearity detection
          </p>
        </div>

        {highPairs.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {highPairs.length} High Correlation Pair(s) (|r| ≥ 0.75)
          </span>
        )}
      </div>

      {/* Multicollinearity Alerts */}
      {highPairs.length > 0 && (
        <div className="space-y-2">
          {highPairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">
                  {pair.feature1} <span className="text-slate-400">↔</span> {pair.feature2}
                </span>
                <span className="text-slate-400 text-[11px]">({pair.description})</span>
              </div>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                r = {pair.correlation > 0 ? `+${pair.correlation}` : pair.correlation}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800">
              <th className="py-2.5 px-3 font-semibold text-slate-400 text-left">Feature</th>
              {numericCols.map((c) => (
                <th key={c} className="py-2.5 px-3 font-semibold text-slate-300 truncate max-w-[100px]" title={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {numericCols.map((rCol) => (
              <tr key={rCol} className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-semibold text-slate-300 text-left font-sans truncate max-w-[120px]" title={rCol}>
                  {rCol}
                </td>
                {numericCols.map((cCol) => {
                  const val = matrix[rCol]?.[cCol] ?? (rCol === cCol ? 1.0 : 0.0);
                  return (
                    <td key={cCol} className={`py-2 px-3 border border-slate-800/40 ${getCellColor(val)}`}>
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
