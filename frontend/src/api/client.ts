import axios from 'axios';
import {
  DatasetSummary,
  DatasetPreviewResponse,
  QualityReportResponse,
  PreprocessingConfig,
  PreprocessingResponse,
  AutoMLTrainResponse,
  PredictResponse,
  HistoryOverviewResponse
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Datasets
  async uploadDataset(file: File): Promise<DatasetSummary> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<DatasetSummary>('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async loadSampleDataset(sampleType: 'classification' | 'regression'): Promise<DatasetSummary> {
    const response = await apiClient.post<DatasetSummary>(`/datasets/sample/${sampleType}`);
    return response.data;
  },

  async listDatasets(): Promise<DatasetSummary[]> {
    const response = await apiClient.get<DatasetSummary[]>('/datasets');
    return response.data;
  },

  async getDataset(id: string): Promise<DatasetSummary> {
    const response = await apiClient.get<DatasetSummary>(`/datasets/${id}`);
    return response.data;
  },

  async previewDataset(
    id: string,
    page: number = 1,
    pageSize: number = 20,
    useProcessed: boolean = false
  ): Promise<DatasetPreviewResponse> {
    const response = await apiClient.get<DatasetPreviewResponse>(`/datasets/${id}/preview`, {
      params: { page, page_size: pageSize, use_processed: useProcessed },
    });
    return response.data;
  },

  getDownloadUrl(datasetId: string, processed: boolean = false): string {
    return `${API_BASE_URL}/datasets/${datasetId}/download?processed=${processed}`;
  },

  async deleteDataset(id: string): Promise<void> {
    await apiClient.delete(`/datasets/${id}`);
  },

  // Data Quality
  async generateQualityReport(
    datasetId: string,
    targetColumn?: string | null,
    useProcessed: boolean = false
  ): Promise<QualityReportResponse> {
    const response = await apiClient.post<QualityReportResponse>(`/quality/${datasetId}`, null, {
      params: {
        ...(targetColumn ? { target_column: targetColumn } : {}),
        use_processed: useProcessed,
      },
    });
    return response.data;
  },

  async getQualityReport(datasetId: string): Promise<QualityReportResponse> {
    const response = await apiClient.get<QualityReportResponse>(`/quality/${datasetId}`);
    return response.data;
  },

  // Preprocessing
  async applyPreprocessing(
    datasetId: string,
    config: PreprocessingConfig
  ): Promise<PreprocessingResponse> {
    const response = await apiClient.post<PreprocessingResponse>(
      `/preprocessing/${datasetId}/apply`,
      config
    );
    return response.data;
  },

  async getPreprocessingHistory(datasetId: string): Promise<PreprocessingResponse[]> {
    const response = await apiClient.get<PreprocessingResponse[]>(
      `/preprocessing/${datasetId}/history`
    );
    return response.data;
  },

  // AutoML
  async trainAutoML(payload: {
    dataset_id: string;
    target_column: string;
    task_type?: string | null;
    test_size?: number;
    use_processed_data?: boolean;
  }): Promise<AutoMLTrainResponse> {
    const response = await apiClient.post<AutoMLTrainResponse>('/automl/train', payload);
    return response.data;
  },

  getModelDownloadUrl(runId: string): string {
    return `${API_BASE_URL}/automl/${runId}/download-model`;
  },

  async predictLive(
    runId: string,
    featureValues: Record<string, any>
  ): Promise<PredictResponse> {
    const response = await apiClient.post<PredictResponse>('/automl/predict', {
      run_id: runId,
      feature_values: featureValues,
    });
    return response.data;
  },

  async getDatasetRuns(datasetId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/automl/${datasetId}/runs`);
    return response.data;
  },

  // History
  async getHistoryOverview(): Promise<HistoryOverviewResponse> {
    const response = await apiClient.get<HistoryOverviewResponse>('/history/overview');
    return response.data;
  },

  async listAllRuns(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/history/runs');
    return response.data;
  },
};
