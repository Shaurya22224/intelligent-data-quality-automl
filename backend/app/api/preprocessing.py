import json
import uuid
import pandas as pd
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import DatasetModel, PreprocessingHistoryModel
from ..schemas import (
    PreprocessingConfig,
    PreprocessingResponse
)
from ..core.preprocessor import apply_preprocessing_pipeline
from ..utils.file_manager import get_processed_filepath
from ..utils.logger import logger

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing"])

@router.post("/{dataset_id}/apply", response_model=PreprocessingResponse)
def apply_preprocessing(
    dataset_id: str,
    config: PreprocessingConfig,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    orig_path = Path(dataset.file_path)
    if not orig_path.exists():
        raise HTTPException(status_code=404, detail="Original dataset file not found on disk.")

    df_orig = pd.read_csv(orig_path)

    try:
        df_processed, before_stats, after_stats, applied_steps = apply_preprocessing_pipeline(
            df=df_orig,
            config=config,
            target_column=dataset.target_column
        )
    except Exception as e:
        logger.error(f"Preprocessing error on dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

    # Save processed dataframe
    proc_filename, proc_filepath = get_processed_filepath(dataset.filename)
    df_processed.to_csv(proc_filepath, index=False)

    # Update dataset model
    dataset.processed_path = str(proc_filepath)

    # Save to history
    history_id = f"prep_{uuid.uuid4().hex[:8]}"
    db_history = PreprocessingHistoryModel(
        id=history_id,
        dataset_id=dataset_id,
        config_json=config.model_dump_json(),
        before_stats_json=before_stats.model_dump_json(),
        after_stats_json=after_stats.model_dump_json(),
        processed_filename=proc_filename
    )
    db.add(db_history)
    db.commit()

    # Preview sample records
    preview_data = df_processed.head(15).replace({float("nan"): None}).to_dict(orient="records")

    logger.info(f"Applied preprocessing on dataset {dataset_id}: {len(applied_steps)} steps executed")

    return PreprocessingResponse(
        history_id=history_id,
        dataset_id=dataset_id,
        processed_filename=proc_filename,
        config=config,
        before_stats=before_stats,
        after_stats=after_stats,
        applied_steps=applied_steps,
        preview_data=preview_data,
        columns=list(df_processed.columns),
        created_at=db_history.created_at
    )

@router.get("/{dataset_id}/history", response_model=List[PreprocessingResponse])
def get_preprocessing_history(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

    records = db.query(PreprocessingHistoryModel).filter(
        PreprocessingHistoryModel.dataset_id == dataset_id
    ).order_by(PreprocessingHistoryModel.created_at.desc()).all()

    response_list = []
    for rec in records:
        conf = PreprocessingConfig(**json.loads(rec.config_json))
        before = json.loads(rec.before_stats_json)
        after = json.loads(rec.after_stats_json)
        
        response_list.append(PreprocessingResponse(
            history_id=rec.id,
            dataset_id=rec.dataset_id,
            processed_filename=rec.processed_filename,
            config=conf,
            before_stats=before,
            after_stats=after,
            applied_steps=["Previously applied pipeline configuration"],
            preview_data=[],
            columns=[],
            created_at=rec.created_at
        ))
        
    return response_list
