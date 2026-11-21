# Academic Minor Project Presentation & Viva Guide

## 1. Project Pitch (30-Second Elevator Summary)
> "Our minor project, the **Intelligent Data Quality Assessment and AutoML Assistant**, is an automated, end-to-end data-science system designed to analyze tabular CSV datasets. It evaluates data health with a transparent 0-to-100 quality score, executes leakage-free preprocessing pipelines, trains and benchmarks 5 machine learning algorithms simultaneously, and exports production-ready `.joblib` model pipelines with an interactive prediction playground."

---

## 2. Step-by-Step Viva Live Demonstration Script

### Step 1: Dashboard & Demonstration Datasets
1. Open `http://localhost:5173`.
2. Point out the dashboard layout, key stats counters, and demo dataset cards.
3. Click **"Load Classification Demo"** (`student_performance.csv`).

### Step 2: Quality Assessment Inspection
1. Navigate to the **"Quality Report"** tab.
2. Highlight the **Quality Score Gauge** (e.g. 91.5/100, Excellent).
3. Show the **Score Deductions Audit**: Explain how points are deducted transparently for missing values and duplicates.
4. Switch tabs:
   - **Missing Values**: Bar chart showing 3% missing in `Study_Hours_Per_Week`.
   - **Outliers (IQR)**: Boxplot/IQR thresholds.
   - **Correlations**: Multicollinearity detection matrix.
   - **Recommendations**: Dynamic rule-based suggestions.

### Step 3: Interactive Preprocessing
1. Click **"Go to Preprocessing Studio"** (or tab).
2. Click **"Apply Recommended Presets"** to automatically select median imputation, mode imputation, and dropping the `Student_ID` column.
3. Click **"Apply Preprocessing Pipeline"**.
4. Show the **Before-and-After Comparison Cards** (Missing values dropped from 32 to 0, Duplicate rows eliminated).
5. Click **"Download Processed CSV"** to demonstrate CSV export.

### Step 4: AutoML Model Training & Recommendation
1. Click **"Proceed to AutoML"**.
2. Point out the target selector (`Passed_Exam`) and auto-detected task type (**Classification**).
3. Click **"Train & Compare Models"**.
4. Show the live execution of:
   - Logistic Regression
   - Decision Tree Classifier
   - Random Forest Classifier
   - K-Nearest Neighbors (KNN)
   - Support Vector Classifier (SVC)
5. Review the **Model Leaderboard** (ranked by Weighted F1-Score).
6. Highlight the **Recommendation Rationale Card** explaining *why* the top model won.
7. Show the **Confusion Matrix Heatmap** and **Metric Comparison Chart**.
8. Click **"Download Trained Pipeline (.joblib)"**.

### Step 5: Live Inference Playground
1. Scroll to the **Live Inference Playground** at the bottom of the AutoML page.
2. Modify Study Hours to `35` and Attendance to `95%`.
3. Click **"Predict Output"** and watch the real-time prediction output (`Pass`, 94.2% probability).

### Step 6: Regression Demonstration & Custom CSV Upload
1. Go back to Dashboard.
2. Click **"Load Regression Demo"** (`housing_prices.csv`).
3. Train AutoML: Explain R² Score and RMSE metrics.
4. Drag-and-drop any custom CSV to show that the system works with **any arbitrary tabular data** without hardcoded assumptions!

---

## 3. Top 15 Technical Viva Questions & Expert Answers

### Q1: What is the main objective of this project?
**Answer**: To eliminate manual trial-and-error in preliminary data science by automating dataset diagnostic audits, data quality scoring, robust preprocessing, and comparative model training for arbitrary tabular CSV datasets.

### Q2: How does your system prevent Data Leakage?
**Answer**: Data leakage occurs when information from the test dataset is mistakenly used during data preprocessing (such as calculating global means or scaling). Our system enforces Scikit-Learn `Pipeline` and `ColumnTransformer` constructs that are **fitted strictly on the training partition (`X_train`) only**. The test set (`X_test`) and future inference inputs are solely transformed using the parameters learned from the training set.

### Q3: How is the Data Quality Score (0–100) calculated?
**Answer**: The score begins at a benchmark of 100.0 points. Transparent mathematical deductions are subtracted based on the severity of data anomalies:
- Missing cells ratio (up to -30 pts)
- Duplicate row ratio (up to -20 pts)
- Extreme IQR outliers (up to -15 pts)
- Constant/zero-variance features (up to -15 pts)
- High-cardinality categorical explosion (up to -10 pts)
- Severe class imbalance (up to -10 pts)

