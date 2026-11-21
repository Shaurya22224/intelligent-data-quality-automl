import React, { useState } from 'react';
import { Hash, Type, Table } from 'lucide-react';
import { QualityReportResponse } from '../../api/types';

export const ColumnStatsTable: React.FC<{ report: QualityReportResponse }> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'numeric' | 'categorical'>('numeric');

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Statistical Profiles by Feature</h3>
          <p className="text-xs text-slate-400">
            Comprehensive univariate summaries for all columns
          </p>
        </div>

        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('numeric')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'numeric'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Numeric ({report.numeric_stats.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categorical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'categorical'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Categorical ({report.categorical_stats.length})</span>
          </button>
        </div>
      </div>

      {/* Numeric Stats Table */}
      {activeTab === 'numeric' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-right">Count</th>
                <th className="py-3 px-4 text-right">Mean</th>
                <th className="py-3 px-4 text-right">Std Dev</th>
                <th className="py-3 px-4 text-right">Min</th>
                <th className="py-3 px-4 text-right">Q25</th>
                <th className="py-3 px-4 text-right text-indigo-300">Median</th>
                <th className="py-3 px-4 text-right">Q75</th>
                <th className="py-3 px-4 text-right">Max</th>
                <th className="py-3 px-4 text-right">IQR</th>
                <th className="py-3 px-4 text-right">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {report.numeric_stats.map((row) => (
                <tr key={row.column} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-4 font-sans font-semibold text-white">
                    {row.column}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.count}</td>
                  <td className="py-2.5 px-4 text-right text-slate-200">{row.mean.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.std.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.min.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.q25.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-indigo-300">{row.median.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.q75.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.max.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-300">{row.iqr.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.skewness ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Categorical Stats Table */}
      {activeTab === 'categorical' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-right">Non-Null Count</th>
                <th className="py-3 px-4 text-right">Unique Values</th>
                <th className="py-3 px-4">Most Frequent (Mode)</th>
                <th className="py-3 px-4 text-right">Mode Frequency</th>
                <th className="py-3 px-4 text-right">Mode Share</th>
                <th className="py-3 px-4 text-right">Cardinality Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {report.categorical_stats.map((row) => (
                <tr key={row.column} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-4 font-sans font-semibold text-white">
                    {row.column}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.count}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-purple-300">{row.unique_count}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                      {row.top_value ?? 'None'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-300">{row.top_frequency}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-400">{row.top_percentage}%</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{row.cardinality_ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
