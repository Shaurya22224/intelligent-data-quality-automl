import pandas as pd
import numpy as np
import pytest
from backend.app.core.preprocessor import apply_preprocessing_pipeline
from backend.app.schemas import PreprocessingConfig

def test_preprocessing_duplicates_and_imputation():
    df = pd.DataFrame({
        "num": [10.0, 20.0, np.nan, 40.0, 50.0, 10.0],
        "cat": ["A", "B", "A", None, "B", "A"],
        "target": [0, 1, 0, 1, 0, 0]
    })
    
    config = PreprocessingConfig(
        remove_duplicates=True,
        numeric_imputation="median",
        categorical_imputation="mode",
        categorical_encoding="none",
        numerical_scaling="none",
        outlier_treatment="none",
        drop_columns=[]
    )
    
    df_proc, before, after, steps = apply_preprocessing_pipeline(df, config, target_column="target")
    assert after.duplicate_rows == 0
    assert after.missing_values == 0
    assert len(steps) >= 2

def test_preprocessing_scaling_and_encoding():
    df = pd.DataFrame({
        "num": [10.0, 20.0, 30.0, 40.0, 50.0],
        "cat": ["Red", "Blue", "Green", "Red", "Blue"],
        "target": [1, 2, 3, 4, 5]
    })
    
    config = PreprocessingConfig(
        remove_duplicates=False,
        numeric_imputation="none",
        categorical_imputation="none",
        categorical_encoding="onehot",
        numerical_scaling="standard",
        outlier_treatment="none",
        drop_columns=[]
    )
    
    df_proc, before, after, steps = apply_preprocessing_pipeline(df, config, target_column="target")
    # One-hot encoding creates dummy columns
    assert any("cat_" in col for col in df_proc.columns)
    # Standard scaling makes mean close to 0
    assert abs(df_proc["num"].mean()) < 1e-5

def test_preprocessing_iqr_capping():
    df = pd.DataFrame({
        "num": [10.0, 11.0, 12.0, 10.5, 11.2, 500.0],
        "target": [0, 1, 0, 1, 0, 1]
    })
    config = PreprocessingConfig(
        remove_duplicates=False,
        numeric_imputation="none",
        categorical_imputation="none",
        categorical_encoding="none",
        numerical_scaling="none",
        outlier_treatment="cap_iqr",
        drop_columns=[]
    )
    df_proc, before, after, steps = apply_preprocessing_pipeline(df, config, target_column="target")
    assert df_proc["num"].max() < 100.0 # capped well below 500.0
