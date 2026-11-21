import httpx
import sys
import json
import io

BASE_URL = "http://127.0.0.1:8000"

def log_step(msg):
    print(f"\n[TEST STEP] ===> {msg}")

def run_live_e2e_tests():
    client = httpx.Client(base_url=BASE_URL, timeout=60.0)
    
    # 1. Health check
    log_step("1. Checking Server Health (/health)...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "healthy"
    print("   [OK] Server is healthy and responsive.")

    # 2. Load Classification Sample Dataset
    log_step("2. Loading Classification Sample Dataset (student_performance.csv)...")
    res = client.post("/api/v1/datasets/sample/classification")
    assert res.status_code == 200, f"Sample load failed: {res.text}"
    cls_ds = res.json()
    cls_id = cls_ds["id"]
    print(f"   [OK] Classification sample loaded: ID={cls_id}, Rows={cls_ds['row_count']}, Cols={cls_ds['column_count']}")
    assert cls_ds["row_count"] >= 500
    assert cls_ds["target_column"] == "Passed_Exam"

    # 3. Load Regression Sample Dataset
    log_step("3. Loading Regression Sample Dataset (housing_prices.csv)...")
    res = client.post("/api/v1/datasets/sample/regression")
    assert res.status_code == 200, f"Regression sample load failed: {res.text}"
    reg_ds = res.json()
    reg_id = reg_ds["id"]
    print(f"   [OK] Regression sample loaded: ID={reg_id}, Rows={reg_ds['row_count']}, Cols={reg_ds['column_count']}")
    assert reg_ds["row_count"] >= 500
    assert reg_ds["target_column"] == "Price"

    # 4. Upload Custom CSV Dataset
    log_step("4. Uploading Arbitrary Custom CSV Dataset...")
    custom_csv = (
        "emp_id,department,experience_years,monthly_salary,promoted\n"
        "E001,Tech,3.5,4500.0,Yes\n"
        "E002,Sales,1.2,3200.0,No\n"
        "E003,Tech,7.0,8200.0,Yes\n"
        "E004,HR,4.0,4100.0,No\n"
        "E005,Tech,,5100.0,Yes\n"
        "E006,Marketing,2.5,3800.0,No\n"
        "E007,Sales,6.5,7500.0,Yes\n"
        "E008,Tech,10.0,12000.0,Yes\n"
        "E009,HR,1.0,2900.0,No\n"
        "E010,Marketing,5.0,6000.0,Yes\n"
        "E011,Sales,3.0,4200.0,No\n"
        "E012,Tech,8.5,9500.0,Yes\n"
        "E013,HR,2.0,3300.0,No\n"
        "E014,Sales,4.5,5400.0,Yes\n"
        "E015,Marketing,1.5,3100.0,No\n"
        "E016,Tech,6.0,7200.0,Yes\n"
        "E017,HR,5.5,5800.0,Yes\n"
        "E018,Sales,2.2,3600.0,No\n"
        "E019,Tech,9.0,10500.0,Yes\n"
        "E020,Marketing,3.8,4700.0,No\n"
    )
    files = {"file": ("custom_employees.csv", io.BytesIO(custom_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/v1/datasets/upload", files=files)
    assert res.status_code == 200, f"Custom upload failed: {res.text}"
    custom_ds = res.json()
    custom_id = custom_ds["id"]
    print(f"   [OK] Custom CSV uploaded successfully: ID={custom_id}, Rows={custom_ds['row_count']}")

    # 5. Preview Table with Pagination
    log_step("5. Testing Paginated Dataset Preview...")
    res = client.get(f"/api/v1/datasets/{cls_id}/preview?page=1&page_size=10")
    assert res.status_code == 200, f"Preview failed: {res.text}"
    prev = res.json()
    assert len(prev["data"]) == 10
    assert prev["total_rows"] == cls_ds["row_count"]
    print(f"   [OK] Paginated preview returned {len(prev['data'])} records across {prev['total_columns']} columns.")

    # 6. Quality Report Generation (Score, Deductions, IQR Outliers, Correlations)
    log_step("6. Generating Data Quality Diagnostic Report...")
    res = client.post(f"/api/v1/quality/{cls_id}?target_column=Passed_Exam")
    assert res.status_code == 200, f"Quality report generation failed: {res.text}"
    quality_report = res.json()
    score = quality_report["overall_score"]
    grade = quality_report["grade"]
    deductions = quality_report["score_breakdown"]["deductions"]
    recs = quality_report["recommendations"]
    print(f"   [OK] Quality Score: {score}/100 (Grade: {grade})")
    print(f"   [OK] Transparent Deductions Count: {len(deductions)}")
    print(f"   [OK] Preprocessing Recommendations: {len(recs)} actionable items")
    assert score > 0
    assert len(recs) > 0

    # 7. Apply Preprocessing Pipeline
    log_step("7. Executing Preprocessing Transformation Pipeline...")
    prep_config = {
        "remove_duplicates": True,
        "numeric_imputation": "median",
        "categorical_imputation": "mode",
        "categorical_encoding": "onehot",
        "numerical_scaling": "standard",
        "outlier_treatment": "cap_iqr",
        "drop_columns": ["Student_ID"]
    }
    res = client.post(f"/api/v1/preprocessing/{cls_id}/apply", json=prep_config)
    assert res.status_code == 200, f"Preprocessing failed: {res.text}"
    prep_result = res.json()
    before = prep_result["before_stats"]
    after = prep_result["after_stats"]
    steps = prep_result["applied_steps"]
    print(f"   [OK] Preprocessing completed. Steps executed: {len(steps)}")
    print(f"        Missing Values: {before['missing_values']} -> {after['missing_values']}")
    print(f"        Duplicate Rows: {before['duplicate_rows']} -> {after['duplicate_rows']}")
    print(f"        Columns (Encoded): {before['columns']} -> {after['columns']}")
    assert after["missing_values"] == 0
    assert after["duplicate_rows"] == 0

    # 8. Train Classification AutoML (5 Models)
    log_step("8. Training Classification AutoML Suite (5 Algorithms)...")
    train_cls_req = {
        "dataset_id": cls_id,
        "target_column": "Passed_Exam",
        "task_type": "classification",
        "test_size": 0.2,
        "use_processed_data": True
    }
    res = client.post("/api/v1/automl/train", json=train_cls_req)
    assert res.status_code == 200, f"AutoML classification training failed: {res.text}"
    cls_automl = res.json()
    best_cls = cls_automl["best_model"]
    models = cls_automl["models"]
    run_id_cls = cls_automl["run_id"]
    print(f"   [OK] Trained {len(models)} models:")
    for m in models:
        print(f"        - #{m['rank']} {m['model_name']}: F1={m['metrics']['f1_score']:.4f}, Acc={m['metrics']['accuracy']*100:.1f}%, Time={m['training_time_seconds']:.3f}s")
    print(f"   [OK] Winning Model: {best_cls['model_name']} (F1={best_cls['metrics']['f1_score']:.4f})")
    assert len(models) == 9
    assert best_cls["metrics"]["f1_score"] > 0.6
    assert best_cls["metrics"]["confusion_matrix"] is not None

    # 9. Test Live Single-Instance Inference
    log_step("9. Testing Real-Time Live Inference Playground...")
    pred_req = {
        "run_id": run_id_cls,
        "feature_values": {
            "Age": 21,
            "Gender": "Female",
            "Parental_Education": "Bachelor",
            "Study_Hours_Per_Week": 32.0,
            "Attendance_Rate": 95.0,
            "Previous_Exam_Score": 88.0,
            "Assignments_Completed": 10,
            "Extracurricular_Activities": "Yes",
            "Internet_Access": "Yes"
        }
    }
    res = client.post("/api/v1/automl/predict", json=pred_req)
    assert res.status_code == 200, f"Prediction failed: {res.text}"
    pred_data = res.json()
    print(f"   [OK] Predicted Output: {pred_data['prediction']}")
    if pred_data.get("probabilities"):
        print(f"   [OK] Probabilities: {pred_data['probabilities']}")
    assert pred_data["prediction"] in ["Pass", "Fail"]

    # 10. Download Serialized Model (.joblib)
    log_step("10. Testing Serialized Model (.joblib) Export Download...")
    res = client.get(f"/api/v1/automl/{run_id_cls}/download-model")
    assert res.status_code == 200, f"Model download failed: {res.text}"
    assert len(res.content) > 1000
    print(f"   [OK] Downloaded .joblib artifact successfully ({len(res.content):,} bytes).")

    # 11. Train Regression AutoML (5 Models)
    log_step("11. Training Regression AutoML Suite (5 Algorithms)...")
    train_reg_req = {
        "dataset_id": reg_id,
        "target_column": "Price",
        "task_type": "regression",
        "test_size": 0.2,
        "use_processed_data": False
    }
    res = client.post("/api/v1/automl/train", json=train_reg_req)
    assert res.status_code == 200, f"AutoML regression training failed: {res.text}"
    reg_automl = res.json()
    best_reg = reg_automl["best_model"]
    reg_models = reg_automl["models"]
    print(f"   [OK] Trained {len(reg_models)} regression models:")
    for m in reg_models:
        print(f"        - #{m['rank']} {m['model_name']}: R²={m['metrics']['r2_score']:.4f}, RMSE={m['metrics']['rmse']:,.2f}")
    print(f"   [OK] Winning Regression Model: {best_reg['model_name']} (R²={best_reg['metrics']['r2_score']:.4f})")
    assert len(reg_models) == 9
    assert best_reg["metrics"]["r2_score"] > 0.6

    # 12. History Overview & Database Audit Logs
    log_step("12. Checking Audit Logs & History Records in SQLite...")
    res = client.get("/api/v1/history/overview")
    assert res.status_code == 200, f"History overview failed: {res.text}"
    hist = res.json()
    print(f"   [OK] Stored Datasets in DB: {hist['total_datasets']}")
    print(f"   [OK] Total Quality Reports in DB: {hist['total_reports']}")
    print(f"   [OK] Total Model Runs in DB: {hist['total_model_runs']}")
    assert hist["total_datasets"] >= 3
    assert hist["total_model_runs"] >= 2

    # 13. Clean up custom dataset
    log_step("13. Testing Dataset Deletion...")
    res = client.delete(f"/api/v1/datasets/{custom_id}")
    assert res.status_code == 200
    print("   [OK] Custom dataset deleted successfully.")

    print("\n" + "="*70)
    print(" [SUCCESS] ALL 13 END-TO-END LIVE WORKFLOW CHECKS PASSED PERFECTLY!")
    print("="*70 + "\n")

if __name__ == "__main__":
    try:
        run_live_e2e_tests()
    except Exception as e:
        print(f"\n[FAILED] Live test error: {e}")
        sys.exit(1)
