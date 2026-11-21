import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import DatasetModel, QualityReportModel, ModelRunModel
from ..schemas import HistoryOverviewResponse, DatasetSummary
from .datasets import model_to_summary

router = APIRouter(prefix="/history", tags=["History & Audit"])

@router.get("/overview", response_model=HistoryOverviewResponse)
def get_history_overview(
    db: Session = Depends(get_db)
):
    total_datasets = db.query(DatasetModel).count()
    total_reports = db.query(QualityReportModel).count()
    total_model_runs = db.query(ModelRunModel).count()

    recent_datasets_db = db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).limit(5).all()
    recent_runs_db = db.query(ModelRunModel).order_by(ModelRunModel.created_at.desc()).limit(5).all()

    recent_runs = []
    for r in recent_runs_db:
        recent_runs.append({
            "run_id": r.id,
            "dataset_id": r.dataset_id,
            "target_column": r.target_column,
            "task_type": r.task_type,
            "best_model_name": r.best_model_name,
            "best_model_score": r.best_model_score,
            "best_model_metric": r.best_model_metric,
            "created_at": r.created_at
        })

    return HistoryOverviewResponse(
        total_datasets=total_datasets,
        total_reports=total_reports,
        total_model_runs=total_model_runs,
        recent_datasets=[model_to_summary(d) for d in recent_datasets_db],
        recent_model_runs=recent_runs
    )

@router.get("/runs", response_model=List[Dict[str, Any]])
def list_all_runs(
    db: Session = Depends(get_db)
):
    runs = db.query(ModelRunModel).order_by(ModelRunModel.created_at.desc()).all()
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
            "models_count": len(json.loads(r.models_results_json)) if r.models_results_json else 0,
            "created_at": r.created_at
        })
    return results

@router.get("/runs/{run_id}", response_model=Dict[str, Any])
def get_run_detail(
    run_id: str,
    db: Session = Depends(get_db)
):
    r = db.query(ModelRunModel).filter(ModelRunModel.id == run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Model run with ID '{run_id}' not found.")
    
    return {
        "run_id": r.id,
        "dataset_id": r.dataset_id,
        "target_column": r.target_column,
        "task_type": r.task_type,
        "train_test_split_ratio": r.train_test_split_ratio,
        "best_model_name": r.best_model_name,
        "best_model_score": r.best_model_score,
        "best_model_metric": r.best_model_metric,
        "recommendation_text": r.recommendation_text,
        "models": json.loads(r.models_results_json) if r.models_results_json else [],
        "created_at": r.created_at
    }
