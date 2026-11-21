import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { PreprocessingConfig } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const PreprocessingConfigForm: React.FC<{ onProcessed?: () => void }> = ({ onProcessed }) => {
  const { 
    activeDataset, 
    activeReport, 
    setPreprocessingResult, 
    setNotification, 
    setError 
  } = useApp();

  const [config, setConfig] = useState<PreprocessingConfig>({
    remove_duplicates: true,
    numeric_imputation: 'median',
    categorical_imputation: 'mode',
    categorical_encoding: 'onehot',
    numerical_scaling: 'standard',
    outlier_treatment: 'none',
    drop_columns: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-fill recommended drop columns (like IDs or constants) if available
  useEffect(() => {
    if (activeDataset && activeReport) {
      const suggestedDrops: string[] = [];
      if (activeReport.constant_columns) {
        suggestedDrops.push(...activeReport.constant_columns);
      }
      activeDataset.columns.forEach((col) => {
        if (col.is_potential_id && col.name !== activeDataset.target_column && !suggestedDrops.includes(col.name)) {
          suggestedDrops.push(col.name);
        }
      });
      if (suggestedDrops.length > 0) {
        setConfig((prev) => ({ ...prev, drop_columns: suggestedDrops }));
      }
    }
  }, [activeDataset, activeReport]);

  const applyRecommended = () => {
    if (!activeDataset) return;
    
    const newConfig: PreprocessingConfig = {
      remove_duplicates: true,
      numeric_imputation: 'median',
      categorical_imputation: 'mode',
      categorical_encoding: 'onehot',
      numerical_scaling: 'standard',
      outlier_treatment: activeReport && activeReport.outlier_stats.some((s) => s.outlier_count > 0) ? 'cap_iqr' : 'none',
      drop_columns: config.drop_columns,
    };

    setConfig(newConfig);
    setNotification('Recommended data-science preprocessing profile loaded!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDataset) return;

    setIsProcessing(true);
    try {
      const res = await api.applyPreprocessing(activeDataset.id, config);
      setPreprocessingResult(res);
      setNotification(`Data preprocessing executed successfully! Created '${res.processed_filename}'`);
      if (onProcessed) onProcessed();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute preprocessing pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDropColumn = (colName: string) => {
    setConfig((prev) => {
      const exists = prev.drop_columns.includes(colName);
      return {
        ...prev,
        drop_columns: exists
          ? prev.drop_columns.filter((c) => c !== colName)
          : [...prev.drop_columns, colName],
      };
    });
  };

  if (!activeDataset) return null;

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white">Preprocessing Pipeline Builder</h3>
          <p className="text-xs text-slate-400">
            Configure automated cleaning, imputation, scaling, and feature selection
          </p>
        </div>

        <button
          type="button"
          onClick={applyRecommended}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors cursor-pointer self-start sm:self-center"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Apply Recommended Presets</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Duplicate Handling */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Duplicate Rows Treatment
          </label>
          <p className="text-[11px] text-slate-400">
            Removes exact repeated row records to prevent data leakage across splits.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="remove_duplicates"
              checked={config.remove_duplicates}
              onChange={(e) => setConfig({ ...config, remove_duplicates: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="remove_duplicates" className="text-xs text-white font-medium cursor-pointer">
              Remove Duplicate Rows
            </label>
          </div>
        </div>

        {/* 2. Numeric Imputation */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Numeric Missing Values
          </label>
          <p className="text-[11px] text-slate-400">
            Strategy for handling NaN/null values in numerical columns.
          </p>
          <select
            value={config.numeric_imputation}
            onChange={(e) => setConfig({ ...config, numeric_imputation: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="median">Median Imputation (Recommended)</option>
            <option value="mean">Mean Imputation</option>
            <option value="drop_rows">Drop Incomplete Rows</option>
            <option value="none">No Action (Keep as is)</option>
          </select>
        </div>

        {/* 3. Categorical Imputation */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Categorical Missing Values
          </label>
          <p className="text-[11px] text-slate-400">
            Strategy for filling missing values in string/category fields.
          </p>
          <select
            value={config.categorical_imputation}
            onChange={(e) => setConfig({ ...config, categorical_imputation: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="mode">Most Frequent Mode (Recommended)</option>
            <option value="unknown">Fill with 'Unknown' Label</option>
            <option value="drop_rows">Drop Incomplete Rows</option>
            <option value="none">No Action (Keep as is)</option>
          </select>
        </div>

        {/* 4. Categorical Encoding */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Categorical Encoding
          </label>
          <p className="text-[11px] text-slate-400">
            Transforms text categories into mathematical vectors.
          </p>
          <select
            value={config.categorical_encoding}
            onChange={(e) => setConfig({ ...config, categorical_encoding: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="onehot">One-Hot Encoding (Recommended)</option>
            <option value="ordinal">Ordinal Integer Encoding</option>
            <option value="none">No Encoding (Raw strings)</option>
          </select>
        </div>

        {/* 5. Numerical Scaling */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Numerical Scaling
          </label>
          <p className="text-[11px] text-slate-400">
            Normalizes continuous numeric features to identical scales.
          </p>
          <select
            value={config.numerical_scaling}
            onChange={(e) => setConfig({ ...config, numerical_scaling: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="standard">Standard Scaling (Z-Score, μ=0, σ=1)</option>
            <option value="minmax">Min-Max Scaling [0, 1]</option>
            <option value="none">No Scaling (Raw values)</option>
          </select>
        </div>

        {/* 6. Outlier Treatment */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Outlier Treatment
          </label>
          <p className="text-[11px] text-slate-400">
            Clips or removes extreme values beyond 1.5×IQR boundaries.
          </p>
          <select
            value={config.outlier_treatment}
            onChange={(e) => setConfig({ ...config, outlier_treatment: e.target.value as any })}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="none">No Action (Retain outliers)</option>
            <option value="cap_iqr">IQR Capping (Winsorization)</option>
            <option value="remove_rows">Remove Outlier Rows</option>
          </select>
        </div>
      </div>

      {/* 7. Column Dropping / Feature Selection */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
              Drop Selected Columns ({config.drop_columns.length} selected)
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select redundant, constant, or identifier columns to exclude from downstream datasets.
            </p>
          </div>
          {config.drop_columns.length > 0 && (
            <button
              type="button"
              onClick={() => setConfig({ ...config, drop_columns: [] })}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
          {activeDataset.columns.map((col) => {
            const isTarget = col.name === activeDataset.target_column;
            const isDropped = config.drop_columns.includes(col.name);

            if (isTarget) return null; // Don't allow dropping target here

            return (
              <button
                type="button"
                key={col.name}
                onClick={() => toggleDropColumn(col.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDropped
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{col.name}</span>
                {col.is_potential_id && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    ID
                  </span>
                )}
                {col.is_constant && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">
                    Const
                  </span>
                )}
                {isDropped && <Trash2 className="w-3 h-3 text-rose-400 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Applying Pipeline...</span>
            </>
          ) : (
            <>
              <Sliders className="w-4 h-4" />
              <span>Apply Preprocessing Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
