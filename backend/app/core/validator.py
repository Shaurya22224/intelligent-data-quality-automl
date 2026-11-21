import io
import csv
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
from ..schemas import ValidationResult, DatasetValidationWarning, ColumnMetadata
from ..config import settings
from ..utils.logger import logger

def detect_encoding(content: bytes) -> str:
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            content.decode(enc)
            return enc
        except UnicodeDecodeError:
            continue
    return "utf-8" # fallback

def detect_delimiter(text_sample: str) -> str:
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(text_sample)
        return dialect.delimiter
    except Exception:
        # Common delimiters fallback check
        counts = {
            ",": text_sample.count(","),
            ";": text_sample.count(";"),
            "\t": text_sample.count("\t"),
            "|": text_sample.count("|")
        }
        best_delim = max(counts, key=counts.get)
        return best_delim if counts[best_delim] > 0 else ","

def infer_column_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if len(non_null) == 0:
        return "text"
    
    # Check boolean
    if series.dtype == bool or set(non_null.unique()).issubset({True, False, 0, 1, "0", "1", "true", "false", "True", "False", "yes", "no", "Yes", "No"}):
        if len(non_null.unique()) <= 2:
            return "boolean"
            
    # Check numeric
    if pd.api.types.is_numeric_dtype(series):
        # Check if it acts like an ID (sequential integers, all unique)
        if series.nunique() == len(series) and len(series) > 30 and series.dtype in [np.int64, np.int32]:
            return "id"
        return "numeric"
        
    # Try converting string to numeric
    try:
        pd.to_numeric(non_null)
        return "numeric"
    except (ValueError, TypeError):
        pass

    # Try datetime
    if non_null.dtype == object and len(non_null) > 0:
        sample_str = str(non_null.iloc[0])
        # Only test datetime if it looks like a date/time string
        if any(char in sample_str for char in ["-", "/", ":"]) and len(sample_str) >= 6:
            try:
                pd.to_datetime(non_null.iloc[:20], format="mixed")
                return "datetime"
            except Exception:
                pass

    # Check ID patterns (e.g. unique strings with id/id_ in col name or 100% unique)
    if series.nunique() == len(series) and len(series) > 30:
        return "id"

    # Categorical if unique values count is relatively small or string
    unique_count = series.nunique()
    if unique_count <= 50 or (unique_count / max(1, len(series))) < 0.2:
        return "categorical"

    return "categorical"

