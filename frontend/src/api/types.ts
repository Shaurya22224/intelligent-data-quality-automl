export interface ColumnMetadata {
  name: string;
  data_type: string;
  inferred_type: "numeric" | "categorical" | "boolean" | "datetime" | "text" | "id";
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  sample_values: any[];
  is_constant: boolean;
  is_high_cardinality: boolean;
  is_potential_id: boolean;
}

export interface DatasetSummary {
  id: string;
  filename: string;
  original_name: string;
  file_size_bytes: number;
  file_size_formatted: string;
  row_count: number;
  column_count: number;
  memory_usage_mb: number;
  columns: ColumnMetadata[];
  target_column?: string | null;
  inferred_task_type?: "classification" | "regression" | null;
  is_sample: boolean;
  has_processed_version: boolean;
  created_at: string;
}

export interface DatasetPreviewResponse {
  dataset_id: string;
  total_rows: number;
  total_columns: number;
  page: number;
  page_size: number;
  total_pages: number;
  columns: string[];
  column_types: Record<string, string>;
  data: Record<string, any>[];
}

export interface NumericSummaryStats {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  iqr: number;
  skewness?: number | null;
}

export interface CategoricalSummaryStats {
  column: string;
  count: number;
  unique_count: number;
  top_value?: string | null;
  top_frequency: number;
  top_percentage: number;
  cardinality_ratio: number;
}

export interface OutlierColumnStats {
  column: string;
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
  min_value: number;
  max_value: number;
}

export interface CorrelatedPair {
  feature1: string;
  feature2: string;
  correlation: number;
  description: string;
}

export interface ClassDistribution {
  target_column: string;
  classes: Record<string, number>;
  percentages: Record<string, number>;
  is_imbalanced: boolean;
  imbalance_ratio: number;
  minority_class?: string | null;
  majority_class?: string | null;
}

export interface ScoreDeduction {
  category: string;
  penalty: number;
  reason: string;
  details: string;
}

export interface QualityScoreBreakdown {
  overall_score: number;
  grade: string;
  base_score: number;
  total_deductions: number;
  deductions: ScoreDeduction[];
  explanation: string;
}

export interface RecommendationItem {
  priority: "High" | "Medium" | "Low";
  category: string;
  issue: string;
  action: string;
  rationale: string;
  suggested_config_key: string;
  suggested_config_value: any;
}

export interface QualityReportResponse {
  id: string;
  dataset_id: string;
  overall_score: number;
  grade: string;
  total_rows: number;
  total_columns: number;
  duplicate_rows_count: number;
  duplicate_rows_percentage: number;
  total_missing_cells: number;
  total_missing_percentage: number;
  numeric_columns: string[];
  categorical_columns: string[];
  numeric_stats: NumericSummaryStats[];
  categorical_stats: CategoricalSummaryStats[];
  outlier_stats: OutlierColumnStats[];
  correlation_matrix: Record<string, Record<string, number>>;
  highly_correlated_pairs: CorrelatedPair[];
  constant_columns: string[];
  high_cardinality_columns: string[];
  class_distribution?: ClassDistribution | null;
  score_breakdown: QualityScoreBreakdown;
  recommendations: RecommendationItem[];
  created_at: string;
}

export interface PreprocessingConfig {
  remove_duplicates: boolean;
  numeric_imputation: "median" | "mean" | "drop_rows" | "none";
  categorical_imputation: "mode" | "unknown" | "drop_rows" | "none";
  categorical_encoding: "onehot" | "ordinal" | "none";
  numerical_scaling: "standard" | "minmax" | "none";
  outlier_treatment: "none" | "cap_iqr" | "remove_rows";
  drop_columns: string[];
}

export interface DatasetStatsDiff {
  rows: number;
  columns: number;
  missing_values: number;
  duplicate_rows: number;
  memory_usage_mb: number;
}

export interface PreprocessingResponse {
  history_id: string;
  dataset_id: string;
  processed_filename: string;
  config: PreprocessingConfig;
  before_stats: DatasetStatsDiff;
  after_stats: DatasetStatsDiff;
  applied_steps: string[];
  preview_data: Record<string, any>[];
  columns: string[];
  created_at: string;
}

export interface ModelMetrics {
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1_score?: number | null;
  macro_f1?: number | null;
  confusion_matrix?: number[][] | null;
  class_labels?: string[] | null;
  classification_report?: Record<string, any> | null;

  mae?: number | null;
  mse?: number | null;
  rmse?: number | null;
  r2_score?: number | null;
  explained_variance?: number | null;
}

export interface SingleModelResult {
  model_name: string;
  model_key: string;
  algorithm_family: string;
  status: "success" | "skipped" | "failed";
  skip_reason?: string | null;
  training_time_seconds: number;
  metrics: ModelMetrics;
  is_best: boolean;
  rank?: number | null;
  hyperparameters: Record<string, any>;
}

export interface AutoMLTrainResponse {
  run_id: string;
  dataset_id: string;
  target_column: string;
  task_type: "classification" | "regression";
  train_test_split: { train_rows: number; test_rows: number };
  models: SingleModelResult[];
  best_model: SingleModelResult;
  recommendation_summary: string;
  recommendation_details: string;
  feature_names: string[];
  created_at: string;
}

export interface PredictResponse {
  run_id: string;
  model_name: string;
  task_type: string;
  prediction: any;
  probabilities?: Record<string, number> | null;
}

export interface HistoryOverviewResponse {
  total_datasets: number;
  total_reports: number;
  total_model_runs: number;
  recent_datasets: DatasetSummary[];
  recent_model_runs: any[];
}
