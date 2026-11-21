from typing import Optional, Any, Dict, List, Union
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# ==================== DATASET SCHEMAS ====================

class ColumnMetadata(BaseModel):
    name: str
    data_type: str # original numpy/pandas dtype
    inferred_type: str # "numeric", "categorical", "boolean", "datetime", "text", "id"
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]
    is_constant: bool = False
    is_high_cardinality: bool = False
    is_potential_id: bool = False

class DatasetSummary(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size_bytes: int
    file_size_formatted: str
    row_count: int
    column_count: int
    memory_usage_mb: float
    columns: List[ColumnMetadata]
    target_column: Optional[str] = None
    inferred_task_type: Optional[str] = None
    is_sample: bool = False
    has_processed_version: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    total_rows: int
    total_columns: int
    page: int
    page_size: int
    total_pages: int
    columns: List[str]
    column_types: Dict[str, str]
    data: List[Dict[str, Any]]

class DatasetValidationWarning(BaseModel):
    category: str # "size", "missing", "imbalance", "cardinality", "structure"
    severity: str # "warning", "critical", "info"
    message: str
    recommendation: str

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[DatasetValidationWarning] = []
    metadata: Optional[Dict[str, Any]] = None

# ==================== DATA QUALITY SCHEMAS ====================

class NumericSummaryStats(BaseModel):
    column: str
    count: int
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float
    iqr: float
    skewness: Optional[float] = None

class CategoricalSummaryStats(BaseModel):
    column: str
    count: int
    unique_count: int
    top_value: Optional[str] = None
    top_frequency: int
    top_percentage: float
    cardinality_ratio: float

class OutlierColumnStats(BaseModel):
    column: str
    outlier_count: int
    outlier_percentage: float
    lower_bound: float
    upper_bound: float
    min_value: float
    max_value: float

class CorrelatedPair(BaseModel):
    feature1: str
    feature2: str
    correlation: float
    description: str

class ClassDistribution(BaseModel):
    target_column: str
    classes: Dict[str, int]
    percentages: Dict[str, float]
    is_imbalanced: bool
    imbalance_ratio: float
    minority_class: Optional[str] = None
    majority_class: Optional[str] = None

class ScoreDeduction(BaseModel):
    category: str
    penalty: float
    reason: str
    details: str

class QualityScoreBreakdown(BaseModel):
    overall_score: float
    grade: str # "Excellent (90-100)", "Good (75-89)", "Fair (60-74)", "Poor (<60)"
    base_score: float = 100.0
    total_deductions: float
    deductions: List[ScoreDeduction]
    explanation: str

class RecommendationItem(BaseModel):
    priority: str # "High", "Medium", "Low"
    category: str # "Missing Values", "Duplicates", "Outliers", "Encoding", "Scaling", "Feature Selection"
    issue: str
    action: str
    rationale: str
    suggested_config_key: str
    suggested_config_value: Any

class QualityReportResponse(BaseModel):
    id: str
    dataset_id: str
    overall_score: float
    grade: str
    total_rows: int
    total_columns: int
    duplicate_rows_count: int
    duplicate_rows_percentage: float
    total_missing_cells: int
    total_missing_percentage: float
    numeric_columns: List[str]
    categorical_columns: List[str]
    numeric_stats: List[NumericSummaryStats]
    categorical_stats: List[CategoricalSummaryStats]
    outlier_stats: List[OutlierColumnStats]
    correlation_matrix: Dict[str, Dict[str, float]]
    highly_correlated_pairs: List[CorrelatedPair]
    constant_columns: List[str]
    high_cardinality_columns: List[str]
    class_distribution: Optional[ClassDistribution] = None
    score_breakdown: QualityScoreBreakdown
    recommendations: List[RecommendationItem]
    created_at: datetime

# ==================== PREPROCESSING SCHEMAS ====================

class PreprocessingConfig(BaseModel):
    remove_duplicates: bool = True
    numeric_imputation: str = Field(default="median", description="median, mean, drop_rows, none")
    categorical_imputation: str = Field(default="mode", description="mode, unknown, drop_rows, none")
    categorical_encoding: str = Field(default="onehot", description="onehot, ordinal, none")
    numerical_scaling: str = Field(default="standard", description="standard, minmax, none")
    outlier_treatment: str = Field(default="none", description="none, cap_iqr, remove_rows")
    drop_columns: List[str] = Field(default_factory=list, description="List of columns to drop")

class DatasetStatsDiff(BaseModel):
    rows: int
    columns: int
    missing_values: int
    duplicate_rows: int
    memory_usage_mb: float

class PreprocessingResponse(BaseModel):
    history_id: str
    dataset_id: str
    processed_filename: str
    config: PreprocessingConfig
    before_stats: DatasetStatsDiff
    after_stats: DatasetStatsDiff
    applied_steps: List[str]
    preview_data: List[Dict[str, Any]]
    columns: List[str]
    created_at: datetime

# ==================== AUTOML SCHEMAS ====================

class AutoMLTrainRequest(BaseModel):
    dataset_id: str
    target_column: str
    task_type: Optional[str] = None # "classification" or "regression" (if None, auto-detected)
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)
    use_processed_data: bool = True

class ModelMetrics(BaseModel):
    # Classification metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None # weighted
    recall: Optional[float] = None # weighted
    f1_score: Optional[float] = None # weighted
    macro_f1: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    class_labels: Optional[List[str]] = None
    classification_report: Optional[Dict[str, Any]] = None

    # Regression metrics
    mae: Optional[float] = None
    mse: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    explained_variance: Optional[float] = None

class SingleModelResult(BaseModel):
    model_name: str
    model_key: str
    algorithm_family: str
    status: str # "success", "skipped", "failed"
    skip_reason: Optional[str] = None
    training_time_seconds: float
    metrics: ModelMetrics
    is_best: bool = False
    rank: Optional[int] = None
    hyperparameters: Dict[str, Any] = {}

class AutoMLTrainResponse(BaseModel):
    run_id: str
    dataset_id: str
    target_column: str
    task_type: str
    train_test_split: Dict[str, int]
    models: List[SingleModelResult]
    best_model: SingleModelResult
    recommendation_summary: str
    recommendation_details: str
    feature_names: List[str]
    created_at: datetime

class PredictRequest(BaseModel):
    run_id: str
    feature_values: Dict[str, Any]

class PredictResponse(BaseModel):
    run_id: str
    model_name: str
    task_type: str
    prediction: Any
    probabilities: Optional[Dict[str, float]] = None

# ==================== HISTORY & AUDIT SCHEMAS ====================

class HistoryOverviewResponse(BaseModel):
    total_datasets: int
    total_reports: int
    total_model_runs: int
    recent_datasets: List[DatasetSummary]
    recent_model_runs: List[Dict[str, Any]]
