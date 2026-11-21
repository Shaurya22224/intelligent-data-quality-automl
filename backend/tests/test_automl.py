import pandas as pd
import numpy as np
import pytest
from backend.app.core.automl_engine import (
    train_and_evaluate_automl,
    infer_task_type,
    validate_target_suitability,
    run_single_prediction,
    get_classification_algorithms,
    get_regression_algorithms
)
from backend.app.schemas import SingleModelResult, ModelMetrics

def test_infer_task_type():
    cat_target = pd.Series(["Pass", "Fail", "Pass", "Pass"])
    assert infer_task_type(cat_target) == "classification"
    
    int_few_classes = pd.Series([0, 1, 0, 1, 0])
    assert infer_task_type(int_few_classes) == "classification"
    
    continuous_target = pd.Series(np.random.normal(100, 25, 50))
    assert infer_task_type(continuous_target) == "regression"

def test_all_9_algorithms_registration():
    cls_algos = get_classification_algorithms()
    assert len(cls_algos) == 9
    cls_names = [a[0] for a in cls_algos]
    assert "Logistic Regression" in cls_names
    assert "Decision Tree Classifier" in cls_names
    assert "Random Forest Classifier" in cls_names
    assert "Extra Trees Classifier" in cls_names
    assert "Gradient Boosting Classifier" in cls_names
    assert "AdaBoost Classifier" in cls_names
    assert "K-Nearest Neighbors Classifier" in cls_names
    assert "Support Vector Classifier" in cls_names
    assert "Gaussian Naive Bayes" in cls_names

    reg_algos = get_regression_algorithms()
    assert len(reg_algos) == 9
    reg_names = [a[0] for a in reg_algos]
    assert "Linear Regression" in reg_names
    assert "Ridge Regression" in reg_names
    assert "Decision Tree Regressor" in reg_names
    assert "Random Forest Regressor" in reg_names
    assert "Extra Trees Regressor" in reg_names
    assert "Gradient Boosting Regressor" in reg_names
    assert "AdaBoost Regressor" in reg_names
    assert "K-Nearest Neighbors Regressor" in reg_names
    assert "Support Vector Regressor" in reg_names

def test_train_classification_automl(sample_classification_df):
    resp, bundle = train_and_evaluate_automl(
        df=sample_classification_df,
        dataset_id="test_cls_1",
        target_column="left_company",
        task_type="classification",
        test_size=0.25
    )
    
    assert resp.task_type == "classification"
    assert len(resp.models) == 9
    assert resp.best_model is not None
    assert resp.best_model.rank == 1
    assert resp.best_model.is_best is True
    assert resp.best_model.model_key == resp.models[0].model_key
    assert resp.best_model.metrics.f1_score is not None
    assert resp.best_model.metrics.confusion_matrix is not None
    assert bundle["pipeline"] is not None
    
    # Verify ranking logic: ranks must be sequential and ordered by weighted F1-score descending
    successful_models = [m for m in resp.models if m.status == "success"]
    assert len(successful_models) == 9
    for idx, model_res in enumerate(successful_models, 1):
        assert model_res.rank == idx

    for i in range(len(successful_models) - 1):
        curr_f1 = successful_models[i].metrics.f1_score or 0.0
        next_f1 = successful_models[i + 1].metrics.f1_score or 0.0
        assert curr_f1 >= next_f1, f"Model rank #{i+1} has F1 {curr_f1} < rank #{i+2} F1 {next_f1}"

    # Test live single inference
    sample_feat = {
        "age": 32,
        "income": 62000,
        "department": "Engineering",
        "satisfaction_score": 4.2
    }
    pred_res = run_single_prediction(bundle, sample_feat)
    assert pred_res.prediction in ["Yes", "No"]
    assert pred_res.probabilities is not None

def test_train_regression_automl(sample_regression_df):
    resp, bundle = train_and_evaluate_automl(
        df=sample_regression_df,
        dataset_id="test_reg_1",
        target_column="price",
        task_type="regression",
        test_size=0.2
    )
    
    assert resp.task_type == "regression"
    assert len(resp.models) == 9
    assert resp.best_model is not None
    assert resp.best_model.rank == 1
    assert resp.best_model.is_best is True
    assert resp.best_model.model_key == resp.models[0].model_key
    assert resp.best_model.metrics.r2_score is not None
    assert resp.best_model.metrics.rmse is not None
    
    # Verify ranking logic: ranks must be sequential and ordered by R2 score descending
    successful_models = [m for m in resp.models if m.status == "success"]
    assert len(successful_models) == 9
    for idx, model_res in enumerate(successful_models, 1):
        assert model_res.rank == idx

    for i in range(len(successful_models) - 1):
        curr_r2 = successful_models[i].metrics.r2_score or -999.0
        next_r2 = successful_models[i + 1].metrics.r2_score or -999.0
        assert curr_r2 >= next_r2, f"Model rank #{i+1} has R2 {curr_r2} < rank #{i+2} R2 {next_r2}"

    # Test live single prediction
    sample_feat = {
        "sqft": 2100,
        "rooms": 3,
        "location": "Suburban"
    }
    pred_res = run_single_prediction(bundle, sample_feat)
    assert isinstance(pred_res.prediction, float)
    assert pred_res.prediction > 0

def test_skipped_model_ranking_order(sample_classification_df, monkeypatch):
    """Verify that if an algorithm fails, it is marked as skipped, placed after successful models, and has rank None."""
    from backend.app.core import automl_engine

    original_get_algos = automl_engine.get_classification_algorithms

    def mock_get_algos():
        algos = original_get_algos()
        # Create a broken estimator for the first algorithm
        class BrokenEstimator:
            def fit(self, X, y):
                raise ValueError("Simulated algorithm incompatibility error")
            def get_params(self, deep=True):
                return {}
        
        modified = []
        for i, (name, key, fam, est) in enumerate(algos):
            if i == 0:
                modified.append((name, key, fam, BrokenEstimator()))
            else:
                modified.append((name, key, fam, est))
        return modified

    monkeypatch.setattr(automl_engine, "get_classification_algorithms", mock_get_algos)

    resp, bundle = train_and_evaluate_automl(
        df=sample_classification_df,
        dataset_id="test_cls_skipped",
        target_column="left_company",
        task_type="classification",
        test_size=0.25
    )

    assert len(resp.models) == 9
    # The last model should be the skipped one
    skipped_model = resp.models[-1]
    assert skipped_model.status == "skipped"
    assert skipped_model.rank is None
    assert skipped_model.is_best is False
    assert "Simulated algorithm incompatibility" in (skipped_model.skip_reason or "")

    # The other 8 models should be successful and ranked 1 through 8
    successful = resp.models[:-1]
    assert len(successful) == 8
    for idx, m in enumerate(successful, 1):
        assert m.status == "success"
        assert m.rank == idx

    assert resp.best_model == resp.models[0]
    assert resp.best_model.rank == 1
