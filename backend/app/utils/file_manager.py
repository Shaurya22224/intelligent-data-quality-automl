import os
import re
import uuid
import shutil
from pathlib import Path
from typing import Tuple
from ..config import settings
from .logger import logger

def format_file_size(size_in_bytes: int) -> str:
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    elif size_in_bytes < 1024 * 1024 * 1024:
        return f"{size_in_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_in_bytes / (1024 * 1024 * 1024):.2f} GB"

def sanitize_filename(filename: str) -> str:
    # Remove unsafe characters
    clean_name = re.sub(r'[^\w\-_\.]', '_', filename)
    return clean_name

def save_uploaded_file(file_content: bytes, original_filename: str) -> Tuple[str, str, Path]:
    safe_name = sanitize_filename(original_filename)
    unique_prefix = uuid.uuid4().hex[:8]
    stored_filename = f"{unique_prefix}_{safe_name}"
    file_path = settings.UPLOAD_DIR / stored_filename
    
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    logger.info(f"Saved uploaded file: {original_filename} as {stored_filename} ({len(file_content)} bytes)")
    return safe_name, stored_filename, file_path

def copy_sample_file(sample_name: str) -> Tuple[str, str, Path]:
    sample_path = settings.SAMPLE_DIR / sample_name
    if not sample_path.exists():
        raise FileNotFoundError(f"Sample file {sample_name} does not exist in {settings.SAMPLE_DIR}")
    
    unique_prefix = uuid.uuid4().hex[:8]
    stored_filename = f"{unique_prefix}_{sample_name}"
    dest_path = settings.UPLOAD_DIR / stored_filename
    
    shutil.copyfile(sample_path, dest_path)
    logger.info(f"Copied sample dataset {sample_name} to {dest_path}")
    return sample_name, stored_filename, dest_path

def get_processed_filepath(original_stored_name: str) -> Tuple[str, Path]:
    processed_filename = f"processed_{original_stored_name}"
    processed_path = settings.PROCESSED_DIR / processed_filename
    return processed_filename, processed_path

def get_model_filepath(dataset_id: str, model_name: str) -> Path:
    safe_model_name = sanitize_filename(model_name.lower().replace(" ", "_"))
    model_filename = f"{dataset_id}_{safe_model_name}_model.joblib"
    return settings.MODELS_DIR / model_filename
