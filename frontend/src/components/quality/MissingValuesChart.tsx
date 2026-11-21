import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { QualityReportResponse } from '../../api/types';

export const MissingValuesChart: React.FC<{ report: QualityReportResponse }> = ({ report }) => {
  // Combine numeric and categorical columns missing stats
  const allStats = [...report.numeric_stats, ...report.categorical_stats];
  const missingData = allStats
    .map((stat) => {
      const missingCount = report.total_rows - stat.count;
      const missingPct = round((missingCount / report.total_rows) * 100, 2);
      return {
        column: stat.column,
        missingCount,
        missingPct,
        completenessPct: round(100 - missingPct, 2),
      };
    })
    .filter((d) => d.missingCount > 0)
    .sort((a, b) => b.missingPct - a.missingPct);

  function round(val: number, decimals: number) {
    return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
  }

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white">Missing Values Distribution</h3>
          <p className="text-xs text-slate-400">
            Detected {report.total_missing_cells} missing cell(s) ({report.total_missing_percentage}% of total dataset)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            {missingData.length} column(s) affected
          </span>
        </div>
      </div>

      {missingData.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-300">Complete Dataset!</p>
          <p className="text-xs text-emerald-400/80 mt-1">
            Zero missing or null values found in any feature column.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="column" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
                          <p className="font-bold text-white">{d.column}</p>
                          <p className="text-rose-400">
                            Missing: <strong>{d.missingCount} rows ({d.missingPct}%)</strong>
                          </p>
                          <p className="text-emerald-400">
                            Completeness: <strong>{d.completenessPct}%</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="missingPct" radius={[6, 6, 0, 0]}>
                  {missingData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.missingPct > 20 ? '#f43f5e' : entry.missingPct > 5 ? '#f59e0b' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {missingData.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-white truncate max-w-[140px]">{item.column}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.missingCount} empty records</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                  item.missingPct > 20
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {item.missingPct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
