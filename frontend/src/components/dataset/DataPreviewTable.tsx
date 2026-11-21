import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Check, 
  AlertCircle,
  Hash,
  Type,
  ToggleLeft,
  Key
} from 'lucide-react';
import { api } from '../../api/client';
import { DatasetPreviewResponse } from '../../api/types';
import { useApp } from '../../context/AppContext';

export const DataPreviewTable: React.FC = () => {
  const { activeDataset } = useApp();
  const [useProcessed, setUseProcessed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewData, setPreviewData] = useState<DatasetPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeDataset) {
      loadPreview(page, pageSize, useProcessed);
    }
  }, [activeDataset, page, pageSize, useProcessed]);

  const loadPreview = async (p: number, ps: number, proc: boolean) => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const data = await api.previewDataset(activeDataset.id, p, ps, proc);
      setPreviewData(data);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeDataset) return null;

  const filteredData = previewData?.data.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    );
  }) || [];

  const getTypeIcon = (typeStr: string) => {
    if (typeStr.includes('int') || typeStr.includes('float')) {
      return <Hash className="w-3 h-3 text-cyan-400" />;
    }
    if (typeStr.includes('bool')) {
      return <ToggleLeft className="w-3 h-3 text-amber-400" />;
    }
    return <Type className="w-3 h-3 text-purple-400" />;
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Dataset Records Explorer</h3>
            <p className="text-xs text-slate-400">
              Viewing {previewData?.total_rows || 0} rows across {previewData?.total_columns || 0} columns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Version Switch (Original vs Processed) */}
          {activeDataset.has_processed_version && (
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => { setUseProcessed(false); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  !useProcessed
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => { setUseProcessed(true); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  useProcessed
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Processed
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search table values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10 rows</option>
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Loading records...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No matching records found.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
                <th className="py-3 px-4 font-semibold text-slate-500 w-12 text-center">#</th>
                {previewData?.columns.map((col) => {
                  const isTarget = col === activeDataset.target_column;
                  const colType = previewData.column_types[col] || 'unknown';
                  return (
                    <th key={col} className="py-3 px-4 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={isTarget ? 'text-indigo-300 font-bold' : 'text-slate-200'}>
                          {col}
                        </span>
                        {isTarget && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            TARGET
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-normal">
                        {getTypeIcon(colType)}
                        <span>{colType}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((row, idx) => {
                const rowNum = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-600">
                      {rowNum}
                    </td>
                    {previewData?.columns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      const isTarget = col === activeDataset.target_column;

                      return (
                        <td 
                          key={col} 
                          className={`py-2.5 px-4 whitespace-nowrap font-mono text-[11px] ${
                            isTarget ? 'bg-indigo-950/20 text-indigo-200' : 'text-slate-300'
                          }`}
                        >
                          {isNull ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                              null
                            </span>
                          ) : typeof val === 'number' ? (
                            val.toLocaleString()
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {previewData && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <p>
            Showing Page <span className="font-semibold text-white">{page}</span> of{' '}
            <span className="font-semibold text-white">{previewData.total_pages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-semibold text-indigo-300">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(previewData.total_pages, p + 1))}
              disabled={page >= previewData.total_pages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
