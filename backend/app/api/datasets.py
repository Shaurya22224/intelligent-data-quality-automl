import json
import math
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List, Optional

from ..database import get_db
from ..models import DatasetModel, QualityReportModel, PreprocessingHistoryModel, ModelRunModel
from ..schemas import (
    DatasetSummary,
    DatasetPreviewResponse,
    ColumnMetadata
)
from ..core.validator import validate_and_parse_csv, extract_column_metadata, infer_column_type
from ..utils.file_manager import (
    save_uploaded_file,
    copy_sample_file,
    format_file_size
)
from ..config import settings
from ..utils.logger import logger

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def model_to_summary(db_dataset: DatasetModel) -> DatasetSummary:
    cols_data = json.loads(db_dataset.columns_json) if db_dataset.columns_json else []
    columns_list = [ColumnMetadata(**c) for c in cols_data]
    
    return DatasetSummary(
        id=db_dataset.id,
        filename=db_dataset.filename,
        original_name=db_dataset.original_name,
        file_size_bytes=db_dataset.file_size_bytes,
        file_size_formatted=format_file_size(db_dataset.file_size_bytes),
        row_count=db_dataset.row_count,
        column_count=db_dataset.column_count,
        memory_usage_mb=round((db_dataset.file_size_bytes / (1024 * 1024)), 3),
        columns=columns_list,
        target_column=db_dataset.target_column,
        inferred_task_type=db_dataset.task_type,
        is_sample=db_dataset.is_sample,
        has_processed_version=bool(db_dataset.processed_path and Path(db_dataset.processed_path).exists()),
        created_at=db_dataset.created_at
    )

@router.post("/upload", response_model=DatasetSummary)
async def upload_csv_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Only .csv files are supported. Provided: '{file.filename}'"
        )
        
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    is_valid, errors, warnings, df = validate_and_parse_csv(content, file.filename)
    if not is_valid or df is None:
        raise HTTPException(status_code=422, detail={"errors": errors, "warnings": [w.model_dump() for w in warnings]})

    # Save to disk
    original_name, stored_filename, file_path = save_uploaded_file(content, file.filename)
    
    # Extract columns metadata
    cols_meta = extract_column_metadata(df)
    
    # Infer potential default target (last column)
    default_target = df.columns[-1] if len(df.columns) > 1 else None
    task_type = "classification" if df[default_target].nunique() <= 15 else "regression"

    db_dataset = DatasetModel(
        filename=stored_filename,
        original_name=original_name,
        file_path=str(file_path),
        file_size_bytes=len(content),
        row_count=len(df),
        column_count=len(df.columns),
        columns_json=json.dumps([c.model_dump() for c in cols_meta]),
        target_column=default_target,
        task_type=task_type,
        is_sample=False
    )
    
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    logger.info(f"Successfully uploaded dataset: ID={db_dataset.id}, Name={original_name}")
    return model_to_summary(db_dataset)

@router.post("/sample/{sample_type}", response_model=DatasetSummary)
def load_sample_dataset(
    sample_type: str, # "classification" or "regression"
    db: Session = Depends(get_db)
):
    if sample_type == "classification":
        sample_file = "student_performance.csv"
        target_col = "Passed_Exam"
        task = "classification"
    elif sample_type == "regression":
        sample_file = "housing_prices.csv"
        target_col = "Price"
        task = "regression"
    else:
        raise HTTPException(status_code=400, detail="Invalid sample type. Must be 'classification' or 'regression'.")

    sample_src = settings.SAMPLE_DIR / sample_file
    if not sample_src.exists():
        raise HTTPException(status_code=404, detail=f"Sample dataset '{sample_file}' not found.")

    with open(sample_src, "rb") as f:
        content = f.read()

    original_name, stored_filename, file_path = copy_sample_file(sample_file)
    df = pd.read_csv(file_path)
    cols_meta = extract_column_metadata(df)

    db_dataset = DatasetModel(
        filename=stored_filename,
        original_name=sample_file,
        file_path=str(file_path),
        file_size_bytes=len(content),
        row_count=len(df),
        column_count=len(df.columns),
        columns_json=json.dumps([c.model_dump() for c in cols_meta]),
        target_column=target_col,
        task_type=task,
        is_sample=True
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    return model_to_summary(db_dataset)

@router.get("", response_model=List[DatasetSummary])
def list_datasets(
    db: Session = Depends(get_db)
):
    datasets = db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).all()
    return [model_to_summary(d) for d in datasets]

@router.get("/{dataset_id}", response_model=DatasetSummary)
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")
    return model_to_summary(dataset)

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(
    dataset_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=5, le=100),
    use_processed: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    target_path = dataset.processed_path if (use_processed and dataset.processed_path and Path(dataset.processed_path).exists()) else dataset.file_path
    
    if not Path(target_path).exists():
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = pd.read_csv(target_path)
    total_rows = len(df)
    total_pages = max(1, math.ceil(total_rows / page_size))
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    sliced_df = df.iloc[start_idx:end_idx]

    # Convert NaNs to None for clean JSON serialization
    records = sliced_df.replace({np.nan: None}).to_dict(orient="records")
    col_types = {col: str(df[col].dtype) for col in df.columns}

    return DatasetPreviewResponse(
        dataset_id=dataset_id,
        total_rows=total_rows,
        total_columns=len(df.columns),
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        columns=list(df.columns),
        column_types=col_types,
        data=records
    )

@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: str,
    processed: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    file_path = dataset.processed_path if (processed and dataset.processed_path) else dataset.file_path
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Requested file does not exist.")

    dl_name = f"processed_{dataset.original_name}" if processed else dataset.original_name
    return FileResponse(
        path=file_path,
        filename=dl_name,
        media_type="text/csv"
    )

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    # Remove files if they exist
    if dataset.file_path and Path(dataset.file_path).exists():
        try:
            Path(dataset.file_path).unlink(missing_ok=True)
        except Exception:
            pass

    if dataset.processed_path and Path(dataset.processed_path).exists():
        try:
            Path(dataset.processed_path).unlink(missing_ok=True)
        except Exception:
            pass

    db.delete(dataset)
    db.commit()
    return {"status": "success", "message": f"Dataset {dataset_id} deleted successfully."}
