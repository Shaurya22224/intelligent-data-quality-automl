import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';
import { RecommendationItem } from '../../api/types';
import { useApp } from '../../context/AppContext';

export const RecommendationsList: React.FC<{ recommendations: RecommendationItem[] }> = ({
  recommendations,
}) => {
  const { setActiveTab } = useApp();

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'low':
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Automated Preprocessing Recommendations</h3>
            <p className="text-xs text-slate-400">
              Data-driven preprocessing strategies tailored specifically to this dataset
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('preprocessing')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-center"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Go to Preprocessing Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-300">Clean Dataset</p>
          <p className="text-xs text-emerald-400/80 mt-1">
            No mandatory preprocessing transformations needed before training.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 card-hover flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    {rec.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(rec.priority)}`}>
                    {rec.priority} Priority
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  {rec.action}
                </h4>

                <p className="text-xs text-slate-300 font-medium">
                  {rec.issue}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {rec.rationale}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Config: <code className="font-mono text-indigo-300">{rec.suggested_config_key}</code></span>
                <button
                  onClick={() => setActiveTab('preprocessing')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Configure</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
