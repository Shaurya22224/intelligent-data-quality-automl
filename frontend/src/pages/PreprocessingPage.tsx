import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet,
  Download,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PreprocessingConfigForm } from '../components/preprocessing/PreprocessingConfigForm';
import { BeforeAfterDiff } from '../components/preprocessing/BeforeAfterDiff';
import { DataPreviewTable } from '../components/dataset/DataPreviewTable';

export const PreprocessingPage: React.FC = () => {
  const { activeDataset, latestPreprocessing, setActiveTab } = useApp();

  if (!activeDataset) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Dataset Loaded</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload or select a dataset first to configure and run the preprocessing pipeline.
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
        <h1 className="text-2xl font-bold text-white">Data Preprocessing Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Clean, impute missing values, scale features, and cap outliers for <strong className="text-indigo-300">{activeDataset.original_name}</strong>
        </p>
      </div>

      {/* Preprocessing Config Form */}
      <PreprocessingConfigForm />

      {/* Before / After Diff Result */}
      {latestPreprocessing && (
        <BeforeAfterDiff result={latestPreprocessing} />
      )}

      {/* Dataset Explorer with Processed View */}
      <div className="pt-4 border-t border-slate-800">
        <DataPreviewTable />
      </div>
    </div>
  );
};
