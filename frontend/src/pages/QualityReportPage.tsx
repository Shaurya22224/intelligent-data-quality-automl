import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  Sliders, 
  Hash, 
  GitCompare, 
  Target, 
  ShieldAlert,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { QualityScoreGauge } from '../components/quality/QualityScoreGauge';
import { ScoreExplanationCard } from '../components/quality/ScoreExplanationCard';
import { MissingValuesChart } from '../components/quality/MissingValuesChart';
import { CorrelationHeatmap } from '../components/quality/CorrelationHeatmap';
import { OutliersTable } from '../components/quality/OutliersTable';
import { ClassDistributionChart } from '../components/quality/ClassDistributionChart';
import { ColumnStatsTable } from '../components/quality/ColumnStatsTable';
import { RecommendationsList } from '../components/quality/RecommendationsList';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type QualityTab = 
  | 'overview' 
  | 'missing' 
  | 'outliers' 
  | 'correlations' 
  | 'class_balance' 
  | 'recommendations';

export const QualityReportPage: React.FC = () => {
  const { 
    activeDataset, 
    activeReport, 
    setReport, 
    setNotification, 
    setError, 
    setActiveTab 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<QualityTab>('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (activeDataset && !activeReport) {
      loadOrGenerateReport();
    }
  }, [activeDataset]);

  const loadOrGenerateReport = async () => {
    if (!activeDataset) return;
    setIsGenerating(true);
    try {
      const rep = await api.generateQualityReport(activeDataset.id, activeDataset.target_column);
      setReport(rep);
      setNotification('Quality assessment completed!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate quality report.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Dataset Selected</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload a CSV dataset or select one of the demonstration datasets to inspect its quality report.
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

  if (isGenerating) {
    return <LoadingSpinner label="Evaluating dataset quality, calculating IQR outliers & correlations..." />;
  }

  if (!activeReport) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Quality Assessment Ready</h2>
        <p className="text-xs text-slate-400">
          Click below to analyze columns, detect duplicates, outliers, and calculate the 0-100 quality score.
        </p>
        <button
          onClick={loadOrGenerateReport}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Generate Quality Report
        </button>
      </div>
    );
  }

  const tabs: { id: QualityTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Feature Stats', icon: <Hash className="w-3.5 h-3.5" /> },
    { 
      id: 'missing', 
      label: 'Missing Values', 
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      badge: activeReport.total_missing_cells > 0 ? activeReport.total_missing_cells : undefined
    },
    { 
      id: 'outliers', 
      label: 'Outliers (IQR)', 
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      badge: activeReport.outlier_stats.filter((s) => s.outlier_count > 0).length || undefined
    },
    { id: 'correlations', label: 'Correlations', icon: <GitCompare className="w-3.5 h-3.5" /> },
    { id: 'class_balance', label: 'Class Balance', icon: <Target className="w-3.5 h-3.5" /> },
    { 
      id: 'recommendations', 
      label: 'Recommendations', 
      icon: <Sparkles className="w-3.5 h-3.5" />,
      badge: activeReport.recommendations.length
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Quality Audit & Diagnostics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quality assessment for <strong className="text-indigo-300">{activeDataset.original_name}</strong> ({activeReport.total_rows} rows × {activeReport.total_columns} cols)
          </p>
        </div>

        <button
          onClick={loadOrGenerateReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Quality Score</span>
        </button>
      </div>

      {/* Quality Score Gauge Banner */}
      <QualityScoreGauge
        score={activeReport.overall_score}
        grade={activeReport.grade}
        explanation={activeReport.score_breakdown.explanation}
        totalDeductions={activeReport.score_breakdown.total_deductions}
      />

      {/* Score Deductions Audit Card */}
      <ScoreExplanationCard breakdown={activeReport.score_breakdown} />

      {/* Interactive Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        {activeSubTab === 'overview' && <ColumnStatsTable report={activeReport} />}
        {activeSubTab === 'missing' && <MissingValuesChart report={activeReport} />}
        {activeSubTab === 'outliers' && <OutliersTable outlierStats={activeReport.outlier_stats} />}
        {activeSubTab === 'correlations' && <CorrelationHeatmap report={activeReport} />}
        {activeSubTab === 'class_balance' && <ClassDistributionChart distribution={activeReport.class_distribution} />}
        {activeSubTab === 'recommendations' && <RecommendationsList recommendations={activeReport.recommendations} />}
      </div>
    </div>
  );
};
