import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pathlib import Path

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.config import settings

from sqlalchemy.pool import StaticPool

# Test in-memory SQLite with StaticPool so tables persist across sessions
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_classification_df():
    np.random.seed(42)
    n = 100
    df = pd.DataFrame({
        "age": np.random.randint(20, 60, n),
        "income": np.random.normal(50000, 15000, n),
        "department": np.random.choice(["HR", "Engineering", "Sales"], n),
        "satisfaction_score": np.random.uniform(1.0, 5.0, n),
        "left_company": np.random.choice(["Yes", "No"], n, p=[0.3, 0.7])
    })
    # Add 2 missing values and 1 duplicate
    df.loc[5, "income"] = np.nan
    df.loc[10, "department"] = np.nan
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    return df

@pytest.fixture
def sample_regression_df():
    np.random.seed(42)
    n = 100
    sqft = np.random.randint(800, 3500, n)
    rooms = np.random.choice([2, 3, 4, 5], n)
    location = np.random.choice(["Urban", "Suburban", "Rural"], n)
    price = 50000 + sqft * 120 + rooms * 15000 + np.random.normal(0, 10000, n)
    
    df = pd.DataFrame({
        "sqft": sqft,
        "rooms": rooms,
        "location": location,
        "price": price
    })
    df.loc[8, "rooms"] = np.nan
    return df
