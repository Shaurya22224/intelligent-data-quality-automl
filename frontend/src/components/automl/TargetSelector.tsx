import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Cpu, 
  Sparkles, 
  Sliders, 
  HelpCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const TargetSelector: React.FC<{ onTrainingComplete?: () => void }> = ({ onTrainingComplete }) => {
  const { 
    activeDataset, 
    setAutoMLResult, 
    setNotification, 
    setError 
  } = useApp();

  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [taskType, setTaskType] = useState<'classification' | 'regression'>('classification');
  const [testSize, setTestSize] = useState<number>(0.2);
  const [useProcessed, setUseProcessed] = useState<boolean>(true);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  useEffect(() => {
    if (activeDataset) {
      const defaultTarget = activeDataset.target_column || activeDataset.columns[activeDataset.columns.length - 1]?.name || '';
      setSelectedTarget(defaultTarget);
      
      const inferredTask = activeDataset.inferred_task_type || 'classification';
      setTaskType(inferredTask as any);
      setUseProcessed(activeDataset.has_processed_version);
    }
  }, [activeDataset]);

  const handleTargetChange = (colName: string) => {
    setSelectedTarget(colName);
    const colMeta = activeDataset?.columns.find((c) => c.name === colName);
    if (colMeta) {
      if (colMeta.inferred_type === 'numeric' && colMeta.unique_count > 15) {
        setTaskType('regression');
      } else {
        setTaskType('classification');
      }
    }
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDataset || !selectedTarget) {
      setError('Please select a valid target column to train models.');
      return;
    }

    setIsTraining(true);
    try {
      const result = await api.trainAutoML({
        dataset_id: activeDataset.id,
        target_column: selectedTarget,
        task_type: taskType,
        test_size: testSize,
        use_processed_data: useProcessed,
      });

      setAutoMLResult(result);
      setNotification(`AutoML Training Completed! Best model: ${result.best_model.model_name}`);
      if (onTrainingComplete) onTrainingComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AutoML training failed. Please check target suitability.');
    } finally {
      setIsTraining(false);
    }
  };

  if (!activeDataset) return null;

  return (
    <form onSubmit={handleTrain} className="glass-panel-glow p-6 rounded-3xl border border-slate-700/80 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AutoML Training Configuration</h3>
            <p className="text-xs text-slate-400">
              Trains 9 scikit-learn pipelines with cross-validated evaluation and zero data leakage
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Target Column Selector */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
            Target Column (y)
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            {activeDataset.columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.inferred_type}, {col.unique_count} uniq)
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Feature to predict during inference.
          </p>
        </div>

        {/* 2. Task Type & Override */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              ML Task Type
            </label>
            <span className="text-[10px] text-indigo-400 font-semibold">
              Auto-Inferred
            </span>
          </div>
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setTaskType('classification')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                taskType === 'classification'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classification
            </button>
            <button
              type="button"
              onClick={() => setTaskType('regression')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                taskType === 'regression'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Regression
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            {taskType === 'classification' ? 'Predicts discrete categories/classes' : 'Estimates continuous numeric quantities'}
          </p>
        </div>

        {/* 3. Train/Test Split Slider */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Test Split Ratio
            </label>
            <span className="text-xs font-bold text-indigo-300 font-mono">
              {(testSize * 100).toFixed(0)}% Test / {((1 - testSize) * 100).toFixed(0)}% Train
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.40"
            step="0.05"
            value={testSize}
            onChange={(e) => setTestSize(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[10px] text-slate-400">
            Random State fixed at seed 42 for reproducible evaluation.
          </p>
        </div>

        {/* 4. Data Source Choice */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
            Input Dataset Version
          </label>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="use_processed"
              checked={useProcessed}
              disabled={!activeDataset.has_processed_version}
              onChange={(e) => setUseProcessed(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="use_processed" className="text-xs text-white font-medium cursor-pointer">
              {activeDataset.has_processed_version ? 'Use Preprocessed CSV' : 'Use Original CSV'}
            </label>
          </div>
          <p className="text-[10px] text-slate-400">
            {activeDataset.has_processed_version 
              ? 'Includes applied imputations and scaling'
              : 'Applies automated dynamic ColumnTransformer on raw data'}
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>
            {taskType === 'classification'
              ? 'Trains 9 Models: Logistic Regression, Decision Tree, Random Forest, Extra Trees, Gradient Boosting, AdaBoost, KNN, SVC, and Gaussian NB.'
              : 'Trains 9 Models: Linear Regression, Ridge, Decision Tree, Random Forest, Extra Trees, Gradient Boosting, AdaBoost, KNN, and SVR.'}
          </span>
        </div>

        <button
          type="submit"
          disabled={isTraining}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isTraining ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Training 9 ML Models in Parallel...</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Train & Compare Models</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
