# REST API Reference Manual

The backend exposes a RESTful API with automated Swagger UI documentation accessible at `http://localhost:8000/docs`.

---

## 1. System Health & Metadata

### `GET /health`
Returns backend service availability status.

**Response:**
```json
{
  "status": "healthy",
  "project": "Intelligent Data Quality Assessment and AutoML Assistant",
  "version": "1.0.0",
  "api_prefix": "/api/v1",
  "docs_url": "/docs"
}
```

---

## 2. Dataset Management (`/api/v1/datasets`)

### `POST /api/v1/datasets/upload`
Uploads a user-provided CSV file for validation and metadata extraction.
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (CSV binary)

### `POST /api/v1/datasets/sample/{sample_type}`
Loads a built-in demonstration dataset without file upload.
- **Path Parameter**: `sample_type` = `classification` | `regression`

### `GET /api/v1/datasets`
Lists all uploaded and demo datasets.

### `GET /api/v1/datasets/{dataset_id}/preview`
Returns paginated row records and inferred column types.
- **Query Parameters**:
  - `page` (int, default: 1)
  - `page_size` (int, default: 20)
  - `use_processed` (bool, default: false)

### `GET /api/v1/datasets/{dataset_id}/download`
Downloads original or preprocessed CSV file.
- **Query Parameter**: `processed=true|false`

---

## 3. Data Quality Engine (`/api/v1/quality`)

### `POST /api/v1/quality/{dataset_id}`
Computes statistical diagnostics, IQR outliers, Pearson correlation matrix, and data quality score.
- **Query Parameters**:
  - `target_column` (optional string)
  - `use_processed` (optional bool)

**Key Response Fields:**
- `overall_score`: Float between 0.0 and 100.0
- `grade`: "Excellent", "Good", "Fair", or "Poor"
- `score_breakdown`: List of itemized deductions with plain-language explanations
- `recommendations`: Actionable preprocessing transformations

---

## 4. Preprocessing Studio (`/api/v1/preprocessing`)

### `POST /api/v1/preprocessing/{dataset_id}/apply`
Applies chosen cleaning, imputation, scaling, and outlier capping transformations.

**Request Payload:**
```json
{
  "remove_duplicates": true,
  "numeric_imputation": "median",
  "categorical_imputation": "mode",
  "categorical_encoding": "onehot",
  "numerical_scaling": "standard",
  "outlier_treatment": "cap_iqr",
  "drop_columns": ["Student_ID"]
}
```

---

## 5. AutoML Engine (`/api/v1/automl`)

### `POST /api/v1/automl/train`
Executes multi-model training pipeline on train split and evaluates on test split.

**Request Payload:**
```json
{
  "dataset_id": "3a345c3b-...",
  "target_column": "Passed_Exam",
  "task_type": "classification",
  "test_size": 0.2,
  "use_processed_data": true
}
```

### `GET /api/v1/automl/{run_id}/download-model`
Downloads the serialized Scikit-Learn `.joblib` model artifact.

### `POST /api/v1/automl/predict`
Runs single-instance real-time prediction using the fitted model pipeline.

**Request Payload:**
```json
{
  "run_id": "run_98fbc12a",
  "feature_values": {
    "Age": 22,
    "Study_Hours_Per_Week": 28.5,
    "Attendance_Rate": 92.0,
    "Previous_Exam_Score": 84.0,
    "Assignments_Completed": 9
  }
}
```
