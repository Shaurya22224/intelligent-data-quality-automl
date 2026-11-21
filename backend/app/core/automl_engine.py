import time
import uuid
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    explained_variance_score
)

# Classification Models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB

# Regression Models
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor,
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    AdaBoostRegressor
)
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR

from ..schemas import (
    AutoMLTrainResponse,
    SingleModelResult,
    ModelMetrics,
    PredictResponse
)
from .validator import infer_column_type
from ..utils.logger import logger

def infer_task_type(target_series: pd.Series) -> str:
    cleaned = target_series.dropna()
    if len(cleaned) == 0:
        return "classification"
        
    # Categorical or string or boolean is classification
    if pd.api.types.is_object_dtype(cleaned) or pd.api.types.is_bool_dtype(cleaned) or pd.api.types.is_string_dtype(cleaned):
        return "classification"
        
    # Check if numeric
    if pd.api.types.is_numeric_dtype(cleaned):
        uniq = cleaned.nunique()
        # If float with many values -> regression
        if pd.api.types.is_float_dtype(cleaned) and uniq > 15:
            return "regression"
        # If integer with <= 15 unique values -> classification
        if uniq <= 15:
            return "classification"
        return "regression"

    return "classification"

def validate_target_suitability(df: pd.DataFrame, target_column: str, task_type: str) -> Tuple[bool, Optional[str]]:
    if target_column not in df.columns:
        return False, f"Target column '{target_column}' does not exist in dataset."
        
    target_series = df[target_column].dropna()
    if len(target_series) < 10:
        return False, f"Target column '{target_column}' has too few non-null samples ({len(target_series)}). Minimum 10 required."

    if task_type == "classification":
        uniq_classes = target_series.nunique()
        if uniq_classes < 2:
            return False, f"Target column has only {uniq_classes} class. Classification requires at least 2 distinct classes."
        if uniq_classes > 50:
            return False, f"Target column has {uniq_classes} unique values. This looks like a continuous regression target or an ID column."
            
        counts = target_series.value_counts()
        if (counts < 2).all():
            return False, "All classes in target column have only 1 sample. Train/test splitting is not possible."

    elif task_type == "regression":
        if not pd.api.types.is_numeric_dtype(pd.to_numeric(target_series, errors="coerce")):
            return False, f"Target column '{target_column}' contains non-numeric values and cannot be used for regression."
        std_val = pd.to_numeric(target_series, errors="coerce").std()
        if std_val == 0 or np.isnan(std_val):
            return False, "Target column has zero variance (all values are identical). Regression cannot be trained."

    return True, None

def build_preprocessing_pipeline(X: pd.DataFrame) -> Tuple[ColumnTransformer, List[str], List[str]]:
    numeric_features = []
    categorical_features = []

    for col in X.columns:
        c_type = infer_column_type(X[col])
        if c_type == "numeric":
            numeric_features.append(col)
        else:
            categorical_features.append(col)

    transformers = []
    
    if numeric_features:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        transformers.append(("num", num_pipeline, numeric_features))

    if categorical_features:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])
        transformers.append(("cat", cat_pipeline, categorical_features))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    return preprocessor, numeric_features, categorical_features

def get_classification_algorithms() -> List[Tuple[str, str, str, Any]]:
    return [
        (
            "Logistic Regression",
            "logistic_regression",
            "Linear Model",
            LogisticRegression(max_iter=1000, random_state=42)
        ),
        (
            "Decision Tree Classifier",
            "decision_tree",
            "Tree-Based",
            DecisionTreeClassifier(max_depth=8, min_samples_split=4, random_state=42)
        ),
        (
            "Random Forest Classifier",
            "random_forest",
            "Ensemble",
            RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        ),
        (
            "Extra Trees Classifier",
            "extra_trees",
            "Ensemble",
            ExtraTreesClassifier(n_estimators=100, max_depth=10, random_state=42)
        ),
        (
            "Gradient Boosting Classifier",
            "gradient_boosting",
            "Ensemble",
            GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
        ),
        (
            "AdaBoost Classifier",
            "adaboost",
            "Ensemble",
            AdaBoostClassifier(n_estimators=50, random_state=42, algorithm="SAMME")
        ),
        (
            "K-Nearest Neighbors Classifier",
            "knn",
            "Distance-Based",
            KNeighborsClassifier(n_neighbors=5)
        ),
        (
            "Support Vector Classifier",
            "svc",
            "Kernel-Based",
            SVC(probability=True, random_state=42)
        ),
        (
            "Gaussian Naive Bayes",
            "gaussian_nb",
            "Probabilistic",
            GaussianNB()
        )
    ]

