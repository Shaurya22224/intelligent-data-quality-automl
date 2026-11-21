import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    processed_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    columns_json = Column(Text, nullable=False, default="[]")
    target_column = Column(String(100), nullable=True)
    task_type = Column(String(50), nullable=True) # "classification" or "regression"
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quality_reports = relationship("QualityReportModel", back_populates="dataset", cascade="all, delete-orphan")
    preprocessing_records = relationship("PreprocessingHistoryModel", back_populates="dataset", cascade="all, delete-orphan")
    model_runs = relationship("ModelRunModel", back_populates="dataset", cascade="all, delete-orphan")

class QualityReportModel(Base):
    __tablename__ = "quality_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    overall_score = Column(Float, nullable=False, default=0.0)
    grade = Column(String(20), nullable=False, default="Unknown") # Excellent, Good, Fair, Poor
    summary_json = Column(Text, nullable=False, default="{}")
    missing_values_json = Column(Text, nullable=False, default="{}")
    duplicates_count = Column(Integer, nullable=False, default=0)
    outliers_json = Column(Text, nullable=False, default="{}")
    correlations_json = Column(Text, nullable=False, default="{}")
    score_breakdown_json = Column(Text, nullable=False, default="{}")
    recommendations_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("DatasetModel", back_populates="quality_reports")

class PreprocessingHistoryModel(Base):
    __tablename__ = "preprocessing_history"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    config_json = Column(Text, nullable=False, default="{}")
    before_stats_json = Column(Text, nullable=False, default="{}")
    after_stats_json = Column(Text, nullable=False, default="{}")
    processed_filename = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("DatasetModel", back_populates="preprocessing_records")

class ModelRunModel(Base):
    __tablename__ = "model_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    target_column = Column(String(100), nullable=False)
    task_type = Column(String(50), nullable=False) # "classification" or "regression"
    train_test_split_ratio = Column(Float, default=0.2)
    models_results_json = Column(Text, nullable=False, default="[]")
    best_model_name = Column(String(100), nullable=False)
    best_model_score = Column(Float, nullable=False, default=0.0)
    best_model_metric = Column(String(50), nullable=False, default="F1-Score")
    recommendation_text = Column(Text, nullable=False, default="")
    model_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("DatasetModel", back_populates="model_runs")