### Q4: Why use Weighted F1-Score instead of simple Accuracy for ranking classification models?
**Answer**: Accuracy can be deceptive on imbalanced datasets (e.g. predicting the majority class 95% of the time achieves 95% accuracy with 0% minority recall). Weighted F1-score calculates the harmonic mean of precision and recall for each class, weighted by class support, providing a balanced evaluation of model generalization.

### Q5: How do you detect numerical outliers?
**Answer**: We use the Interquartile Range (IQR) method:
$$\text{IQR} = Q_3 - Q_1$$
$$\text{Lower Bound} = Q_1 - 1.5 \times \text{IQR}, \quad \text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$$
Any data point beyond these boundaries is flagged as an outlier and can be either winsorized (capped) or removed.

### Q6: How does your system infer whether a task is Classification or Regression?
**Answer**:
- If the target column is string, object, or boolean $\rightarrow$ Classification.
- If the target column has $\le 15$ unique integer values $\rightarrow$ Classification.
- If the target column is continuous float or high-cardinality integer $\rightarrow$ Regression.
- The user can also override the inferred type on the UI.

### Q7: What models are evaluated for Classification?
**Answer**: We evaluate 9 diverse Scikit-Learn classification algorithms:
1. **Logistic Regression** (Linear baseline with L-BFGS solver)
2. **Decision Tree Classifier** (Interpretable tree-based non-linear partitioning)
3. **Random Forest Classifier** (Bagging ensemble of 100 decision trees)
4. **Extra Trees Classifier** (Extremely randomized trees reducing variance)
5. **Gradient Boosting Classifier** (Sequential gradient boosting for complex residual fitting)
6. **AdaBoost Classifier** (Adaptive boosting focused on hard-to-classify samples)
7. **K-Nearest Neighbors Classifier** (Distance-based instance classification)
8. **Support Vector Classifier** (Kernel-based maximal margin classifier with probability calibration)
9. **Gaussian Naive Bayes** (Probabilistic classifier based on Bayes' theorem with Gaussian priors)

### Q8: What models are evaluated for Regression?
**Answer**: We evaluate 9 diverse Scikit-Learn regression algorithms:
1. **Linear Regression** (Ordinary Least Squares continuous estimator)
2. **Ridge Regression** (L2-regularized linear model handling multicollinearity)
3. **Decision Tree Regressor** (Piecewise constant regression tree)
4. **Random Forest Regressor** (Ensemble of 100 regression trees)
5. **Extra Trees Regressor** (Extremely randomized regression ensemble)
6. **Gradient Boosting Regressor** (Stage-wise additive regression)
7. **AdaBoost Regressor** (Adaptive boosting on continuous targets)
8. **K-Nearest Neighbors Regressor** (Local distance-weighted continuous interpolation)
9. **Support Vector Regressor** (Epsilon-insensitive margin regression)

### Q9: What happens when an algorithm cannot run on a specific dataset?
**Answer**: Each model is wrapped in exception-safe training blocks. If an algorithm fails to converge or is computationally incompatible, it is marked as `skipped` on the leaderboard with the exact reason displayed to the user, preventing system crashes.

### Q10: How is the trained model persisted and exported?
**Answer**: We serialize the complete end-to-end Python pipeline (imputer + one-hot encoder + scaler + estimator + label mappings) using `joblib`. The resulting `.joblib` file can be downloaded and directly used in production with `pipeline.predict()`.

### Q11: What database and backend framework are used?
**Answer**: We used **FastAPI** with Python 3.12 for high performance and asynchronous request handling, **SQLAlchemy ORM** for database interaction, and **SQLite** for metadata and history persistence.

### Q12: What frontend stack and styling approach did you implement?
**Answer**: **React 18** with **TypeScript** and **Vite** for fast compilation, styled with **Tailwind CSS** using a modern data-science theme, with **Recharts** for interactive visual analytics.

### Q13: How does your application handle arbitrary CSV files uploaded by users?
**Answer**: The system contains a dynamic CSV ingestion engine that automatically detects file encoding, sniffing delimiters (comma, semicolon, tab, pipe), validates data integrity, and inspects all column statistics dynamically without hardcoded field names.

### Q14: How are tests configured in your project?
**Answer**:
- Backend: **pytest** (17 unit and integration tests covering validation, quality scoring, preprocessing, AutoML, and REST endpoints).
- Frontend: **Vitest** + **React Testing Library** (unit tests for component rendering and user interaction).

### Q15: How can this project be containerized and deployed?
**Answer**: The repository includes dedicated multi-stage **Dockerfiles** for both backend and frontend, orchestrated via **Docker Compose** with persistent named volumes for SQLite database, uploaded files, and trained model artifacts.
