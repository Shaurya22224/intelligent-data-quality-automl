import React from 'react';
import { Grid, Target, CheckCircle2 } from 'lucide-react';
import { ModelMetrics } from '../../api/types';

export const ConfusionMatrixViewer: React.FC<{
  metrics: ModelMetrics;
  modelName: string;
}> = ({ metrics, modelName }) => {
  const cm = metrics.confusion_matrix;
  const labels = metrics.class_labels || [];

  if (!cm || cm.length === 0 || labels.length === 0) {
    return null;
  }

  // Find max value in matrix for relative color shading
  const flatValues = cm.flat();
  const maxVal = Math.max(...flatValues, 1);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Test Confusion Matrix</h3>
          <p className="text-xs text-slate-400">
            Actual vs Predicted class counts for <strong className="text-indigo-300">{modelName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            {labels.length} Classes
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Predicted Class →
        </div>

        <div className="flex items-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider -rotate-90 mr-2 whitespace-nowrap">
            ← Actual Class
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 p-2 bg-slate-950/60">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {labels.map((lbl) => (
                    <th key={lbl} className="p-2 font-semibold text-slate-300 text-center min-w-[70px]">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 font-semibold text-slate-300 text-right pr-3 min-w-[70px]">
                      {labels[rIdx]}
                    </td>
                    {row.map((count, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const intensity = Math.min(1, Math.max(0.1, count / maxVal));

                      return (
                        <td
                          key={cIdx}
                          className="p-3 text-center border border-slate-800 font-mono font-bold text-xs"
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(99, 102, 241, ${intensity * 0.7})`
                              : count > 0
                              ? `rgba(244, 63, 94, ${intensity * 0.5})`
                              : 'rgba(15, 23, 42, 0.4)',
                            color: isDiagonal ? '#ffffff' : count > 0 ? '#fecdd3' : '#64748b',
                          }}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Class metrics summary */}
      {metrics.classification_report && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Per-Class Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {labels.map((lbl) => {
              const classRep = metrics.classification_report?.[lbl];
              if (!classRep) return null;
              return (
                <div key={lbl} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <p className="font-bold text-white truncate">{lbl}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Precision: <strong className="text-cyan-300">{(classRep.precision * 100).toFixed(1)}%</strong></span>
                    <span>Recall: <strong className="text-purple-300">{(classRep.recall * 100).toFixed(1)}%</strong></span>
                    <span>F1: <strong className="text-emerald-300">{(classRep['f1-score'] * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
