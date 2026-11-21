import io
import pytest
from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_sample_datasets_and_flow(client: TestClient):
    # 1. Load sample classification dataset
    resp_sample = client.post("/api/v1/datasets/sample/classification")
    assert resp_sample.status_code == 200
    dataset = resp_sample.json()
    dataset_id = dataset["id"]
    assert dataset["is_sample"] is True
    assert dataset["row_count"] > 100

    # 2. Get preview
    resp_prev = client.get(f"/api/v1/datasets/{dataset_id}/preview?page=1&page_size=10")
    assert resp_prev.status_code == 200
    prev_data = resp_prev.json()
    assert len(prev_data["data"]) == 10
    assert prev_data["total_rows"] == dataset["row_count"]

    # 3. Quality report
    resp_qual = client.post(f"/api/v1/quality/{dataset_id}?target_column={dataset['target_column']}")
    assert resp_qual.status_code == 200
    qual_data = resp_qual.json()
    assert "overall_score" in qual_data
    assert len(qual_data["recommendations"]) > 0

    # 4. Preprocessing
    prep_payload = {
        "remove_duplicates": True,
        "numeric_imputation": "median",
        "categorical_imputation": "mode",
        "categorical_encoding": "none",
        "numerical_scaling": "none",
        "outlier_treatment": "none",
        "drop_columns": []
    }
    resp_prep = client.post(f"/api/v1/preprocessing/{dataset_id}/apply", json=prep_payload)
    assert resp_prep.status_code == 200
    prep_res = resp_prep.json()
    assert prep_res["after_stats"]["duplicate_rows"] == 0

    # 5. AutoML training
    automl_payload = {
        "dataset_id": dataset_id,
        "target_column": dataset["target_column"],
        "task_type": "classification",
        "test_size": 0.2,
        "use_processed_data": True
    }
    resp_train = client.post("/api/v1/automl/train", json=automl_payload)
    assert resp_train.status_code == 200
    train_res = resp_train.json()
    assert train_res["task_type"] == "classification"
    assert len(train_res["models"]) == 9
    assert train_res["best_model"] is not None
    assert train_res["best_model"]["rank"] == 1
    assert train_res["models"][0]["rank"] == 1
    assert train_res["models"][0]["model_name"] == train_res["best_model"]["model_name"]

    # 6. Prediction
    run_id = train_res["run_id"]
    pred_payload = {
        "run_id": run_id,
        "feature_values": {
            "Age": 21,
            "Gender": "Female",
            "Parental_Education": "Bachelor",
            "Study_Hours_Per_Week": 25.0,
            "Attendance_Rate": 90.0,
            "Previous_Exam_Score": 85.0,
            "Assignments_Completed": 9,
            "Extracurricular_Activities": "Yes",
            "Internet_Access": "Yes"
        }
    }
    resp_pred = client.post("/api/v1/automl/predict", json=pred_payload)
    assert resp_pred.status_code == 200
    pred_data = resp_pred.json()
    assert pred_data["prediction"] in ["Pass", "Fail"]

    # 7. Model download
    resp_dl = client.get(f"/api/v1/automl/{run_id}/download-model")
    assert resp_dl.status_code == 200
    assert len(resp_dl.content) > 0

    # 8. History overview
    resp_hist = client.get("/api/v1/history/overview")
    assert resp_hist.status_code == 200
    hist_data = resp_hist.json()
    assert hist_data["total_datasets"] >= 1
    assert hist_data["total_model_runs"] >= 1
