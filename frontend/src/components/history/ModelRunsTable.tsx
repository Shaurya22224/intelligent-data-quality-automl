import React from 'react';
import { 
  Trophy, 
  Download, 
  Calendar, 
  Layers, 
  Target, 
  Cpu 
} from 'lucide-react';
import { api } from '../../api/client';

export const ModelRunsTable: React.FC<{ runs: any[] }> = ({ runs }) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Model Training Runs History</h3>
          <p className="text-xs text-slate-400">
            Archived AutoML experiments, hyperparameter logs, and saved model artifacts
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          {runs.length} Saved Run(s)
        </span>
      </div>

      {runs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          No previous model training runs recorded yet. Launch a run in AutoML Hub.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Target Feature</th>
                <th className="py-3 px-4">Task Type</th>
                <th className="py-3 px-4">Winning Model</th>
                <th className="py-3 px-4 text-right">Top Score</th>
                <th className="py-3 px-4">Executed At</th>
                <th className="py-3 px-4 text-center">Artifact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {runs.map((r) => (
                <tr key={r.run_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-400">
                    {r.run_id.slice(0, 12)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {r.target_column}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.task_type === 'classification'
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    }`}>
                      {r.task_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{r.best_model_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {typeof r.best_model_score === 'number' ? r.best_model_score.toFixed(4) : r.best_model_score}{' '}
                    <span className="text-[10px] text-slate-500 font-sans font-normal">({r.best_model_metric})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <a
                      href={api.getModelDownloadUrl(r.run_id)}
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>.joblib</span>
                    </a>
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
