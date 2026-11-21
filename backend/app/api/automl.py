import json
import joblib
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import DatasetModel, ModelRunModel
from ..schemas import (
    AutoMLTrainRequest,
    AutoMLTrainResponse,
    PredictRequest,
    PredictResponse,
    SingleModelResult
)
from ..core.automl_engine import train_and_evaluate_automl, run_single_prediction
from ..utils.file_manager import get_model_filepath
from ..config import settings
from ..utils.logger import logger

router = APIRouter(prefix="/automl", tags=["AutoML"])

# In-memory cache for fast live inference during session
MODELS_CACHE: Dict[str, Dict[str, Any]] = {}

@router.post("/train", response_model=AutoMLTrainResponse)
def train_automl_pipeline(
    req: AutoMLTrainRequest,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{req.dataset_id}' not found.")

    # Determine file to use
    if req.use_processed_data and dataset.processed_path and Path(dataset.processed_path).exists():
        data_path = Path(dataset.processed_path)
    else:
        data_path = Path(dataset.file_path)

    if not data_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = pd.read_csv(data_path)

    if req.target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.target_column}' is not present in dataset.")

    try:
        response, bundle = train_and_evaluate_automl(
            df=df,
            dataset_id=req.dataset_id,
            target_column=req.target_column,
            task_type=req.task_type,
            test_size=req.test_size,
            model_save_dir=settings.MODELS_DIR
        )
    except ValueError as ve:
        logger.warning(f"AutoML validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"AutoML training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AutoML training encountered an unexpected error: {str(e)}")

    # Save model pipeline with joblib
    model_save_path = get_model_filepath(req.dataset_id, response.best_model.model_name)
    joblib.dump(bundle, model_save_path)
    logger.info(f"Persisted best trained model bundle to {model_save_path}")

    # Cache for live predictions
    MODELS_CACHE[response.run_id] = bundle

    # Record in database
    metric_name = "F1-Score" if response.task_type == "classification" else "R² Score"
    metric_val = response.best_model.metrics.f1_score if response.task_type == "classification" else response.best_model.metrics.r2_score
    
    db_run = ModelRunModel(
        id=response.run_id,
        dataset_id=req.dataset_id,
        target_column=req.target_column,
        task_type=response.task_type,
        train_test_split_ratio=req.test_size,
        models_results_json=json.dumps([m.model_dump() for m in response.models]),
        best_model_name=response.best_model.model_name,
        best_model_score=metric_val or 0.0,
        best_model_metric=metric_name,
        recommendation_text=response.recommendation_summary + " " + response.recommendation_details,
        model_file_path=str(model_save_path)
    )
    db.add(db_run)
    dataset.target_column = req.target_column
    dataset.task_type = response.task_type
    db.commit()

    return response

@router.get("/{run_id}/download-model")
def download_trained_model(
    run_id: str,
    db: Session = Depends(get_db)
):
    model_run = db.query(ModelRunModel).filter(ModelRunModel.id == run_id).first()
    if not model_run:
        raise HTTPException(status_code=404, detail=f"Model run '{run_id}' not found.")

    if not model_run.model_file_path or not Path(model_run.model_file_path).exists():
        raise HTTPException(status_code=404, detail="Trained model artifact (.joblib) not found on disk.")

    filename = Path(model_run.model_file_path).name
    return FileResponse(
        path=model_run.model_file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@router.post("/predict", response_model=PredictResponse)
def predict_live_instance(
    req: PredictRequest,
    db: Session = Depends(get_db)
):
    # Try cache first
    bundle = MODELS_CACHE.get(req.run_id)
    
    if not bundle:
        model_run = db.query(ModelRunModel).filter(ModelRunModel.id == req.run_id).first()
        if not model_run or not model_run.model_file_path or not Path(model_run.model_file_path).exists():
            raise HTTPException(status_code=404, detail=f"Model run '{req.run_id}' or model file not found.")
        try:
            bundle = joblib.load(model_run.model_file_path)
            MODELS_CACHE[req.run_id] = bundle
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model from disk: {str(e)}")

    try:
        pred_res = run_single_prediction(bundle, req.feature_values)
        return pred_res
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

@router.get("/{dataset_id}/runs", response_model=List[Dict[str, Any]])
def get_dataset_runs(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    runs = db.query(ModelRunModel).filter(
        ModelRunModel.dataset_id == dataset_id
    ).order_by(ModelRunModel.created_at.desc()).all()

    results = []
    for r in runs:
        results.append({
            "run_id": r.id,
            "dataset_id": r.dataset_id,
            "target_column": r.target_column,
            "task_type": r.task_type,
            "best_model_name": r.best_model_name,
            "best_model_score": r.best_model_score,
            "best_model_metric": r.best_model_metric,
            "recommendation_text": r.recommendation_text,
            "models": json.loads(r.models_results_json) if r.models_results_json else [],
            "created_at": r.created_at
        })
    return results
