import React from 'react';
import { 
  FileSpreadsheet, 
  Trash2, 
  Download, 
  Calendar, 
  HardDrive, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { DatasetSummary } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const DatasetHistoryTable: React.FC<{ datasets: DatasetSummary[] }> = ({ datasets }) => {
  const { activeDataset, selectDataset, deleteDataset, setActiveTab } = useApp();

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Dataset Upload History</h3>
          <p className="text-xs text-slate-400">
            All stored original and processed dataset records ({datasets.length} total)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
              <th className="py-3 px-4">Dataset Name</th>
              <th className="py-3 px-4">Rows / Cols</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Target Feature</th>
              <th className="py-3 px-4">Uploaded</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {datasets.map((d) => {
              const isActive = activeDataset?.id === d.id;
              return (
                <tr key={d.id} className={`hover:bg-slate-900/40 transition-colors ${isActive ? 'bg-indigo-950/20' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white truncate max-w-[200px]">{d.original_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {d.id.slice(0, 8)}</p>
                      </div>
                      {d.is_sample && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Sample</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {d.row_count.toLocaleString()} × {d.column_count}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {d.file_size_formatted}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-mono">
                      {d.target_column || 'None'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { selectDataset(d.id); setActiveTab('quality'); }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30"
                      >
                        Inspect
                      </button>
                      <a
                        href={api.getDownloadUrl(d.id, false)}
                        download
                        title="Download CSV"
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteDataset(d.id)}
                        title="Delete dataset"
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
