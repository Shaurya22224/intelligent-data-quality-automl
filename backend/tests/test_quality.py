import pandas as pd
import numpy as np
import pytest
from backend.app.core.quality_assessor import assess_data_quality

def test_assess_data_quality_clean():
    df = pd.DataFrame({
        "feature1": np.linspace(1, 100, 100),
        "feature2": np.linspace(10, 200, 100),
        "target": ["Pass", "Fail"] * 50
    })
    
    report = assess_data_quality(df, "clean_ds_1", target_column="target")
    assert report.overall_score >= 90.0
    assert report.grade == "Excellent"
    assert report.total_rows == 100
    assert report.total_columns == 3
    assert report.duplicate_rows_count == 0
    assert report.total_missing_cells == 0
    assert len(report.recommendations) >= 1

def test_assess_data_quality_with_issues():
    df = pd.DataFrame({
        "num_col": [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000, None], # outlier and missing
        "cat_col": ["A", "A", "A", "B", "B", "A", "B", "A", None, "A", "A"], # missing
        "constant_col": [1] * 11, # constant
        "target": ["Yes"] * 9 + ["No"] * 2 # imbalanced
    })
    # Add duplicate row
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    
    report = assess_data_quality(df, "issue_ds_1", target_column="target")
    assert report.overall_score < 100.0
    assert report.duplicate_rows_count >= 1
    assert report.total_missing_cells >= 2
    assert len(report.constant_columns) >= 1
    assert report.class_distribution.is_imbalanced is True
    assert len(report.score_breakdown.deductions) >= 3
    assert len(report.recommendations) >= 3

def test_outlier_detection_iqr():
    # Normal data + 2 extreme values
    values = list(np.random.normal(50, 5, 98)) + [500.0, -200.0]
    df = pd.DataFrame({"metric": values})
    
    report = assess_data_quality(df, "outlier_ds")
    outlier_stat = next(s for s in report.outlier_stats if s.column == "metric")
    assert outlier_stat.outlier_count >= 2
    assert outlier_stat.outlier_percentage > 0
