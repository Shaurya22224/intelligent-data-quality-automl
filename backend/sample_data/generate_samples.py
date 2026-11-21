import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_classification_dataset(n_samples=500):
    student_ids = [f"STU_{1000 + i}" for i in range(n_samples)]
    age = np.random.randint(18, 26, size=n_samples)
    gender = np.random.choice(["Male", "Female", "Other"], size=n_samples, p=[0.48, 0.48, 0.04])
    parental_education = np.random.choice(
        ["High School", "Associate Degree", "Bachelor", "Master", "Doctorate"],
        size=n_samples,
        p=[0.25, 0.30, 0.25, 0.15, 0.05]
    )
    study_hours = np.round(np.random.normal(15, 6, size=n_samples).clip(2, 40), 1)
    attendance_rate = np.round(np.random.normal(82, 12, size=n_samples).clip(45, 100), 1)
    previous_score = np.round(np.random.normal(68, 14, size=n_samples).clip(30, 99), 1)
    assignments_completed = np.random.randint(4, 11, size=n_samples)
    extracurricular = np.random.choice(["Yes", "No"], size=n_samples, p=[0.55, 0.45])
    internet_access = np.random.choice(["Yes", "No"], size=n_samples, p=[0.88, 0.12])
    
    # Calculate pass probability based on features
    edu_weights = {"High School": 0, "Associate Degree": 3, "Bachelor": 6, "Master": 8, "Doctorate": 10}
    edu_score = np.array([edu_weights[e] for e in parental_education])
    
    net_score = np.where(internet_access == "Yes", 4.0, 0.0)
    
    latent_score = (
        0.35 * study_hours + 
        0.30 * attendance_rate + 
        0.40 * previous_score + 
        2.5 * assignments_completed + 
        edu_score + 
        net_score +
        np.random.normal(0, 8, size=n_samples)
    )
    
    threshold = np.percentile(latent_score, 38) # ~62% pass rate
    passed_exam = np.where(latent_score >= threshold, "Pass", "Fail")
    
    df = pd.DataFrame({
        "Student_ID": student_ids,
        "Age": age,
        "Gender": gender,
        "Parental_Education": parental_education,
        "Study_Hours_Per_Week": study_hours,
        "Attendance_Rate": attendance_rate,
        "Previous_Exam_Score": previous_score,
        "Assignments_Completed": assignments_completed,
        "Extracurricular_Activities": extracurricular,
        "Internet_Access": internet_access,
        "Passed_Exam": passed_exam
    })
    
    # Inject a realistic small amount of missing values (3-5%)
    mask_study = np.random.rand(n_samples) < 0.04
    df.loc[mask_study, "Study_Hours_Per_Week"] = np.nan
    
    mask_prev = np.random.rand(n_samples) < 0.03
    df.loc[mask_prev, "Previous_Exam_Score"] = np.nan
    
    mask_edu = np.random.rand(n_samples) < 0.02
    df.loc[mask_edu, "Parental_Education"] = np.nan

    # Inject 2 duplicate rows to test duplicate detection
    df = pd.concat([df, df.iloc[[10, 45]]], ignore_index=True)
    
    return df

def generate_regression_dataset(n_samples=500):
    prop_ids = [f"PROP_{2000 + i}" for i in range(n_samples)]
    sqft = np.random.randint(850, 4200, size=n_samples)
    bedrooms = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.05, 0.25, 0.40, 0.22, 0.08])
    bathrooms = np.random.choice([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0], size=n_samples, p=[0.08, 0.12, 0.35, 0.25, 0.12, 0.05, 0.03])
    neighborhood = np.random.choice(
        ["Downtown", "Suburbs", "Uptown", "Westside", "Lakeside"],
        size=n_samples,
        p=[0.22, 0.30, 0.20, 0.18, 0.10]
    )
    year_built = np.random.randint(1970, 2024, size=n_samples)
    garage_cars = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.10, 0.30, 0.45, 0.15])
    dist_city_km = np.round(np.random.uniform(1.5, 35.0, size=n_samples), 1)
    has_pool = np.random.choice(["Yes", "No"], size=n_samples, p=[0.28, 0.72])
    condition_score = np.random.randint(1, 6, size=n_samples)
    
    neighborhood_base = {
        "Downtown": 120000,
        "Suburbs": 60000,
        "Uptown": 100000,
        "Westside": 75000,
        "Lakeside": 140000
    }
    
    base_prices = np.array([neighborhood_base[n] for n in neighborhood])
    
    pool_bonus = np.where(has_pool == "Yes", 35000, 0)
    
    price = (
        80000 +
        base_prices +
        sqft * 115 +
        bedrooms * 12000 +
        bathrooms * 18000 +
        (year_built - 1970) * 850 +
        garage_cars * 14000 +
        condition_score * 12500 +
        pool_bonus -
        dist_city_km * 1800 +
        np.random.normal(0, 22000, size=n_samples)
    )
    price = np.round(price.clip(120000, 950000), -2)
    
    df = pd.DataFrame({
        "Property_ID": prop_ids,
        "Square_Feet": sqft,
        "Bedrooms": bedrooms,
        "Bathrooms": bathrooms,
        "Neighborhood": neighborhood,
        "Year_Built": year_built,
        "Garage_Cars": garage_cars,
        "Distance_To_City_Center_KM": dist_city_km,
        "Has_Pool": has_pool,
        "Condition_Score": condition_score,
        "Price": price
    })
    
    # Inject a realistic small amount of missing values (3-5%)
    mask_garage = np.random.rand(n_samples) < 0.04
    df.loc[mask_garage, "Garage_Cars"] = np.nan
    
    mask_dist = np.random.rand(n_samples) < 0.03
    df.loc[mask_dist, "Distance_To_City_Center_KM"] = np.nan
    
    mask_neigh = np.random.rand(n_samples) < 0.02
    df.loc[mask_neigh, "Neighborhood"] = np.nan

    # Inject 2 duplicate rows to test duplicate detection
    df = pd.concat([df, df.iloc[[15, 60]]], ignore_index=True)
    
    return df

if __name__ == "__main__":
    os.makedirs("backend/sample_data", exist_ok=True)
    
    df_cls = generate_classification_dataset()
    cls_path = os.path.join("backend", "sample_data", "student_performance.csv")
    df_cls.to_csv(cls_path, index=False)
    print(f"Generated {cls_path} with {len(df_cls)} rows and {df_cls.shape[1]} columns.")
    
    df_reg = generate_regression_dataset()
    reg_path = os.path.join("backend", "sample_data", "housing_prices.csv")
    df_reg.to_csv(reg_path, index=False)
    print(f"Generated {reg_path} with {len(df_reg)} rows and {df_reg.shape[1]} columns.")