def get_regression_algorithms() -> List[Tuple[str, str, str, Any]]:
    return [
        (
            "Linear Regression",
            "linear_regression",
            "Linear Model",
            LinearRegression()
        ),
        (
            "Ridge Regression",
            "ridge",
            "Linear Model",
            Ridge(random_state=42)
        ),
        (
            "Decision Tree Regressor",
            "decision_tree_regressor",
            "Tree-Based",
            DecisionTreeRegressor(max_depth=8, min_samples_split=4, random_state=42)
        ),
        (
            "Random Forest Regressor",
            "random_forest_regressor",
            "Ensemble",
            RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        ),
        (
            "Extra Trees Regressor",
            "extra_trees_regressor",
            "Ensemble",
            ExtraTreesRegressor(n_estimators=100, max_depth=10, random_state=42)
        ),
        (
            "Gradient Boosting Regressor",
            "gradient_boosting_regressor",
            "Ensemble",
            GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
        ),
        (
            "AdaBoost Regressor",
            "adaboost_regressor",
            "Ensemble",
            AdaBoostRegressor(n_estimators=50, random_state=42)
        ),
        (
            "K-Nearest Neighbors Regressor",
            "knn_regressor",
            "Distance-Based",
            KNeighborsRegressor(n_neighbors=5)
        ),
        (
            "Support Vector Regressor",
            "svr",
            "Kernel-Based",
            SVR()
        )
    ]

