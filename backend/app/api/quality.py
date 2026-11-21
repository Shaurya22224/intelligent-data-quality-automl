import json
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import DatasetModel, QualityReportModel
from ..schemas import QualityReportResponse
from ..core.quality_assessor import assess_data_quality
from ..utils.logger import logger

router = APIRouter(prefix="/quality", tags=["Data Quality"])

@router.post("/{dataset_id}", response_model=QualityReportResponse)
def generate_quality_report(
    dataset_id: str,
    target_column: Optional[str] = Query(default=None),
    use_processed: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    file_path = dataset.processed_path if (use_processed and dataset.processed_path and Path(dataset.processed_path).exists()) else dataset.file_path
    
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = pd.read_csv(file_path)
    target = target_column or dataset.target_column
    
    report_response = assess_data_quality(df, dataset_id, target_column=target)

    # Save to database
    db_report = QualityReportModel(
        dataset_id=dataset_id,
        overall_score=report_response.overall_score,
        grade=report_response.grade,
        summary_json=json.dumps({
            "total_rows": report_response.total_rows,
            "total_columns": report_response.total_columns,
            "total_missing_cells": report_response.total_missing_cells,
            "total_missing_percentage": report_response.total_missing_percentage,
            "duplicate_rows_count": report_response.duplicate_rows_count,
            "duplicate_rows_percentage": report_response.duplicate_rows_percentage
        }),
        missing_values_json=json.dumps([c.model_dump() for c in report_response.categorical_stats] + [c.model_dump() for c in report_response.numeric_stats]),
        duplicates_count=report_response.duplicate_rows_count,
        outliers_json=json.dumps([o.model_dump() for o in report_response.outlier_stats]),
        correlations_json=json.dumps(report_response.correlation_matrix),
        score_breakdown_json=report_response.score_breakdown.model_dump_json(),
        recommendations_json=json.dumps([r.model_dump() for r in report_response.recommendations])
    )
    
    db.add(db_report)
    # Update target on dataset if supplied
    if target_column:
        dataset.target_column = target_column
    db.commit()
    
    logger.info(f"Generated quality report for dataset {dataset_id}: Score={report_response.overall_score}")
    return report_response

@router.get("/{dataset_id}", response_model=QualityReportResponse)
def get_latest_quality_report(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    # Re-run or generate if none exists
    file_path = dataset.processed_path if (dataset.processed_path and Path(dataset.processed_path).exists()) else dataset.file_path
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = pd.read_csv(file_path)
    return assess_data_quality(df, dataset_id, target_column=dataset.target_column)
