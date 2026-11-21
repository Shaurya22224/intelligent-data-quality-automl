import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  DatasetSummary,
  QualityReportResponse,
  AutoMLTrainResponse,
  PreprocessingResponse
} from '../api/types';

export type NavigationTab =
  | 'dashboard'
  | 'upload'
  | 'quality'
  | 'preprocessing'
  | 'automl'
  | 'history';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  datasets: DatasetSummary[];
  activeDataset: DatasetSummary | null;
  activeReport: QualityReportResponse | null;
  latestAutoMLResult: AutoMLTrainResponse | null;
  latestPreprocessing: PreprocessingResponse | null;
  isLoading: boolean;
  error: string | null;
  notification: string | null;
  refreshDatasets: () => Promise<void>;
  selectDataset: (id: string) => Promise<void>;
  loadSample: (sampleType: 'classification' | 'regression') => Promise<void>;
  setReport: (report: QualityReportResponse | null) => void;
  setAutoMLResult: (result: AutoMLTrainResponse | null) => void;
  setPreprocessingResult: (result: PreprocessingResponse | null) => void;
  clearError: () => void;
  setError: (err: string | null) => void;
  setNotification: (msg: string | null) => void;
  deleteDataset: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [activeDataset, setActiveDataset] = useState<DatasetSummary | null>(null);
  const [activeReport, setActiveReport] = useState<QualityReportResponse | null>(null);
  const [latestAutoMLResult, setLatestAutoMLResult] = useState<AutoMLTrainResponse | null>(null);
  const [latestPreprocessing, setLatestPreprocessing] = useState<PreprocessingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshDatasets = async () => {
    try {
      const list = await api.listDatasets();
      setDatasets(list);
      if (list.length > 0 && !activeDataset) {
        setActiveDataset(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    refreshDatasets();
  }, []);

  const selectDataset = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const ds = await api.getDataset(id);
      setActiveDataset(ds);
      // Try to load cached quality report if exists
      try {
        const report = await api.getQualityReport(id);
        setActiveReport(report);
      } catch {
        setActiveReport(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to select dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = async (sampleType: 'classification' | 'regression') => {
    setIsLoading(true);
    setError(null);
    try {
      const sample = await api.loadSampleDataset(sampleType);
      await refreshDatasets();
      setActiveDataset(sample);
      setNotification(`Sample dataset '${sample.original_name}' loaded successfully!`);
      
      // Auto-generate quality report for instant preview
      try {
        const rep = await api.generateQualityReport(sample.id, sample.target_column);
        setActiveReport(rep);
      } catch (e) {
        console.warn('Initial report generation skipped:', e);
      }
      setActiveTab('quality');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load sample dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDataset = async (id: string) => {
    try {
      await api.deleteDataset(id);
      setNotification('Dataset deleted successfully.');
      if (activeDataset?.id === id) {
        setActiveDataset(null);
        setActiveReport(null);
        setLatestAutoMLResult(null);
      }
      await refreshDatasets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete dataset.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        datasets,
        activeDataset,
        activeReport,
        latestAutoMLResult,
        latestPreprocessing,
        isLoading,
        error,
        notification,
        refreshDatasets,
        selectDataset,
        loadSample,
        setReport: setActiveReport,
        setAutoMLResult: setLatestAutoMLResult,
        setPreprocessingResult: setLatestPreprocessing,
        clearError,
        setError,
        setNotification,
        deleteDataset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
