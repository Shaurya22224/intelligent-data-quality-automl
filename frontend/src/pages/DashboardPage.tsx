import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  Sliders, 
  Cpu, 
  UploadCloud, 
  Database, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { SampleDataButtons } from '../components/dataset/SampleDataButtons';
import { FileUpload } from '../components/dataset/FileUpload';
import { api } from '../api/client';
import { HistoryOverviewResponse } from '../api/types';

export const DashboardPage: React.FC = () => {
  const { 
    datasets, 
    activeDataset, 
    selectDataset, 
    setActiveTab 
  } = useApp();

  const [historyOverview, setHistoryOverview] = useState<HistoryOverviewResponse | null>(null);

  useEffect(() => {
    loadOverview();
  }, [datasets]);

  const loadOverview = async () => {
    try {
      const data = await api.getHistoryOverview();
      setHistoryOverview(data);
    } catch (err) {
      console.error('Failed to fetch history overview:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow border border-indigo-500/25 p-8 sm:p-10">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5th Semester Academic Minor Project</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Intelligent Data Quality Assessment & AutoML Assistant
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            An end-to-end automated platform for tabular CSV datasets. Automatically inspect missing values, duplicates, and outliers, compute a transparent quality score (0–100), execute tailored preprocessing pipelines, and train 9 machine learning models with zero data leakage.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Custom Dataset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              disabled={!activeDataset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>View Active Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Stored Datasets"
          value={historyOverview?.total_datasets ?? datasets.length}
          subtitle="Original & processed CSV files loaded"
          icon={<Database className="w-5 h-5" />}
          badge={{ text: 'Ready', type: 'success' }}
        />
        <MetricCard
          title="Quality Audits"
          value={historyOverview?.total_reports ?? 0}
          subtitle="Computed quality benchmark reports"
          icon={<ShieldCheck className="w-5 h-5" />}
          badge={{ text: '0-100 Score', type: 'info' }}
        />
        <MetricCard
          title="AutoML Model Runs"
          value={historyOverview?.total_model_runs ?? 0}
          subtitle="Trained pipelines & saved joblib models"
          icon={<Cpu className="w-5 h-5" />}
          badge={{ text: '9 Algorithms', type: 'warning' }}
        />
      </div>

      {/* Quick Load Sample Datasets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Quick Demo Datasets
          </h2>
          <span className="text-xs text-slate-400">One-click demonstration</span>
        </div>
        <SampleDataButtons />
      </div>

      {/* Quick Upload Zone */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Upload Custom Tabular CSV</h3>
          <span className="text-xs text-slate-400">Works with any valid CSV structure</span>
        </div>
        <FileUpload onUploadSuccess={() => setActiveTab('upload')} />
      </div>

      {/* Recent Model Runs Leaderboard */}
      {historyOverview && historyOverview.recent_model_runs.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recent AutoML Champions</h3>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View All Runs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {historyOverview.recent_model_runs.slice(0, 3).map((r: any) => (
              <div
                key={r.run_id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {r.task_type}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {typeof r.best_model_score === 'number' ? r.best_model_score.toFixed(4) : r.best_model_score}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">
                  {r.best_model_name}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  Target: <strong className="text-slate-200">{r.target_column}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
