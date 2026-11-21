import React from 'react';
import { 
  Trophy, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Activity
} from 'lucide-react';
import { AutoMLTrainResponse } from '../../api/types';
import { api } from '../../api/client';

export const BestModelRecommendation: React.FC<{ result: AutoMLTrainResponse }> = ({ result }) => {
  const { best_model, recommendation_summary, recommendation_details, run_id, task_type } = result;
  const isClassification = task_type === 'classification';

  return (
    <div className="glass-panel-glow p-6 rounded-3xl border border-amber-500/30 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Winning Champion
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Run ID: {run_id.slice(0, 8)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {best_model.model_name}
            </h2>
          </div>
        </div>

        {/* Download Button */}
        <a
          href={api.getModelDownloadUrl(run_id)}
          download
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white text-xs font-bold shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Trained Pipeline (.joblib)</span>
        </a>
      </div>

      {/* Rationale & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Recommendation Rationale
          </h4>
          <p className="text-sm font-semibold text-white leading-relaxed">
            {recommendation_summary}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {recommendation_details}
          </p>
        </div>

        {/* Metrics Spotlight */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Key Performance Metrics
          </p>
          {isClassification ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Weighted F1-Score:</span>
                <span className="font-bold text-indigo-300 font-mono">
                  {best_model.metrics.f1_score?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Accuracy:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {best_model.metrics.accuracy ? `${(best_model.metrics.accuracy * 100).toFixed(1)}%` : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Precision:</span>
                <span className="font-bold text-cyan-300 font-mono">
                  {best_model.metrics.precision?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Recall:</span>
                <span className="font-bold text-purple-300 font-mono">
                  {best_model.metrics.recall?.toFixed(4)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">R² Determination:</span>
                <span className="font-bold text-purple-300 font-mono">
                  {best_model.metrics.r2_score?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Root Mean Squared Error:</span>
                <span className="font-bold text-slate-200 font-mono">
                  {best_model.metrics.rmse?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Mean Absolute Error:</span>
                <span className="font-bold text-slate-200 font-mono">
                  {best_model.metrics.mae?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