def train_and_evaluate_automl(
    df: pd.DataFrame,
    dataset_id: str,
    target_column: str,
    task_type: Optional[str] = None,
    test_size: float = 0.2,
    model_save_dir: Optional[Path] = None
) -> Tuple[AutoMLTrainResponse, Any]:
    
    # 1. Prepare target and feature matrix
    if not task_type:
        task_type = infer_task_type(df[target_column])
    else:
        task_type = task_type.lower()

    is_valid, err_msg = validate_target_suitability(df, target_column, task_type)
    if not is_valid:
        raise ValueError(err_msg)

    # Clean rows where target is null
    df_clean = df.dropna(subset=[target_column]).copy()
    
    # Drop obvious identifier columns from feature matrix if they exist
    cols_to_exclude = [target_column]
    for col in df_clean.columns:
        if col != target_column:
            c_type = infer_column_type(df_clean[col])
            if c_type == "id" or (df_clean[col].nunique() == len(df_clean) and len(df_clean) > 30 and df_clean[col].dtype == object):
                cols_to_exclude.append(col)

    X = df_clean.drop(columns=cols_to_exclude)
    if X.shape[1] == 0:
        raise ValueError("No valid feature columns remain after dropping target and identifier columns.")

    feature_names = list(X.columns)
    
    # Target formatting
    label_encoder = None
    if task_type == "classification":
        y_raw = df_clean[target_column].astype(str)
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw)
        class_labels = [str(cls) for cls in label_encoder.classes_]
        
        # Check stratification feasibility
        min_class_samples = pd.Series(y).value_counts().min()
        stratify_opt = y if min_class_samples >= 2 else None
    else:
        y = pd.to_numeric(df_clean[target_column], errors="coerce").fillna(0.0).values
        class_labels = None
        stratify_opt = None

    # Train / Test split with fixed random_state
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=42,
        stratify=stratify_opt
    )

    # 2. Build leakage-free ColumnTransformer pipeline
    preprocessor, num_feats, cat_feats = build_preprocessing_pipeline(X_train)

    model_results: List[SingleModelResult] = []
    trained_pipelines: Dict[str, Pipeline] = {}
    
    algorithms = get_classification_algorithms() if task_type == "classification" else get_regression_algorithms()

    for name, key, family, estimator in algorithms:
        start_time = time.time()
        try:
            full_pipeline = Pipeline([
                ("preprocessor", preprocessor),
                ("model", estimator)
            ])
            
            # Fit strictly on training set
            full_pipeline.fit(X_train, y_train)
            train_duration = round(time.time() - start_time, 4)
            
            # Predict on unseen test set
            y_pred = full_pipeline.predict(X_test)
            
            trained_pipelines[key] = full_pipeline
            
            if task_type == "classification":
                acc = float(accuracy_score(y_test, y_pred))
                prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
                rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
                f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
                macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
                cm = confusion_matrix(y_test, y_pred).tolist()
                rep = classification_report(y_test, y_pred, target_names=class_labels, output_dict=True, zero_division=0)
                
                metrics = ModelMetrics(
                    accuracy=round(acc, 4),
                    precision=round(prec, 4),
                    recall=round(rec, 4),
                    f1_score=round(f1, 4),
                    macro_f1=round(macro_f1, 4),
                    confusion_matrix=cm,
                    class_labels=class_labels,
                    classification_report=rep
                )
            else:
                mae_val = float(mean_absolute_error(y_test, y_pred))
                mse_val = float(mean_squared_error(y_test, y_pred))
                rmse_val = float(np.sqrt(mse_val))
                r2_val = float(r2_score(y_test, y_pred))
                ev_val = float(explained_variance_score(y_test, y_pred))
                
                metrics = ModelMetrics(
                    mae=round(mae_val, 4),
                    mse=round(mse_val, 4),
                    rmse=round(rmse_val, 4),
                    r2_score=round(r2_val, 4),
                    explained_variance=round(ev_val, 4)
                )

            # Hyperparameters extraction
            hp = {}
            for param, val in estimator.get_params().items():
                if isinstance(val, (int, float, str, bool)) and val is not None:
                    hp[param] = val

            model_results.append(SingleModelResult(
                model_name=name,
                model_key=key,
                algorithm_family=family,
                status="success",
                training_time_seconds=train_duration,
                metrics=metrics,
                hyperparameters=dict(list(hp.items())[:6])
            ))
            
        except Exception as e:
            train_duration = round(time.time() - start_time, 4)
            logger.warning(f"Model {name} failed or was skipped: {str(e)}")
            model_results.append(SingleModelResult(
                model_name=name,
                model_key=key,
                algorithm_family=family,
                status="skipped",
                skip_reason=f"Algorithm could not converge or encountered incompatible data shape: {str(e)}",
                training_time_seconds=train_duration,
                metrics=ModelMetrics()
            ))

    # 3. Model Ranking & Recommendation
    successful_models = [m for m in model_results if m.status == "success"]
    failed_or_skipped_models = [m for m in model_results if m.status != "success"]
    if not successful_models:
        raise RuntimeError("All candidate models failed to train. Please check feature columns and target configuration.")

    if task_type == "classification":
        # Rank by Weighted F1-score (descending), then Accuracy
        successful_models.sort(
            key=lambda m: (
                m.metrics.f1_score if m.metrics.f1_score is not None else -1.0,
                m.metrics.accuracy if m.metrics.accuracy is not None else -1.0
            ),
            reverse=True
        )
    else:
        # Rank by R2 score (descending), then lower RMSE
        successful_models.sort(
            key=lambda m: (
                m.metrics.r2_score if m.metrics.r2_score is not None else -999.0,
                -(m.metrics.rmse if m.metrics.rmse is not None else 999.0)
            ),
            reverse=True
        )

    # Assign ranks only after sorting: best model = rank 1, next = rank 2, etc.
    for rank_idx, model_res in enumerate(successful_models, 1):
        model_res.rank = rank_idx
        model_res.is_best = (rank_idx == 1)

    # Skipped/failed models should appear after successful models and should not receive a normal numeric rank.
    for skipped_res in failed_or_skipped_models:
        skipped_res.rank = None
        skipped_res.is_best = False

    # Ensure best_model is always the first successfully ranked model.
    best_result = successful_models[0]
    best_pipeline = trained_pipelines[best_result.model_key]

    # Combine: successful models in true sorted rank order first, followed by skipped/failed models
    sorted_model_results = successful_models + failed_or_skipped_models

    # Generate Plain-Language Recommendation Summary & Details
    if task_type == "classification":
        rec_summary = (
            f"Recommended Model: {best_result.model_name} "
            f"(F1-Score: {best_result.metrics.f1_score:.4f}, Accuracy: {best_result.metrics.accuracy * 100:.1f}%)"
        )
        rec_details = (
            f"The '{best_result.model_name}' demonstrated the superior predictive capability among all evaluated algorithms "
            f"with a top Weighted F1-Score of {best_result.metrics.f1_score:.4f} and Precision of {best_result.metrics.precision:.4f}. "
            f"It was selected because it delivers balanced classification performance across all {len(class_labels)} classes "
            f"while minimizing false positives and false negatives under random test evaluation (training time: {best_result.training_time_seconds:.3f}s)."
        )
    else:
        rec_summary = (
            f"Recommended Model: {best_result.model_name} "
            f"(R² Score: {best_result.metrics.r2_score:.4f}, RMSE: {best_result.metrics.rmse:,.2f})"
        )
        rec_details = (
            f"The '{best_result.model_name}' is selected as the best performing regression model, "
            f"explaining {max(0.0, best_result.metrics.r2_score * 100):.1f}% of the target variance (R² = {best_result.metrics.r2_score:.4f}) "
            f"with the lowest test Root Mean Squared Error (RMSE = {best_result.metrics.rmse:,.2f}) and MAE of {best_result.metrics.mae:,.2f}."
        )

    # Package the model bundle for persistence
    bundle = {
        "pipeline": best_pipeline,
        "feature_names": feature_names,
        "target_column": target_column,
        "task_type": task_type,
        "label_encoder": label_encoder,
        "class_labels": class_labels,
        "best_model_name": best_result.model_name,
        "metrics": best_result.metrics.model_dump()
    }

    run_id = f"run_{uuid.uuid4().hex[:8]}"

    response = AutoMLTrainResponse(
        run_id=run_id,
        dataset_id=dataset_id,
        target_column=target_column,
        task_type=task_type,
        train_test_split={"train_rows": len(X_train), "test_rows": len(X_test)},
        models=sorted_model_results,
        best_model=best_result,
        recommendation_summary=rec_summary,
        recommendation_details=rec_details,
        feature_names=feature_names,
        created_at=pd.Timestamp.utcnow().to_pydatetime()
    )

    return response, bundle

