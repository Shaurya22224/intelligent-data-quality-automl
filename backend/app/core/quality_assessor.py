import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from ..schemas import (
    QualityReportResponse,
    NumericSummaryStats,
    CategoricalSummaryStats,
    OutlierColumnStats,
    CorrelatedPair,
    ClassDistribution,
    QualityScoreBreakdown,
    ScoreDeduction,
    RecommendationItem
)
from .validator import infer_column_type
from ..utils.logger import logger

def assess_data_quality(df: pd.DataFrame, dataset_id: str, target_column: Optional[str] = None) -> QualityReportResponse:
    total_rows = len(df)
    total_cols = len(df.columns)
    
    # 1. Duplicates & Missing
    duplicate_count = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_count / max(1, total_rows)) * 100, 2)
    
    missing_total = int(df.isna().sum().sum())
    total_cells = total_rows * total_cols
    missing_pct = round((missing_total / max(1, total_cells)) * 100, 2)
    
    # 2. Separate numeric and categorical columns
    numeric_cols: List[str] = []
    categorical_cols: List[str] = []
    
    for col in df.columns:
        col_type = infer_column_type(df[col])
        if col_type == "numeric":
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)
            
    # 3. Numeric Summary Statistics
    numeric_stats: List[NumericSummaryStats] = []
    outlier_stats: List[OutlierColumnStats] = []
    total_outliers_count = 0
    total_numeric_values = 0
    
    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(series) > 0:
            cnt = int(len(series))
            mean_val = float(series.mean())
            std_val = float(series.std()) if cnt > 1 else 0.0
            min_val = float(series.min())
            q25_val = float(series.quantile(0.25))
            med_val = float(series.median())
            q75_val = float(series.quantile(0.75))
            max_val = float(series.max())
            iqr_val = float(q75_val - q25_val)
            skew_val = float(series.skew()) if cnt > 2 and std_val > 0 else 0.0
            
            numeric_stats.append(NumericSummaryStats(
                column=col,
                count=cnt,
                mean=round(mean_val, 3),
                std=round(std_val, 3),
                min=round(min_val, 3),
                q25=round(q25_val, 3),
                median=round(med_val, 3),
                q75=round(q75_val, 3),
                max=round(max_val, 3),
                iqr=round(iqr_val, 3),
                skewness=round(skew_val, 3) if not np.isnan(skew_val) else 0.0
            ))
            
            # IQR Outlier Detection
            lower_bound = q25_val - 1.5 * iqr_val
            upper_bound = q75_val + 1.5 * iqr_val
            outliers = series[(series < lower_bound) | (series > upper_bound)]
            outlier_cnt = int(len(outliers))
            outlier_pct = round((outlier_cnt / max(1, cnt)) * 100, 2)
            
            total_outliers_count += outlier_cnt
            total_numeric_values += cnt
            
            outlier_stats.append(OutlierColumnStats(
                column=col,
                outlier_count=outlier_cnt,
                outlier_percentage=outlier_pct,
                lower_bound=round(lower_bound, 3),
                upper_bound=round(upper_bound, 3),
                min_value=round(min_val, 3),
                max_value=round(max_val, 3)
            ))

    # 4. Categorical Summary Statistics
    categorical_stats: List[CategoricalSummaryStats] = []
    for col in categorical_cols:
        series = df[col].dropna()
        cnt = int(len(series))
        if cnt > 0:
            uniq = int(series.nunique())
            val_counts = series.value_counts()
            top_val = str(val_counts.index[0]) if len(val_counts) > 0 else None
            top_freq = int(val_counts.iloc[0]) if len(val_counts) > 0 else 0
            top_pct = round((top_freq / max(1, cnt)) * 100, 2)
            card_ratio = round(uniq / max(1, total_rows), 4)
            
            categorical_stats.append(CategoricalSummaryStats(
                column=col,
                count=cnt,
                unique_count=uniq,
                top_value=top_val,
                top_frequency=top_freq,
                top_percentage=top_pct,
                cardinality_ratio=card_ratio
            ))

    # 5. Correlation Matrix & Highly Correlated Pairs
    corr_dict: Dict[str, Dict[str, float]] = {}
    highly_corr_pairs: List[CorrelatedPair] = []
    
    if len(numeric_cols) >= 2:
        numeric_df = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
        corr_matrix = numeric_df.corr(method="pearson").fillna(0.0)
        
        for r_col in numeric_cols:
            corr_dict[r_col] = {}
            for c_col in numeric_cols:
                corr_dict[r_col][c_col] = round(float(corr_matrix.loc[r_col, c_col]), 3)

        # Find high correlation pairs (|corr| >= 0.75, non-diagonal)
        seen_pairs = set()
        for i, col1 in enumerate(numeric_cols):
            for j, col2 in enumerate(numeric_cols):
                if i < j:
                    pair_key = tuple(sorted([col1, col2]))
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        val = float(corr_matrix.loc[col1, col2])
                        if abs(val) >= 0.75 and not np.isnan(val):
                            desc = "Strong positive linear correlation" if val > 0 else "Strong negative linear correlation"
                            if abs(val) >= 0.90:
                                desc = "Very high multicollinearity (redundant feature risk)"
                            highly_corr_pairs.append(CorrelatedPair(
                                feature1=col1,
                                feature2=col2,
                                correlation=round(val, 3),
                                description=desc
                            ))
    else:
        for c in numeric_cols:
            corr_dict[c] = {c: 1.0}

    # 6. Constant, Near-Constant & High-Cardinality Columns
    constant_cols: List[str] = []
    high_card_cols: List[str] = []
    
    for col in df.columns:
        uniq = df[col].nunique(dropna=False)
        if uniq <= 1:
            constant_cols.append(col)
        elif uniq / max(1, total_rows) >= 0.98 and uniq > 30 and col in categorical_cols:
            constant_cols.append(col) # near-unique identifier or quasi-constant

        if col in categorical_cols:
            uniq_valid = df[col].nunique(dropna=True)
            if uniq_valid > 50 or (uniq_valid / max(1, total_rows) > 0.5 and total_rows > 30):
                high_card_cols.append(col)

    # 7. Class Distribution (if target column supplied or auto-detected)
    class_dist_info: Optional[ClassDistribution] = None
    target_to_check = target_column
    if not target_to_check:
        # Check last column by convention if suitable
        last_col = df.columns[-1]
        if df[last_col].nunique() <= 20:
            target_to_check = last_col
            
    if target_to_check and target_to_check in df.columns:
        target_series = df[target_to_check].dropna()
        uniq_targets = target_series.nunique()
        if uniq_targets <= 20: # classification candidate
            counts = target_series.value_counts()
            classes_map = {str(k): int(v) for k, v in counts.items()}
            pcts_map = {str(k): round((v / max(1, len(target_series))) * 100, 2) for k, v in counts.items()}
            
            maj_class = str(counts.index[0])
            min_class = str(counts.index[-1])
            imbalance_ratio = round(float(counts.iloc[0] / max(1, counts.iloc[-1])), 2)
            is_imbalanced = (imbalance_ratio > 2.5) or (counts.iloc[-1] / len(target_series) < 0.20)
            
            class_dist_info = ClassDistribution(
                target_column=target_to_check,
                classes=classes_map,
                percentages=pcts_map,
                is_imbalanced=is_imbalanced,
                imbalance_ratio=imbalance_ratio,
                minority_class=min_class,
                majority_class=maj_class
            )

    # 8. Score Calculation & Deductions Breakdown
    deductions: List[ScoreDeduction] = []
    
    # Missing values penalty (up to 30 pts)
    if missing_pct > 0:
        penalty_missing = min(30.0, round(missing_pct * 0.6, 1))
        deductions.append(ScoreDeduction(
            category="Missing Values",
            penalty=penalty_missing,
            reason=f"{missing_pct}% total missing values detected ({missing_total} empty cells).",
            details="Missing values reduce dataset completeness and require imputation or row removal before modeling."
        ))

    # Duplicate rows penalty (up to 20 pts)
    if duplicate_pct > 0:
        penalty_dups = min(20.0, round(duplicate_pct * 1.5, 1))
        deductions.append(ScoreDeduction(
            category="Duplicate Rows",
            penalty=penalty_dups,
            reason=f"{duplicate_count} duplicate rows found ({duplicate_pct}% of total records).",
            details="Duplicates can artificially inflate accuracy and bias the model toward repeated samples."
        ))

    # Outliers penalty (up to 15 pts)
    outlier_rate = (total_outliers_count / max(1, total_numeric_values)) * 100 if total_numeric_values > 0 else 0
    if outlier_rate > 1.0:
        penalty_outliers = min(15.0, round(outlier_rate * 0.5, 1))
        deductions.append(ScoreDeduction(
            category="Outliers",
            penalty=penalty_outliers,
            reason=f"{total_outliers_count} numerical outliers detected via IQR method ({outlier_rate:.1f}% of numeric values).",
            details="Extreme outliers can skew linear models and distort standard scaling."
        ))

    # Constant / zero-variance columns penalty (up to 15 pts)
    if constant_cols:
        penalty_const = min(15.0, round(len(constant_cols) * 5.0, 1))
        deductions.append(ScoreDeduction(
            category="Constant Features",
            penalty=penalty_const,
            reason=f"{len(constant_cols)} constant or near-constant column(s) detected ({', '.join(constant_cols[:3])}).",
            details="Constant columns carry zero predictive variance and should be removed."
        ))

    # High cardinality penalty (up to 10 pts)
    if high_card_cols:
        penalty_card = min(10.0, round(len(high_card_cols) * 3.0, 1))
        deductions.append(ScoreDeduction(
            category="High Cardinality",
            penalty=penalty_card,
            reason=f"{len(high_card_cols)} high-cardinality categorical column(s) detected ({', '.join(high_card_cols[:3])}).",
            details="High cardinality creates dimensionality explosion during one-hot encoding."
        ))

    # Imbalance penalty (up to 10 pts)
    if class_dist_info and class_dist_info.is_imbalanced:
        deductions.append(ScoreDeduction(
            category="Class Imbalance",
            penalty=7.0,
            reason=f"Target class distribution is imbalanced (ratio: {class_dist_info.imbalance_ratio}:1).",
            details="Imbalanced classes can cause standard classifiers to favor the majority class; use F1-score for evaluation."
        ))

    total_penalty = sum(d.penalty for d in deductions)
    overall_score = max(0.0, min(100.0, round(100.0 - total_penalty, 1)))
    
    if overall_score >= 90:
        grade = "Excellent"
    elif overall_score >= 75:
        grade = "Good"
    elif overall_score >= 60:
        grade = "Fair"
    else:
        grade = "Poor"

    explanation = (
        f"The dataset received a quality score of {overall_score}/100 ({grade}). "
        f"Base score started at 100.0, with {len(deductions)} quality deduction(s) totaling {total_penalty:.1f} points. "
        + (" ".join([f"[{d.category}: -{d.penalty} pts]" for d in deductions]) if deductions else "No critical quality issues found.")
    )

    score_breakdown = QualityScoreBreakdown(
        overall_score=overall_score,
        grade=grade,
        base_score=100.0,
        total_deductions=round(total_penalty, 1),
        deductions=deductions,
        explanation=explanation
    )

    # 9. Practical Preprocessing Recommendations
    recommendations: List[RecommendationItem] = []
    
    if duplicate_count > 0:
        recommendations.append(RecommendationItem(
            priority="High",
            category="Duplicates",
            issue=f"Found {duplicate_count} duplicate row(s) in the dataset.",
            action="Remove duplicate rows",
            rationale="Eliminating duplicate records prevents data leakage between train and test splits.",
            suggested_config_key="remove_duplicates",
            suggested_config_value=True
        ))
        
    if missing_total > 0:
        # Check if numeric missing or categorical missing
        num_missing = sum(df[c].isna().sum() for c in numeric_cols)
        cat_missing = sum(df[c].isna().sum() for c in categorical_cols)
        
        if num_missing > 0:
            recommendations.append(RecommendationItem(
                priority="High",
                category="Missing Values",
                issue=f"{num_missing} missing values across numeric columns.",
                action="Impute numeric missing values using Median",
                rationale="Median imputation is robust to skewed distributions and preserves sample count.",
                suggested_config_key="numeric_imputation",
                suggested_config_value="median"
            ))
            
        if cat_missing > 0:
            recommendations.append(RecommendationItem(
                priority="High",
                category="Missing Values",
                issue=f"{cat_missing} missing values across categorical columns.",
                action="Impute categorical missing values using Mode / 'Unknown'",
                rationale="Filling categorical gaps preserves complete records without discarding training rows.",
                suggested_config_key="categorical_imputation",
                suggested_config_value="mode"
            ))

    if constant_cols:
        recommendations.append(RecommendationItem(
            priority="High",
            category="Feature Selection",
            issue=f"Detected constant/uninformative columns: {', '.join(constant_cols)}",
            action=f"Drop constant columns: {', '.join(constant_cols)}",
            rationale="Features with no variance provide zero predictive power and only add noise.",
            suggested_config_key="drop_columns",
            suggested_config_value=constant_cols
        ))

    # High cardinality ID columns recommendation
    id_like_cols = [c for c in df.columns if (c.lower().endswith("_id") or c.lower() in ["id", "identifier"]) and c not in constant_cols]
    if id_like_cols:
        recommendations.append(RecommendationItem(
            priority="Medium",
            category="Feature Selection",
            issue=f"Detected primary key or identifier columns: {', '.join(id_like_cols)}",
            action=f"Drop ID columns: {', '.join(id_like_cols)}",
            rationale="Identifier columns can cause severe overfitting and false pattern memorization.",
            suggested_config_key="drop_columns",
            suggested_config_value=id_like_cols
        ))

    if categorical_cols:
        active_cats = [c for c in categorical_cols if c not in constant_cols and c not in id_like_cols]
        if active_cats:
            recommendations.append(RecommendationItem(
                priority="Medium",
                category="Encoding",
                issue=f"Dataset contains {len(active_cats)} categorical feature(s).",
                action="Apply One-Hot Encoding",
                rationale="One-hot encoding translates non-numeric attributes into mathematical representations suitable for all ML algorithms.",
                suggested_config_key="categorical_encoding",
                suggested_config_value="onehot"
            ))

    if numeric_cols:
        recommendations.append(RecommendationItem(
            priority="Medium",
            category="Scaling",
            issue="Numeric features have different ranges and standard deviations.",
            action="Apply Standard Scaling (Z-score normalization)",
            rationale="Ensures distance-based models (KNN, Logistic Regression, SVM) treat all features with equal weight.",
            suggested_config_key="numerical_scaling",
            suggested_config_value="standard"
        ))

    if total_outliers_count > 0:
        recommendations.append(RecommendationItem(
            priority="Low",
            category="Outliers",
            issue=f"{total_outliers_count} extreme outlier values found in numeric features.",
            action="Apply IQR Capping (Winsorization)",
            rationale="Capping extreme outliers to 1.5x IQR boundaries prevents gradient distortion without losing sample rows.",
            suggested_config_key="outlier_treatment",
            suggested_config_value="cap_iqr"
        ))

    return QualityReportResponse(
        id=f"rep_{dataset_id[:8]}",
        dataset_id=dataset_id,
        overall_score=overall_score,
        grade=grade,
        total_rows=total_rows,
        total_columns=total_cols,
        duplicate_rows_count=duplicate_count,
        duplicate_rows_percentage=duplicate_pct,
        total_missing_cells=missing_total,
        total_missing_percentage=missing_pct,
        numeric_columns=numeric_cols,
        categorical_columns=categorical_cols,
        numeric_stats=numeric_stats,
        categorical_stats=categorical_stats,
        outlier_stats=outlier_stats,
        correlation_matrix=corr_dict,
        highly_correlated_pairs=highly_corr_pairs,
        constant_columns=constant_cols,
        high_cardinality_columns=high_card_cols,
        class_distribution=class_dist_info,
        score_breakdown=score_breakdown,
        recommendations=recommendations,
        created_at=pd.Timestamp.utcnow().to_pydatetime()
    )
