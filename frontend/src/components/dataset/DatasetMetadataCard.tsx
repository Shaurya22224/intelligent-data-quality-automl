import React from 'react';
import { 
  FileSpreadsheet, 
  Rows, 
  Columns, 
  HardDrive, 
  Target, 
  Calendar, 
  Download, 
  Trash2,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const DatasetMetadataCard: React.FC = () => {
  const { activeDataset, deleteDataset, setActiveTab } = useApp();

  if (!activeDataset) return null;

  return (
    <div className="glass-panel-glow p-6 rounded-3xl border border-slate-700/80">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white truncate max-w-md">
                {activeDataset.original_name}
              </h2>
              {activeDataset.is_sample && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Sample Dataset
                </span>
              )}
              {activeDataset.has_processed_version && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Processed Version Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Uploaded {new Date(activeDataset.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>ID: {activeDataset.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.getDownloadUrl(activeDataset.id, false)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download Original</span>
          </a>

          {activeDataset.has_processed_version && (
            <a
              href={api.getDownloadUrl(activeDataset.id, true)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Processed</span>
            </a>
          )}

          <button
            onClick={() => setActiveTab('automl')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Train AutoML</span>
          </button>

          <button
            onClick={() => deleteDataset(activeDataset.id)}
            title="Delete dataset"
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Rows className="w-4 h-4 text-indigo-400" />
            <span>Total Rows</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-white">
            {activeDataset.row_count.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Columns className="w-4 h-4 text-purple-400" />
            <span>Total Columns</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-white">
            {activeDataset.column_count}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>File Size</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-white">
            {activeDataset.file_size_formatted}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Target Column</span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-indigo-300 truncate">
            {activeDataset.target_column || 'None Selected'}
          </p>
        </div>
      </div>
    </div>
  );
};
