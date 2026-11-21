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
import { AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { ClassDistribution } from '../../api/types';

export const ClassDistributionChart: React.FC<{ distribution?: ClassDistribution | null }> = ({
  distribution,
}) => {
  if (!distribution) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
        <Target className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        Select a target column in the dataset preview or AutoML page to inspect class balance and distribution.
      </div>
    );
  }

  const chartData = Object.entries(distribution.classes).map(([cls, count]) => ({
    className: cls,
    count,
    percentage: distribution.percentages[cls] || 0,
  }));

  const colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Target Class Distribution</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {distribution.target_column}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Breakdown across {Object.keys(distribution.classes).length} distinct class labels
          </p>
        </div>

        {distribution.is_imbalanced ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 self-start sm:self-center">
            <AlertTriangle className="w-3.5 h-3.5" />
            Class Imbalance Detected ({distribution.imbalance_ratio}:1 ratio)
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 self-start sm:self-center">
            <CheckCircle className="w-3.5 h-3.5" />
            Balanced Class Distribution
          </span>
        )}
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="className" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
                      <p className="font-bold text-white">Class: {d.className}</p>
                      <p className="text-indigo-300">Samples: <strong>{d.count.toLocaleString()}</strong></p>
                      <p className="text-purple-300">Share: <strong>{d.percentage}%</strong></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Class distribution cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {chartData.map((c, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 truncate">{c.className}</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">{c.count.toLocaleString()}</span>
              <span className="text-xs font-semibold text-indigo-400">{c.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
