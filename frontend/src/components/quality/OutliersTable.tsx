import React from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { OutlierColumnStats } from '../../api/types';

export const OutliersTable: React.FC<{ outlierStats: OutlierColumnStats[] }> = ({ outlierStats }) => {
  const detected = outlierStats.filter((s) => s.outlier_count > 0);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">IQR Outlier Detection</h3>
          <p className="text-xs text-slate-400">
            Identifies numerical anomalies outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR] boundaries
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          {detected.length} feature(s) with outliers
        </span>
      </div>

      {detected.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-300">No Extreme Outliers Found!</p>
          <p className="text-xs text-emerald-400/80 mt-1">
            All numeric distributions fall within standard IQR variance bounds.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
                <th className="py-3 px-4 font-semibold">Numeric Feature</th>
                <th className="py-3 px-4 font-semibold text-center">Outliers Found</th>
                <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">Lower Bound</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">Upper Bound</th>
                <th className="py-3 px-4 font-semibold font-mono text-right">Actual [Min, Max]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {detected.map((stat) => (
                <tr key={stat.column} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-white">
                    {stat.column}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      <AlertOctagon className="w-3 h-3" />
                      {stat.outlier_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-300">
                    {stat.outlier_percentage}%
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {stat.lower_bound.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {stat.upper_bound.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    [{stat.min_value.toLocaleString()}, {stat.max_value.toLocaleString()}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
