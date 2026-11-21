import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { AutoMLTrainResponse } from '../../api/types';

export const ModelMetricsComparisonChart: React.FC<{ result: AutoMLTrainResponse }> = ({ result }) => {
  const isClassification = result.task_type === 'classification';

  // Defensively sort successful models by rank so the chart uses the identical order as the leaderboard
  const chartData = useMemo(() => {
    return [...result.models]
      .filter((m) => m.status === 'success')
      .sort((a, b) => {
        const aRank = typeof a.rank === 'number' && a.rank > 0 ? a.rank : 9999;
        const bRank = typeof b.rank === 'number' && b.rank > 0 ? b.rank : 9999;
        return aRank - bRank;
      })
      .map((m) => {
        const shortName = m.model_name
          .replace(' Classifier', '')
          .replace(' Regressor', '')
          .replace(' Regression', '')
          .replace(' (SVC)', '')
          .replace(' (SVR)', '');

        if (isClassification) {
          return {
            name: shortName,
            F1Score: m.metrics.f1_score ? parseFloat((m.metrics.f1_score * 100).toFixed(2)) : 0,
            Accuracy: m.metrics.accuracy ? parseFloat((m.metrics.accuracy * 100).toFixed(2)) : 0,
            Precision: m.metrics.precision ? parseFloat((m.metrics.precision * 100).toFixed(2)) : 0,
            Recall: m.metrics.recall ? parseFloat((m.metrics.recall * 100).toFixed(2)) : 0,
            isBest: m.is_best,
          };
        } else {
          return {
            name: shortName,
            R2Score: m.metrics.r2_score ? parseFloat((m.metrics.r2_score * 100).toFixed(2)) : 0,
            MAE: m.metrics.mae || 0,
            RMSE: m.metrics.rmse || 0,
            isBest: m.is_best,
          };
        }
      });
  }, [result.models, isClassification]);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Algorithm Performance Comparison</h3>
          <p className="text-xs text-slate-400">
            {isClassification ? 'Evaluation across test metrics (%) sorted by leaderboard rank' : 'Explained Variance (R² %) across algorithms sorted by leaderboard rank'}
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              interval={0}
              angle={-25}
              textAnchor="end"
              height={55}
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
            />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
                      <p className="font-bold text-white mb-1">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                          {entry.name}: <strong>{entry.value}%</strong>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {isClassification ? (
              <>
                <Bar dataKey="F1Score" name="Weighted F1 (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Accuracy" name="Accuracy (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" name="Precision (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" name="Recall (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <>
                <Bar dataKey="R2Score" name="R² Score (%)" fill="#a855f7" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isBest ? '#ec4899' : '#8b5cf6'} />
                  ))}
                </Bar>
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
