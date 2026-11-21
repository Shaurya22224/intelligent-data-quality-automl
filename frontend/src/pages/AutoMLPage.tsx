import React from 'react';
import { 
  Cpu, 
  Sparkles, 
  Trophy, 
  Download, 
  Play, 
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TargetSelector } from '../components/automl/TargetSelector';
import { ModelLeaderboard } from '../components/automl/ModelLeaderboard';
import { ModelMetricsComparisonChart } from '../components/automl/ModelMetricsComparisonChart';
import { ConfusionMatrixViewer } from '../components/automl/ConfusionMatrixViewer';
import { BestModelRecommendation } from '../components/automl/BestModelRecommendation';
import { LiveInferencePlayground } from '../components/automl/LiveInferencePlayground';

export const AutoMLPage: React.FC = () => {
  const { activeDataset, latestAutoMLResult, setActiveTab } = useApp();

  if (!activeDataset) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Dataset Selected for AutoML</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload or load a dataset first to start automated machine learning model training.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AutoML Model Training Hub</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated multi-algorithm training, ranking, evaluation, and serialized model deployment
        </p>
      </div>

      {/* Target & Training Config */}
      <TargetSelector />

      {/* Trained Results Section */}
      {latestAutoMLResult && (
        <div className="space-y-8 pt-4 border-t border-slate-800">
          {/* Best Model Recommendation Spotlight */}
          <BestModelRecommendation result={latestAutoMLResult} />

          {/* Leaderboard Table */}
          <ModelLeaderboard result={latestAutoMLResult} />

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModelMetricsComparisonChart result={latestAutoMLResult} />

            {latestAutoMLResult.task_type === 'classification' && latestAutoMLResult.best_model.metrics && (
              <ConfusionMatrixViewer
                metrics={latestAutoMLResult.best_model.metrics}
                modelName={latestAutoMLResult.best_model.model_name}
              />
            )}
          </div>

          {/* Live Single-Instance Inference Playground */}
          <LiveInferencePlayground result={latestAutoMLResult} />
        </div>
      )}
    </div>
  );
};