def validate_and_parse_csv(file_bytes: bytes, filename: str) -> Tuple[bool, List[str], List[DatasetValidationWarning], Optional[pd.DataFrame]]:
    errors: List[str] = []
    warnings: List[DatasetValidationWarning] = []
    
    # 1. Extension check
    if not filename.lower().endswith(".csv"):
        errors.append(f"Invalid file extension. Only CSV files (.csv) are supported. Provided: '{filename}'")
        return False, errors, warnings, None
        
    # 2. File size check
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        errors.append(f"File size ({size_mb:.2f} MB) exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB} MB.")
        return False, errors, warnings, None
        
    if len(file_bytes) == 0:
        errors.append("The uploaded file is empty (0 bytes). Please upload a valid CSV with data.")
        return False, errors, warnings, None
        
    # 3. Encoding & Delimiter
    encoding = detect_encoding(file_bytes)
    try:
        decoded_text = file_bytes.decode(encoding)
    except Exception as e:
        errors.append(f"Unable to decode file using detected encoding '{encoding}': {str(e)}")
        return False, errors, warnings, None

    sample_lines = "\n".join(decoded_text.splitlines()[:20])
    delimiter = detect_delimiter(sample_lines)
    
    # 4. Parse into DataFrame
    try:
        df = pd.read_csv(
            io.StringIO(decoded_text),
            sep=delimiter,
            encoding=encoding,
            na_values=["", " ", "NA", "N/A", "null", "NULL", "NaN", "None", "?", "-"],
            keep_default_na=True
        )
    except Exception as e:
        errors.append(f"Malformed CSV: Failed to parse CSV content. Reason: {str(e)}")
        return False, errors, warnings, None

    # 5. Row and column structure validation
    if df.empty or len(df) == 0:
        errors.append("The CSV file contains no data rows.")
        return False, errors, warnings, None
        
    if len(df.columns) < 2:
        errors.append(f"The CSV file only has {len(df.columns)} column. At least 2 columns (features and target) are required for quality assessment and AutoML.")
        return False, errors, warnings, None

    # Check for duplicate column names
    if len(df.columns) != len(set(df.columns)):
        dup_cols = [col for col in df.columns if list(df.columns).count(col) > 1]
        warnings.append(DatasetValidationWarning(
            category="structure",
            severity="warning",
            message=f"Duplicate column headers found: {list(set(dup_cols))}. Columns have been renamed automatically.",
            recommendation="Ensure column names are distinct in your original CSV header."
        ))
        # Deduplicate column names
        cols = pd.Series(df.columns)
        for dup in cols[cols.duplicated()].unique():
            cols[cols[cols == dup].index.values.tolist()] = [
                dup if i == 0 else f"{dup}_{i}" for i in range(sum(cols == dup))
            ]
        df.columns = cols

    # Clean whitespace in column names
    df.columns = [str(c).strip() for c in df.columns]

    # 6. Data Quality Checks & Warnings
    row_count = len(df)
    if row_count < 15:
        warnings.append(DatasetValidationWarning(
            category="size",
            severity="critical",
            message=f"Dataset has only {row_count} rows. Machine learning models require at least 20-30 rows to train reliably.",
            recommendation="Consider adding more rows or using this dataset for exploratory analysis only."
        ))
    elif row_count < 50:
        warnings.append(DatasetValidationWarning(
            category="size",
            severity="warning",
            message=f"Dataset has a small sample size ({row_count} rows). Cross-validation and model metrics may have higher variance.",
            recommendation="For optimal AutoML accuracy, datasets with 100+ rows are recommended."
        ))

    # Missing value checks
    missing_total = df.isna().sum().sum()
    total_cells = df.size
    missing_ratio = missing_total / max(1, total_cells)
    if missing_ratio > 0.4:
        warnings.append(DatasetValidationWarning(
            category="missing",
            severity="critical",
            message=f"Dataset has {missing_ratio * 100:.1f}% missing values overall across columns.",
            recommendation="Use the Preprocessing tab to impute or drop heavily missing columns before training."
        ))

    # All-null columns
    all_null_cols = [c for c in df.columns if df[c].isna().all()]
    if all_null_cols:
        warnings.append(DatasetValidationWarning(
            category="missing",
            severity="warning",
            message=f"Columns with 100% missing values detected: {all_null_cols}",
            recommendation="These columns should be dropped before modeling."
        ))

    # Single-value constant columns
    constant_cols = [c for c in df.columns if df[c].nunique(dropna=False) <= 1]
    if constant_cols:
        warnings.append(DatasetValidationWarning(
            category="structure",
            severity="info",
            message=f"Constant columns (only 1 unique value) detected: {constant_cols}",
            recommendation="Constant columns provide zero variance and should be removed during preprocessing."
        ))

    return True, errors, warnings, df

def extract_column_metadata(df: pd.DataFrame) -> List[ColumnMetadata]:
    columns_meta: List[ColumnMetadata] = []
    total_rows = len(df)
    
    for col in df.columns:
        series = df[col]
        data_type = str(series.dtype)
        inferred = infer_column_type(series)
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / max(1, total_rows)) * 100, 2)
        unique_count = int(series.nunique(dropna=True))
        
        # Sample non-null values
        samples = series.dropna().head(5).tolist()
        # Convert non-serializable types
        clean_samples = []
        for s in samples:
            if isinstance(s, (np.integer, np.int64, np.int32)):
                clean_samples.append(int(s))
            elif isinstance(s, (np.floating, np.float64, np.float32)):
                clean_samples.append(round(float(s), 3))
            elif isinstance(s, (pd.Timestamp, np.datetime64)):
                clean_samples.append(str(s))
            else:
                clean_samples.append(str(s))

        is_const = unique_count <= 1
        is_high_card = (inferred == "categorical") and (unique_count > 50 or (unique_count / max(1, total_rows)) > 0.6)
        is_id = inferred == "id" or (col.lower() in ["id", "identifier", "uuid", "key", "index"] or col.lower().endswith("_id"))

        columns_meta.append(ColumnMetadata(
            name=str(col),
            data_type=data_type,
            inferred_type=inferred,
            missing_count=missing_count,
            missing_percentage=missing_pct,
            unique_count=unique_count,
            sample_values=clean_samples,
            is_constant=is_const,
            is_high_cardinality=is_high_card,
            is_potential_id=is_id
        ))
        
    return columns_meta
