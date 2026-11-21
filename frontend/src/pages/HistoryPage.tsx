import React, { useEffect, useState } from 'react';
import { 
  History, 
  Database, 
  Cpu, 
  ShieldCheck, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { MetricCard } from '../components/common/MetricCard';
import { DatasetHistoryTable } from '../components/history/DatasetHistoryTable';
import { ModelRunsTable } from '../components/history/ModelRunsTable';

export const HistoryPage: React.FC = () => {
  const { datasets, refreshDatasets } = useApp();
  const [allRuns, setAllRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const runs = await api.listAllRuns();
      setAllRuns(runs);
    } catch (err) {
      console.error('Failed to load runs history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshDatasets();
    await loadRuns();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">History & Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete database audit trail of uploaded datasets, quality reports, and AutoML runs
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Total Datasets Stored"
          value={datasets.length}
          subtitle="Persistent CSV datasets in database"
          icon={<Database className="w-5 h-5" />}
          badge={{ text: 'SQLite Stored', type: 'info' }}
        />
        <MetricCard
          title="Total AutoML Runs"
          value={allRuns.length}
          subtitle="Trained models with saved joblib pipelines"
          icon={<Cpu className="w-5 h-5" />}
          badge={{ text: 'Ready for Inference', type: 'success' }}
        />
      </div>

      {/* Dataset History Table */}
      <DatasetHistoryTable datasets={datasets} />

      {/* Model Runs Table */}
      <ModelRunsTable runs={allRuns} />
    </div>
  );
};
