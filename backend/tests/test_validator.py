import io
import pandas as pd
import pytest
from backend.app.core.validator import (
    validate_and_parse_csv,
    detect_encoding,
    detect_delimiter,
    infer_column_type,
    extract_column_metadata
)

def test_validate_valid_csv():
    csv_text = "id,name,age,salary,is_active\n1,Alice,25,50000,True\n2,Bob,30,60000,False\n3,Charlie,35,70000,True\n"
    csv_bytes = csv_text.encode("utf-8")
    
    is_valid, errors, warnings, df = validate_and_parse_csv(csv_bytes, "test_data.csv")
    assert is_valid is True
    assert len(errors) == 0
    assert df is not None
    assert len(df) == 3
    assert len(df.columns) == 5

def test_validate_invalid_extension():
    is_valid, errors, _, _ = validate_and_parse_csv(b"some data", "test.xlsx")
    assert is_valid is False
    assert any("extension" in e.lower() for e in errors)

def test_validate_empty_file():
    is_valid, errors, _, _ = validate_and_parse_csv(b"", "empty.csv")
    assert is_valid is False
    assert any("empty" in e.lower() for e in errors)

def test_detect_semicolon_delimiter():
    csv_sample = "name;age;city\nJohn;30;NYC\nJane;25;LA\n"
    delim = detect_delimiter(csv_sample)
    assert delim == ";"

def test_infer_column_types():
    num_series = pd.Series([10.5, 20.3, 30.1, 40.8])
    assert infer_column_type(num_series) == "numeric"
    
    cat_series = pd.Series(["HR", "Engineering", "Sales", "HR"])
    assert infer_column_type(cat_series) == "categorical"
    
    bool_series = pd.Series([True, False, True, False])
    assert infer_column_type(bool_series) == "boolean"

def test_extract_column_metadata():
    df = pd.DataFrame({
        "id": range(1, 40),
        "score": [80.5] * 38 + [None],
        "category": ["A", "B", "C"] * 13
    })
    meta = extract_column_metadata(df)
    assert len(meta) == 3
    score_meta = next(m for m in meta if m.name == "score")
    assert score_meta.missing_count == 1
    assert score_meta.inferred_type == "numeric"
