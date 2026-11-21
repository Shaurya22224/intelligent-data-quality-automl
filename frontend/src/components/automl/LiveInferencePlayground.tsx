import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, Zap, ArrowRight, Activity } from 'lucide-react';
import { AutoMLTrainResponse, PredictResponse } from '../../api/types';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const LiveInferencePlayground: React.FC<{ result: AutoMLTrainResponse }> = ({ result }) => {
  const { activeDataset, setError } = useApp();
  const { run_id, feature_names, best_model, task_type } = result;

  // Initialize feature values with sample values from metadata if available
  const [featureInputs, setFeatureInputs] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    feature_names.forEach((feat) => {
      const meta = activeDataset?.columns.find((c) => c.name === feat);
      if (meta && meta.sample_values && meta.sample_values.length > 0) {
        init[feat] = meta.sample_values[0];
      } else {
        init[feat] = '';
      }
    });
    return init;
  });

  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const pred = await api.predictLive(run_id, featureInputs);
      setPredictionResult(pred);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Live prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleInputChange = (feat: string, val: string) => {
    const meta = activeDataset?.columns.find((c) => c.name === feat);
    let parsedVal: any = val;
    if (meta && meta.inferred_type === 'numeric' && val !== '') {
      parsedVal = isNaN(Number(val)) ? val : Number(val);
    }
    setFeatureInputs((prev) => ({ ...prev, [feat]: parsedVal }));
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live Model Inference Playground</h3>
            <p className="text-xs text-slate-400">
              Test real-time predictions using the winning <strong className="text-indigo-300">{best_model.model_name}</strong> pipeline
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePredict} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {feature_names.map((feat) => {
            const meta = activeDataset?.columns.find((c) => c.name === feat);
            return (
              <div key={feat} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 truncate max-w-[120px]" title={feat}>
                    {feat}
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {meta?.inferred_type || 'text'}
                  </span>
                </div>
                <input
                  type="text"
                  value={featureInputs[feat] ?? ''}
                  onChange={(e) => handleInputChange(feat, e.target.value)}
                  placeholder={`e.g. ${meta?.sample_values?.[0] ?? 'value'}`}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Inputs are automatically processed through the fitted training transformers before scoring.
          </p>

          <button
            type="submit"
            disabled={isPredicting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPredicting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Predict Output</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Prediction Output Card */}
      {predictionResult && (
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Predicted Result
              </span>
              <span className="text-xs text-slate-400">Target: {result.target_column}</span>
            </div>
            <p className="text-2xl font-black text-white mt-1">
              {String(predictionResult.prediction)}
            </p>
          </div>

          {predictionResult.probabilities && (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {Object.entries(predictionResult.probabilities).map(([lbl, prob]) => (
                <div key={lbl} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs min-w-[90px]">
                  <p className="text-[10px] text-slate-400 truncate">{lbl}</p>
                  <p className="text-sm font-bold text-indigo-300 mt-0.5 font-mono">
                    {(prob * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
