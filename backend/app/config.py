import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Data Quality Assessment and AutoML Assistant"
    API_V1_STR: str = "/api/v1"
    
    # Directories
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    MODELS_DIR: Path = BASE_DIR / "trained_models"
    SAMPLE_DIR: Path = BASE_DIR / "sample_data"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/automl_assistant.db"
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [".csv"]
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://localhost"
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.MODELS_DIR, settings.SAMPLE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