def run_single_prediction(model_bundle: Dict[str, Any], feature_values: Dict[str, Any]) -> PredictResponse:
    pipeline: Pipeline = model_bundle["pipeline"]
    feature_names: List[str] = model_bundle["feature_names"]
    task_type: str = model_bundle["task_type"]
    label_encoder: Optional[LabelEncoder] = model_bundle.get("label_encoder")
    class_labels: Optional[List[str]] = model_bundle.get("class_labels")
    best_model_name: str = model_bundle.get("best_model_name", "Best Model")

    # Build single row dataframe matching exact feature names
    row_data = {}
    for feat in feature_names:
        row_data[feat] = [feature_values.get(feat, None)]
        
    input_df = pd.DataFrame(row_data)

    raw_pred = pipeline.predict(input_df)[0]
    
    probabilities = None
    if task_type == "classification":
        if label_encoder is not None:
            pred_label = str(label_encoder.inverse_transform([int(raw_pred)])[0])
        else:
            pred_label = str(raw_pred)
            
        # Check predict_proba
        try:
            if hasattr(pipeline, "predict_proba"):
                probs = pipeline.predict_proba(input_df)[0]
                probabilities = {
                    (class_labels[i] if class_labels and i < len(class_labels) else str(i)): round(float(prob), 4)
                    for i, prob in enumerate(probs)
                }
        except Exception:
            probabilities = None
            
        final_prediction = pred_label
    else:
        final_prediction = round(float(raw_pred), 3)

    return PredictResponse(
        run_id="live_prediction",
        model_name=best_model_name,
        task_type=task_type,
        prediction=final_prediction,
        probabilities=probabilities
    )
