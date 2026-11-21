import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from ..schemas import PreprocessingConfig, DatasetStatsDiff
from .validator import infer_column_type
from ..utils.logger import logger

def calculate_stats_diff(df: pd.DataFrame) -> DatasetStatsDiff:
    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    return DatasetStatsDiff(
        rows=int(len(df)),
        columns=int(len(df.columns)),
        missing_values=int(df.isna().sum().sum()),
        duplicate_rows=int(df.duplicated().sum()),
        memory_usage_mb=memory_mb
    )

def apply_preprocessing_pipeline(
    df: pd.DataFrame,
    config: PreprocessingConfig,
    target_column: str = None
) -> Tuple[pd.DataFrame, DatasetStatsDiff, DatasetStatsDiff, List[str]]:
    
    df_processed = df.copy()
    before_stats = calculate_stats_diff(df)
    applied_steps: List[str] = []

    # 1. Drop explicitly selected columns (excluding target if specified)
    if config.drop_columns:
        cols_to_drop = [c for c in config.drop_columns if c in df_processed.columns and c != target_column]
        if cols_to_drop:
            df_processed.drop(columns=cols_to_drop, inplace=True)
            applied_steps.append(f"Dropped {len(cols_to_drop)} column(s): {', '.join(cols_to_drop)}")

    # 2. Remove duplicate rows
    if config.remove_duplicates:
        initial_dups = int(df_processed.duplicated().sum())
        if initial_dups > 0:
            df_processed.drop_duplicates(inplace=True)
            df_processed.reset_index(drop=True, inplace=True)
            applied_steps.append(f"Removed {initial_dups} duplicate row(s)")

    # Identify numeric and categorical columns
    numeric_cols = []
    categorical_cols = []
    for col in df_processed.columns:
        if col == target_column:
            continue
        c_type = infer_column_type(df_processed[col])
        if c_type == "numeric":
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)

    # 3. Numeric Missing Values
    if config.numeric_imputation == "drop_rows":
        if numeric_cols:
            rows_before = len(df_processed)
            df_processed.dropna(subset=numeric_cols, inplace=True)
            df_processed.reset_index(drop=True, inplace=True)
            dropped = rows_before - len(df_processed)
            if dropped > 0:
                applied_steps.append(f"Dropped {dropped} row(s) containing numeric missing values")
    elif config.numeric_imputation in ["median", "mean"]:
        for col in numeric_cols:
            series = pd.to_numeric(df_processed[col], errors="coerce")
            missing_c = int(series.isna().sum())
            if missing_c > 0:
                fill_val = float(series.median()) if config.numeric_imputation == "median" else float(series.mean())
                if np.isnan(fill_val):
                    fill_val = 0.0
                df_processed[col] = series.fillna(fill_val)
                applied_steps.append(f"Imputed {missing_c} missing value(s) in numeric column '{col}' with {config.numeric_imputation} ({fill_val:.2f})")
            else:
                df_processed[col] = series

    # 4. Categorical Missing Values
    if config.categorical_imputation == "drop_rows":
        if categorical_cols:
            rows_before = len(df_processed)
            df_processed.dropna(subset=categorical_cols, inplace=True)
            df_processed.reset_index(drop=True, inplace=True)
            dropped = rows_before - len(df_processed)
            if dropped > 0:
                applied_steps.append(f"Dropped {dropped} row(s) containing categorical missing values")
    elif config.categorical_imputation == "mode":
        for col in categorical_cols:
            missing_c = int(df_processed[col].isna().sum())
            if missing_c > 0:
                modes = df_processed[col].mode()
                fill_val = str(modes.iloc[0]) if len(modes) > 0 else "Unknown"
                df_processed[col] = df_processed[col].fillna(fill_val)
                applied_steps.append(f"Imputed {missing_c} missing value(s) in categorical column '{col}' with mode ('{fill_val}')")
    elif config.categorical_imputation == "unknown":
        for col in categorical_cols:
            missing_c = int(df_processed[col].isna().sum())
            if missing_c > 0:
                df_processed[col] = df_processed[col].fillna("Unknown")
                applied_steps.append(f"Imputed {missing_c} missing value(s) in categorical column '{col}' with 'Unknown'")

    # 5. Outlier Treatment for numeric features
    if config.outlier_treatment == "cap_iqr" and numeric_cols:
        capped_count = 0
        for col in numeric_cols:
            series = pd.to_numeric(df_processed[col], errors="coerce")
            q25 = float(series.quantile(0.25))
            q75 = float(series.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            
            outliers_mask = (series < lower_bound) | (series > upper_bound)
            num_outliers = int(outliers_mask.sum())
            if num_outliers > 0:
                df_processed[col] = series.clip(lower=lower_bound, upper=upper_bound)
                capped_count += num_outliers
        if capped_count > 0:
            applied_steps.append(f"Capped {capped_count} outlier values across numeric features using 1.5x IQR boundaries")
            
    elif config.outlier_treatment == "remove_rows" and numeric_cols:
        rows_before = len(df_processed)
        mask = pd.Series(True, index=df_processed.index)
        for col in numeric_cols:
            series = pd.to_numeric(df_processed[col], errors="coerce")
            q25 = float(series.quantile(0.25))
            q75 = float(series.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            mask = mask & (series >= lower_bound) & (series <= upper_bound)
            
        df_processed = df_processed[mask].reset_index(drop=True)
        dropped_outliers = rows_before - len(df_processed)
        if dropped_outliers > 0:
            applied_steps.append(f"Removed {dropped_outliers} row(s) containing extreme numerical outliers")

    # 6. Categorical Encoding (if requested in processed CSV)
    if config.categorical_encoding == "onehot" and categorical_cols:
        cols_to_encode = [c for c in categorical_cols if c in df_processed.columns]
        if cols_to_encode:
            # Only encode columns with reasonable cardinality (<= 30)
            valid_encode_cols = [c for c in cols_to_encode if df_processed[c].nunique() <= 30]
            if valid_encode_cols:
                df_processed = pd.get_dummies(df_processed, columns=valid_encode_cols, drop_first=False, dtype=int)
                applied_steps.append(f"Applied One-Hot Encoding on {len(valid_encode_cols)} column(s): {', '.join(valid_encode_cols)}")
    elif config.categorical_encoding == "ordinal" and categorical_cols:
        for col in categorical_cols:
            if col in df_processed.columns:
                df_processed[col] = df_processed[col].astype("category").cat.codes
        applied_steps.append(f"Applied Ordinal Encoding on {len(categorical_cols)} column(s): {', '.join(categorical_cols)}")

    # 7. Numerical Scaling (if requested in processed CSV)
    if config.numerical_scaling == "standard" and numeric_cols:
        for col in numeric_cols:
            if col in df_processed.columns:
                mean = df_processed[col].mean()
                std = df_processed[col].std()
                if std > 0:
                    df_processed[col] = (df_processed[col] - mean) / std
        applied_steps.append(f"Applied Standard Scaling (Z-score) to {len(numeric_cols)} numeric feature(s)")
    elif config.numerical_scaling == "minmax" and numeric_cols:
        for col in numeric_cols:
            if col in df_processed.columns:
                min_v = df_processed[col].min()
                max_v = df_processed[col].max()
                if max_v > min_v:
                    df_processed[col] = (df_processed[col] - min_v) / (max_v - min_v)
        applied_steps.append(f"Applied Min-Max Scaling [0, 1] to {len(numeric_cols)} numeric feature(s)")

    if not applied_steps:
        applied_steps.append("No modifications needed or requested")

    after_stats = calculate_stats_diff(df_processed)
    return df_processed, before_stats, after_stats, applied_steps
