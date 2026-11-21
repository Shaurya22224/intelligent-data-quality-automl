import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  Cpu, 
  Layers, 
  TrendingDown, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { PreprocessingResponse } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const BeforeAfterDiff: React.FC<{ result: PreprocessingResponse }> = ({ result }) => {
  const { setActiveTab } = useApp();
  const { before_stats, after_stats, applied_steps, dataset_id, processed_filename } = result;

  const rowsDelta = after_stats.rows - before_stats.rows;
  const missingDelta = after_stats.missing_values - before_stats.missing_values;
  const colsDelta = after_stats.columns - before_stats.columns;

  return (
    <div className="glass-panel-glow p-6 rounded-3xl border border-slate-700/80 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Preprocessing Results & Audit</h3>
            <p className="text-xs text-slate-400">
              Cleaned dataset generated: <span className="font-mono text-indigo-300">{processed_filename}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getDownloadUrl(dataset_id, true)}
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Processed CSV</span>
          </a>

          <button
            onClick={() => setActiveTab('automl')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Proceed to AutoML</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Before vs After Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rows */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Rows</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">
              {after_stats.rows.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              was {before_stats.rows}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
            {rowsDelta === 0 ? (
              <span className="text-slate-400">No rows dropped</span>
            ) : (
              <span className="text-amber-400 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {rowsDelta} rows ({((rowsDelta / before_stats.rows) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* Missing Values */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Missing Values</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400">
              {after_stats.missing_values}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              was {before_stats.missing_values}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>{Math.abs(missingDelta)} gaps resolved</span>
          </div>
        </div>

        {/* Columns */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Features</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">
              {after_stats.columns}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              was {before_stats.columns}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
            {colsDelta >= 0 ? (
              <span className="text-indigo-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{colsDelta} features (encoded)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {colsDelta} dropped
              </span>
            )}
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Memory Usage</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">
              {after_stats.memory_usage_mb} MB
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              was {before_stats.memory_usage_mb} MB
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Optimized in-memory footprint
          </div>
        </div>
      </div>

      {/* Applied Steps Audit Log */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Applied Transformation Sequence
          </h4>
        </div>

        <ul className="space-y-2">
          {applied_steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
